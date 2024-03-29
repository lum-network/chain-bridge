import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { toBech32, LumBech32Prefixes, fromBech32 } from '@lum-network/sdk-javascript';
import { PubKey } from '@lum-network/sdk-javascript/build/codegen/cosmos/crypto/ed25519/keys';
import { PageRequest } from '@lum-network/sdk-javascript/build/codegen/cosmos/base/query/v1beta1/pagination';

import { ChainService, ValidatorDelegationService, ValidatorService } from '@app/services';
import { ValidatorEntity } from '@app/database';
import { AssetPrefix, AssetSymbol, SIGNED_BLOCK_WINDOW } from '@app/utils';

@Injectable()
export class ValidatorScheduler {
    private readonly _logger: Logger = new Logger(ValidatorScheduler.name);

    constructor(
        private readonly _configService: ConfigService,
        private readonly _chainService: ChainService,
        private readonly _validatorService: ValidatorService,
        private readonly _validatorDelegationService: ValidatorDelegationService,
    ) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async delegationSync() {
        if (!this._configService.get<boolean>('VALIDATOR_SYNC_ENABLED')) {
            return;
        }

        this._logger.log(`Syncing validator delegations from chain...`);
        const validators = await this._validatorService.fetchAll();
        this._logger.debug(`Found ${validators.length} validators to sync`);

        // For each stored validator, we query chain and ask for delegations
        for (const validator of validators) {
            let page: Uint8Array | undefined = undefined;

            while (true) {
                const delegations = await this._chainService.getChain(AssetSymbol.LUM).client.cosmos.staking.v1beta1.validatorDelegations({ validatorAddr: validator.operator_address, pagination: page ? ({ key: page } as PageRequest) : undefined });
                this._logger.debug(`Found ${delegations.delegationResponses.length} delegations to sync for validator ${validator.operator_address}`);

                // For each delegation, we create or update the matching entry in our database
                for (const delegation of delegations.delegationResponses) {
                    const shares = Number(parseInt(delegation.delegation.shares, 10).toFixed());
                    await this._validatorDelegationService.createOrUpdate(delegation.delegation.delegatorAddress, delegation.delegation.validatorAddress, shares, {
                        denom: delegation.balance.denom,
                        amount: parseInt(delegation.balance.amount, 10),
                    });
                }

                // If we have pagination key, we just patch it and it will process in the next loop
                if (delegations.pagination && delegations.pagination.nextKey && delegations.pagination.nextKey.length) {
                    page = delegations.pagination.nextKey;
                } else {
                    break;
                }
            }
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS, { name: 'validators_live_ingest' })
    async basicSync() {
        if (!this._configService.get<boolean>('VALIDATOR_SYNC_ENABLED')) {
            return;
        }

        try {
            // Fetch tendermint validators
            let tmValidators: any = null;
            try {
                tmValidators = await this._chainService.getChain(AssetSymbol.LUM).client.cosmos.base.tendermint.v1beta1.getValidatorSetByHeight({ height: this._configService.get<bigint>('STARTING_HEIGHT') });
            } catch (error) {
                this._logger.error(`Failed to fetch validators: ${error}`, error.stack);
                return;
            }

            // Build validators list
            const validators: Partial<ValidatorEntity>[] = [];
            for (const val of tmValidators.validators) {
                validators.push({
                    proposer_address: val.address,
                    consensus_address: toBech32(LumBech32Prefixes.CONS_ADDR, fromBech32(val.address).data),
                    consensus_pubkey: toBech32(LumBech32Prefixes.CONS_PUB, PubKey.fromProtoMsg(val.pubKey as any).key),
                });
            }

            // Go through all staking validators to match them with tendermint ones
            const statuses = ['BOND_STATUS_BONDED', 'BOND_STATUS_UNBONDED', 'BOND_STATUS_UNBONDING'];
            let nextPageKey: Uint8Array = new Uint8Array();

            for (const s of statuses) {
                nextPageKey = new Uint8Array();
                while (true) {
                    const stakingValidators = await this._chainService.getChain(AssetSymbol.LUM).client.cosmos.staking.v1beta1.validators({
                        status: s as any,
                        pagination: PageRequest.fromPartial({
                            key: nextPageKey,
                            limit: BigInt(100),
                            offset: BigInt(0),
                            reverse: false,
                            countTotal: false,
                        }),
                    });

                    for (const val of stakingValidators.validators) {
                        const pubKey = PubKey.fromProtoMsg(val.consensusPubkey as any);
                        const consensus_pubkey = toBech32(LumBech32Prefixes.CONS_PUB, pubKey.key);

                        // Find the tendermint validator and add the operator address to it
                        for (let v = 0; v < validators.length; v++) {
                            if (validators[v].consensus_pubkey === consensus_pubkey) {
                                // Get the account address from the validators operatorAddress
                                const getDecodedAccountAddress = toBech32(AssetPrefix.LUM, fromBech32(val.operatorAddress).data);

                                // Fetch the signing infos and self bonded for validators
                                const [signingInfos, selfBonded] = await Promise.all([
                                    this._chainService.getChain(AssetSymbol.LUM).client.cosmos.slashing.v1beta1.signingInfo({ consAddress: validators[v].consensus_address }),
                                    this._chainService.getChain(AssetSymbol.LUM).client.cosmos.staking.v1beta1.delegatorDelegations({ delegatorAddr: getDecodedAccountAddress }),
                                ]);

                                // Set the required information
                                validators[v].operator_address = val.operatorAddress;
                                validators[v].account_address = getDecodedAccountAddress;
                                validators[v].description = {
                                    moniker: val.description.moniker,
                                    identity: val.description.identity,
                                    website: val.description.website,
                                    security_contact: val.description.securityContact,
                                    details: val.description.details,
                                };
                                validators[v].displayed_name = val.description.moniker || val.description.identity || val.operatorAddress;
                                validators[v].jailed = val.jailed;
                                validators[v].status = val.status;
                                validators[v].tokens = parseInt(val.tokens, 10);
                                validators[v].delegator_shares = Number(Number(val.delegatorShares).toFixed());
                                validators[v].commission = {
                                    rates: {
                                        current_rate: parseInt(val.commission.commissionRates.rate, 10),
                                        max_rate: parseInt(val.commission.commissionRates.maxRate, 10),
                                        max_change_rate: parseInt(val.commission.commissionRates.maxChangeRate, 10),
                                    },
                                    last_updated_at: val.commission.updateTime,
                                };
                                validators[v].bonded_height = Number(signingInfos.valSigningInfo.startHeight);
                                // We may receive falsy values from delegation responses (NaN, null)
                                // Hence we convert falsy values in case we receive them
                                validators[v].self_bonded = Number(selfBonded.delegationResponses.map((el) => el.balance.amount)[0]) || 0;
                                validators[v].tombstoned = signingInfos.valSigningInfo.tombstoned;
                                validators[v].uptime = ((SIGNED_BLOCK_WINDOW - Number(Number(signingInfos.valSigningInfo.missedBlocksCounter).toFixed())) / SIGNED_BLOCK_WINDOW) * 100;
                                break;
                            }
                        }
                    }
                    if (stakingValidators.pagination && stakingValidators.pagination.nextKey && stakingValidators.pagination.nextKey.length > 0) {
                        nextPageKey = stakingValidators.pagination.nextKey;
                    } else {
                        break;
                    }
                }
            }

            // Persist to database
            await this._validatorService.saveBulk(validators);
            this._logger.log(`Persisted ${validators.length} validators`);
        } catch (error) {
            this._logger.error(`Failed to ingest validators: ${error}`, error.stack);
        }
    }
}
