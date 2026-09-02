import type { VideoEditorLyricCue, VideoEditorLyrics } from "./videoEditorTypes";

export const DEFAULT_VIDEO_EDITOR_LYRICS: VideoEditorLyrics = {
  enabled: false,
  sourceAssetId: "",
  language: "auto",
  model: "base",
  animation: "karaoke",
  position: "bottom",
  fontSize: 54,
  textColor: "#ffffff",
  highlightColor: "#22d3ee",
  outlineColor: "#020617",
  cues: [],
};

export function normalizeEditorLyrics(value?: Partial<VideoEditorLyrics> | null): VideoEditorLyrics {
  const raw = value || {};
  return {
    ...DEFAULT_VIDEO_EDITOR_LYRICS,
    ...raw,
    enabled: raw.enabled === true,
    sourceAssetId: typeof raw.sourceAssetId === "string" ? raw.sourceAssetId : "",
    language: typeof raw.language === "string" && raw.language.trim() ? raw.language.trim() : "auto",
    model: typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : "base",
    animation: isLyricAnimation(raw.animation) ? raw.animation : "karaoke",
    position: raw.position === "top" || raw.position === "center" ? raw.position : "bottom",
    fontSize: clampNumber(raw.fontSize, 24, 120, 54),
    textColor: normalizeColor(raw.textColor, "#ffffff"),
    highlightColor: normalizeColor(raw.highlightColor, "#22d3ee"),
    outlineColor: normalizeColor(raw.outlineColor, "#020617"),
    cues: normalizeLyricCues(raw.cues),
  };
}

export function getActiveLyricCue(cues: VideoEditorLyricCue[], timeSeconds: number) {
  return cues.find((cue) => timeSeconds >= cue.start && timeSeconds < cue.end) || null;
}

export function normalizeLyricCues(value: unknown): VideoEditorLyricCue[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 5000)
    .map((cue, index) => {
      const raw = cue && typeof cue === "object" ? cue as Partial<VideoEditorLyricCue> : {};
      const start = clampNumber(raw.start, 0, 8 * 60 * 60, 0);
      const end = Math.max(start + 0.05, clampNumber(raw.end, 0, 8 * 60 * 60, start + 1));
      const text = typeof raw.text === "string" ? raw.text.trim().slice(0, 240) : "";
      const words = Array.isArray(raw.words) ? raw.words.slice(0, 80).map((word) => ({
        text: typeof word?.text === "string" ? word.text.slice(0, 80) : "",
        start: clampNumber(word?.start, start, end, start),
        end: clampNumber(word?.end, start, end, end),
      })).filter((word) => word.text) : [];
      return { id: typeof raw.id === "string" && raw.id ? raw.id.slice(0, 80) : `lyric-${index}`, start, end, text, words };
    })
    .filter((cue) => cue.text && cue.end > cue.start)
    .sort((a, b) => a.start - b.start);
}

function isLyricAnimation(value: unknown): value is VideoEditorLyrics["animation"] {
  return value === "karaoke" || value === "fade" || value === "pop" || value === "slide-up" || value === "typewriter";
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
