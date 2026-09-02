import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { TimelineLyricCue, TimelineLyricWord } from "../models/TimelineVideo";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveWhisper, runCommand } from "./YoutubeToolsService";

type WhisperWord = { word?: string; start?: number; end?: number; probability?: number };
type WhisperSegment = { id?: number; start?: number; end?: number; text?: string; words?: WhisperWord[] };
type WhisperJson = { language?: string; text?: string; segments?: WhisperSegment[] };

export async function transcribeLyricsFromMedia(params: {
  inputPath: string;
  originalName?: string;
  model?: string;
  language?: string;
  envOverrides?: RuntimeEnvValues;
}) {
  if (!params.inputPath || !fs.existsSync(params.inputPath)) throw new Error("Không tìm thấy media để nhận lyric.");
  const env = readEnvValues(params.envOverrides);
  const whisper = await resolveWhisper(env);
  if (!whisper.ok) {
    throw new Error(`${whisper.detail || "Chưa cài Whisper."} Cài bằng: python -m pip install -U openai-whisper`);
  }

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "kai-auto-lyrics-"));
  try {
    const model = sanitizeCliValue(params.model, "base");
    const language = sanitizeLanguage(params.language);
    const args = [
      ...whisper.prefixArgs,
      params.inputPath,
      "--model", model,
      "--task", "transcribe",
      "--word_timestamps", "True",
      "--output_dir", outputDir,
      "--output_format", "json",
      "--verbose", "False",
    ];
    if (language !== "auto") args.push("--language", language);

    await runCommand(whisper.command, args, 2 * 60 * 60 * 1000);
    const jsonPath = findWhisperJson(outputDir);
    if (!jsonPath) throw new Error("Whisper không tạo file JSON timestamp.");
    const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as WhisperJson;
    const cues = buildLyricCues(raw.segments || []);
    if (!cues.length) throw new Error("Whisper không nhận được lời hát/giọng nói trong media.");

    const hasWordTiming = cues.some((cue) => (cue.words?.length || 0) > 0);
    return {
      ok: true as const,
      sourceLabel: params.originalName || path.basename(params.inputPath),
      detectedLanguage: raw.language,
      cues,
      warning: hasWordTiming ? undefined : "Whisper chỉ tạo timestamp theo câu; Karaoke từng từ sẽ dùng timing xấp xỉ.",
    };
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

function buildLyricCues(segments: WhisperSegment[]): TimelineLyricCue[] {
  return segments.slice(0, 5000).map((segment, index) => {
    const start = safeTime(segment.start, 0);
    const end = Math.max(start + 0.08, safeTime(segment.end, start + 1));
    const text = String(segment.text || "").trim().slice(0, 240);
    const words = buildWords(segment.words, text, start, end);
    return { id: `lyric-${segment.id ?? index}`, start, end, text, words };
  }).filter((cue) => Boolean(cue.text));
}

function buildWords(rawWords: WhisperWord[] | undefined, text: string, start: number, end: number): TimelineLyricWord[] {
  const words = Array.isArray(rawWords) ? rawWords.map((word) => ({
    text: String(word.word || ""),
    start: safeTime(word.start, start),
    end: safeTime(word.end, end),
  })).filter((word) => word.text) : [];
  if (words.length) return words;

  const tokens = text.match(/\S+\s*/g) || [];
  if (!tokens.length) return [];
  const duration = Math.max(0.08, end - start);
  return tokens.map((token, index) => ({
    text: index === 0 ? token : ` ${token.trimStart()}`,
    start: start + duration * (index / tokens.length),
    end: start + duration * ((index + 1) / tokens.length),
  }));
}

function findWhisperJson(outputDir: string) {
  if (!fs.existsSync(outputDir)) return "";
  return fs.readdirSync(outputDir).map((name) => path.join(outputDir, name)).find((file) => path.extname(file).toLowerCase() === ".json") || "";
}

function sanitizeCliValue(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return /^[\w.-]+$/.test(text) ? text : fallback;
}

function sanitizeLanguage(value: unknown) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "auto";
  if (!text || text === "auto") return "auto";
  return /^[a-z-]{2,12}$/.test(text) ? text : "auto";
}

function safeTime(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}
