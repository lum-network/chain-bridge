import {Injectable} from "@nestjs/common";
import {HealthCheckError, HealthIndicator, HealthIndicatorResult} from "@nestjs/terminus";
import {ElasticService} from "@app/Services";

@Injectable()
export default class ElasticsearchIndicator extends HealthIndicator {
    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            const ping = await ElasticService.getInstance().client.ping();
            return this.getStatus('elasticsearch', ping.body);
        } catch(error){
            throw new HealthCheckError('Elasticsearch ping failed', error);
        }
    }
}
