import {Injectable} from "@nestjs/common";
import {LumNetworkService} from "@app/services/lum-network.service";
import {ElasticService} from "@app/services/elastic.service";
import {plainToClass} from "class-transformer";
import {ValidatorResponse} from "@app/http";
import {ElasticIndexes} from "@app/utils";
import {LumUtils} from "@lum-network/sdk-javascript";

@Injectable()
export class ValidatorService {
    constructor(private readonly _lumNetworkService: LumNetworkService, private readonly _elasticService: ElasticService) {}

    fetch = async (): Promise<any[]> => {
        const lumClt = await this._lumNetworkService.getClient();
        const { validators } = lumClt.queryClient.staking;

        // We acquire both bounded and unbonded (candidates) validators
        const [bonded, unbonding, unbonded, tmValidators] = await Promise.all([
            validators('BOND_STATUS_BONDED'),
            validators('BOND_STATUS_UNBONDING'),
            validators('BOND_STATUS_UNBONDED'),
            lumClt.tmClient.validatorsAll(1),
        ]);

        let allBondedValidators = bonded.validators;

        while (bonded.pagination && bonded.pagination.nextKey && bonded.pagination.nextKey.length) {
            const newPage = await validators('BOND_STATUS_BONDED', bonded.pagination.nextKey);
            allBondedValidators = [...allBondedValidators, ...newPage.validators];
        }

        const results = [...allBondedValidators, ...unbonding.validators, ...unbonded.validators];

        const mapResults = results.map((validator) => plainToClass(ValidatorResponse, validator));

        // Get the operator addresses
        const operatorAddresses: string[] = [];

        for (const tmValidator of tmValidators.validators) {
            try {
                const validatorDoc = await this._elasticService.documentGet(ElasticIndexes.INDEX_VALIDATORS, LumUtils.toHex(tmValidator.address).toUpperCase());

                operatorAddresses.push(validatorDoc && validatorDoc.body && validatorDoc.body._source && validatorDoc.body._source.operator_address);
            } catch (e) {}
        }

        for (const [key, validator] of Object.entries(mapResults)) {
            const genesis = operatorAddresses.find((value) => value === validator.operator_address);

            if (genesis) {
                mapResults[key].genesis = true;
            }
        }

        return mapResults;
    }
}
