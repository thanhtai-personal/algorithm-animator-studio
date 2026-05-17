import fs from "node:fs";
import path from "node:path";

export function clampSentenceSilence(value: unknown): number {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0.7;
  }

  return Math.min(Math.max(numberValue, 0.5), 3);
}

export function sanitizeFileBaseName(fileName: string): string {
  const cleaned = removeAudioExtension(fileName)
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  if (!cleaned) {
    return `audio-${Date.now()}`;
  }

  return cleaned.slice(0, 120);
}

export function getLocalDateFolderName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function ensureDirectoryExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

export function getUniqueOutputFile(params: { baseName: string; outputDir: string }) {
  let index = 0;

  while (true) {
    const outputFileName = buildIndexedFileName(params.baseName, index);
    const outputPath = path.join(params.outputDir, outputFileName);

    if (!fs.existsSync(outputPath)) {
      return { outputFileName, outputPath };
    }

    index += 1;
  }
}

export function getUniqueOutputFileWithExtension(params: {
  baseName: string;
  extension: string;
  outputDir: string;
}) {
  let index = 0;

  while (true) {
    const outputFileName = buildIndexedFileName(params.baseName, index, params.extension);
    const outputPath = path.join(params.outputDir, outputFileName);

    if (!fs.existsSync(outputPath)) {
      return { outputFileName, outputPath };
    }

    index += 1;
  }
}

function removeAudioExtension(fileName: string): string {
  return fileName.replace(/\.(wav|mp3|m4a|aac|ogg|opus)$/i, "");
}

function buildIndexedFileName(baseName: string, index: number, extension = "wav"): string {
  if (index === 0) {
    return `${baseName}.${extension}`;
  }

  return `${baseName}-${String(index).padStart(3, "0")}.${extension}`;
}
