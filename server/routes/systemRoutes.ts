import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { Router } from "express";

const execFileAsync = promisify(execFile);
const WSL_POWERSHELL_PATH = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";

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
  const initialScript = initialPath ? `
$initialPath = ${toPowerShellString(initialPath)}
if ($initialPath -and (Test-Path -LiteralPath $initialPath)) {
  $initialItem = Get-Item -LiteralPath $initialPath
  if ($initialItem.PSIsContainer) { $dialog.InitialDirectory = $initialItem.FullName }
  else { $dialog.InitialDirectory = $initialItem.DirectoryName }
}
`.trim() : "";
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.StartPosition = 'CenterScreen'
$owner.ShowInTaskbar = $false
$owner.Opacity = 0.01
$owner.Width = 1
$owner.Height = 1
$owner.Show()
$owner.Activate()
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = ${toPowerShellString(title)}
$dialog.Filter = 'Folders|*.folder|All files (*.*)|*.*'
$dialog.CheckFileExists = $false
$dialog.CheckPathExists = $true
$dialog.ValidateNames = $false
$dialog.Multiselect = $false
$dialog.FileName = 'Select this folder'
${initialScript}
$result = $dialog.ShowDialog($owner)
$owner.Dispose()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  $selectedPath = $dialog.FileName
  if (Test-Path -LiteralPath $selectedPath -PathType Container) {
    Write-Output $selectedPath
  } else {
    $selectedFolder = Split-Path -Parent $selectedPath
    if ($selectedFolder) { Write-Output $selectedFolder }
  }
}
`.trim();

  return runPowerShellPicker(script);
}

async function selectFile(title: string, initialPath: string) {
  ensureWindowsDialogSupport();
  const initial = resolveInitialDirectory(initialPath);
  const initialScript = initial ? `$dialog.InitialDirectory = ${toPowerShellString(initial)};` : "";
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.StartPosition = 'CenterScreen'
$owner.ShowInTaskbar = $false
$owner.Opacity = 0.01
$owner.Width = 1
$owner.Height = 1
$owner.Show()
$owner.Activate()
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = ${toPowerShellString(title)}
$dialog.Filter = 'Executable (*.exe)|*.exe|All files (*.*)|*.*'
$dialog.Multiselect = $false
${initialScript}
$result = $dialog.ShowDialog($owner)
$owner.Dispose()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName }
`.trim();

  return runPowerShellPicker(script);
}

async function runPowerShellPicker(script: string) {
  const powershellCommand = getPowerShellCommand();
  const { stdout } = await execFileAsync(
    powershellCommand,
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
  if (!getPowerShellCommand()) {
    throw new Error("Chọn bằng Explorer hiện chỉ hỗ trợ khi chạy backend local trên Windows.");
  }
}

function getPowerShellCommand() {
  if (process.platform === "win32") return "powershell.exe";
  return fs.existsSync(WSL_POWERSHELL_PATH) ? WSL_POWERSHELL_PATH : "";
}

function toPowerShellString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thực hiện được thao tác hệ thống.";
}
