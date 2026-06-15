import type { AgentVideoJob } from "./aiVideoAgentApi";
import { buildApiUrl } from "./runtimeApi";
import type { YoutubeToolsJob } from "./youtubeToolsApi";

export type BackgroundJobsSnapshot = {
  atMs: number;
  youtubeJobs: YoutubeToolsJob[];
  agentJobs: AgentVideoJob[];
};

type SnapshotListener = (snapshot: BackgroundJobsSnapshot) => void;

const listeners = new Set<SnapshotListener>();
let socket: WebSocket | null = null;
let lastSnapshot: BackgroundJobsSnapshot | null = null;
let reconnectTimer: number | undefined;
let manualClose = false;

export function openBackgroundJobsSocket(onSnapshot: (snapshot: BackgroundJobsSnapshot) => void, onClose?: () => void) {
  listeners.add(onSnapshot);
  if (lastSnapshot) onSnapshot(lastSnapshot);
  ensureSocket(onClose);

  return () => {
    listeners.delete(onSnapshot);
    if (!listeners.size) closeSocket();
  };
}

function ensureSocket(onClose?: () => void) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  manualClose = false;
  socket = new WebSocket(toWebSocketUrl(buildApiUrl("/api/background-jobs/ws")));

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as { type?: string; payload?: BackgroundJobsSnapshot };
      if (message.type === "snapshot" && message.payload) {
        lastSnapshot = message.payload;
        for (const listener of listeners) listener(message.payload);
      }
    } catch {
      // Ignore malformed realtime messages; the fallback poll can recover.
    }
  };
  socket.onerror = () => socket?.close();
  socket.onclose = () => {
    socket = null;
    onClose?.();
    if (!manualClose && listeners.size && reconnectTimer === undefined) {
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        ensureSocket(onClose);
      }, 5000);
    }
  };
}

function closeSocket() {
  manualClose = true;
  if (reconnectTimer !== undefined) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
  socket?.close();
  socket = null;
}

function toWebSocketUrl(url: string) {
  const absolute = new URL(url, window.location.origin);
  absolute.protocol = absolute.protocol === "https:" ? "wss:" : "ws:";
  return absolute.toString();
}
