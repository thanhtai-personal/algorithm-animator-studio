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
      },
      {
        id: "piper-runtime",
        label: "Piper executable",
        description: "Tạo Python venv và cài piper-tts để backend tạo voice local.",
        ready: piperRuntimeReady,
        optional: false,
        canAutoFix: true,
        detail: piperRuntimeReady ? piper.piperExe : "Chưa tìm thấy piper.exe.",
      },
      {
        id: "piper-models",
        label: "Piper voice models",
        description: "Tải các model Piper còn thiếu vào MODEL_DIR.",
        ready: piperModelsReady,
        optional: false,
        canAutoFix: true,
        detail: piperModelsReady
          ? `${piper.availableCount}/${piper.models.length} model sẵn sàng.`
          : `${piper.availableCount}/${piper.models.length} model sẵn sàng. Cần tải thêm model còn thiếu.`,
      },
      {
        id: "supertonic",
        label: "Supertonic local TTS",
        description: "Cài package Supertonic và khởi động server local nếu máy hỗ trợ.",
        ready: Boolean(supertonic.serverOk && supertonic.endpointsOk),
        optional: true,
        canAutoFix: true,
        detail: supertonic.serverOk ? `${supertonic.voices.length} voice · ${supertonic.baseUrl}` : supertonic.error || "Server chưa chạy.",
      },
      {
        id: "applio-client",
        label: "Applio client dependencies",
        description: "Cài gradio_client để backend gọi RVC/Applio local.",
        ready: applioClientReady,
        optional: true,
        canAutoFix: true,
        detail: applioClientReady ? "gradio_client OK" : applio.gradioClientCheckError || "Thiếu gradio_client hoặc Python.",
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
      },
      {
        id: "vieneu",
        label: "VieNeu-TTS SDK",
        description: "Cài VieNeu-TTS từ source bundled/fork local để dùng giọng Việt.",
        ready: Boolean(vieneu.sdkInstalled && vieneu.pythonExists && vieneu.bridgeExists),
        optional: true,
        canAutoFix: true,
        detail: vieneu.sdkInstalled ? `${vieneu.mode} · ${vieneu.version || "SDK OK"}` : vieneu.error || "SDK chưa cài.",
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

export async function runSetupWizardTask(taskId: SetupTaskId, envOverrides: RuntimeEnvValues = {}): Promise<SetupTaskResult> {
  const env = readEnvValues(envOverrides);
  let message = "Đã thực hiện.";
  let output = "";

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
    status: await getSetupWizardStatus(envOverrides),
  };
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
  for (const model of status.models) {
    if (!model.available) {
      await installPiperModel(model.key, envOverrides);
      output.push(`Installed ${model.key}`);
    }
  }
  return output.length ? output.join("\n") : "Tất cả Piper model đã có sẵn.";
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
  };
}

function outputTail(value: string) {
  if (!value) return "";
  const lines = value.split(/\r?\n/).filter(Boolean);
  return lines.slice(-24).join("\n");
}
