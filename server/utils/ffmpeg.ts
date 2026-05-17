import { spawn } from "node:child_process";
import type { Buffer } from "node:buffer";
import { FFMPEG_EXE, FFPROBE_EXE } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "../services/EnvFileService";
import { resolveRuntimeExecutable } from "../services/RuntimeEnvService";
import { stripAnsi } from "./text";

export function runFfmpeg(
  args: string[],
  envOverrides: RuntimeEnvValues = {}
): Promise<{ stdout: string; stderr: string }> {
  const env = readEnvValues(envOverrides);
  return runProcess(
    resolveRuntimeExecutable(env.FFMPEG_EXE || process.env.FFMPEG_EXE || FFMPEG_EXE),
    args,
    "Không chạy được FFmpeg"
  );
}

export async function getAudioDurationSeconds(
  audioPath: string,
  envOverrides: RuntimeEnvValues = {}
): Promise<number> {
  const env = readEnvValues(envOverrides);
  const result = await runProcess(
    resolveRuntimeExecutable(env.FFPROBE_EXE || process.env.FFPROBE_EXE || FFPROBE_EXE),
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      audioPath,
    ],
    "Không chạy được FFprobe"
  );
  const duration = Number.parseFloat(result.stdout.trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Không đọc được thời lượng audio bằng FFprobe.");
  }

  return duration;
}

function runProcess(
  command: string,
  args: string[],
  errorPrefix: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });

    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString("utf8");
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(new Error(`${errorPrefix}: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;

      const cleanStdout = stripAnsi(stdout);
      const cleanStderr = stripAnsi(stderr);

      if (code !== 0) {
        reject(
          new Error(
            JSON.stringify(
              {
                message: `${errorPrefix}.`,
                code,
                stderr: cleanStderr,
                stdout: cleanStdout,
              },
              null,
              2
            )
          )
        );
        return;
      }

      resolve({ stdout: cleanStdout, stderr: cleanStderr });
    });
  });
}
