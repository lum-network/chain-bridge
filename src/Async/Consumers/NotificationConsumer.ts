import { Logger } from '@nestjs/common';

import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';

import { QueueJobs, Queues } from '@app/Utils/Constants';
import { Gateway } from '@app/Websocket';

@Processor(Queues.QUEUE_DEFAULT)
export default class NotificationConsumer {
    private readonly _logger: Logger = new Logger(NotificationConsumer.name);

    constructor(private readonly _messageGateway: Gateway) {
    }

    @Process(QueueJobs.NOTIFICATION_SOCKET)
    async dispatchNotificationSocket(job: Job<{ channel: string, event: string, data: string }>) {
        this._logger.log(`Dispatching notification on channel ${job.data.channel}...`);
        if(this._messageGateway && this._messageGateway._server) {
            this._messageGateway._server.to(job.data.channel).emit(job.data.event, job.data.data);
        }
    }
}
