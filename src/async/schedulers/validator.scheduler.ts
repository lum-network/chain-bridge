import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';

import {LumConstants, LumTypes, LumUtils, LumRegistry} from '@lum-network/sdk-javascript';

import {LumNetworkService, ValidatorService} from '@app/services';
import {ValidatorEntity} from "@app/database";

@Injectable()
export class ValidatorScheduler {
    private readonly _logger: Logger = new Logger(ValidatorScheduler.name);

    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _validatorService: ValidatorService) {
    }

    @Cron(CronExpression.EVERY_10_SECONDS, {name: 'validators_live_ingest'})
    async liveIngest() {
        try {
            // Fetch tendermint validators
            const tmValidators = await this._lumNetworkService.client.tmClient.validatorsAll();

            // Build validators list
            const validators: Partial<ValidatorEntity>[] = [];
            for (const val of tmValidators.validators) {
                validators.push({
                    proposer_address: LumUtils.toHex(val.address).toUpperCase(),
                    consensus_address: LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsAddr, val.address),
                    consensus_pubkey: LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsPub, val.pubkey.data),
                });
            }

            // Go through all staking validators to match them with tendermint ones
            const statuses = ['BOND_STATUS_BONDED', 'BOND_STATUS_UNBONDED', 'BOND_STATUS_UNBONDING'];
            let page: Uint8Array | undefined = undefined;
            for (const s of statuses) {
                page = undefined;
                while (true) {
                    const stakingValidators = await this._lumNetworkService.client.queryClient.staking.validators(s as any, page);
                    for (const val of stakingValidators.validators) {
                        const pubKey = LumRegistry.decode(val.consensusPubkey) as LumTypes.PubKey;
                        const consensus_pubkey = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsPub, pubKey.key);
                        // Find the tendermint validator and add the operator address to it
                        for (let v = 0; v < validators.length; v++) {
                            if (validators[v].consensus_pubkey === consensus_pubkey) {
                                validators[v].operator_address = val.operatorAddress;
                                validators[v].account_address = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixAccAddr, LumUtils.Bech32.decode(val.operatorAddress).data);
                                validators[v].description = {
                                    moniker: val.description.moniker,
                                    identity: val.description.identity,
                                    website: val.description.website,
                                    security_contact: val.description.securityContact,
                                    details: val.description.details
                                };
                                validators[v].displayed_name = val.description.moniker || val.description.identity || val.operatorAddress;
                                validators[v].jailed = val.jailed;
                                validators[v].status = val.status;
                                validators[v].tokens = parseInt(val.tokens, 10);
                                validators[v].delegator_shares = val.delegatorShares;
                                validators[v].commission = {
                                    rates: {
                                        current_rate: val.commission.commissionRates.rate,
                                        max_rate: val.commission.commissionRates.maxRate,
                                        max_change_rate: val.commission.commissionRates.maxChangeRate
                                    },
                                    last_updated_at: val.commission.updateTime
                                };
                                break;
                            }
                        }
                    }
                    if (stakingValidators.pagination && stakingValidators.pagination.nextKey && stakingValidators.pagination.nextKey.length > 0) {
                        page = stakingValidators.pagination.nextKey;
                    } else {
                        break;
                    }
                }
            }

            // Save to elasticsearch
            await this._validatorService.saveBulk(validators);
            this._logger.log(`Ingested validator set ${validators.length}`);
        } catch (error) {
            this._logger.error(`Failed to ingest validators: ${error}`, error.stack);
        }
    }
}
