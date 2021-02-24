import {
    ConnectedSocket,
    MessageBody, OnGatewayConnection, OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationChannels } from '@app/Utils/Constants';

@WebSocketGateway()
export default class Gateway implements OnGatewayInit, OnGatewayConnection {
    private _logger: Logger = new Logger(Gateway.name);

    @WebSocketServer()
    _server!: Server;

    afterInit(server: Server): any {
        this._server = server;
        this._logger.log(`Websocket gateway initialized`);
    }

    handleConnection(client: any, ...args: any[]): any {
        this._logger.debug('New connection of user ID ' + client.id);
    }

    @SubscribeMessage('action:listen-channel')
    listenChannel(@MessageBody() data: string, @ConnectedSocket() client: Socket): string {
        const payload = JSON.parse(data);
        if (!payload || !payload.name) {
            return 'invalid_payload';
        }

        if (Object.values(NotificationChannels).includes(payload.name) === false) {
            return 'invalid_channel_name';
        }
        client.join(payload.name);
        this._logger.log(`Client ${client.id} joined ${payload.name}`);
        return 'ok';
    }
}
