import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import {
  PROJECT_ROOT,
  getGeneratedBackgroundMusicDir,
  getGeneratedDir,
  getGeneratedPreviewDir,
  getGeneratedVideoDir,
} from "../config/paths";
import { getPiperRuntimeStatus, installPiperModel } from "./PiperModelInstallService";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";
import { getRvcApplioConfigStatus } from "./RvcApplioService";
import { getSupertonicConfigStatus } from "./SupertonicService";
import { getVieneuConfigStatus } from "./VieneuService";

export type SetupTaskId =
  | "generated-data"
  | "piper-runtime"
  | "piper-models"
  | "supertonic"
  | "applio-client"
  | "applio-start"
  | "vieneu";

type SetupTaskStatus = {
  id: SetupTaskId | "elevenlabs";
  label: string;
  description: string;
  ready: boolean;
  optional: boolean;
  canAutoFix: boolean;
  detail: string;
  command?: string;
};

export type SetupWizardStatus = {
  coreReady: boolean;
  generatedDir: string;
  piperExe: string;
  modelDir: string;
  tasks: SetupTaskStatus[];
};

type SetupTaskResult = {
  ok: boolean;
  taskId: SetupTaskId;
  message: string;
  output?: string;
  command?: string;
  status: SetupWizardStatus;
};

type SetupAutostartItem = {
  id: string;
  label: string;
  message: string;
};

type SetupAutostartResult = {
  ok: boolean;
  message: string;
  started: SetupAutostartItem[];
  skipped: SetupAutostartItem[];
  failed: SetupAutostartItem[];
  status: SetupWizardStatus;
};

const backgroundProcesses = new Map<string, ReturnType<typeof spawn>>();

export async function getSetupWizardStatus(envOverrides: RuntimeEnvValues = {}): Promise<SetupWizardStatus> {
  const env = readEnvValues(envOverrides);
  const generatedDir = getGeneratedDir(env.SERVER_DATA_DIR);
  const [piper, supertonic, applio, vieneu] = await Promise.all([
    getPiperRuntimeStatus(envOverrides),
    getSupertonicConfigStatus(envOverrides),
    getRvcApplioConfigStatus(envOverrides),
    getVieneuConfigStatus(envOverrides),
  ]);

  const generatedReady = fs.existsSync(generatedDir);
  const piperRuntimeReady = piper.piperExists;
  const piperModelsReady = piper.models.length > 0 && piper.availableCount >= piper.models.length;
  const applioConfigured = Boolean(
    applio.startCommandConfigured ||
    applio.argTemplateConfigured ||
    applio.ttsTemplateConfigured ||
    applio.serverOk,
  );
  const applioClientReady = Boolean(applio.pythonExists && applio.bridgeExists && applio.gradioClientInstalled);
  const applioReady = Boolean(applio.serverOk && applio.endpointsOk && (applio.argTemplateConfigured || applio.ttsTemplateConfigured));

  return {
    coreReady: generatedReady && piperRuntimeReady && piperModelsReady,
    generatedDir,
    piperExe: piper.piperExe,
    modelDir: piper.modelDir,
    tasks: [
      {
        id: "generated-data",
        label: "Generated data",
        description: "Tạo thư mục dữ liệu local để lưu audio/video sinh ra.",
        ready: generatedReady,
        optional: false,
        canAutoFix: true,
        detail: generatedReady ? generatedDir : "Chưa có thư mục generated data.",
        command: describeSetupTaskCommand("generated-data", env),
      },
      {
        id: "piper-runtime",
        label: "Piper executable",
        description: "Tạo Python venv và cài piper-tts để backend tạo voice local.",
        ready: piperRuntimeReady,
        optional: false,
        canAutoFix: true,
        detail: piperRuntimeReady ? piper.piperExe : "Chưa tìm thấy piper.exe.",
        command: describeSetupTaskCommand("piper-runtime", env),
      },
      {
        id: "piper-models",
        label: "Piper voice models",
        description: "Copy model Piper bundled từ installer vào MODEL_DIR; nếu thiếu bundled mới tải online.",
        ready: piperModelsReady,
        optional: false,
        canAutoFix: true,
        detail: piperModelsReady
          ? `${piper.availableCount}/${piper.models.length} model sẵn sàng.`
          : `${piper.availableCount}/${piper.models.length} model sẵn sàng. Cần tải thêm model còn thiếu.`,
        command: describeSetupTaskCommand("piper-models", env),
      },
      {
        id: "supertonic",
        label: "Supertonic local TTS",
        description: "Cài package Supertonic và khởi động server local nếu máy hỗ trợ.",
        ready: Boolean(supertonic.serverOk && supertonic.endpointsOk),
        optional: true,
        canAutoFix: true,
        detail: supertonic.serverOk ? `${supertonic.voices.length} voice · ${supertonic.baseUrl}` : supertonic.error || "Server chưa chạy.",
        command: describeSetupTaskCommand("supertonic", env),
      },
      {
        id: "applio-client",
        label: "Applio client dependencies",
        description: "Cài gradio_client để backend gọi RVC/Applio local.",
        ready: applioClientReady,
        optional: true,
        canAutoFix: true,
        detail: applioClientReady ? "gradio_client OK" : applio.gradioClientCheckError || "Thiếu gradio_client hoặc Python.",
        command: describeSetupTaskCommand("applio-client", env),
      },
      {
        id: "applio-start",
        label: "Applio server",
        description: "Khởi động Applio bằng RVC_APPLIO_START_COMMAND nếu đã cấu hình.",
        ready: applioReady,
        optional: true,
        canAutoFix: applio.startCommandConfigured,
        detail: applioConfigured
          ? (applioReady ? applio.baseUrl : applio.error || "Applio chưa sẵn sàng.")
          : "Chưa cấu hình Applio model/start command, bỏ qua khi setup lần đầu.",
        command: describeSetupTaskCommand("applio-start", env),
      },
      {
        id: "vieneu",
        label: "VieNeu-TTS SDK",
        description: "Cài VieNeu-TTS từ source bundled/fork local để dùng giọng Việt.",
        ready: Boolean(vieneu.sdkInstalled && vieneu.pythonExists && vieneu.bridgeExists),
        optional: true,
        canAutoFix: true,
        detail: vieneu.sdkInstalled ? `${vieneu.mode} · ${vieneu.version || "SDK OK"}` : vieneu.error || "SDK chưa cài.",
        command: describeSetupTaskCommand("vieneu", env),
      },
      {
        id: "elevenlabs",
        label: "ElevenLabs API",
        description: "Provider cloud, cần API key riêng nên không tự cài.",
        ready: Boolean(env.ELEVENLABS_API_KEY),
        optional: true,
        canAutoFix: false,
        detail: env.ELEVENLABS_API_KEY ? "Đã cấu hình API key." : "Chưa cấu hình API key, bỏ qua khi dùng local TTS.",
      },
    ],
  };
}

export async function runSetupAutostart(envOverrides: RuntimeEnvValues = {}): Promise<SetupAutostartResult> {
  const env = readEnvValues(envOverrides);
  const started: SetupAutostartItem[] = [];
  const skipped: SetupAutostartItem[] = [];
  const failed: SetupAutostartItem[] = [];

  const supertonic = await getSupertonicConfigStatus(envOverrides);
  if (supertonic.serverOk && supertonic.endpointsOk) {
    skipped.push({ id: "supertonic", label: "Supertonic local TTS", message: "Supertonic đã chạy." });
  } else if (await commandAvailable("supertonic", ["--help"])) {
    try {
      await startManagedScript("supertonic", "scripts/start-supertonic.mjs", env);
      started.push({ id: "supertonic", label: "Supertonic local TTS", message: `Đã gửi lệnh start Supertonic tại ${supertonic.baseUrl}.` });
    } catch (error) {
      failed.push({ id: "supertonic", label: "Supertonic local TTS", message: getErrorMessage(error) });
    }
  } else {
    skipped.push({ id: "supertonic", label: "Supertonic local TTS", message: "Chưa thấy CLI Supertonic, không tự cài khi mở app." });
  }

  const applio = await getRvcApplioConfigStatus(envOverrides);
  if (applio.serverOk) {
    skipped.push({ id: "applio-start", label: "Applio server", message: "Applio đã chạy." });
  } else if (applio.startCommandConfigured) {
    try {
      await startManagedScript("applio", "scripts/start-applio.mjs", env);
      started.push({ id: "applio-start", label: "Applio server", message: `Đã gửi lệnh start Applio: ${applio.startCommand}` });
    } catch (error) {
      failed.push({ id: "applio-start", label: "Applio server", message: getErrorMessage(error) });
    }
  } else {
    skipped.push({ id: "applio-start", label: "Applio server", message: "Chưa cấu hình RVC_APPLIO_START_COMMAND, bỏ qua autostart." });
  }

  const vieneu = await getVieneuConfigStatus(envOverrides);
  const vieneuAutoStart = String(env.VIENEU_AUTO_START ?? "true").toLowerCase() !== "false";
  if (!vieneuAutoStart) {
    skipped.push({ id: "vieneu", label: "VieNeu-TTS SDK", message: "VIENEU_AUTO_START=false, bỏ qua." });
  } else if (vieneu.sdkInstalled && vieneu.pythonExists && vieneu.bridgeExists) {
    try {
      await startManagedScript("vieneu", "scripts/start-vieneu.mjs", env);
      started.push({ id: "vieneu", label: "VieNeu-TTS SDK", message: "Đã kiểm tra/start VieNeu bridge process." });
    } catch (error) {
      failed.push({ id: "vieneu", label: "VieNeu-TTS SDK", message: getErrorMessage(error) });
    }
  } else {
    skipped.push({ id: "vieneu", label: "VieNeu-TTS SDK", message: "VieNeu chưa đủ SDK/Python/bridge, không tự cài khi mở app." });
  }

  return {
    ok: failed.length === 0,
    message: `Autostart hoàn tất: ${started.length} started, ${skipped.length} skipped, ${failed.length} failed.`,
    started,
    skipped,
    failed,
    status: await getSetupWizardStatus(envOverrides),
  };
}

export async function runSetupWizardTask(taskId: SetupTaskId, envOverrides: RuntimeEnvValues = {}): Promise<SetupTaskResult> {
  const env = readEnvValues(envOverrides);
  let message = "Đã thực hiện.";
  let output = "";
  const command = describeSetupTaskCommand(taskId, env);

  if (taskId === "generated-data") {
    await ensureGeneratedDirectories(env);
    message = "Đã tạo thư mục dữ liệu local.";
  } else if (taskId === "piper-runtime") {
    output = await ensurePiperRuntime(env);
    message = "Đã cài/kiểm tra Piper runtime.";
  } else if (taskId === "piper-models") {
    output = await installMissingPiperModels(envOverrides);
    message = "Đã cài/kiểm tra Piper models.";
  } else if (taskId === "supertonic") {
    output = await installSupertonic(env);
    await startManagedScript("supertonic", "scripts/start-supertonic.mjs", env);
    message = "Đã cài và thử khởi động Supertonic.";
  } else if (taskId === "applio-client") {
    output = await installPythonPackage(env.RVC_APPLIO_PYTHON || "python", ["install", "-U", "gradio_client"], env);
    message = "Đã cài/kiểm tra gradio_client cho Applio.";
  } else if (taskId === "applio-start") {
    const applio = await getRvcApplioConfigStatus(envOverrides);
    if (!applio.startCommandConfigured) throw new Error("Chưa cấu hình RVC_APPLIO_START_COMMAND nên app không thể tự mở Applio.");
    await startManagedScript("applio", "scripts/start-applio.mjs", env);
    message = "Đã gửi lệnh khởi động Applio.";
  } else if (taskId === "vieneu") {
    output = await runNodeScript("scripts/install-vieneu-from-source.mjs", env, 60 * 60 * 1000);
    message = "Đã cài/kiểm tra VieNeu-TTS SDK.";
  }

  return {
    ok: true,
    taskId,
    message,
    output: outputTail(output),
    command,
    status: await getSetupWizardStatus(envOverrides),
  };
}

function describeSetupTaskCommand(taskId: SetupTaskId, env: RuntimeEnvValues) {
  if (taskId === "generated-data") {
    return `mkdir "${getGeneratedDir(env.SERVER_DATA_DIR)}"`;
  }

  if (taskId === "piper-runtime") {
    const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || "models/.venv/Scripts/piper.exe");
    const venvScriptsDir = path.dirname(piperExe);
    const venvDir = path.dirname(venvScriptsDir);
    const venvPython = process.platform === "win32"
      ? path.join(venvScriptsDir, "python.exe")
      : path.join(venvScriptsDir, "python");
    const bootstrapPython = process.platform === "win32" ? "python" : "python3";
    return `${bootstrapPython} -m venv "${venvDir}" && "${venvPython}" -m pip install --upgrade pip setuptools wheel && "${venvPython}" -m pip install piper-tts`;
  }

  if (taskId === "piper-models") {
    return "copy bundled Piper models into MODEL_DIR; download only when bundled files are missing";
  }

  if (taskId === "supertonic") {
    const python = process.platform === "win32" ? "python" : "python3";
    return `${python} -m pip install supertonic[serve] && node scripts/start-supertonic.mjs`;
  }

  if (taskId === "applio-client") {
    return `${env.RVC_APPLIO_PYTHON || "python"} -m pip install -U gradio_client`;
  }

  if (taskId === "applio-start") {
    return env.RVC_APPLIO_START_COMMAND || "node scripts/start-applio.mjs";
  }

  if (taskId === "vieneu") {
    return "node scripts/install-vieneu-from-source.mjs";
  }

  return "";
}

async function ensureGeneratedDirectories(env: RuntimeEnvValues) {
  await Promise.all([
    fsp.mkdir(getGeneratedDir(env.SERVER_DATA_DIR), { recursive: true }),
    fsp.mkdir(getGeneratedPreviewDir(env.SERVER_DATA_DIR), { recursive: true }),
    fsp.mkdir(getGeneratedVideoDir(env.SERVER_DATA_DIR), { recursive: true }),
    fsp.mkdir(getGeneratedBackgroundMusicDir(env.SERVER_DATA_DIR), { recursive: true }),
  ]);
}

async function ensurePiperRuntime(env: RuntimeEnvValues) {
  const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || "models/.venv/Scripts/piper.exe");
  if (fs.existsSync(piperExe)) return `Piper đã có: ${piperExe}`;

  const venvScriptsDir = path.dirname(piperExe);
  const venvDir = path.dirname(venvScriptsDir);
  const venvPython = process.platform === "win32"
    ? path.join(venvScriptsDir, "python.exe")
    : path.join(venvScriptsDir, "python");
  const bootstrapPython = process.platform === "win32" ? "python" : "python3";
  let output = "";

  if (!fs.existsSync(venvPython)) {
    await fsp.mkdir(path.dirname(venvDir), { recursive: true });
    output += await runCommand(bootstrapPython, ["-m", "venv", venvDir], env, 20 * 60 * 1000);
  }

  output += await runCommand(venvPython, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"], env, 20 * 60 * 1000);
  output += await runCommand(venvPython, ["-m", "pip", "install", "piper-tts"], env, 45 * 60 * 1000);

  if (!fs.existsSync(piperExe)) throw new Error(`Đã cài piper-tts nhưng chưa thấy executable tại ${piperExe}.`);
  return output;
}

async function installMissingPiperModels(envOverrides: RuntimeEnvValues) {
  const status = await getPiperRuntimeStatus(envOverrides);
  const output: string[] = [];

  await fsp.mkdir(status.modelDir, { recursive: true });

  for (const model of status.models) {
    if (fs.existsSync(model.modelPath) && fs.existsSync(model.jsonPath)) {
      output.push(`SKIP ${model.key}: đã có trong MODEL_DIR.`);
      continue;
    }

    const copied = await copyBundledPiperModel(model);
    if (copied) {
      output.push(`COPIED ${model.key}: ${copied}`);
      continue;
    }

    await installPiperModel(model.key, envOverrides);
    output.push(`DOWNLOADED ${model.key}: không có bundled model, đã tải online.`);
  }

  const finalStatus = await getPiperRuntimeStatus(envOverrides);
  if (finalStatus.availableCount < finalStatus.models.length) {
    const missing = finalStatus.models.filter((model) => !model.available).map((model) => model.key).join(", ");
    throw new Error(`Piper models chưa đủ (${finalStatus.availableCount}/${finalStatus.models.length}). Thiếu: ${missing}`);
  }

  return output.length ? output.join("\n") : "Tất cả Piper model đã có sẵn.";
}

async function copyBundledPiperModel(model: { key: string; modelPath: string; jsonPath: string }) {
  const modelFileName = path.basename(model.modelPath);
  const jsonFileName = path.basename(model.jsonPath);
  const bundledDir = findBundledPiperModelDir(modelFileName, jsonFileName);

  if (!bundledDir) return "";

  await fsp.mkdir(path.dirname(model.modelPath), { recursive: true });
  await copyFileIfMissing(path.join(bundledDir, modelFileName), model.modelPath);
  await copyFileIfMissing(path.join(bundledDir, jsonFileName), model.jsonPath);
  return bundledDir;
}

function findBundledPiperModelDir(modelFileName: string, jsonFileName: string) {
  for (const dir of getBundledPiperModelDirs()) {
    if (fs.existsSync(path.join(dir, modelFileName)) && fs.existsSync(path.join(dir, jsonFileName))) {
      return dir;
    }
  }
  return "";
}

function getBundledPiperModelDirs() {
  return Array.from(new Set([
    path.join(PROJECT_ROOT, "bundled-models"),
    path.join(PROJECT_ROOT, "models"),
    path.resolve(process.cwd(), "models"),
  ]));
}

async function copyFileIfMissing(sourcePath: string, targetPath: string) {
  if (fs.existsSync(targetPath)) return;
  await fsp.copyFile(sourcePath, targetPath);
}

async function installSupertonic(env: RuntimeEnvValues) {
  const python = process.platform === "win32" ? "python" : "python3";
  return installPythonPackage(python, ["install", "supertonic[serve]"], env);
}

async function installPythonPackage(pythonExe: string, pipArgs: string[], env: RuntimeEnvValues) {
  return runCommand(resolveRuntimeExecutable(pythonExe), ["-m", "pip", ...pipArgs], env, 45 * 60 * 1000);
}

async function startManagedScript(key: string, relativeScript: string, env: RuntimeEnvValues) {
  const existing = backgroundProcesses.get(key);
  if (existing && !existing.killed && existing.exitCode === null) return;

  const child = spawnNodeScript(relativeScript, env);
  backgroundProcesses.set(key, child);
  child.on("exit", () => backgroundProcesses.delete(key));
  await new Promise((resolve) => setTimeout(resolve, 1600));
}

function spawnNodeScript(relativeScript: string, env: RuntimeEnvValues) {
  const scriptPath = path.join(PROJECT_ROOT, relativeScript);
  if (!fs.existsSync(scriptPath)) throw new Error(`Không tìm thấy script: ${scriptPath}`);
  return spawn(getNodeExecutable(), [scriptPath], {
    cwd: PROJECT_ROOT,
    env: buildProcessEnv(env),
    windowsHide: true,
    stdio: "ignore",
  });
}

function runNodeScript(relativeScript: string, env: RuntimeEnvValues, timeoutMs: number) {
  const scriptPath = path.join(PROJECT_ROOT, relativeScript);
  if (!fs.existsSync(scriptPath)) throw new Error(`Không tìm thấy script: ${scriptPath}`);
  return runCommand(getNodeExecutable(), [scriptPath], env, timeoutMs);
}

function getNodeExecutable() {
  return process.execPath;
}

function runCommand(command: string, args: string[], env: RuntimeEnvValues, timeoutMs: number) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      env: buildProcessEnv(env),
      windowsHide: true,
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Lệnh chạy quá lâu: ${command} ${args.join(" ")}`));
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const output = `${stdout}\n${stderr}`.trim();
      if (code === 0) resolve(output);
      else reject(new Error(output || `Lệnh thất bại: ${command} ${args.join(" ")}`));
    });
  });
}

function buildProcessEnv(env: RuntimeEnvValues) {
  return {
    ...process.env,
    ...env,
    KATA_PROJECT_ROOT: PROJECT_ROOT,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
    ELECTRON_RUN_AS_NODE: "1",
    KAI_STUDIO_MANAGED_SERVICE: "1",
    BROWSER: process.env.BROWSER || "none",
    NO_BROWSER: process.env.NO_BROWSER || "1",
    APPLIO_NO_BROWSER: process.env.APPLIO_NO_BROWSER || "1",
    GRADIO_ANALYTICS_ENABLED: process.env.GRADIO_ANALYTICS_ENABLED || "False",
  };
}

async function commandAvailable(command: string, args: string[] = ["--version"]) {
  const commandLine = [command, ...args].map(quoteCommandPart).join(" ");
  const result = process.platform === "win32"
    ? await runCommand("cmd.exe", ["/d", "/s", "/c", commandLine], {}, 30 * 1000).then(() => true).catch(() => false)
    : await runCommand(command, args, {}, 30 * 1000).then(() => true).catch(() => false);
  return result;
}

function quoteCommandPart(value: string) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function outputTail(value: string) {
  if (!value) return "";
  const lines = value.split(/\r?\n/).filter(Boolean);
  return lines.slice(-24).join("\n");
}
