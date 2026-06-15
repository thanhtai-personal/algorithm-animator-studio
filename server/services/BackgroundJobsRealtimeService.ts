import type { Server as HttpServer } from "node:http";
import WebSocket, { WebSocketServer } from "ws";

type SnapshotProvider = () => unknown;

let snapshotProvider: SnapshotProvider = () => ({ atMs: Date.now(), youtubeJobs: [], agentJobs: [] });
let server: WebSocketServer | null = null;
let pendingBroadcast: NodeJS.Timeout | null = null;

export function attachBackgroundJobsWebSocket(httpServer: HttpServer, provider: SnapshotProvider) {
  snapshotProvider = provider;
  server = new WebSocketServer({ server: httpServer, path: "/api/background-jobs/ws" });

  server.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "snapshot", payload: snapshotProvider() }));
  });

  windowlessInterval(() => broadcastSnapshot(), 30_000);
}

export function notifyBackgroundJobsChanged() {
  if (!server) return;
  if (pendingBroadcast) return;
  pendingBroadcast = setTimeout(() => {
    pendingBroadcast = null;
    broadcastSnapshot();
  }, 400);
}

function broadcastSnapshot() {
  if (!server || !server.clients.size) return;
  const payload = JSON.stringify({ type: "snapshot", payload: snapshotProvider() });
  for (const client of server.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

function windowlessInterval(callback: () => void, ms: number) {
  const timer = setInterval(callback, ms);
  timer.unref?.();
}
