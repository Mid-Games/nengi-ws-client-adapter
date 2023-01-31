import { ClientNetwork, Context } from 'nengi';
import WebSocket from 'ws';
declare class WsClientAdapter {
    socket: WebSocket | null;
    network: ClientNetwork;
    context: Context;
    constructor(network: ClientNetwork);
    flush(): void;
    setupWebsocket(socket: WebSocket): void;
    connect(wsUrl: string, handshake: any): Promise<unknown>;
}
export { WsClientAdapter };
