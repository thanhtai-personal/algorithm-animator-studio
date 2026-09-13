import type { PresetVideoDefinition, PresetVideoLanguage } from "../types";

export function resolvePresetVideoDefinition(preset: PresetVideoDefinition, language: PresetVideoLanguage): PresetVideoDefinition {
  const localized = preset.localizations?.[language];
  if (!localized) return preset;
  return { ...preset, ...localized };
}
