import type { PresetVideoDefinition, PresetVideoExportSettings, PresetVideoOutputPreset } from "../types";
import { PRESET_VIDEO_OUTPUT_SIZES } from "../outputPresets";

const STORAGE_PREFIX = "kai-studio.preset-video.";

export function createDefaultPresetVideoSettings(preset: PresetVideoDefinition): PresetVideoExportSettings {
  return {
    outputPreset: preset.defaultOutputPreset,
    trimStartSeconds: 0,
    trimEndSeconds: preset.defaultDurationSeconds,
    backgroundMusicId: "",
    backgroundMusicVolume: 0.22,
    originalAudioVolume: 1,
  };
}

export function loadPresetVideoSettings(preset: PresetVideoDefinition): PresetVideoExportSettings {
  const defaults = createDefaultPresetVideoSettings(preset);
  if (typeof window === "undefined") return defaults;

  try {
    const raw = JSON.parse(window.localStorage.getItem(storageKey(preset.id)) || "null") as Partial<PresetVideoExportSettings> | null;
    if (!raw) return defaults;

    const outputPreset = isOutputPreset(raw.outputPreset) ? raw.outputPreset : defaults.outputPreset;
    const trimStartSeconds = clampNumber(raw.trimStartSeconds, 0, preset.defaultDurationSeconds, defaults.trimStartSeconds);
    const trimEndSeconds = clampNumber(raw.trimEndSeconds, trimStartSeconds + 0.1, preset.defaultDurationSeconds, defaults.trimEndSeconds);

    return {
      outputPreset,
      trimStartSeconds,
      trimEndSeconds,
      backgroundMusicId: typeof raw.backgroundMusicId === "string" ? raw.backgroundMusicId : "",
      backgroundMusicVolume: clampNumber(raw.backgroundMusicVolume, 0, 1, defaults.backgroundMusicVolume),
      originalAudioVolume: clampNumber(raw.originalAudioVolume, 0, 1, defaults.originalAudioVolume),
    };
  } catch {
    return defaults;
  }
}

export function savePresetVideoSettings(presetId: string, settings: PresetVideoExportSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(presetId), JSON.stringify(settings));
}

export function clearPresetVideoSettings(presetId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(presetId));
}

function storageKey(presetId: string) {
  return `${STORAGE_PREFIX}${presetId}`;
}

function isOutputPreset(value: unknown): value is PresetVideoOutputPreset {
  return PRESET_VIDEO_OUTPUT_SIZES.some((item) => item.id === value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
