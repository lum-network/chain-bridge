import {Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {BlockchainService, ElasticService} from "@app/Services";
import {ElasticIndexes} from "@app/Utils/Constants";

@Injectable()
export default class ValidatorScheduler {
    private _logger: Logger = new Logger(ValidatorScheduler.name);

    @Cron(CronExpression.EVERY_MINUTE)
    async ingest(){
        const vss:{'height', result: {'block_height', 'validators':[]}} = await BlockchainService.getInstance().getClient().getValidatorsSet();
        const vs:{'height', result: []} = await BlockchainService.getInstance().getClient().getValidators();

        if(!vs || !vss){
            this._logger.error(`Cannot acquire validators set`);
            return;
        }

        for (let set of vss.result.validators){
            for (let val of vs.result){
                if(val['consensus_pubkey'] !== set['pub_key']){
                    return;
                }

                let payload = {
                    "address_consensus": set['address'],
                    "address_consensus_pub": set['pub_key'],
                    "address_operator": val['operator_address'],
                    "address_operator_pub": ''
                };

                if ((await ElasticService.getInstance().documentExists(ElasticIndexes.INDEX_VALIDATORS, set['address'])) === false){
                    await ElasticService.getInstance().documentCreate(ElasticIndexes.INDEX_VALIDATORS, set['address'], payload);
                    this._logger.log(`Indexed validator with address ${set['address']}`);
                }
            }
        }
    }
}
