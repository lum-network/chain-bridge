import {Process, Processor} from '@nestjs/bull';
import {Inject} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {ClientProxy} from '@nestjs/microservices';

import {Job} from 'bull';

import {QueueJobs, Queues, makeRequest} from '@app/utils';

@Processor(Queues.QUEUE_DEFAULT)
export class NotificationConsumer {
    constructor(@Inject('API') private readonly _client: ClientProxy, private readonly _configService: ConfigService) {
    }

    @Process(QueueJobs.NOTIFICATION_SOCKET)
    async dispatchNotificationSocket(job: Job<{ channel: string; event: string; data: string }>) {
        if (this._configService.get<boolean>('PUSH_NOTIF_ENABLED') == false) {
            return;
        }

        await makeRequest(this._client, 'notifySocket', job.data);
    }
}
