import { Router, type NextFunction, type Request, type Response } from "express";
import { CLIENT_ORIGIN } from "../config/paths";
import type { RemoteControlConfigUpdate } from "../models/RemoteControl";
import {
  hasTelegramBotToken,
  readRemoteControlConfig,
  saveRemoteControlConfig,
} from "../services/RemoteControlConfigService";
import type { RemoteControlRuntimeStatus } from "../models/RemoteControl";

export type RemoteControlRuntimeController = {
  getStatus: () => RemoteControlRuntimeStatus;
  restart: () => Promise<void>;
};

export function createRemoteControlRouter(service: RemoteControlRuntimeController) {
  const router = Router();

  router.use("/remote-control", localSettingsGuard);

  router.get("/remote-control/settings", (_req, res) => {
    res.json(buildSettingsResponse(service));
  });

  router.put(
    "/remote-control/settings",
    async (req: Request<unknown, unknown, RemoteControlConfigUpdate>, res: Response) => {
      try {
        saveRemoteControlConfig(req.body || {});
        try {
          await service.restart();
        } catch {
          // Runtime status contains the Telegram connection error; saving valid local config still succeeds.
        }
        res.json(buildSettingsResponse(service));
      } catch (error) {
        res.status(400).json({ error: toErrorMessage(error) });
      }
    },
  );

  return router;
}

function buildSettingsResponse(service: TelegramRemoteControlService) {
  return {
    config: readRemoteControlConfig(),
    tokenConfigured: hasTelegramBotToken(),
    runtime: service.getStatus(),
  };
}

function localSettingsGuard(req: Request, res: Response, next: NextFunction) {
  if (!isLoopbackAddress(req.socket.remoteAddress || "")) {
    res.status(403).json({ error: "Remote Control settings chỉ được quản lý từ máy local." });
    return;
  }

  const origin = req.header("origin");
  if (origin && !isTrustedClientOrigin(origin)) {
    res.status(403).json({ error: "Origin không được phép quản lý Remote Control." });
    return;
  }

  next();
}

function isLoopbackAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  return normalized === "127.0.0.1"
    || normalized === "::1"
    || normalized === "::ffff:127.0.0.1";
}

function isTrustedClientOrigin(origin: string): boolean {
  try {
    const actual = new URL(origin);
    const expected = new URL(CLIENT_ORIGIN);

    if (actual.origin === expected.origin) return true;

    return isLoopbackHostname(actual.hostname)
      && actual.port === expected.port
      && actual.protocol === expected.protocol;
  } catch {
    return false;
  }
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "[::1]" || normalized === "::1";
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Không lưu được Remote Control settings.";
}
