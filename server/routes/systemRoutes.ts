import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { Router } from "express";

const execFileAsync = promisify(execFile);

type SelectKind = "directory" | "file";

export function createSystemRouter() {
  const router = Router();

  router.post("/system/select-directory", async (req, res) => {
    try {
      const kind = normalizeKind(req.body?.kind);
      const title = String(req.body?.title || (kind === "file" ? "Chọn tệp" : "Chọn thư mục"));
      const initialPath = typeof req.body?.initialPath === "string" ? req.body.initialPath : "";
      const selectedPath = kind === "file"
        ? await selectFile(title, initialPath)
        : await selectDirectory(title, initialPath);

      res.json({ ok: true, path: selectedPath });
    } catch (error) {
      res.status(500).json({ error: toErrorMessage(error) });
    }
  });

  router.post("/system/open-directory", async (req, res) => {
    try {
      const targetPath = String(req.body?.path || "").trim();
      if (!targetPath) throw new Error("Chưa có đường dẫn để mở.");
      await openPath(targetPath);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: toErrorMessage(error) });
    }
  });

  return router;
}

function normalizeKind(value: unknown): SelectKind {
  return value === "file" ? "file" : "directory";
}

async function selectDirectory(title: string, initialPath: string) {
  ensureWindowsDialogSupport();
  const initialScript = initialPath ? `$dialog.SelectedPath = ${toPowerShellString(initialPath)};` : "";
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = ${toPowerShellString(title)}
$dialog.ShowNewFolderButton = $true
${initialScript}
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.SelectedPath }
`.trim();

  return runPowerShellPicker(script);
}

async function selectFile(title: string, initialPath: string) {
  ensureWindowsDialogSupport();
  const initial = resolveInitialDirectory(initialPath);
  const initialScript = initial ? `$dialog.InitialDirectory = ${toPowerShellString(initial)};` : "";
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = ${toPowerShellString(title)}
$dialog.Filter = 'Executable (*.exe)|*.exe|All files (*.*)|*.*'
$dialog.Multiselect = $false
${initialScript}
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName }
`.trim();

  return runPowerShellPicker(script);
}

async function runPowerShellPicker(script: string) {
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-Command", script],
    { windowsHide: false, timeout: 120_000 }
  );
  const selectedPath = stdout.trim().split(/\r?\n/).pop()?.trim() || "";
  if (!selectedPath) throw new Error("Bạn chưa chọn đường dẫn nào.");
  return selectedPath;
}

async function openPath(targetPath: string) {
  const normalized = path.resolve(targetPath);
  if (!fs.existsSync(normalized)) {
    throw new Error(`Đường dẫn không tồn tại: ${normalized}`);
  }

  const pathToOpen = fs.statSync(normalized).isDirectory() ? normalized : path.dirname(normalized);

  if (process.platform === "win32") {
    await execFileAsync("explorer.exe", [pathToOpen], { windowsHide: false });
    return;
  }

  if (process.platform === "darwin") {
    await execFileAsync("open", [pathToOpen]);
    return;
  }

  await execFileAsync("xdg-open", [pathToOpen]);
}

function resolveInitialDirectory(value: string) {
  if (!value.trim()) return "";
  const resolved = path.resolve(value);
  if (!fs.existsSync(resolved)) return "";
  return fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);
}

function ensureWindowsDialogSupport() {
  if (process.platform !== "win32") {
    throw new Error("Chọn bằng Explorer hiện chỉ hỗ trợ khi chạy backend local trên Windows.");
  }
}

function toPowerShellString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thực hiện được thao tác hệ thống.";
}
