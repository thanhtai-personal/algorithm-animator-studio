import { execFile } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import {
  FFMPEG_EXE,
  FFPROBE_EXE,
  KATA_STUDIO_HOME,
  MODEL_DIR,
  PIPER_EXE,
  PROJECT_ROOT,
  RUNTIME_TOOLS_DIR,
} from "../config/paths";

type RuntimeDependencyCheck = {
  key: string;
  label: string;
  ok: boolean;
  status: "ready" | "missing" | "checking";
  detail: string;
};

type RuntimeInstallStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "skipped" | "error";
  detail?: string;
};

type RuntimeCapabilities = {
  platform: NodeJS.Platform;
  winget: boolean;
  homebrew: boolean;
  pythonCommand?: string;
  bundledFfmpeg: boolean;
};

type RuntimeManualAction = {
  key: string;
  tool: "winget" | "python" | "piper" | "models" | "ffmpeg" | "homebrew";
  label: string;
  detail: string;
  primaryUrl: string;
  cta?: string;
  urls?: Array<{ label: string; url: string }>;
};

type RuntimeDependencyStatus = {
  ok: boolean;
  supported: boolean;
  installing: boolean;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  installRoot: string;
  modelDir: string;
  piperExe: string;
  ffmpegExe: string;
  ffprobeExe: string;
  missing: string[];
  checks: RuntimeDependencyCheck[];
  steps: RuntimeInstallStep[];
  log: string[];
  manualActions: string[];
  manualActionLinks: RuntimeManualAction[];
  capabilities: RuntimeCapabilities;
};

type ModelDownload = {
  id: string;
  label: string;
  fileName: string;
  url: string;
};

type CommandCandidate = {
  command: string;
  args: string[];
  label: string;
};

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type FfmpegPair = {
  ffmpegExe: string;
  ffprobeExe: string;
};

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const PYTHON_INSTALL_ID = "Python.Python.3.12";
const FFMPEG_INSTALL_ID = "Gyan.FFmpeg";
const HOMEBREW_INSTALL_HINT = "https://brew.sh";
const OFFICIAL_INSTALL_LINKS = {
  appInstaller: "https://apps.microsoft.com/detail/9nblggh4nns1",
  wingetDocs: "https://learn.microsoft.com/windows/package-manager/winget/",
  winget: "https://apps.microsoft.com/detail/9nblggh4nns1",
  python: "https://www.python.org/downloads/",
  pythonWindows: "https://www.python.org/downloads/windows/",
  piper: "https://github.com/rhasspy/piper",
  piperVoices: "https://huggingface.co/rhasspy/piper-voices",
  ffmpeg: "https://ffmpeg.org/download.html",
  homebrew: HOMEBREW_INSTALL_HINT,
} as const;
const VENV_DIR = path.join(MODEL_DIR, ".venv");
const VENV_BIN_DIR = path.join(VENV_DIR, IS_WINDOWS ? "Scripts" : "bin");
const VENV_PYTHON_EXE = path.join(VENV_BIN_DIR, IS_WINDOWS ? "python.exe" : "python");

const DEFAULT_MODELS: ModelDownload[] = [
  {
    id: "vi_vais1000_onnx",
    label: "Model tiếng Việt vi_VN-vais1000-medium.onnx",
    fileName: "vi_VN-vais1000-medium.onnx",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
  },
  {
    id: "vi_vais1000_json",
    label: "Config model tiếng Việt vi_VN-vais1000-medium.onnx.json",
    fileName: "vi_VN-vais1000-medium.onnx.json",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx.json",
  },
  {
    id: "en_lessac_onnx",
    label: "Model tiếng Anh en_US-lessac-medium.onnx",
    fileName: "en_US-lessac-medium.onnx",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
  },
  {
    id: "en_lessac_json",
    label: "Config model tiếng Anh en_US-lessac-medium.onnx.json",
    fileName: "en_US-lessac-medium.onnx.json",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
  },
  {
    id: "en_ryan_onnx",
    label: "Model tiếng Anh en_US-ryan-medium.onnx",
    fileName: "en_US-ryan-medium.onnx",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx",
  },
  {
    id: "en_ryan_json",
    label: "Config model tiếng Anh en_US-ryan-medium.onnx.json",
    fileName: "en_US-ryan-medium.onnx.json",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json",
  },
  {
    id: "en_libritts_onnx",
    label: "Model tiếng Anh en_US-libritts_r-medium.onnx",
    fileName: "en_US-libritts_r-medium.onnx",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
  },
  {
    id: "en_libritts_json",
    label: "Config model tiếng Anh en_US-libritts_r-medium.onnx.json",
    fileName: "en_US-libritts_r-medium.onnx.json",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json",
  },
];

const INSTALL_STEPS_TEMPLATE: RuntimeInstallStep[] = [
  { id: "winget", label: "Kiểm tra/cài App Installer / winget", status: "pending" },
  { id: "python", label: "Kiểm tra/cài Python 3", status: "pending" },
  { id: "venv", label: "Tạo môi trường ảo Piper", status: "pending" },
  { id: "pip", label: "Cài piper-tts bằng pip", status: "pending" },
  { id: "models", label: "Tải model giọng đọc", status: "pending" },
  { id: "ffmpeg", label: "Kiểm tra/cài FFmpeg", status: "pending" },
  { id: "verify", label: "Kiểm tra lại runtime", status: "pending" },
];

const runtimeState: {
  installing: boolean;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  steps: RuntimeInstallStep[];
  log: string[];
} = {
  installing: false,
  steps: cloneSteps(),
  log: [],
};

export async function getRuntimeDependencyStatus(): Promise<RuntimeDependencyStatus> {
  const checks = await buildChecks();
  const missing = checks.filter((check) => !check.ok).map((check) => check.key);
  const capabilities = await buildCapabilities();
  const ffmpegPair = await resolveFfmpegPair();

  if (ffmpegPair) {
    process.env.FFMPEG_EXE = process.env.FFMPEG_EXE || ffmpegPair.ffmpegExe;
    process.env.FFPROBE_EXE = process.env.FFPROBE_EXE || ffmpegPair.ffprobeExe;
  }

  return {
    ok: missing.length === 0,
    supported: isSupportedRuntime(),
    installing: runtimeState.installing,
    startedAt: runtimeState.startedAt,
    finishedAt: runtimeState.finishedAt,
    error: runtimeState.error,
    installRoot: KATA_STUDIO_HOME,
    modelDir: MODEL_DIR,
    piperExe: process.env.PIPER_EXE || PIPER_EXE,
    ffmpegExe: ffmpegPair?.ffmpegExe || process.env.FFMPEG_EXE || FFMPEG_EXE,
    ffprobeExe: ffmpegPair?.ffprobeExe || process.env.FFPROBE_EXE || FFPROBE_EXE,
    missing,
    checks,
    steps: runtimeState.steps,
    log: runtimeState.log.slice(-100),
    manualActions: buildManualActions(missing, capabilities),
    manualActionLinks: buildManualActionLinks(missing, capabilities),
    capabilities,
  };
}

export async function startRuntimeDependencyInstall(): Promise<RuntimeDependencyStatus> {
  if (!isSupportedRuntime()) {
    runtimeState.error = "Nền tảng này chưa hỗ trợ tự cài runtime. Hãy cài Python/Piper/FFmpeg thủ công.";
    return getRuntimeDependencyStatus();
  }

  if (!runtimeState.installing) {
    void installRuntimeDependencies();
  }

  return getRuntimeDependencyStatus();
}

async function installRuntimeDependencies() {
  runtimeState.installing = true;
  runtimeState.startedAt = new Date().toISOString();
  runtimeState.finishedAt = undefined;
  runtimeState.error = undefined;
  runtimeState.steps = cloneSteps();
  runtimeState.log = [];

  const errors: string[] = [];

  let python: CommandCandidate | null = null;
  try {
    python = await ensurePython();
    await ensureVirtualEnv(python);
    await ensurePiperPackage();
  } catch (caught) {
    const message = getErrorMessage(caught);
    errors.push(message);
    markRunningStepAsError(message);
    addLog(`ERROR: ${message}`);
  }

  try {
    await ensureModelFiles();
  } catch (caught) {
    const message = getErrorMessage(caught);
    errors.push(message);
    markRunningStepAsError(message);
    addLog(`ERROR: ${message}`);
  }

  try {
    await ensureFfmpeg();
  } catch (caught) {
    const message = getErrorMessage(caught);
    errors.push(message);
    markRunningStepAsError(message);
    addLog(`ERROR: ${message}`);
  }

  try {
    await verifyRuntime();
  } catch (caught) {
    const message = getErrorMessage(caught);
    errors.push(message);
    setStep("verify", "error", message);
    addLog(`ERROR: ${message}`);
  }

  runtimeState.error = errors.length ? unique(errors).join("\n") : undefined;
  runtimeState.installing = false;
  runtimeState.finishedAt = new Date().toISOString();
}

async function buildChecks(): Promise<RuntimeDependencyCheck[]> {
  const python = await resolvePythonCandidate();
  const piperExe = await resolvePiperExecutable();
  if (piperExe) {
    process.env.PIPER_EXE = piperExe;
  }
  const piperExeExists = Boolean(piperExe);
  const piperRuns = piperExeExists ? await canRun(piperExe, ["--help"], 20_000) : false;
  const requiredModelFiles = DEFAULT_MODELS.filter((model) => model.fileName.startsWith("vi_VN-vais1000"));
  const modelFilesOk = requiredModelFiles.every((model) => fs.existsSync(path.join(MODEL_DIR, model.fileName)));
  const ffmpegPair = await resolveFfmpegPair();

  return [
    {
      key: "python",
      label: "Python",
      ok: Boolean(python),
      status: python ? "ready" : "missing",
      detail: python ? `Đã nhận ${python.label}.` : buildPythonMissingDetail(),
    },
    {
      key: "piper",
      label: "Piper TTS",
      ok: piperExeExists,
      status: piperExeExists ? "ready" : "missing",
      detail: piperExeExists
        ? piperRuns
          ? `Piper chạy được trực tiếp: ${piperExe}`
          : `Sử dụng trực tiếp piper.exe: ${piperExe}. Nếu Windows chưa refresh PATH/DLL, app vẫn ưu tiên chạy bằng đường dẫn này.`
        : `Chưa có ${PIPER_EXE}`,
    },
    {
      key: "models",
      label: "Model giọng đọc mặc định",
      ok: modelFilesOk,
      status: modelFilesOk ? "ready" : "missing",
      detail: modelFilesOk ? MODEL_DIR : "Thiếu vi_VN-vais1000-medium.onnx hoặc file .json đi kèm.",
    },
    {
      key: "ffmpeg",
      label: "FFmpeg",
      ok: Boolean(ffmpegPair?.ffmpegExe),
      status: ffmpegPair?.ffmpegExe ? "ready" : "missing",
      detail: ffmpegPair?.ffmpegExe ? ffmpegPair.ffmpegExe : buildFfmpegMissingDetail(),
    },
    {
      key: "ffprobe",
      label: "FFprobe",
      ok: Boolean(ffmpegPair?.ffprobeExe),
      status: ffmpegPair?.ffprobeExe ? "ready" : "missing",
      detail: ffmpegPair?.ffprobeExe ? ffmpegPair.ffprobeExe : "FFprobe thường đi kèm FFmpeg.",
    },
  ];
}

async function buildCapabilities(): Promise<RuntimeCapabilities> {
  const python = await resolvePythonCandidate();
  const bundledFfmpeg = Boolean(await resolveBundledFfmpegExecutable("ffmpeg"));

  return {
    platform: process.platform,
    winget: IS_WINDOWS ? Boolean(await resolveWingetCommand()) : false,
    homebrew: IS_MAC ? await canRun("brew", ["--version"]) : false,
    pythonCommand: python ? [python.command, ...python.args].join(" ") : undefined,
    bundledFfmpeg,
  };
}

async function ensurePython(): Promise<CommandCandidate> {
  setStep("python", "running", "Đang kiểm tra Python...");

  const existing = await resolvePythonCandidate();
  if (existing) {
    setStep("python", "skipped", `Máy đã có ${existing.label}.`);
    return existing;
  }

  if (IS_WINDOWS) {
    await installWithWinget(PYTHON_INSTALL_ID, "python", "Không tìm thấy Python. Đang cài Python 3.12 bằng winget...");
  } else if (IS_MAC) {
    await installWithBrew("python@3.12", "python", "Không tìm thấy Python. Đang cài python@3.12 bằng Homebrew...");
  } else {
    throw new Error("Chưa có Python. Hãy cài Python 3 rồi mở lại Kata Studio.");
  }

  const installed = await resolvePythonCandidate();
  if (installed) {
    setStep("python", "done", `Đã nhận ${installed.label}.`);
    return installed;
  }

  throw new Error("Không tìm thấy Python sau khi chạy trình cài. Hãy mở lại app hoặc cài Python thủ công.");
}

async function ensureVirtualEnv(python: CommandCandidate) {
  setStep("venv", "running", "Đang kiểm tra .venv...");

  if (fs.existsSync(VENV_PYTHON_EXE)) {
    setStep("venv", "skipped", VENV_PYTHON_EXE);
    return;
  }

  await fsp.mkdir(MODEL_DIR, { recursive: true });
  await runCommand(python.command, [...python.args, "-m", "venv", VENV_DIR], 10 * 60 * 1000);
  setStep("venv", "done", VENV_PYTHON_EXE);
}

async function ensurePiperPackage() {
  setStep("pip", "running", "Đang kiểm tra/cài piper-tts...");

  const existingPiper = await resolvePiperExecutable();
  if (existingPiper) {
    process.env.PIPER_EXE = existingPiper;
    const canRunDirectly = await canRun(existingPiper, ["--help"], 20_000);
    setStep(
      "pip",
      "skipped",
      canRunDirectly
        ? `Piper đã sẵn sàng: ${existingPiper}`
        : `Đã có piper.exe, sẽ dùng trực tiếp: ${existingPiper}`
    );
    return;
  }

  if (!fs.existsSync(VENV_PYTHON_EXE)) {
    throw new Error(`Chưa có Python trong .venv: ${VENV_PYTHON_EXE}`);
  }

  await runCommand(VENV_PYTHON_EXE, ["-m", "pip", "install", "--upgrade", "pip"], 10 * 60 * 1000);
  await runCommand(VENV_PYTHON_EXE, ["-m", "pip", "install", "piper-tts"], 30 * 60 * 1000);

  const installedPiper = await resolvePiperExecutable();
  if (!installedPiper) {
    throw new Error(`Đã cài piper-tts nhưng chưa tìm thấy piper.exe tại ${PIPER_EXE}.`);
  }

  process.env.PIPER_EXE = installedPiper;
  const canRunDirectly = await canRun(installedPiper, ["--help"], 20_000);
  setStep(
    "pip",
    "done",
    canRunDirectly
      ? `Piper đã sẵn sàng: ${installedPiper}`
      : `Đã có piper.exe, sẽ dùng trực tiếp: ${installedPiper}`
  );
}

async function ensureModelFiles() {
  setStep("models", "running", "Đang tải model Piper...");
  await fsp.mkdir(MODEL_DIR, { recursive: true });

  for (const model of DEFAULT_MODELS) {
    const targetPath = path.join(MODEL_DIR, model.fileName);
    if (fs.existsSync(targetPath)) {
      addLog(`Bỏ qua ${model.fileName}: đã tồn tại.`);
      continue;
    }

    addLog(`Tải ${model.label}`);
    await downloadFile(model.url, targetPath);
  }

  setStep("models", "done", MODEL_DIR);
}

async function ensureFfmpeg() {
  setStep("ffmpeg", "running", "Đang kiểm tra ffmpeg/ffprobe...");

  const existing = await resolveFfmpegPair();
  if (existing) {
    process.env.FFMPEG_EXE = existing.ffmpegExe;
    process.env.FFPROBE_EXE = existing.ffprobeExe;
    setStep("ffmpeg", "skipped", `FFmpeg đã sẵn sàng: ${existing.ffmpegExe}`);
    return;
  }

  if (IS_WINDOWS) {
    await installWithWinget(FFMPEG_INSTALL_ID, "ffmpeg", "Không tìm thấy FFmpeg. Đang cài/kiểm tra Gyan.FFmpeg bằng winget...");
  } else if (IS_MAC) {
    await installWithBrew("ffmpeg", "ffmpeg", "Không tìm thấy FFmpeg. Đang cài FFmpeg bằng Homebrew...");
  } else {
    throw new Error("Chưa có FFmpeg. Hãy cài FFmpeg rồi mở lại Kata Studio.");
  }

  const installed = await resolveFfmpegPair();
  if (installed) {
    process.env.FFMPEG_EXE = installed.ffmpegExe;
    process.env.FFPROBE_EXE = installed.ffprobeExe;
    setStep("ffmpeg", "done", `FFmpeg đã sẵn sàng: ${installed.ffmpegExe}`);
    return;
  }

  throw new Error("Đã chạy trình cài FFmpeg nhưng app chưa tìm thấy ffmpeg/ffprobe. Hãy đóng app mở lại hoặc cài FFmpeg thủ công.");
}

async function verifyRuntime() {
  setStep("verify", "running", "Đang kiểm tra lại runtime...");
  const checks = await buildChecks();
  const missing = checks.filter((check) => !check.ok).map((check) => check.key);

  if (missing.length) {
    throw new Error(`Runtime vẫn còn thiếu: ${missing.join(", ")}.`);
  }

  setStep("verify", "done", "Runtime local đã sẵn sàng.");
}

async function resolvePiperExecutable(): Promise<string> {
  const configured = process.env.PIPER_EXE || PIPER_EXE;
  const candidates = unique([
    configured,
    PIPER_EXE,
    path.join(VENV_BIN_DIR, IS_WINDOWS ? "piper.exe" : "piper"),
    IS_WINDOWS ? findKnownExecutable("piper.exe") : "",
  ].filter(Boolean));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "";
}

async function resolvePythonCandidate(): Promise<CommandCandidate | null> {
  const candidates: CommandCandidate[] = IS_WINDOWS
    ? [
        { command: "py", args: ["-3"], label: "py -3" },
        { command: "py", args: [], label: "py" },
        { command: "python", args: [], label: "python" },
      ]
    : [
        { command: "python3", args: [], label: "python3" },
        { command: "python", args: [], label: "python" },
      ];

  for (const candidate of candidates) {
    if (await canRun(candidate.command, [...candidate.args, "--version"])) {
      return candidate;
    }
  }

  return null;
}

async function resolveFfmpegPair(): Promise<FfmpegPair | null> {
  const ffmpegExe = await resolveFfmpegExecutable("ffmpeg");
  if (!ffmpegExe || !(await canRun(ffmpegExe, ["-version"]))) {
    return null;
  }

  const ffprobeExe = await resolveFfmpegExecutable("ffprobe", path.dirname(ffmpegExe));
  if (ffprobeExe && await canRun(ffprobeExe, ["-version"])) {
    return { ffmpegExe, ffprobeExe };
  }

  return null;
}

async function resolveFfmpegExecutable(command: "ffmpeg" | "ffprobe", preferredDir = ""): Promise<string> {
  const executableName = IS_WINDOWS ? `${command}.exe` : command;
  const configured = command === "ffmpeg" ? process.env.FFMPEG_EXE || FFMPEG_EXE : process.env.FFPROBE_EXE || FFPROBE_EXE;
  const configuredPath = await resolveIfWorks(configured, ["-version"]);
  if (configuredPath) return configuredPath;

  const bundled = await resolveBundledFfmpegExecutable(command, preferredDir);
  if (bundled) return bundled;

  const pathValue = await resolveCommandPath(command);
  if (pathValue && await canRun(pathValue, ["-version"])) return pathValue;

  if (IS_WINDOWS) {
    const known = findKnownExecutable(executableName);
    if (known && await canRun(known, ["-version"])) return known;
  }

  return "";
}

async function resolveWingetCommand(): Promise<string> {
  if (!IS_WINDOWS) return "";
  if (await canRun("winget", ["--version"])) return "winget";

  const pathValue = await resolveCommandPath("winget");
  if (pathValue && await canRun(pathValue, ["--version"])) return pathValue;

  const known = findKnownExecutable("winget.exe");
  if (known && await canRun(known, ["--version"])) return known;

  return "";
}

async function resolveBundledFfmpegExecutable(command: "ffmpeg" | "ffprobe", preferredDir = ""): Promise<string> {
  const executableName = IS_WINDOWS ? `${command}.exe` : command;
  const candidates = [
    preferredDir && path.join(preferredDir, executableName),
    path.join(RUNTIME_TOOLS_DIR, "ffmpeg", "bin", executableName),
    path.join(RUNTIME_TOOLS_DIR, "ffmpeg", executableName),
    path.join(getBundledToolsRoot(), "ffmpeg", "bin", executableName),
    path.join(getBundledToolsRoot(), "ffmpeg", executableName),
    path.join(PROJECT_ROOT, "runtime", "tools", "ffmpeg", "bin", executableName),
    path.join(PROJECT_ROOT, "tools", "ffmpeg", "bin", executableName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const found = await resolveIfWorks(candidate, ["-version"]);
    if (found) return found;
  }

  return "";
}

function getBundledToolsRoot() {
  return process.env.KATA_BUNDLED_TOOLS_DIR || path.join(PROJECT_ROOT, "runtime", "tools");
}

async function installWithWinget(id: string, stepId: string, message: string) {
  const wingetCommand = await ensureWingetAvailable(id);

  setStep(stepId, "running", message);
  const result = await runCommandDetailed(wingetCommand, [
    "install",
    "--id",
    id,
    "-e",
    "--accept-source-agreements",
    "--accept-package-agreements",
    "--silent",
  ], 30 * 60 * 1000, { allowFailure: true });

  const output = `${result.stdout}
${result.stderr}`;
  if (result.code === 0 || isPackageManagerAlreadyInstalledOutput(output)) {
    addLog(output.trim() || `winget đã xử lý ${id}.`);
    return;
  }

  throw new Error(result.stderr.trim() || result.stdout.trim() || `winget cài ${id} thất bại.`);
}

async function ensureWingetAvailable(requiredForPackage = "") {
  const existing = await resolveWingetCommand();
  if (existing) {
    setStep("winget", "skipped", `Đã nhận winget: ${existing}`);
    return existing;
  }

  setStep("winget", "running", "Máy chưa có winget. Đang thử đăng ký App Installer sẵn có trong Windows...");
  const registerResult = await runPowerShell([
    "$ErrorActionPreference = 'Continue'",
    "Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe",
  ].join("; "), 5 * 60 * 1000, { allowFailure: true });
  addLog(registerResult.stdout.trim() || registerResult.stderr.trim() || "Đã chạy lệnh đăng ký App Installer.");

  const registered = await resolveWingetCommand();
  if (registered) {
    setStep("winget", "done", `Đã đăng ký winget: ${registered}`);
    return registered;
  }

  setStep("winget", "running", "Chưa nhận winget. Đang thử bootstrap bằng Microsoft.WinGet.Client...");
  const bootstrapScript = [
    "$ErrorActionPreference = 'Continue'",
    "$ProgressPreference = 'SilentlyContinue'",
    "Install-PackageProvider -Name NuGet -Force | Out-Null",
    "try { Set-PSRepository -Name PSGallery -InstallationPolicy Trusted } catch { Write-Host $_ }",
    "Install-Module -Name Microsoft.WinGet.Client -Force -Repository PSGallery -Scope CurrentUser -AllowClobber | Out-Null",
    "try { Repair-WinGetPackageManager -AllUsers } catch { Write-Host $_; Repair-WinGetPackageManager }",
  ].join("; ");
  const bootstrapResult = await runPowerShell(bootstrapScript, 20 * 60 * 1000, { allowFailure: true });
  addLog(bootstrapResult.stdout.trim() || bootstrapResult.stderr.trim() || "Đã chạy bootstrap Microsoft.WinGet.Client.");

  const bootstrapped = await resolveWingetCommand();
  if (bootstrapped) {
    setStep("winget", "done", `Đã bootstrap winget: ${bootstrapped}`);
    return bootstrapped;
  }

  setStep("winget", "error", "Không tự cài/khôi phục được winget. Cần tải App Installer từ Microsoft Store.");
  throw new Error(`Không tự cài được winget/App Installer${requiredForPackage ? ` để cài ${requiredForPackage}` : ""}. Hãy bấm nút Tải App Installer trong màn hình cài thủ công, cài xong rồi mở lại Kata Studio.`);
}

async function installWithBrew(packageName: string, stepId: string, message: string) {
  if (!(await canRun("brew", ["--version"]))) {
    throw new Error(`Máy macOS chưa có Homebrew nên không thể tự cài ${packageName}. Hãy cài Homebrew tại ${HOMEBREW_INSTALL_HINT}, sau đó mở lại Kata Studio.`);
  }

  setStep(stepId, "running", message);
  const result = await runCommandDetailed("brew", ["install", packageName], 45 * 60 * 1000, { allowFailure: true });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.code === 0 || isPackageManagerAlreadyInstalledOutput(output)) {
    addLog(output.trim() || `brew đã xử lý ${packageName}.`);
    return;
  }

  throw new Error(result.stderr.trim() || result.stdout.trim() || `brew cài ${packageName} thất bại.`);
}

function isPackageManagerAlreadyInstalledOutput(output: string) {
  const normalized = output.toLowerCase();
  return [
    "existing package already installed",
    "no available upgrade found",
    "no newer package versions are available",
    "already installed",
    "is already installed",
    "đã được cài đặt",
  ].some((text) => normalized.includes(text));
}

function runPowerShell(script: string, timeout: number, options?: { allowFailure?: boolean }) {
  return runCommandDetailed("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], timeout, options);
}

function canRun(command: string, args: string[], timeout = 8_000): Promise<boolean> {
  return runCommandDetailed(command, args, timeout, { allowFailure: true }).then((result) => result.code === 0);
}

function runCommand(command: string, args: string[], timeout: number): Promise<void> {
  return runCommandDetailed(command, args, timeout).then(() => undefined);
}

function runCommandDetailed(command: string, args: string[], timeout: number, options?: { allowFailure?: boolean; env?: NodeJS.ProcessEnv }): Promise<CommandResult> {
  addLog(`> ${[command, ...args].join(" ")}`);

  return new Promise((resolve, reject) => {
    execFile(command, args, {
      windowsHide: true,
      timeout,
      env: buildCommandEnv(command, options?.env),
    }, (error, stdout = "", stderr = "") => {
      if (stdout.trim()) addLog(stdout.trim());
      if (stderr.trim()) addLog(stderr.trim());

      if (error && !options?.allowFailure) {
        reject(new Error(stderr.trim() || stdout.trim() || error.message));
        return;
      }

      resolve({
        code: error && typeof (error as NodeJS.ErrnoException & { code?: number }).code === "number"
          ? Number((error as NodeJS.ErrnoException & { code?: number }).code)
          : error
            ? 1
            : 0,
        stdout,
        stderr,
      });
    });
  });
}

function buildCommandEnv(command: string, extraEnv?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const baseEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...extraEnv,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
  };

  if (!isPiperExecutable(command)) {
    return baseEnv;
  }

  const piperDir = looksLikePath(command) ? path.dirname(command) : VENV_BIN_DIR;
  const venvDir = path.resolve(piperDir, "..");
  const sitePackageDirs = findPiperSitePackageDirs(piperDir);
  const extraPathEntries = unique([
    piperDir,
    ...sitePackageDirs,
    ...sitePackageDirs.map((dir) => path.join(dir, "onnxruntime", "capi")),
    ...sitePackageDirs.map((dir) => path.join(dir, "piper_phonemize")),
  ].filter((entry) => entry && fs.existsSync(entry)));

  const mergedPath = [
    ...extraPathEntries,
    baseEnv.PATH || baseEnv.Path || "",
  ].filter(Boolean).join(path.delimiter);

  return {
    ...baseEnv,
    VIRTUAL_ENV: venvDir,
    PATH: mergedPath,
    Path: mergedPath,
  };
}

function findPiperSitePackageDirs(piperDir: string): string[] {
  const venvDir = path.resolve(piperDir, "..");
  const candidates = [
    path.join(venvDir, "Lib", "site-packages"),
    path.join(venvDir, "lib", "site-packages"),
  ];

  const libDir = path.join(venvDir, "lib");
  if (fs.existsSync(libDir)) {
    for (const entry of fs.readdirSync(libDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith("python")) {
        candidates.push(path.join(libDir, entry.name, "site-packages"));
      }
    }
  }

  return unique(candidates.filter((candidate) => fs.existsSync(candidate)));
}

function isPiperExecutable(command: string) {
  const baseName = path.basename(command).toLowerCase();
  return baseName === "piper.exe" || baseName === "piper";
}

function downloadFile(url: string, targetPath: string, redirectCount = 0): Promise<void> {
  if (redirectCount > 5) {
    return Promise.reject(new Error(`Quá nhiều redirect khi tải ${url}`));
  }

  return new Promise((resolve, reject) => {
    const tempPath = `${targetPath}.download`;
    const file = fs.createWriteStream(tempPath);

    https.get(url, (response) => {
      const statusCode = response.statusCode ?? 0;
      const locationHeader = response.headers.location;
      const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;

      if (statusCode >= 300 && statusCode < 400 && location) {
        file.close(() => {
          fs.rmSync(tempPath, { force: true });
          downloadFile(new URL(location, url).toString(), targetPath, redirectCount + 1).then(resolve, reject);
        });
        return;
      }

      if (statusCode !== 200) {
        file.close(() => fs.rmSync(tempPath, { force: true }));
        reject(new Error(`Không tải được ${url}. HTTP ${statusCode}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          fs.renameSync(tempPath, targetPath);
          resolve();
        });
      });
    }).on("error", (error) => {
      file.close(() => fs.rmSync(tempPath, { force: true }));
      reject(error);
    });
  });
}

async function resolveIfWorks(value: string | undefined, args: string[]) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (looksLikePath(trimmed) && !fs.existsSync(trimmed)) return "";
  return await canRun(trimmed, args) ? trimmed : "";
}

async function resolveCommandPath(command: string): Promise<string> {
  const result = IS_WINDOWS
    ? await runCommandDetailed("where", [command], 20_000, { allowFailure: true })
    : await runCommandDetailed("/bin/bash", ["-lc", `command -v ${shellQuote(command)}`], 20_000, { allowFailure: true });
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

function findKnownExecutable(fileName: string) {
  if (!IS_WINDOWS) return "";

  const roots = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "WinGet", "Packages"),
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.ChocolateyInstall && path.join(process.env.ChocolateyInstall, "bin"),
    "C:\\ProgramData\\chocolatey\\bin",
  ].filter(Boolean) as string[];

  for (const root of roots) {
    const found = findFileUnder(root, fileName, 6, /ffmpeg|gyan|winget|chocolatey/i);
    if (found) return found;
  }

  return "";
}

function findFileUnder(root: string, fileName: string, maxDepth: number, preferredPattern: RegExp): string {
  if (!root || maxDepth < 0 || !fs.existsSync(root)) return "";

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return "";
  }

  const sorted = entries.sort((a, b) => {
    const aPreferred = preferredPattern.test(a.name) ? 0 : 1;
    const bPreferred = preferredPattern.test(b.name) ? 0 : 1;
    return aPreferred - bPreferred || a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    const fullPath = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) return fullPath;
  }

  for (const entry of sorted) {
    if (!entry.isDirectory()) continue;
    const found = findFileUnder(path.join(root, entry.name), fileName, maxDepth - 1, preferredPattern);
    if (found) return found;
  }

  return "";
}

function buildManualActions(missing: string[], capabilities: RuntimeCapabilities) {
  return buildManualActionLinks(missing, capabilities).map((action) => action.detail);
}

function buildManualActionLinks(missing: string[], capabilities: RuntimeCapabilities): RuntimeManualAction[] {
  const actions: RuntimeManualAction[] = [];
  const needsPython = missing.includes("python");
  const needsPiper = missing.includes("piper");
  const needsModels = missing.includes("models");
  const needsFfmpeg = missing.includes("ffmpeg") || missing.includes("ffprobe");

  if (IS_WINDOWS && !capabilities.winget && (needsPython || needsFfmpeg)) {
    actions.push({
      key: "winget",
      tool: "winget",
      label: "App Installer / winget",
      detail: "App đã thử tự đăng ký/khôi phục winget nhưng chưa thành công. Hãy tải App Installer trực tiếp từ Microsoft Store, mở/cài xong rồi khởi động lại app.",
      primaryUrl: OFFICIAL_INSTALL_LINKS.appInstaller,
      cta: "Tải App Installer",
      urls: [
        { label: "Tải App Installer từ Microsoft Store", url: OFFICIAL_INSTALL_LINKS.appInstaller },
        { label: "Xem tài liệu winget của Microsoft", url: OFFICIAL_INSTALL_LINKS.wingetDocs },
      ],
    });
  }

  if (IS_MAC && !capabilities.homebrew && (needsPython || needsFfmpeg)) {
    actions.push({
      key: "homebrew",
      tool: "homebrew",
      label: "Homebrew",
      detail: "Máy macOS chưa có Homebrew nên app không thể tự cài Python/FFmpeg bằng brew. Cài Homebrew từ trang chính thức, rồi mở lại app.",
      primaryUrl: OFFICIAL_INSTALL_LINKS.homebrew,
      cta: "Mở trang Homebrew",
      urls: [
        { label: "Homebrew chính thức", url: OFFICIAL_INSTALL_LINKS.homebrew },
      ],
    });
  }

  if (needsPython) {
    actions.push({
      key: "python",
      tool: "python",
      label: "Python 3",
      detail: IS_WINDOWS
        ? "Cài Python 3 thủ công từ python.org. Khi cài trên Windows, nhớ bật tùy chọn Add python.exe to PATH, sau đó đóng app mở lại và bấm Kiểm tra lại."
        : "Cài Python 3 thủ công từ python.org hoặc package manager của hệ điều hành, sau đó đóng app mở lại và bấm Kiểm tra lại.",
      primaryUrl: IS_WINDOWS ? OFFICIAL_INSTALL_LINKS.pythonWindows : OFFICIAL_INSTALL_LINKS.python,
      cta: "Mở trang tải Python chính thức",
      urls: [
        { label: "Python downloads", url: OFFICIAL_INSTALL_LINKS.python },
        { label: "Python for Windows", url: OFFICIAL_INSTALL_LINKS.pythonWindows },
      ],
    });
  }

  if (needsPiper) {
    actions.push({
      key: "piper",
      tool: "piper",
      label: "Piper TTS",
      detail: `Nếu Python đã có nhưng Piper lỗi, có thể xóa thư mục ${VENV_DIR}, bấm cài tự động lại, hoặc cài Piper theo hướng dẫn chính thức trên GitHub.`,
      primaryUrl: OFFICIAL_INSTALL_LINKS.piper,
      cta: "Mở hướng dẫn Piper chính thức",
      urls: [
        { label: "Piper GitHub", url: OFFICIAL_INSTALL_LINKS.piper },
      ],
    });
  }

  if (needsModels) {
    actions.push({
      key: "models",
      tool: "models",
      label: "Piper voice model",
      detail: `Máy cần model .onnx và .onnx.json. Nếu tải tự động bị chặn, tải thủ công từ HuggingFace rồi đặt vào thư mục ${MODEL_DIR}.`,
      primaryUrl: OFFICIAL_INSTALL_LINKS.piperVoices,
      cta: "Mở kho model Piper",
      urls: [
        { label: "Piper voices on HuggingFace", url: OFFICIAL_INSTALL_LINKS.piperVoices },
      ],
    });
  }

  if (needsFfmpeg) {
    actions.push({
      key: "ffmpeg",
      tool: "ffmpeg",
      label: "FFmpeg / FFprobe",
      detail: capabilities.bundledFfmpeg
        ? "App đã có FFmpeg bundle nhưng chưa chạy được. Kiểm tra antivirus/quyền truy cập thư mục cài đặt, hoặc cài FFmpeg thủ công rồi thêm thư mục bin vào PATH."
        : "Cài FFmpeg thủ công từ trang chính thức, giải nén và thêm thư mục bin vào PATH. Sau đó đóng app mở lại và bấm Kiểm tra lại.",
      primaryUrl: OFFICIAL_INSTALL_LINKS.ffmpeg,
      cta: "Mở trang tải FFmpeg chính thức",
      urls: [
        { label: "FFmpeg download", url: OFFICIAL_INSTALL_LINKS.ffmpeg },
      ],
    });
  }

  return uniqueManualActions(actions);
}

function uniqueManualActions(actions: RuntimeManualAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.key)) return false;
    seen.add(action.key);
    return true;
  });
}

function buildPythonMissingDetail() {
  if (IS_WINDOWS) return "Chưa nhận py/python. App sẽ thử tự đăng ký/cài winget nếu cần, sau đó dùng winget để cài Python; nếu vẫn lỗi sẽ hiển thị nút cài thủ công.";
  if (IS_MAC) return "Chưa nhận python3/python. App sẽ thử Homebrew nếu có, nếu không sẽ hiển thị hướng dẫn cài thủ công.";
  return "Chưa nhận Python 3.";
}

function buildFfmpegMissingDetail() {
  if (IS_WINDOWS) return "Chưa tìm thấy FFmpeg trong runtime bundle, PATH, WinGet packages hoặc Program Files. App sẽ thử tự đăng ký/cài winget nếu cần để cài FFmpeg.";
  if (IS_MAC) return "Chưa tìm thấy FFmpeg trong runtime bundle hoặc PATH.";
  return "Chưa tìm thấy FFmpeg trong PATH.";
}

function isSupportedRuntime() {
  return IS_WINDOWS || IS_MAC || process.env.KATA_DESKTOP_RUNTIME === "true";
}

function cloneSteps() {
  return INSTALL_STEPS_TEMPLATE.map((step) => ({ ...step }));
}

function setStep(id: string, status: RuntimeInstallStep["status"], detail?: string) {
  runtimeState.steps = runtimeState.steps.map((step) =>
    step.id === id ? { ...step, status, detail } : step
  );
  addLog(`${id}: ${status}${detail ? ` - ${detail}` : ""}`);
}

function markRunningStepAsError(detail: string) {
  runtimeState.steps = runtimeState.steps.map((step) =>
    step.status === "running" ? { ...step, status: "error", detail } : step
  );
}

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  runtimeState.log.push(`[${timestamp}] ${message}`);
  runtimeState.log = runtimeState.log.slice(-220);
}

function shellQuote(value: string) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function looksLikePath(value: string) {
  return value.includes("/") || value.includes("\\") || /^[a-zA-Z]:/.test(value);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Cài runtime thất bại.";
}
