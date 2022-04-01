import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OSMOSIS_API_URL } from '@app/utils/constants';

@Injectable()
export class LumService {
    constructor(private httpService: HttpService) {}

    getLum = (): Promise<any> => this.httpService.get(`${OSMOSIS_API_URL}/tokens/v2/LUM`).toPromise();

    getPreviousDayLum = (): Promise<any> => this.httpService.get(`${OSMOSIS_API_URL}/tokens/v1/historical/LUM/chart?range=1d`).toPromise();
}
