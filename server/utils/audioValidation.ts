import fs from "node:fs";
import { getAudioDurationSeconds } from "./ffmpeg";
import type { RuntimeEnvValues } from "../services/EnvFileService";

const MIN_AUDIO_BYTES = 44;

export async function getValidatedAudioDurationSeconds(audioPath: string, envOverrides: RuntimeEnvValues = {}) {
  const stats = fs.statSync(audioPath);
  if (stats.size <= MIN_AUDIO_BYTES) {
    throw new Error(`File audio tạo ra rỗng hoặc quá nhỏ (${stats.size} bytes).`);
  }

  try {
    return await getAudioDurationSeconds(audioPath, envOverrides);
  } catch (error) {
    const wavDuration = readWavDurationSeconds(audioPath);
    if (wavDuration > 0) return wavDuration;
    throw error;
  }
}

function readWavDurationSeconds(audioPath: string) {
  const buffer = fs.readFileSync(audioPath);
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") return 0;

  let byteRate = 0;
  let dataSize = 0;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt " && offset + 16 <= buffer.length) byteRate = buffer.readUInt32LE(offset + 16);
    if (chunkId === "data") dataSize = chunkSize;
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return byteRate > 0 && dataSize > 0 ? dataSize / byteRate : 0;
}
