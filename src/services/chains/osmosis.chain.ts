import { lastValueFrom, map } from 'rxjs';

import { GenericChain } from '@app/services/chains/generic.chain';
import { ApiUrl, PERCENTAGE } from '@app/utils';

export class OsmosisChain extends GenericChain {
    getAPY = async (): Promise<number> => {
        const apy = Number(await lastValueFrom(this.httpService.get(`${ApiUrl.GET_OSMOSIS_APY}`).pipe(map((response) => response.data)))) / PERCENTAGE;
        return apy;
    };
}
