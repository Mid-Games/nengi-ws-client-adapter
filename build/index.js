"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsClientAdapter = void 0;
const nengi_1 = require("nengi");
const ws_1 = __importDefault(require("ws"));
const nengi_buffers_1 = require("nengi-buffers");
class WsClientAdapter {
    constructor(network) {
        this.socket = null;
        this.network = network;
        this.context = this.network.client.context;
    }
    flush() {
        if (!this.socket) {
            return;
        }
        if (this.socket.readyState !== ws_1.default.OPEN) {
            return;
        }
        const buffer = this.network.createOutboundBuffer(nengi_buffers_1.BufferWriter);
        this.socket.send(buffer);
    }
    setupWebsocket(socket) {
        this.socket = socket;
        socket.on('message', (data) => {
            // @ts-ignore
            const dr = new nengi_buffers_1.BufferReader(Buffer.from(data));
            this.network.readSnapshot(dr);
        });
        socket.onclose = function (event) {
            // TODO
        };
        socket.onerror = function (event) {
            // TODO
        };
    }
    connect(wsUrl, handshake) {
        return new Promise((resolve, reject) => {
            const socket = new ws_1.default(wsUrl, { perMessageDeflate: false });
            socket.onopen = (event) => {
                socket.send(this.network.createHandshakeBuffer(handshake, nengi_buffers_1.BufferWriter));
            };
            socket.onclose = function (event) {
                reject(event);
            };
            socket.onerror = function (event) {
                reject(event);
            };
            socket.on('message', (data) => {
                // initially the only thing we care to read is a response to our handshake
                // we don't even setup the parser for the rest of what a nengi client can receive
                // @ts-ignore
                const dr = new nengi_buffers_1.BufferReader(Buffer.from(data));
                const type = dr.readUInt8(); // type of message
                if (type === nengi_1.BinarySection.EngineMessages) {
                    const count = dr.readUInt8(); // quantity of engine messages
                    const connectionResponseByte = dr.readUInt8();
                    if (connectionResponseByte === nengi_1.EngineMessage.ConnectionAccepted) {
                        // setup listeners for normal game data
                        this.setupWebsocket(socket);
                        resolve('accepted');
                    }
                    if (connectionResponseByte === nengi_1.EngineMessage.ConnectionDenied) {
                        const denyReason = JSON.parse(dr.readString());
                        reject(denyReason);
                    }
                }
            });
        });
    }
}
exports.WsClientAdapter = WsClientAdapter;
