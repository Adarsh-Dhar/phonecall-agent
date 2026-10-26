import type { WebSocketServer, WebSocket } from "ws";

type Beating = WebSocket & { isAlive?: boolean };
const HEARTBEAT_MS = Number(process.env.WS_HEARTBEAT_MS) || 15_000;

export function attachHeartbeat(wss: WebSocketServer): () => void {
  wss.on("connection", (ws: Beating) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });
  });
  const timer = setInterval(() => {
    for (const client of wss.clients as Set<Beating>) {
      if (client.isAlive === false) { client.terminate(); continue; }
      client.isAlive = false;
      client.ping();
    }
  }, HEARTBEAT_MS);
  timer.unref();
  wss.on("close", () => clearInterval(timer));
  return () => clearInterval(timer);
}
