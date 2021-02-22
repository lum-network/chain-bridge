import {Injectable} from "@nestjs/common";

import Pusher from 'pusher';

import {config} from "@app/Utils/Config";

@Injectable()
export default class PusherService {
    private _instance: Pusher;

    constructor() {
        this._instance = new Pusher({
            appId: config.getValue<string>('PUSHER_APP_ID'),
            key: config.getValue<string>('PUSHER_KEY'),
            secret: config.getValue<string>('PUSHER_SECRET'),
            cluster: 'eu',
            useTLS: true
        });
    }

    notify = (channel: string, event: string, data: any): Promise<any> => {
        return this._instance.trigger(channel, event, data);
    }
}
