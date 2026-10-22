import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";

const execFileAsync = promisify(execFile);
const WHISPER_CLI_BRIDGE = "import sys; from whisper.transcribe import cli; sys.argv=['whisper']+sys.argv[1:]; cli()";

export type WhisperCommand = {
  command: string;
  prefixArgs: string[];
  ok: boolean;
  detail?: string;
};

// Auto-lyrics is a local media tool, not a YouTube download dependency.
export async function resolveWhisper(env: RuntimeEnvValues = {}): Promise<WhisperCommand> {
  // Keep the old interpreter setting as a migration fallback for existing local installs.
  const configuredValue = env.WHISPER_PYTHON && env.WHISPER_PYTHON !== "python"
    ? env.WHISPER_PYTHON
    : env.YOUTUBE_TOOLS_PYTHON || env.WHISPER_PYTHON || "python";
  const configured = resolveRuntimeExecutable(configuredValue);
  const candidates = configured === "python" ? ["python", "python3", "py"] : [configured];
  const failed: string[] = [];

  for (const python of candidates) {
    const asModule = await probe(python, ["-m", "whisper", "--help"]);
    if (asModule.ok) return { command: python, prefixArgs: ["-m", "whisper"], ok: true };

    const asImport = await probe(python, ["-c", "import whisper; from whisper.transcribe import cli"]);
    if (asImport.ok) return { command: python, prefixArgs: ["-c", WHISPER_CLI_BRIDGE], ok: true };
    if (asImport.detail) failed.push(asImport.detail);
  }

  const executable = resolveRuntimeExecutable(env.WHISPER_EXE || "whisper");
  const asCli = await probe(executable, ["--help"]);
  return {
    command: executable,
    prefixArgs: [],
    ok: asCli.ok,
    detail: asCli.ok ? undefined : asCli.detail || failed[0] || "Không tìm thấy Whisper.",
  };
}

async function probe(command: string, args: string[]) {
  try {
    await execFileAsync(command, args, { timeout: 15_000, windowsHide: true, maxBuffer: 1024 * 1024 });
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, detail: error instanceof Error ? error.message : String(error) };
  }
}

export function runCommand(command: string, args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve({ stdout, stderr });
    };
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(new Error(`Whisper command timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });
    child.on("error", (error) => finish(error));
    child.on("close", (code) => {
      if (code === 0) finish();
      else finish(new Error(stderr.trim() || stdout.trim() || `Whisper exited with code ${code}`));
    });
  });
}
