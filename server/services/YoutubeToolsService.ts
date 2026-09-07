import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  FFMPEG_EXE,
  FFPROBE_EXE,
  GENERATED_VIDEO_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedVideoDir,
} from "../config/paths";
import type {
  YoutubeDownloadMode,
  YoutubeDownloadRequest,
  YoutubeDownloadResult,
  YoutubeToolStatus,
  YoutubeToolsHealth,
  YoutubeTranscriptRequest,
  YoutubeTranscriptResult,
} from "../models/YoutubeTools";
import { ensureDirectoryExists, getLocalDateFolderName, sanitizeFileBaseName } from "../utils/audioOutput";
import { normalizeYoutubeUrl } from "../utils/youtubeUrl";
import { buildYoutubeDownloadSectionArgs } from "../utils/youtubeDownloadSection";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";
import {
  buildYtDlpRuntimeArgs,
  getYtDlpRuntimeStatus,
  isYtDlpAuthenticationRequiredError,
  isYtDlpBrowserCookieAccessError,
  stripYtDlpBrowserCookieArgs,
  toYtDlpUserMessage,
} from "./YoutubeToolsRuntimeOptions";

const execFileAsync = promisify(execFile);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mkv", ".webm", ".mov", ".m4v"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".webm", ".opus", ".wav"]);
const WHISPER_CLI_BRIDGE = "import sys; from whisper.transcribe import cli; sys.argv=['whisper']+sys.argv[1:]; cli()";

export type CommandSpec = { command: string; prefixArgs: string[]; label: string; ok: boolean; version?: string; detail?: string };
export type RunResult = { stdout: string; stderr: string; combined: string[] };
export type YoutubeToolsRunHooks = { onLog?: (line: string) => void };

export async function getYoutubeToolsHealth(envOverrides: RuntimeEnvValues = {}): Promise<YoutubeToolsHealth> {
  const env = readEnvValues(envOverrides);
  const [python, ytDlp, whisper, ffmpeg, ffprobe] = await Promise.all([
    checkFirstPython(env),
    resolveYtDlp(env),
    resolveWhisper(env),
    checkCommand(resolveRuntimeExecutable(env.FFMPEG_EXE || FFMPEG_EXE), ["-version"]),
    checkCommand(resolveRuntimeExecutable(env.FFPROBE_EXE || FFPROBE_EXE), ["-version"]),
  ]);

  const outputDir = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const ytDlpRuntime = getYtDlpRuntimeStatus(env);
  return {
    ok: ytDlp.ok && whisper.ok && ffmpeg.ok && ffprobe.ok,
    python,
    ytDlp: toStatus(ytDlp),
    whisper: toStatus(whisper),
    ffmpeg,
    ffprobe,
    ...ytDlpRuntime,
    outputDir,
    installHint: [
      "python -m pip install -U yt-dlp openai-whisper",
      "Kiểm tra FFmpeg: ffmpeg -version",
      "Nếu YouTube báo bot/429: dùng YOUTUBE_COOKIES_FILE hoặc YOUTUBE_COOKIES_FROM_BROWSER",
      "Nếu YouTube báo n challenge: đặt YOUTUBE_JS_RUNTIME=node và YOUTUBE_REMOTE_COMPONENTS=ejs:github",
      "Nếu dùng Python venv riêng: đặt YOUTUBE_TOOLS_PYTHON=đường_dẫn_python.exe trong .env",
    ],
  };
}

export async function downloadYoutubeVideo(
  request: YoutubeDownloadRequest,
  envOverrides: RuntimeEnvValues = {},
  hooks: YoutubeToolsRunHooks = {}
): Promise<YoutubeDownloadResult> {
  const env = readEnvValues(envOverrides);
  const url = normalizeYoutubeUrl(request.url);
  const mode: YoutubeDownloadMode = request.mode === "audio" ? "audio" : "video";
  const ytDlp = await resolveYtDlp(env);
  if (!ytDlp.ok) throw new Error(ytDlp.detail || "Chưa cài yt-dlp.");

  const outputRoot = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const dateFolder = getLocalDateFolderName();
  const relativeDir = `youtube/${dateFolder}`;
  const outputDir = path.join(outputRoot, relativeDir);
  const before = snapshotFiles(outputDir);
  ensureDirectoryExists(outputDir);

  const baseName = sanitizeFileBaseName(request.fileName || "youtube-video");
  const outputTemplate = path.join(outputDir, `${baseName}-${Date.now()}-%(id)s.%(ext)s`);
  const args = buildYtDlpDownloadArgs({ mode, maxHeight: request.maxHeight, outputTemplate, env, url, sectionStartSeconds: request.sectionStartSeconds, sectionEndSeconds: request.sectionEndSeconds });
  const result = await runYtDlpCommand(ytDlp.command, [...ytDlp.prefixArgs, ...args], 60 * 60 * 1000, hooks);
  const downloaded = findNewestChangedFile(outputDir, before, mode === "audio" ? AUDIO_EXTENSIONS : VIDEO_EXTENSIONS);
  if (!downloaded) throw new Error("Không tìm thấy file sau khi tải. Hãy kiểm tra log yt-dlp.");

  const stat = fs.statSync(downloaded);
  const relativePath = path.relative(outputRoot, downloaded).replaceAll(path.sep, "/");
  return {
    ok: true,
    mode,
    fileName: path.basename(downloaded),
    relativePath,
    url: buildGeneratedFileUrl(GENERATED_VIDEO_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    savedTo: downloaded,
    sizeBytes: stat.size,
    log: tail(result.combined),
  };
}

export async function transcribeYoutubeVideo(
  request: YoutubeTranscriptRequest,
  envOverrides: RuntimeEnvValues = {},
  hooks: YoutubeToolsRunHooks = {}
): Promise<YoutubeTranscriptResult> {
  const env = readEnvValues(envOverrides);
  const whisper = await resolveWhisper(env);
  if (!whisper.ok) throw new Error(whisper.detail || "Chưa cài Whisper.");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kai-youtube-transcript-"));
  try {
    const sourcePath = request.sourceRelativePath
      ? resolveGeneratedVideoPath(request.sourceRelativePath, env)
      : await downloadAudioForTranscript(request.url || "", tempDir, env, hooks);

    const outputRoot = getGeneratedVideoDir(env.SERVER_DATA_DIR);
    const dateFolder = getLocalDateFolderName();
    const outputDir = path.join(outputRoot, "youtube-transcripts", dateFolder, sanitizeFileBaseName(path.parse(sourcePath).name));
    ensureDirectoryExists(outputDir);

    const model = sanitizeWhisperValue(request.model || env.YOUTUBE_TRANSCRIPT_MODEL || "base", "base");
    const task = request.task === "translate" ? "translate" : "transcribe";
    const language = sanitizeWhisperLanguage(request.language || env.YOUTUBE_TRANSCRIPT_LANGUAGE || "auto");
    const args = [
      ...whisper.prefixArgs,
      sourcePath,
      "--model", model,
      "--task", task,
      "--output_dir", outputDir,
      "--output_format", "all",
    ];
    if (language !== "auto") args.push("--language", language);

    const result = await runCommand(whisper.command, args, 2 * 60 * 60 * 1000, hooks);
    const files = collectTranscriptFiles(outputDir, outputRoot, env.SERVER_ORIGIN || SERVER_ORIGIN);
    const transcriptText = readFirstTranscriptText(outputDir);
    if (!transcriptText.trim() && Object.keys(files).length === 0) {
      throw new Error(`Whisper không tạo được transcript. ${tail(result.combined, 12).join("\n")}`);
    }

    return {
      ok: true,
      sourceLabel: path.basename(sourcePath),
      transcriptText,
      files: filesToPublicUrls(files, env.SERVER_ORIGIN || SERVER_ORIGIN),
      outputDir,
      log: tail(result.combined),
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function downloadAudioForTranscript(urlValue: string, tempDir: string, env: RuntimeEnvValues, hooks: YoutubeToolsRunHooks) {
  const url = normalizeYoutubeUrl(urlValue);
  const ytDlp = await resolveYtDlp(env);
  if (!ytDlp.ok) throw new Error(ytDlp.detail || "Chưa cài yt-dlp để tải audio tạm.");
  const before = snapshotFiles(tempDir);
  const outputTemplate = path.join(tempDir, "audio-%(id)s.%(ext)s");
  const args = ["--no-playlist", "-x", "--audio-format", "mp3", "--audio-quality", "0", "-o", outputTemplate, ...buildYtDlpRuntimeArgs(env), ...ffmpegArgs(env), url];
  await runYtDlpCommand(ytDlp.command, [...ytDlp.prefixArgs, ...args], 60 * 60 * 1000, hooks);
  const audioPath = findNewestChangedFile(tempDir, before, AUDIO_EXTENSIONS);
  if (!audioPath) throw new Error("Không tải được audio tạm từ YouTube.");
  return audioPath;
}

function buildYtDlpDownloadArgs(params: {
  mode: YoutubeDownloadMode;
  maxHeight?: number;
  outputTemplate: string;
  env: RuntimeEnvValues;
  url: string;
  sectionStartSeconds?: number;
  sectionEndSeconds?: number;
}) {
  const args = ["--no-playlist", "--newline", "-o", params.outputTemplate, ...buildYtDlpRuntimeArgs(params.env), ...ffmpegArgs(params.env)];
  args.push(...buildYoutubeDownloadSectionArgs(params.mode, params.sectionStartSeconds, params.sectionEndSeconds));
  if (params.mode === "audio") {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    const maxHeight = normalizeMaxHeight(params.maxHeight);
    args.push("-f", `bv*[height<=${maxHeight}]+ba/b[height<=${maxHeight}]/best`, "--merge-output-format", "mp4");
  }
  args.push(params.url);
  return args;
}

async function resolveYtDlp(env: RuntimeEnvValues): Promise<CommandSpec> {
  const pythonChecks = [];
  for (const python of getPythonCandidates(env)) {
    const pythonModule = await checkCommand(python, ["-m", "yt_dlp", "--version"]);
    pythonChecks.push(pythonModule.detail);
    if (pythonModule.ok) return { command: python, prefixArgs: ["-m", "yt_dlp"], label: `${python} -m yt_dlp`, ok: true, version: pythonModule.version };
  }
  const binary = await checkCommand(resolveRuntimeExecutable(env.YOUTUBE_DLP_EXE || "yt-dlp"), ["--version"]);
  return { command: resolveRuntimeExecutable(env.YOUTUBE_DLP_EXE || "yt-dlp"), prefixArgs: [], label: "yt-dlp", ok: binary.ok, version: binary.version, detail: binary.detail || pythonChecks.find(Boolean) };
}

export async function resolveWhisper(env: RuntimeEnvValues): Promise<CommandSpec> {
  const pythonChecks = [];
  for (const python of getPythonCandidates(env)) {
    const pythonModule = await checkCommand(python, ["-m", "whisper", "--help"]);
    if (pythonModule.ok) return { command: python, prefixArgs: ["-m", "whisper"], label: `${python} -m whisper`, ok: true, version: pythonModule.version || "OK" };
    pythonChecks.push(pythonModule.detail);
    const pythonImport = await checkCommand(python, ["-c", "import whisper; from whisper.transcribe import cli; print(getattr(whisper, '__version__', 'OK'))"]);
    if (pythonImport.ok) return { command: python, prefixArgs: ["-c", WHISPER_CLI_BRIDGE], label: `${python} openai-whisper`, ok: true, version: pythonImport.version || "OK" };
    pythonChecks.push(pythonImport.detail);
  }
  const binary = await checkCommand(resolveRuntimeExecutable(env.WHISPER_EXE || "whisper"), ["--help"]);
  return { command: resolveRuntimeExecutable(env.WHISPER_EXE || "whisper"), prefixArgs: [], label: "whisper", ok: binary.ok, version: binary.version || "OK", detail: binary.detail || pythonChecks.find(Boolean) };
}

async function checkFirstPython(env: RuntimeEnvValues) {
  let lastStatus: YoutubeToolStatus | undefined;
  for (const python of getPythonCandidates(env)) {
    const status = await checkCommand(python, ["--version"]);
    if (status.ok) return status;
    lastStatus = status;
  }
  return lastStatus || checkCommand("python", ["--version"]);
}

function getPythonCandidates(env: RuntimeEnvValues) {
  const configured = resolveRuntimeExecutable(env.YOUTUBE_TOOLS_PYTHON || "python");
  return configured === "python" ? ["python", "python3", "py"] : [configured];
}

async function checkCommand(command: string, args: string[]): Promise<YoutubeToolStatus> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 15_000, windowsHide: true, maxBuffer: 1024 * 1024 });
    const firstLine = `${stdout || stderr}`.split(/\r?\n/).find(Boolean)?.trim() || "OK";
    return { ok: true, command, version: firstLine };
  } catch (error) {
    return { ok: false, command, detail: toErrorMessage(error) };
  }
}

export function runCommand(command: string, args: string[], timeoutMs: number, hooks: YoutubeToolsRunHooks = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" } });
    const chunks: string[] = [];
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Lệnh chạy quá lâu và đã bị dừng: ${command}`));
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      const lines = text.split(/\r?\n/).filter(Boolean);
      chunks.push(...lines);
      lines.forEach((line) => hooks.onLog?.(line));
    });
    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      const lines = text.split(/\r?\n/).filter(Boolean);
      chunks.push(...lines);
      lines.forEach((line) => hooks.onLog?.(line));
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr, combined: chunks });
      else reject(new Error(tail(chunks).join("\n") || `${command} exited with code ${code}`));
    });
  });
}

async function runYtDlpCommand(command: string, args: string[], timeoutMs: number, hooks: YoutubeToolsRunHooks = {}) {
  const publicArgs = stripYtDlpBrowserCookieArgs(args);
  if (publicArgs.length === args.length) {
    try {
      return await runCommand(command, args, timeoutMs, hooks);
    } catch (error) {
      throw new Error(toYtDlpUserMessage(toErrorMessage(error)));
    }
  }

  try {
    return await runCommand(command, publicArgs, timeoutMs, hooks);
  } catch (publicError) {
    const message = toErrorMessage(publicError);
    if (!isYtDlpAuthenticationRequiredError(message)) throw new Error(toYtDlpUserMessage(message));
    hooks.onLog?.("warning: YouTube yêu cầu xác thực; thử lại bằng browser cookies.");
  }

  try {
    return await runCommand(command, args, timeoutMs, hooks);
  } catch (browserError) {
    const message = toErrorMessage(browserError);
    if (isYtDlpBrowserCookieAccessError(message)) {
      throw new Error("YouTube cần cookie nhưng browser đang khóa cookie database. Đóng hẳn Chrome/Edge rồi thử lại, hoặc ưu tiên YOUTUBE_COOKIES_FILE trong Settings > Data.");
    }
    throw new Error(toYtDlpUserMessage(message));
  }
}

function resolveGeneratedVideoPath(relativePath: string, env: RuntimeEnvValues) {
  const root = path.resolve(getGeneratedVideoDir(env.SERVER_DATA_DIR));
  const normalized = path.normalize(relativePath || "");
  if (!normalized || path.isAbsolute(normalized) || normalized.startsWith("..")) throw new Error("Đường dẫn video không hợp lệ.");
  const absolutePath = path.resolve(root, normalized);
  if (!absolutePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(absolutePath)) throw new Error("Không tìm thấy video đã tải.");
  return absolutePath;
}

function snapshotFiles(directory: string) {
  const files = new Map<string, number>();
  if (!fs.existsSync(directory)) return files;
  for (const file of fs.readdirSync(directory)) {
    const absolute = path.join(directory, file);
    if (fs.statSync(absolute).isFile()) files.set(absolute, fs.statSync(absolute).mtimeMs);
  }
  return files;
}

function findNewestChangedFile(directory: string, before: Map<string, number>, extensions: Set<string>) {
  if (!fs.existsSync(directory)) return "";
  return fs.readdirSync(directory)
    .map((file) => path.join(directory, file))
    .filter((file) => fs.statSync(file).isFile() && extensions.has(path.extname(file).toLowerCase()))
    .filter((file) => !before.has(file) || fs.statSync(file).mtimeMs > (before.get(file) || 0))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || "";
}

function collectTranscriptFiles(outputDir: string, outputRoot: string, serverOrigin: string) {
  const entries: Record<string, string> = {};
  if (!fs.existsSync(outputDir)) return entries;
  for (const file of fs.readdirSync(outputDir)) {
    const extension = path.extname(file).toLowerCase();
    if (![".txt", ".srt", ".vtt", ".json"].includes(extension)) continue;
    const relativePath = path.relative(outputRoot, path.join(outputDir, file)).replaceAll(path.sep, "/");
    entries[extension.slice(1)] = buildGeneratedFileUrl(GENERATED_VIDEO_PUBLIC_PATH, relativePath, serverOrigin);
  }
  return entries;
}

function filesToPublicUrls(files: Record<string, string>, _serverOrigin: string) {
  return { txt: files.txt, srt: files.srt, vtt: files.vtt, json: files.json };
}

function readFirstTranscriptText(outputDir: string) {
  const file = fs.readdirSync(outputDir).find((entry) => entry.endsWith(".txt"));
  return file ? fs.readFileSync(path.join(outputDir, file), "utf8") : "";
}

function normalizeMaxHeight(value?: number) {
  if (!value || Number.isNaN(value)) return 1080;
  return Math.max(144, Math.min(2160, Math.round(value)));
}

function sanitizeWhisperValue(value: string, fallback: string) {
  const cleaned = value.trim();
  return /^[\w.-]+$/.test(cleaned) ? cleaned : fallback;
}

function sanitizeWhisperLanguage(value: string) {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned || cleaned === "auto") return "auto";
  return /^[a-z-]{2,12}$/.test(cleaned) ? cleaned : "auto";
}

function ffmpegArgs(env: RuntimeEnvValues) {
  const configured = resolveRuntimeExecutable(env.FFMPEG_EXE || FFMPEG_EXE);
  if (!configured || configured === "ffmpeg") return [];
  return ["--ffmpeg-location", configured];
}

function toStatus(command: CommandSpec): YoutubeToolStatus {
  return { ok: command.ok, command: command.label, version: command.version, detail: command.detail };
}

function tail(lines: string[], count = 30) {
  return lines.slice(Math.max(0, lines.length - count));
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không chạy được lệnh nền.";
}
