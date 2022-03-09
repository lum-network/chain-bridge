import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { Job } from 'bull';

import { QueueJobs, Queues, config, makeRequest } from '@app/utils';

@Processor(Queues.QUEUE_DEFAULT)
export class NotificationConsumer {
    constructor(@Inject('API') private readonly _client: ClientProxy) {}

    @Process(QueueJobs.NOTIFICATION_SOCKET)
    async dispatchNotificationSocket(job: Job<{ channel: string; event: string; data: string }>) {
        if (config.isPushNotifEnabled() == false) {
            return;
        }

        await makeRequest(this._client, 'notifySocket', job.data);
    }
}
