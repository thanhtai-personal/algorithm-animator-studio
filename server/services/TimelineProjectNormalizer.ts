import type {
  NormalizedTimelineLyricCue,
  NormalizedTimelineLyricWord,
  NormalizedTimelineVideoClip,
  NormalizedTimelineVideoProject,
  TimelineLyricAnimation,
  TimelineLyricCue,
  TimelineVideoRenderEngine,
  TimelineVideoRenderProject,
  TimelineVideoTransition,
} from "../models/TimelineVideo";

export function normalizeTimelineProject(raw: TimelineVideoRenderProject, forcedEngine?: TimelineVideoRenderEngine): NormalizedTimelineVideoProject {
  const clips = Array.isArray(raw.clips) ? raw.clips : [];
  const normalizedClips = clips
    .map((clip, index) => ({
      id: sanitizeText(clip.id, `clip-${index}`, 80),
      assetId: sanitizeText(clip.assetId, "", 120),
      type: clip.type === "audio" || clip.type === "video" ? clip.type : "image",
      durationSeconds: clampNumber(clip.durationSeconds, 1, 7200, 4),
      fitMode: clip.fitMode === "contain" ? "contain" : "cover",
      transition: normalizeTransition(clip.transition),
      transitionSeconds: clampNumber(clip.transitionSeconds, 0.2, 8, 1.5),
      keepOriginalAudio: clip.keepOriginalAudio === true,
      volume: clampNumber(clip.volume, 0, 2, 1),
    }))
    .filter((clip): clip is NormalizedTimelineVideoClip => Boolean(clip.assetId));

  return {
    title: sanitizeText(raw.title, forcedEngine === "remotion" ? "remotion-timeline-video" : "timeline-video", 96),
    aspectRatio: raw.aspectRatio === "9:16" ? "9:16" : "16:9",
    fps: clampNumber(raw.fps, 24, 60, 30),
    renderEngine: forcedEngine || (raw.renderEngine === "remotion" ? "remotion" : "ffmpeg"),
    clips: normalizedClips,
    showWatermark: raw.showWatermark !== false,
    watermarkText: sanitizeText(raw.watermarkText, "KAI STUDIO", 40),
    watermarkLogoAssetId: sanitizeText(raw.watermarkLogoAssetId, "", 120),
    lyrics: normalizeTimelineLyrics(raw.lyrics),
  };
}

function normalizeTimelineLyrics(raw: TimelineVideoRenderProject["lyrics"]): NormalizedTimelineVideoProject["lyrics"] {
  const cues = Array.isArray(raw?.cues) ? raw.cues.slice(0, 5000).map(normalizeCue).filter(Boolean) as NormalizedTimelineLyricCue[] : [];
  cues.sort((a, b) => a.start - b.start);
  return {
    enabled: raw?.enabled === true && cues.length > 0,
    sourceAssetId: sanitizeText(raw?.sourceAssetId, "", 120),
    language: sanitizeText(raw?.language, "auto", 16),
    model: sanitizeText(raw?.model, "base", 24),
    animation: normalizeLyricAnimation(raw?.animation),
    position: raw?.position === "top" || raw?.position === "center" ? raw.position : "bottom",
    fontSize: clampNumber(raw?.fontSize, 24, 120, 54),
    textColor: normalizeColor(raw?.textColor, "#ffffff"),
    highlightColor: normalizeColor(raw?.highlightColor, "#22d3ee"),
    outlineColor: normalizeColor(raw?.outlineColor, "#020617"),
    cues,
  };
}

function normalizeCue(cue: TimelineLyricCue, index: number): NormalizedTimelineLyricCue | null {
  const start = clampNumber(cue?.start, 0, 8 * 60 * 60, 0);
  const end = Math.max(start + 0.05, clampNumber(cue?.end, 0, 8 * 60 * 60, start + 1));
  const text = sanitizeText(cue?.text, "", 240);
  if (!text) return null;
  const words = Array.isArray(cue?.words)
    ? cue.words.slice(0, 80).map((word) => normalizeWord(word, start, end)).filter(Boolean) as NormalizedTimelineLyricWord[]
    : [];
  return { id: sanitizeText(cue?.id, `lyric-${index}`, 80), start, end, text, words };
}

function normalizeWord(word: { text?: string; start?: number; end?: number }, cueStart: number, cueEnd: number): NormalizedTimelineLyricWord | null {
  const text = typeof word?.text === "string" ? word.text.slice(0, 80) : "";
  if (!text) return null;
  const start = clampNumber(word.start, cueStart, cueEnd, cueStart);
  const end = Math.max(start, clampNumber(word.end, cueStart, cueEnd, cueEnd));
  return { text, start, end };
}

function normalizeTransition(value: unknown): TimelineVideoTransition {
  if (
    value === "blurry" || value === "fade" || value === "zoom-in" || value === "zoom-out" ||
    value === "slide-left" || value === "slide-right" || value === "slide-up" || value === "slide-down" ||
    value === "push-left" || value === "push-right" || value === "none"
  ) return value;
  return "blurry";
}

function normalizeLyricAnimation(value: unknown): TimelineLyricAnimation {
  if (value === "fade" || value === "pop" || value === "slide-up" || value === "typewriter") return value;
  return "karaoke";
}

function sanitizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
