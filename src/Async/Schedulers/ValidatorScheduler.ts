import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LumConstants, LumTypes, LumUtils, LumRegistry } from '@lum-network/sdk-javascript';

import { LumNetworkService, ElasticService } from '@app/Services';
import { ValidatorDocument } from '@app/Utils/Models';
import { ElasticIndexes } from '@app/Utils/Constants';

@Injectable()
export default class ValidatorScheduler {
    private readonly _logger: Logger = new Logger(ValidatorScheduler.name);

    constructor(
        private readonly _elasticService: ElasticService,
        private readonly _lumNetworkService: LumNetworkService,
    ) {
    }

    @Cron(CronExpression.EVERY_MINUTE, { name: 'validators_live_ingest' })
    async liveIngest() {
        try {
            this._logger.debug(`Ingesting validators set`);

            // Acquire lum network client
            const clt = this._lumNetworkService.getClient();

            // Fetch tendermint validators
            const tmValidators = await clt.tmClient.validatorsAll();

            // Build validators list
            const validators: ValidatorDocument[] = [];
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
                    const stakingValidators = await clt.queryClient.staking.unverified.validators(s as any, page);
                    for (const val of stakingValidators.validators) {
                        const pubKey = LumRegistry.decode(val.consensusPubkey) as LumTypes.PubKey;
                        const consensus_pubkey = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsPub, pubKey.key);
                        // Find the tendermint validator and add the operator address to it
                        for (let v = 0; v < validators.length; v++) {
                            if (validators[v].consensus_pubkey === consensus_pubkey) {
                                validators[v].operator_address = val.operatorAddress;
                                break;
                            }
                        }
                    }
                    if (stakingValidators.pagination && stakingValidators.pagination.nextKey) {
                        page = stakingValidators.pagination.nextKey;
                    } else {
                        break;
                    }
                }
            }

            // Save to elasticsearch
            const bulkPayload = [];
            for (const v of validators) {
                bulkPayload.push({
                    index: {
                        _index: ElasticIndexes.INDEX_VALIDATORS,
                        _id: v.proposer_address,
                    },
                });
                bulkPayload.push(v);
            }
            await this._elasticService.bulkUpdate({ body: bulkPayload });
        } catch (error) {
            this._logger.error(`Failed to ingest validators:`, error);
        }
    }
}
