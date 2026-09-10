import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import {
  createRemoteControlRouter,
  type RemoteControlRuntimeController,
} from "./routes/remoteControlRoutes";

export type RemoteAppOptions = {
  clientDirectory?: string;
};

export function createRemoteApp(
  service: RemoteControlRuntimeController,
  options: RemoteAppOptions = {},
) {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "kai-remote", at: new Date().toISOString() });
  });
  app.use("/api", createRemoteControlRouter(service));

  const clientDirectory = resolveClientDirectory(options.clientDirectory);
  if (clientDirectory) {
    app.use(express.static(clientDirectory, { index: false, maxAge: "1h" }));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
      return res.sendFile(path.join(clientDirectory, "index.html"));
    });
  }

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  return app;
}

function resolveClientDirectory(value: string | undefined) {
  const directory = value?.trim() ? path.resolve(value) : "";
  if (!directory || !fs.existsSync(path.join(directory, "index.html"))) return "";
  return directory;
}
