import HttpClient from '@app/utils/http';
import { OSMOSIS_API_URL } from '@app/utils/constants';
import { LumResponse } from '@app/http';

class OsmosisApi extends HttpClient {
    private static instance?: OsmosisApi;

    private constructor() {
        super(OSMOSIS_API_URL);
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new OsmosisApi();
        }

        return this.instance;
    }

    public getLum = () => this.instance.get<LumResponse[]>('/tokens/v1/LUM');
}

export default OsmosisApi;
