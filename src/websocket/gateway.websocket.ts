import {Logger} from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';

import {Server, Socket} from 'socket.io';

import {NotificationChannels} from '@app/utils';

@WebSocketGateway({cors: true})
export class GatewayWebsocket implements OnGatewayInit, OnGatewayConnection {
    private _logger: Logger = new Logger(GatewayWebsocket.name);

    @WebSocketServer()
    _server!: Server;

    afterInit(server: Server): any {
        this._server = server;
        this._logger.log(`Websocket gateway initialized`);
    }

    handleConnection(client: any, ...args: any[]): any {
        this._logger.debug('New connection of user ID ' + client.id, ...args);
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
