import os from "node:os";
import { spawn } from "node:child_process";
import type { RemoteControlConfig } from "../models/RemoteControl";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function executeRemoteControlAction(
  action: "status" | "lock" | "open_app" | "shutdown" | "restart",
  config: RemoteControlConfig,
  alias?: string,
): Promise<ActionResult> {
  switch (action) {
    case "status":
      return getSystemStatus();
    case "lock":
      return lockWorkstation();
    case "open_app":
      return openConfiguredApp(config, alias);
    case "shutdown":
    case "restart":
      return runPowerAction(action, config);
  }
}

function getSystemStatus(): ActionResult {
  const usedMemoryBytes = os.totalmem() - os.freemem();
  const usedMemoryPercent = Math.round((usedMemoryBytes / os.totalmem()) * 100);
  const uptimeMinutes = Math.floor(os.uptime() / 60);

  return {
    ok: true,
    message: [
      `Host: ${os.hostname()}`,
      `Platform: ${os.platform()} ${os.release()}`,
      `CPU: ${os.cpus().length} logical cores`,
      `RAM: ${usedMemoryPercent}% used`,
      `Uptime: ${formatMinutes(uptimeMinutes)}`,
    ].join("\n"),
  };
}

async function lockWorkstation(): Promise<ActionResult> {
  if (process.platform !== "win32") {
    return { ok: false, message: "Lock hiện chỉ được hỗ trợ trên Windows." };
  }

  await spawnDetached("rundll32.exe", ["user32.dll,LockWorkStation"]);
  return { ok: true, message: "Đã gửi lệnh khóa máy." };
}

async function openConfiguredApp(config: RemoteControlConfig, rawAlias?: string): Promise<ActionResult> {
  const alias = rawAlias?.trim().toLowerCase() || "";
  const executable = config.appAliases[alias];

  if (!alias || !executable) {
    const available = Object.keys(config.appAliases);
    return {
      ok: false,
      message: available.length
        ? `Alias không hợp lệ. Có thể dùng: ${available.join(", ")}`
        : "Chưa cấu hình app alias nào trong Settings → Remote.",
    };
  }

  await spawnDetached(executable, []);
  return { ok: true, message: `Đã mở ứng dụng "${alias}".` };
}

async function runPowerAction(
  action: "shutdown" | "restart",
  config: RemoteControlConfig,
): Promise<ActionResult> {
  if (!config.allowPowerActions) {
    return { ok: false, message: "Shutdown/restart đang bị tắt trong Settings → Remote." };
  }
  if (process.platform !== "win32") {
    return { ok: false, message: "Shutdown/restart từ Remote Control hiện chỉ hỗ trợ Windows." };
  }

  const args = action === "restart"
    ? ["/r", "/t", "10"]
    : ["/s", "/t", "10"];

  await spawnDetached("shutdown.exe", args);
  return {
    ok: true,
    message: action === "restart"
      ? "Đã xác nhận restart. Windows sẽ khởi động lại sau khoảng 10 giây."
      : "Đã xác nhận shutdown. Windows sẽ tắt sau khoảng 10 giây.",
  };
}

function spawnDetached(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      shell: false,
    });

    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

function formatMinutes(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    `${minutes}m`,
  ].filter(Boolean).join(" ");
}
