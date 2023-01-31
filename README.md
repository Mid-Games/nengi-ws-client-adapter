# nengi-ws-client-adapter
nengi client adapter for ws [https://github.com/websockets/ws](https://github.com/websockets/ws) and node.js buffers

this adapter allows a nengi client in node.js (or any environment with Buffers) to connect via ws

some uses
- creating a node.js bot that connects to a nengi instance
- service-to-service connections (create a client in any node app and connect to a nengi instance)
- stress tests