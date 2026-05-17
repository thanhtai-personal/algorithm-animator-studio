import { execFile } from "node:child_process";
import express from "express";
import { getRuntimeDependencyStatus, startRuntimeDependencyInstall } from "../services/RuntimeDependencyInstallerService";

const DIRECTORY_DIALOG_TITLE = "Chọn nơi app-server local lưu dữ liệu trên máy";

export function createSystemRouter() {
  const router = express.Router();

  router.get("/system/dependencies", async (_req, res) => {
    try {
      res.json(await getRuntimeDependencyStatus());
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Could not check runtime dependencies.",
      });
    }
  });

  router.post("/system/dependencies/install", async (_req, res) => {
    try {
      res.json(await startRuntimeDependencyInstall());
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Could not start runtime dependency installation.",
      });
    }
  });

  router.post("/system/select-directory", (_req, res) => {
    if (process.platform !== "win32") {
      res.status(501).json({
        ok: false,
        error: "Folder picker is currently supported on Windows local app-server only.",
      });
      return;
    }

    const command = [
      "$ErrorActionPreference = 'Stop';",
      "$shell = New-Object -ComObject Shell.Application;",
      `$folder = $shell.BrowseForFolder(0, '${escapePowerShellSingleQuoted(DIRECTORY_DIALOG_TITLE)}', 0);`,
      "if ($folder -ne $null) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $folder.Self.Path }",
    ].join(" ");

    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      { windowsHide: false, timeout: 5 * 60 * 1000 },
      (error, stdout, stderr) => {
        if (error) {
          res.status(500).json({
            ok: false,
            error: stderr?.trim() || error.message || "Could not open folder picker.",
          });
          return;
        }

        res.json({
          ok: true,
          path: stdout.trim(),
        });
      }
    );
  });

  return router;
}

function escapePowerShellSingleQuoted(value: string) {
  return value.replace(/'/g, "''");
}
