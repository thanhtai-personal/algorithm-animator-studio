const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const PYTHON_INSTALL_ID = "Python.Python.3.12";
const FFMPEG_INSTALL_ID = "Gyan.FFmpeg";
const HOMEBREW_INSTALL_HINT = "https://brew.sh";
const DEFAULT_MODEL = {
  onnx: "vi_VN-vais1000-medium.onnx",
  json: "vi_VN-vais1000-medium.onnx.json",
  onnxUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
  jsonUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx.json",
};

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

async function ensureDesktopRuntime({ appDataDir, onStatus }) {
  const runtimeHome = getRuntimeHome(appDataDir);
  const modelDir = path.join(runtimeHome, "models");
  const toolsDir = path.join(runtimeHome, "tools");
  const venvDir = path.join(modelDir, ".venv");
  const binDir = getVenvBinDir(venvDir);
  const piperExe = path.join(binDir, isWindows ? "piper.exe" : "piper");

  fs.mkdirSync(modelDir, { recursive: true });
  fs.mkdirSync(toolsDir, { recursive: true });

  const runtime = {
    runtimeHome,
    modelDir,
    piperExe,
    ffmpegExe: process.env.FFMPEG_EXE || "ffmpeg",
    ffprobeExe: process.env.FFPROBE_EXE || "ffprobe",
  };

  status(onStatus, "python", "running", "Đang kiểm tra Python...");
  const python = await ensurePython(onStatus).catch((error) => {
    warn(onStatus, "python", getErrorMessage(error));
    return null;
  });

  if (python) {
    await ensurePiper({ onStatus, python, venvDir, binDir, piperExe }).catch((error) => {
      warn(onStatus, "piper", getErrorMessage(error));
    });
  } else {
    warn(onStatus, "piper", "Bỏ qua cài Piper vì máy chưa có Python. App vẫn mở để bạn xem hướng dẫn cài thủ công.");
  }

  await ensureDefaultModelFiles({ onStatus, modelDir }).catch((error) => {
    warn(onStatus, "models", getErrorMessage(error));
  });

  status(onStatus, "ffmpeg", "running", "Đang kiểm tra FFmpeg...");
  const ffmpeg = await ensureFfmpeg({ onStatus, runtimeHome }).catch((error) => {
    warn(onStatus, "ffmpeg", getErrorMessage(error));
    return null;
  });

  if (ffmpeg) {
    runtime.ffmpegExe = ffmpeg.ffmpegExe;
    runtime.ffprobeExe = ffmpeg.ffprobeExe;
  }

  process.env.KATA_STUDIO_HOME = process.env.KATA_STUDIO_HOME || runtimeHome;
  process.env.MODEL_DIR = process.env.MODEL_DIR || modelDir;
  process.env.PIPER_EXE = process.env.PIPER_EXE || piperExe;
  process.env.FFMPEG_EXE = process.env.FFMPEG_EXE || runtime.ffmpegExe;
  process.env.FFPROBE_EXE = process.env.FFPROBE_EXE || runtime.ffprobeExe;
  process.env.KATA_BUNDLED_TOOLS_DIR = process.env.KATA_BUNDLED_TOOLS_DIR || getBundledToolsRoot();

  status(onStatus, "ready", "done", "Đã chuẩn bị xong phần có thể tự xử lý. Đang mở AlgoShorts Studio...");
  return runtime;
}

async function ensurePiper({ onStatus, python, venvDir, binDir, piperExe }) {
  if (fs.existsSync(piperExe)) {
    const canRunDirectly = await commandWorks(piperExe, ["--help"]);
    status(
      onStatus,
      "piper",
      "done",
      canRunDirectly
        ? `Piper đã sẵn sàng: ${piperExe}`
        : `Đã có piper.exe, sẽ dùng trực tiếp: ${piperExe}`
    );
    return;
  }

  if (!fs.existsSync(path.join(binDir, isWindows ? "python.exe" : "python"))) {
    status(onStatus, "piper", "running", "Đang tạo môi trường ảo Piper...");
    await runPython(python, ["-m", "venv", venvDir], { timeout: 20 * 60 * 1000 });
  }

  const venvPython = path.join(binDir, isWindows ? "python.exe" : "python");
  status(onStatus, "piper", "running", "Đang cập nhật pip...");
  await runCommand(venvPython, ["-m", "pip", "install", "--upgrade", "pip"], { timeout: 20 * 60 * 1000 });

  status(onStatus, "piper", "running", "Đang cài piper-tts...");
  await runCommand(venvPython, ["-m", "pip", "install", "piper-tts"], { timeout: 45 * 60 * 1000 });

  if (!fs.existsSync(piperExe)) {
    throw new Error(`Đã cài piper-tts nhưng chưa tìm thấy piper.exe tại ${piperExe}.`);
  }

  const canRunDirectly = await commandWorks(piperExe, ["--help"]);
  status(
    onStatus,
    "piper",
    "done",
    canRunDirectly
      ? `Piper đã sẵn sàng: ${piperExe}`
      : `Đã có piper.exe, sẽ dùng trực tiếp: ${piperExe}`
  );
}

async function ensureDefaultModelFiles({ onStatus, modelDir }) {
  const modelFiles = [
    { file: DEFAULT_MODEL.onnx, url: DEFAULT_MODEL.onnxUrl },
    { file: DEFAULT_MODEL.json, url: DEFAULT_MODEL.jsonUrl },
  ];

  for (const item of modelFiles) {
    const target = path.join(modelDir, item.file);
    if (!fs.existsSync(target)) {
      status(onStatus, "models", "running", `Đang tải ${item.file}...`);
      await downloadFile(item.url, target);
    }
  }

  status(onStatus, "models", "done", "Model tiếng Việt đã sẵn sàng.");
}

function getRuntimeHome(appDataDir) {
  if (isWindows) {
    const localAppData = process.env.LOCALAPPDATA || appDataDir || path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "AlgoShorts Studio");
  }

  if (isMac) {
    return path.join(appDataDir || path.join(os.homedir(), "Library", "Application Support", "AlgoShorts Studio"), "runtime");
  }

  return path.join(appDataDir || path.join(os.homedir(), ".kata-studio"), "runtime");
}

function getVenvBinDir(venvDir) {
  return path.join(venvDir, isWindows ? "Scripts" : "bin");
}

async function ensurePython(onStatus) {
  const existing = await resolvePythonCandidate();
  if (existing) {
    status(onStatus, "python", "done", `Đã tìm thấy Python: ${existing.label}`);
    return existing;
  }

  if (isWindows) {
    await installWithWinget(PYTHON_INSTALL_ID, onStatus, "python", "Chưa có Python. Đang thử cài Python 3.12 bằng winget...");
  } else if (isMac) {
    await installWithBrew("python@3.12", onStatus, "python", "Chưa có Python. Đang thử cài python@3.12 bằng Homebrew...");
  } else {
    throw new Error("Chưa có Python. Hãy cài Python 3 rồi mở lại AlgoShorts Studio.");
  }

  const installed = await resolvePythonCandidate();
  if (installed) {
    status(onStatus, "python", "done", `Đã nhận Python: ${installed.label}`);
    return installed;
  }

  throw new Error("Không tìm thấy Python sau khi chạy trình cài. Hãy mở lại app, hoặc cài Python 3 thủ công rồi mở lại.");
}

async function resolvePythonCandidate() {
  const candidates = isWindows
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
    if (await commandWorks(candidate.command, [...candidate.args, "--version"])) {
      return candidate;
    }
  }

  return null;
}

async function ensureFfmpeg({ onStatus, runtimeHome }) {
  const existingPair = await resolveFfmpegPair(runtimeHome);
  if (existingPair) {
    status(onStatus, "ffmpeg", "done", `Đã tìm thấy FFmpeg: ${existingPair.ffmpegExe}`);
    return existingPair;
  }

  if (isWindows) {
    await installWithWinget(FFMPEG_INSTALL_ID, onStatus, "ffmpeg", "Chưa có FFmpeg. Đang thử cài/kiểm tra Gyan.FFmpeg bằng winget...");
  } else if (isMac) {
    await installWithBrew("ffmpeg", onStatus, "ffmpeg", "Chưa có FFmpeg. Đang thử cài FFmpeg bằng Homebrew...");
  } else {
    throw new Error("Chưa có FFmpeg. Hãy cài FFmpeg rồi mở lại AlgoShorts Studio.");
  }

  const installedPair = await resolveFfmpegPair(runtimeHome);
  if (installedPair) {
    status(onStatus, "ffmpeg", "done", `FFmpeg đã sẵn sàng: ${installedPair.ffmpegExe}`);
    return installedPair;
  }

  throw new Error("Đã chạy trình cài FFmpeg nhưng app chưa tìm thấy ffmpeg/ffprobe. Hãy đóng mở lại app hoặc cài FFmpeg thủ công.");
}

async function installWithWinget(id, onStatus, step, message) {
  if (!isWindows) {
    throw new Error("winget chỉ dùng cho Windows.");
  }

  if (!(await commandWorks("winget", ["--version"]))) {
    throw new Error(`Máy chưa có winget/App Installer nên không thể tự cài ${id}. Hãy cài thủ công hoặc dùng bản installer có bundle runtime.`);
  }

  status(onStatus, step, "running", message);
  const result = await runCommand("winget", [
    "install",
    "--id",
    id,
    "-e",
    "--accept-source-agreements",
    "--accept-package-agreements",
    "--silent",
  ], { timeout: 30 * 60 * 1000, allowFailure: true });

  const output = `${result.stdout}\n${result.stderr}`;
  if (result.code === 0 || isPackageManagerAlreadyInstalledOutput(output)) {
    return result;
  }

  throw new Error(result.stderr.trim() || result.stdout.trim() || `winget cài ${id} thất bại.`);
}

async function installWithBrew(packageName, onStatus, step, message) {
  if (!isMac) {
    throw new Error("Homebrew chỉ dùng cho macOS.");
  }

  if (!(await commandWorks("brew", ["--version"]))) {
    throw new Error(`Máy macOS chưa có Homebrew nên không thể tự cài ${packageName}. Hãy cài Homebrew tại ${HOMEBREW_INSTALL_HINT}, sau đó mở lại AlgoShorts Studio.`);
  }

  status(onStatus, step, "running", message);
  const result = await runCommand("brew", ["install", packageName], { timeout: 45 * 60 * 1000, allowFailure: true });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.code === 0 || isPackageManagerAlreadyInstalledOutput(output)) {
    return result;
  }

  throw new Error(result.stderr.trim() || result.stdout.trim() || `brew cài ${packageName} thất bại.`);
}

function isPackageManagerAlreadyInstalledOutput(output) {
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

async function resolveFfmpegPair(runtimeHome) {
  const ffmpegExe = await resolveFfmpegExecutable("ffmpeg", runtimeHome);
  if (!ffmpegExe || !(await commandWorks(ffmpegExe, ["-version"]))) {
    return null;
  }

  const ffprobeExe = await resolveFfmpegExecutable("ffprobe", runtimeHome, path.dirname(ffmpegExe));
  if (ffprobeExe && await commandWorks(ffprobeExe, ["-version"])) {
    return { ffmpegExe, ffprobeExe };
  }

  return { ffmpegExe, ffprobeExe: isWindows ? "ffprobe.exe" : "ffprobe" };
}

async function resolveFfmpegExecutable(command, runtimeHome, preferredDir = "") {
  const executableName = isWindows ? `${command}.exe` : command;
  const explicitValue = command === "ffmpeg" ? process.env.FFMPEG_EXE : process.env.FFPROBE_EXE;
  const explicit = await resolveIfWorks(explicitValue, ["-version"]);
  if (explicit) return explicit;

  const candidates = [
    preferredDir && path.join(preferredDir, executableName),
    path.join(runtimeHome, "tools", "ffmpeg", "bin", executableName),
    path.join(runtimeHome, "tools", "ffmpeg", executableName),
    path.join(getBundledToolsRoot(), "ffmpeg", "bin", executableName),
    path.join(getBundledToolsRoot(), "ffmpeg", executableName),
    path.join(process.cwd(), "runtime", "tools", "ffmpeg", "bin", executableName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const found = await resolveIfWorks(candidate, ["-version"]);
    if (found) return found;
  }

  const pathValue = await resolveCommandPath(command);
  if (pathValue) return pathValue;

  if (isWindows) {
    return findKnownExecutable(executableName);
  }

  return "";
}

function getBundledToolsRoot() {
  if (process.env.KATA_BUNDLED_TOOLS_DIR) return process.env.KATA_BUNDLED_TOOLS_DIR;
  if (process.resourcesPath) return path.join(process.resourcesPath, "runtime", "tools");
  return path.join(__dirname, "..", "runtime", "tools");
}

async function resolveIfWorks(value, args) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (!fs.existsSync(trimmed) && looksLikePath(trimmed)) return "";
  return await commandWorks(trimmed, args) ? trimmed : "";
}

function findKnownExecutable(fileName) {
  if (!isWindows) return "";

  const roots = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "WinGet", "Packages"),
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.ChocolateyInstall && path.join(process.env.ChocolateyInstall, "bin"),
    "C:\\ProgramData\\chocolatey\\bin",
  ].filter(Boolean);

  for (const root of roots) {
    const found = findFileUnder(root, fileName, 6, /ffmpeg|gyan|winget|chocolatey/i);
    if (found) return found;
  }

  return "";
}

function findFileUnder(root, fileName, maxDepth, preferredPattern) {
  if (!root || maxDepth < 0 || !fs.existsSync(root)) return "";

  let entries = [];
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
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
      return fullPath;
    }
  }

  for (const entry of sorted) {
    if (!entry.isDirectory()) continue;
    const found = findFileUnder(path.join(root, entry.name), fileName, maxDepth - 1, preferredPattern);
    if (found) return found;
  }

  return "";
}

async function runPython(python, args, options) {
  return runCommand(python.command, [...python.args, ...args], options);
}

async function resolveCommandPath(command) {
  const result = isWindows
    ? await runCommand("where", [command], { timeout: 30 * 1000, allowFailure: true })
    : await runCommand("/bin/bash", ["-lc", `command -v ${shellQuote(command)}`], { timeout: 30 * 1000, allowFailure: true });
  const first = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return first || "";
}

async function assertCommandWorks(command, args, errorMessage) {
  if (!(await commandWorks(command, args))) {
    throw new Error(errorMessage);
  }
}

async function commandWorks(command, args) {
  const result = await runCommand(command, args, { timeout: 45 * 1000, allowFailure: true });
  return result.code === 0;
}

function runCommand(command, args, options = {}) {
  const timeout = options.timeout || 5 * 60 * 1000;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
      env: buildCommandEnv(command),
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Lệnh chạy quá lâu: ${command} ${args.join(" ")}`));
    }, timeout);

    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      if (options.allowFailure) {
        resolve({ code: 1, stdout, stderr: stderr || error.message });
      } else {
        reject(error);
      }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 || options.allowFailure) {
        resolve({ code: code ?? 0, stdout, stderr });
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || `Lệnh thất bại: ${command} ${args.join(" ")}`));
    });
  });
}

function buildCommandEnv(command) {
  const baseEnv = {
    ...process.env,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
  };

  if (!isPiperExecutable(command)) {
    return baseEnv;
  }

  const piperDir = looksLikePath(command) ? path.dirname(command) : "";
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

function findPiperSitePackageDirs(piperDir) {
  if (!piperDir) return [];
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

function isPiperExecutable(command) {
  const baseName = path.basename(command).toLowerCase();
  return baseName === "piper.exe" || baseName === "piper";
}

async function downloadFile(url, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Không tải được ${url}: HTTP ${response.status}`);
  }

  const tempFile = `${target}.download`;
  const file = fs.createWriteStream(tempFile);
  await new Promise((resolve, reject) => {
    const reader = response.body.getReader();
    function pump() {
      reader.read().then(({ done, value }) => {
        if (done) {
          file.end(resolve);
          return;
        }
        file.write(Buffer.from(value), pump);
      }).catch(reject);
    }
    file.on("error", reject);
    pump();
  });
  fs.renameSync(tempFile, target);
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function looksLikePath(value) {
  return String(value).includes("/") || String(value).includes("\\") || /^[a-zA-Z]:/.test(String(value));
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function warn(onStatus, step, message) {
  status(onStatus, step, "warning", message);
}

function status(onStatus, step, status, message) {
  onStatus({ step, status, message });
}

module.exports = { ensureDesktopRuntime };
