import {
    EngineMessage,
    BinarySection,
    ClientNetwork,
    Context
} from 'nengi'

import WebSocket from 'ws'
import { BufferReader, BufferWriter } from 'nengi-buffers'

class WsClientAdapter {
    socket: WebSocket | null
    network: ClientNetwork
    context: Context

    constructor(network: ClientNetwork) {
        this.socket = null
        this.network = network
        this.context = this.network.client.context
    }

    flush() {
        if (!this.socket) {
            return
        }

        if (this.socket!.readyState !== WebSocket.OPEN) {
            return
        }

        const buffer = this.network.createOutboundBuffer(BufferWriter)

        this.socket!.send(buffer)
    }

    setupWebsocket(socket: WebSocket) {
        this.socket = socket

        socket.on('message', (data) => {
            // @ts-ignore
            const dr = new BufferReader(Buffer.from(data))
            this.network.readSnapshot(dr)
        })

        socket.onclose = function (event) {
            console.error('Socket Closed. Event:', event);
            throw new Error('Socket disconnected');
        }

        socket.onerror = function (event) {
            console.error('Socket Error. Event:', event);
            throw new Error('Socket closed due to error');
        }
    }

    connect(wsUrl: string, handshake: any) {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(wsUrl, { perMessageDeflate: false })

            socket.onopen = (event) => {
                socket.send(this.network.createHandshakeBuffer(handshake, BufferWriter))
            }

            socket.onclose = function (event) {
                reject(event)
            }

            socket.onerror = function (event) {
                reject(event)
            }

            socket.on('message', (data) => {
                // initially the only thing we care to read is a response to our handshake
                // we don't even setup the parser for the rest of what a nengi client can receive
                // @ts-ignore
                const dr = new BufferReader(Buffer.from(data))
                const type = dr.readUInt8() // type of message
                if (type === BinarySection.EngineMessages) {
                    const count = dr.readUInt8() // quantity of engine messages
                    const connectionResponseByte = dr.readUInt8()
                    if (connectionResponseByte === EngineMessage.ConnectionAccepted) {
                        // setup listeners for normal game data
                        this.setupWebsocket(socket)
                        resolve('accepted')
                    }
                    if (connectionResponseByte === EngineMessage.ConnectionDenied) {
                        const denyReason = JSON.parse(dr.readString())
                        reject(denyReason)
                    }
                }
            })
        })
    }
}

export { WsClientAdapter }