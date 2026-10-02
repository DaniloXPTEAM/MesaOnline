import { PeerServer } from "peer";

const server = PeerServer({ port: 9000, path: "/peerjs", proxied: false, allow_discovery: false });

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
