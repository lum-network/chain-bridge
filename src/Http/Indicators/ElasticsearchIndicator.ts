import {Injectable} from "@nestjs/common";
import {HealthCheckError, HealthIndicator, HealthIndicatorResult} from "@nestjs/terminus";
import {ElasticService} from "@app/Services";

@Injectable()
export default class ElasticsearchIndicator extends HealthIndicator {

    constructor(private readonly _elasticService: ElasticService) {
        super();
    }

    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            const ping = await this._elasticService.client.ping();
            return this.getStatus('elasticsearch', ping.body);
        } catch(error){
            throw new HealthCheckError('Elasticsearch ping failed', error);
        }
    }
}
