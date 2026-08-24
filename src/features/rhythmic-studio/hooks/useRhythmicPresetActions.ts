import { useCallback } from "react";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { presetById, type RhythmicPresetId } from "../lib/studioPresets";

export function useRhythmicPresetActions(store: RhythmicStudioStore) {
  const applyQuickPreset = useCallback((id: RhythmicPresetId) => {
    // A manual preset choice is allowed to establish its designed marble identity.
    // The backdrop stays locked. Once Auto Mix is running, the marble/VFX are then
    // treated as user-owned and remain unchanged across subsequent preset segments.
    const preset = presetById(id).settings;
    const lockedBackground = {
      backgroundPreset: store.settings.backgroundPreset,
      backgroundColor: store.settings.backgroundColor,
      backgroundMotion: store.settings.backgroundMotion,
      backgroundImageOpacity: store.settings.backgroundImageOpacity,
      backgroundImageBlur: store.settings.backgroundImageBlur,
      backgroundImageFit: store.settings.backgroundImageFit,
    };
    store.applyVisualPreset(id, { ...store.settings, ...preset, ...lockedBackground });
    store.setOverrides([]);
    store.setSelectedNode(null);
  }, [store]);

  const togglePresetMix = useCallback(() => {
    const nextEnabled = !store.presetMixEnabled;
    if (nextEnabled) store.setPresetMixSeed(1 + Math.floor(Math.random() * 1_000_000_000));
    store.setPresetMixEnabled(nextEnabled);
    store.setSelectedNode(null);
  }, [store]);

  return { applyQuickPreset, togglePresetMix };
}
