import { useCallback } from "react";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { presetById, type RhythmicPresetId } from "../lib/studioPresets";

export function useRhythmicPresetActions(store: RhythmicStudioStore) {
  const applyQuickPreset = useCallback((id: RhythmicPresetId) => {
    // Manual selection must take ownership immediately. Leaving Auto Mix enabled
    // would make the UI look unresponsive because the time-based resolver keeps
    // replacing the manually selected preset on the next render frame.
    if (store.presetMixEnabled) store.setPresetMixEnabled(false);
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
