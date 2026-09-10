import { createServer } from "node:http";
import { createRemoteApp } from "./remoteApp";
import { TelegramRemoteControlService } from "./services/TelegramRemoteControlService";

const host = "127.0.0.1";
const port = normalizePort(process.env.PORT);
const remoteControl = new TelegramRemoteControlService();
const httpServer = createServer(createRemoteApp(remoteControl, {
  clientDirectory: process.env.KATA_REMOTE_CLIENT_DIR,
}));

httpServer.listen(port, host, () => {
  console.log(`[kai-remote] Running at http://${host}:${port}`);
  void remoteControl.start().catch((error) => {
    console.warn("[kai-remote] Telegram bot did not start:", toErrorMessage(error));
  });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void shutdown());
}

async function shutdown() {
  await remoteControl.stop().catch(() => undefined);
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
}

function normalizePort(value: string | undefined) {
  const parsed = Number(value || 8891);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error(`KAI Remote port không hợp lệ: ${value || ""}`);
  }
  return parsed;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
