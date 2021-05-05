import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { Job } from 'bull';

import { QueueJobs, Queues, config } from '@app/utils';
import { GatewayWebsocket } from '@app/websocket';

@Processor(Queues.QUEUE_DEFAULT)
export class NotificationConsumer {
    private readonly _logger: Logger = new Logger(NotificationConsumer.name);

    constructor(private readonly _messageGateway: GatewayWebsocket) {}

    @Process(QueueJobs.NOTIFICATION_SOCKET)
    async dispatchNotificationSocket(job: Job<{ channel: string; event: string; data: string }>) {
        if (config.isPushNotifEnabled() == false) {
            return;
        }

        this._logger.log(`Dispatching notification on channel ${job.data.channel}...`);
        if (this._messageGateway && this._messageGateway._server) {
            this._messageGateway._server.to(job.data.channel).emit(job.data.event, job.data.data);
        }
    }
}
