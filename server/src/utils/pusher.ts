import * as Pusher from 'pusher';
import Singleton from "./singleton";

export default class PusherClient extends Singleton<PusherClient>{
    protected _instance: Pusher;

    constructor(){
        super();
        this._instance = new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: 'eu',
            useTLS: true
        });
    }

    notify(channel:string, event:string, data: any){
        return this._instance.trigger(channel, event, data);
    }
}
