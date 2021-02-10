import {Job} from "bull";
import {Process, Processor} from "@nestjs/bull";
import {QueueJobs, Queues} from "@app/Utils/Constants";
import {Logger} from "@nestjs/common";
import {PusherService} from "@app/Services";

@Processor(Queues.QUEUE_DEFAULT)
export default class NotificationConsumer {
    private readonly _logger: Logger = new Logger(NotificationConsumer.name);

    constructor(private readonly _pusherService: PusherService) {
    }

    @Process(QueueJobs.NOTIFICATION_SOCKET)
    async dispatchNotificationSocket(job: Job<{ channel: string, event: string, data: any }>) {
        this._logger.log(`Dispatching notification on channel ${job.data.channel}...`);
        await this._pusherService.notify(job.data.channel, job.data.event, job.data.data);
    }
}
