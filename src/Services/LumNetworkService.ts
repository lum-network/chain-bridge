import { LumClient } from '@lum-network/sdk-javascript';

import { config } from '@app/Utils/Config';

let client: LumClient;

export default class LumNetworkService {
    public static getClient = async (): Promise<LumClient> => {
        if (client) {
            return client;
        }
        client = await LumClient.connect(config.getLumNetworkEndpoint());
        return client;
    };
}
