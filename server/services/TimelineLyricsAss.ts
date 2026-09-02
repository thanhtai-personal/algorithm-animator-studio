import fs from "node:fs";
import path from "node:path";
import type { NormalizedTimelineLyrics, TimelineVideoAspectRatio } from "../models/TimelineVideo";
import type { RuntimeEnvValues } from "./EnvFileService";
import { runFfmpeg } from "../utils/ffmpeg";

const DIMENSIONS: Record<TimelineVideoAspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

export async function burnTimelineLyrics(params: {
  inputPath: string;
  outputPath: string;
  assPath: string;
  aspectRatio: TimelineVideoAspectRatio;
  lyrics: NormalizedTimelineLyrics;
  envOverrides?: RuntimeEnvValues;
}) {
  const dimensions = DIMENSIONS[params.aspectRatio];
  fs.writeFileSync(params.assPath, buildLyricsAss(params.lyrics, dimensions.width, dimensions.height), "utf8");
  try {
    await runFfmpeg([
      "-y",
      "-i", params.inputPath,
      "-vf", `ass='${escapeFilterPath(params.assPath)}'`,
      "-an",
      "-c:v", "libx264",
      "-crf", "18",
      "-preset", "medium",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      params.outputPath,
    ], params.envOverrides);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such filter.*ass|filter.*ass.*not found|libass/i.test(message)) {
      throw new Error("FFmpeg hiện tại chưa có libass/ASS filter nên không thể burn lyric. Hãy cấu hình FFMPEG_EXE tới bản FFmpeg có libass.");
    }
    throw error;
  }
}

export function buildLyricsAss(lyrics: NormalizedTimelineLyrics, width: number, height: number) {
  const alignment = lyrics.position === "top" ? 8 : lyrics.position === "center" ? 5 : 2;
  const marginV = lyrics.position === "bottom" ? Math.round(height * 0.12) : lyrics.position === "top" ? Math.round(height * 0.12) : 40;
  const textColor = toAssColor(lyrics.textColor);
  const highlightColor = toAssColor(lyrics.highlightColor);
  const outlineColor = toAssColor(lyrics.outlineColor);
  const fontSize = Math.round(lyrics.fontSize * (height / 1080));
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: TV.709",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Lyrics,Arial,${fontSize},${textColor},${textColor},${outlineColor},&H64000000,-1,0,0,0,100,100,0,0,1,4,1,${alignment},70,70,${marginV},1`,
    `Style: Karaoke,Arial,${fontSize},${highlightColor},${textColor},${outlineColor},&H64000000,-1,0,0,0,100,100,0,0,1,4,1,${alignment},70,70,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = lyrics.cues.flatMap((cue) => {
    if (cue.end <= 0) return [];
    if (lyrics.animation === "typewriter") return buildTypewriterEvents(cue.start, cue.end, cue.text);
    const eventStart = Math.max(0, cue.start);
    if (lyrics.animation === "karaoke" && cue.words.length > 0) {
      return buildKaraokeEvents(cue.words, eventStart, cue.end, lyrics.textColor, lyrics.highlightColor);
    }
    const text = `${buildAnimationTag(lyrics.animation, lyrics.position, width, height, cue.start < 0)}${escapeAssText(cue.text)}`;
    return [`Dialogue: 0,${toAssTime(eventStart)},${toAssTime(cue.end)},Lyrics,,0,0,0,,${text}`];
  });
  return [...header, ...events, ""].join("\n");
}

function buildKaraokeEvents(
  words: NormalizedTimelineLyrics["cues"][number]["words"],
  eventStart: number,
  eventEnd: number,
  textColor: string,
  highlightColor: string,
) {
  const visibleWords = words.filter((word) => word.end > eventStart - 0.001 && word.start < eventEnd);
  if (!visibleWords.length) return [];
  const breakpoints = Array.from(new Set([
    eventStart,
    ...visibleWords.map((word) => Math.max(eventStart, Math.min(eventEnd, word.start))),
    eventEnd,
  ])).sort((a, b) => a - b);

  return breakpoints.slice(0, -1).flatMap((segmentStart, index) => {
    const segmentEnd = breakpoints[index + 1];
    if (segmentEnd - segmentStart <= 0.004) return [];
    const text = visibleWords.map((word) => {
      const color = segmentStart + 0.001 >= word.start ? highlightColor : textColor;
      return `{\\1c${toAssOverrideColor(color)}}${escapeAssText(word.text)}`;
    }).join("");
    return [`Dialogue: 0,${toAssTime(segmentStart)},${toAssTime(segmentEnd)},Lyrics,,0,0,0,,${text}`];
  });
}

function buildTypewriterEvents(start: number, end: number, text: string) {
  const characters = Array.from(text);
  if (!characters.length || end <= 0) return [];
  const eventStart = Math.max(0, start);
  const duration = Math.max(0.08, end - start);
  const visibleDuration = Math.max(0.01, end - eventStart);
  const steps = Math.max(1, Math.min(36, characters.length));
  return Array.from({ length: steps }, (_, index) => {
    const segmentStart = eventStart + visibleDuration * (index / steps);
    const segmentEnd = index === steps - 1 ? end : eventStart + visibleDuration * ((index + 1) / steps);
    const progress = Math.min(1, Math.max(0, (segmentStart - start) / duration));
    const count = Math.max(1, Math.ceil(characters.length * progress));
    return `Dialogue: 0,${toAssTime(segmentStart)},${toAssTime(segmentEnd)},Lyrics,,0,0,0,,${escapeAssText(characters.slice(0, count).join(""))}`;
  });
}

function buildAnimationTag(animation: NormalizedTimelineLyrics["animation"], position: NormalizedTimelineLyrics["position"], width: number, height: number, skipEnter: boolean) {
  if (animation === "fade") return skipEnter ? "{\\fad(0,180)}" : "{\\fad(180,180)}";
  if (animation === "pop") return skipEnter ? "{\\fad(0,140)}" : "{\\fscx78\\fscy78\\t(0,180,\\fscx100\\fscy100)\\fad(80,140)}";
  if (animation === "slide-up") {
    const x = Math.round(width / 2);
    const y = position === "top" ? Math.round(height * 0.18) : position === "center" ? Math.round(height * 0.5) : Math.round(height * 0.84);
    return skipEnter ? `{\\an5\\pos(${x},${y})\\fad(0,140)}` : `{\\an5\\move(${x},${y + 70},${x},${y},0,240)\\fad(80,140)}`;
  }
  return "";
}


function toAssColor(hex: string) {
  const value = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  return `&H00${b}${g}${r}`.toUpperCase();
}

function toAssOverrideColor(hex: string) {
  const value = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  return `&H${b}${g}${r}&`.toUpperCase();
}

function toAssTime(seconds: number) {
  const value = Math.max(0, seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const wholeSeconds = Math.floor(value % 60);
  const centiseconds = Math.min(99, Math.round((value - Math.floor(value)) * 100));
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function escapeAssText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/{/g, "\\{").replace(/}/g, "\\}").replace(/\r?\n/g, "\\N");
}

function escapeFilterPath(filePath: string) {
  return path.resolve(filePath).replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/,/g, "\\,");
}
