import type { AgentVideoJob } from "./aiVideoAgentApi";
import { buildApiUrl } from "./runtimeApi";
import type { YoutubeToolsJob } from "./youtubeToolsApi";

export type BackgroundJobsSnapshot = {
  atMs: number;
  youtubeJobs: YoutubeToolsJob[];
  agentJobs: AgentVideoJob[];
};

export function openBackgroundJobsSocket(onSnapshot: (snapshot: BackgroundJobsSnapshot) => void, onClose?: () => void) {
  const socket = new WebSocket(toWebSocketUrl(buildApiUrl("/api/background-jobs/ws")));

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as { type?: string; payload?: BackgroundJobsSnapshot };
      if (message.type === "snapshot" && message.payload) onSnapshot(message.payload);
    } catch {
      // Ignore malformed realtime messages; the fallback poll can recover.
    }
  };
  socket.onerror = () => socket.close();
  socket.onclose = () => onClose?.();

  return () => socket.close();
}

function toWebSocketUrl(url: string) {
  return url.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}
