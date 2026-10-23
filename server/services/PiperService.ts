import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { stripAnsi } from "../utils/text";

type RunPiperParams = {
  text: string;
  segments?: string[];
  modelPath: string;
  outputPath: string;
  sentenceSilence: number;
  speechRate?: number;
  piperExe: string;
};

export async function runPiper(params: RunPiperParams): Promise<{ stdout: string; stderr: string; segmentDurationsSec?: number[] }> {
  const segments = params.segments?.length ? params.segments : splitPiperInputSegments(params.text);

  if (segments.length <= 1 || params.sentenceSilence <= 0) {
    return runPiperSingle(params);
  }

  return runPiperWithForcedSentenceSilence(params, segments);
}

function runPiperSingle(params: RunPiperParams): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(params.piperExe, buildPiperArgs(params), {
      windowsHide: true,
      env: buildPiperProcessEnv(params.piperExe),
    });

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
      reject(new Error(`Không chạy được giọng local: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;

      const cleanStdout = stripAnsi(stdout);
      const cleanStderr = stripAnsi(stderr);

      if (code !== 0) {
        reject(buildPiperError(code, cleanStdout, cleanStderr));
        return;
      }

      resolve({ stdout: cleanStdout, stderr: cleanStderr });
    });

    child.stdin.setDefaultEncoding("utf8");
    child.stdin.write(params.text, "utf8");
    child.stdin.end();
  });
}

async function runPiperWithForcedSentenceSilence(
  params: RunPiperParams,
  segments: string[]
): Promise<{ stdout: string; stderr: string; segmentDurationsSec: number[] }> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kata-piper-segments-"));
  const tempFiles: string[] = [];
  const segmentDurationsSec: number[] = [];
  const stdoutParts: string[] = [];
  const stderrParts: string[] = [];

  try {
    for (let index = 0; index < segments.length; index += 1) {
      const segmentPath = path.join(tempDir, `${String(index).padStart(5, "0")}.wav`);
      tempFiles.push(segmentPath);

      const result = await runPiperSingle({
        ...params,
        text: segments[index],
        outputPath: segmentPath,
        sentenceSilence: 0,
      });

      const audio = readWavPcmFile(segmentPath);
      const audioSeconds = audio.data.length / audio.byteRate;
      segmentDurationsSec.push(audioSeconds + (index < segments.length - 1 ? params.sentenceSilence : 0));
      stdoutParts.push(result.stdout);
      stderrParts.push(result.stderr);
    }

    concatenateWavFilesWithSilence({
      inputPaths: tempFiles,
      outputPath: params.outputPath,
      silenceSeconds: params.sentenceSilence,
    });

    stdoutParts.push(
      `Đã chèn khoảng nghỉ thật ${params.sentenceSilence}s giữa ${segments.length} câu/dòng.`
    );

    return {
      stdout: stdoutParts.filter(Boolean).join("\n"),
      stderr: stderrParts.filter(Boolean).join("\n"),
      segmentDurationsSec,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function buildPiperProcessEnv(piperExe: string): NodeJS.ProcessEnv {
  const piperDir = path.dirname(piperExe);
  const venvDir = path.resolve(piperDir, "..");
  const sitePackageDirs = findSitePackageDirs(piperDir);
  const extraPathEntries = unique([
    piperDir,
    ...sitePackageDirs,
    ...sitePackageDirs.map((dir) => path.join(dir, "onnxruntime", "capi")),
    ...sitePackageDirs.map((dir) => path.join(dir, "piper_phonemize")),
  ].filter((entry) => entry && fs.existsSync(entry)));

  const mergedPath = [
    ...extraPathEntries,
    process.env.PATH || process.env.Path || "",
  ].filter(Boolean).join(path.delimiter);

  return {
    ...process.env,
    VIRTUAL_ENV: venvDir,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
    PYTHONLEGACYWINDOWSSTDIO: "0",
    PATH: mergedPath,
    Path: mergedPath,
  };
}

function findSitePackageDirs(piperDir: string): string[] {
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

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function splitPiperInputSegments(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+|\r?\n+/u)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function buildPiperArgs(params: {
  modelPath: string;
  outputPath: string;
  sentenceSilence: number;
  speechRate?: number;
  piperExe: string;
}): string[] {
  const speechRate = typeof params.speechRate === "number" && Number.isFinite(params.speechRate) ? params.speechRate : 0.85;
  const lengthScale = 1 / speechRate;

  return [
    "--model",
    params.modelPath,
    "--sentence_silence",
    String(params.sentenceSilence),
    "--length_scale",
    lengthScale.toFixed(4),
    "--output_file",
    params.outputPath,
  ];
}

function buildPiperError(code: number | null, stdout: string, stderr: string): Error {
  return new Error(
    JSON.stringify(
      {
        message: "Giọng local tạo âm thanh thất bại.",
        code,
        stderr,
        stdout,
      },
      null,
      2
    )
  );
}
type WavPcmData = {
  audioFormat: number;
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  data: Buffer;
};

function concatenateWavFilesWithSilence(params: {
  inputPaths: string[];
  outputPath: string;
  silenceSeconds: number;
}) {
  const wavFiles = params.inputPaths.map(readWavPcmFile);
  const first = wavFiles[0];

  if (!first) {
    throw new Error("Không có đoạn âm thanh nào để ghép khoảng nghỉ.");
  }

  for (const wav of wavFiles) {
    assertCompatibleWav(first, wav);
  }

  const silence = createSilenceBuffer({
    seconds: params.silenceSeconds,
    sampleRate: first.sampleRate,
    blockAlign: first.blockAlign,
  });
  const dataParts: Buffer[] = [];

  wavFiles.forEach((wav, index) => {
    dataParts.push(wav.data);

    if (index < wavFiles.length - 1 && silence.length > 0) {
      dataParts.push(silence);
    }
  });

  writeWavPcmFile(params.outputPath, first, Buffer.concat(dataParts));
}

function readWavPcmFile(filePath: string): WavPcmData {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`Tệp WAV không hợp lệ: ${filePath}`);
  }

  let offset = 12;
  let fmt: WavPcmData | null = null;
  let data: Buffer | null = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkSize;

    if (chunkEnd > buffer.length) {
      break;
    }

    if (chunkId === "fmt ") {
      const audioFormat = buffer.readUInt16LE(chunkStart);
      const numChannels = buffer.readUInt16LE(chunkStart + 2);
      const sampleRate = buffer.readUInt32LE(chunkStart + 4);
      const byteRate = buffer.readUInt32LE(chunkStart + 8);
      const blockAlign = buffer.readUInt16LE(chunkStart + 12);
      const bitsPerSample = buffer.readUInt16LE(chunkStart + 14);

      fmt = {
        audioFormat,
        numChannels,
        sampleRate,
        byteRate,
        blockAlign,
        bitsPerSample,
        data: Buffer.alloc(0),
      };
    }

    if (chunkId === "data") {
      data = Buffer.from(buffer.subarray(chunkStart, chunkEnd));
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!fmt || !data) {
    throw new Error(`Tệp WAV thiếu fmt/data chunk: ${filePath}`);
  }

  if (fmt.audioFormat !== 1) {
    throw new Error(`Chỉ hỗ trợ WAV PCM để chèn khoảng nghỉ. Audio format hiện tại: ${fmt.audioFormat}`);
  }

  return { ...fmt, data };
}

function assertCompatibleWav(reference: WavPcmData, candidate: WavPcmData) {
  const compatible =
    reference.audioFormat === candidate.audioFormat &&
    reference.numChannels === candidate.numChannels &&
    reference.sampleRate === candidate.sampleRate &&
    reference.blockAlign === candidate.blockAlign &&
    reference.bitsPerSample === candidate.bitsPerSample;

  if (!compatible) {
    throw new Error("Các đoạn WAV từ giọng local không cùng định dạng nên không thể ghép khoảng nghỉ.");
  }
}

function createSilenceBuffer(params: { seconds: number; sampleRate: number; blockAlign: number }): Buffer {
  const frameCount = Math.max(0, Math.round(params.seconds * params.sampleRate));
  return Buffer.alloc(frameCount * params.blockAlign);
}

function writeWavPcmFile(outputPath: string, format: WavPcmData, data: Buffer) {
  const header = Buffer.alloc(44);
  const riffSize = 36 + data.length;

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(riffSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(format.audioFormat, 20);
  header.writeUInt16LE(format.numChannels, 22);
  header.writeUInt32LE(format.sampleRate, 24);
  header.writeUInt32LE(format.byteRate, 28);
  header.writeUInt16LE(format.blockAlign, 32);
  header.writeUInt16LE(format.bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(outputPath, Buffer.concat([header, data]));
}
