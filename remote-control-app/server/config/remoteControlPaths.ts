import os from "node:os";
import path from "node:path";

export const REMOTE_CONTROL_HOME = resolveRemoteControlHome();
export const REMOTE_CONTROL_CLIENT_ORIGIN = process.env.CLIENT_ORIGIN?.trim() || "http://localhost:3000";

function resolveRemoteControlHome() {
  const configured = process.env.KATA_STUDIO_HOME?.trim();
  if (configured) return path.resolve(configured);

  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, "KAI STUDIO");
  }

  return path.join(os.homedir(), ".kata-studio");
}
