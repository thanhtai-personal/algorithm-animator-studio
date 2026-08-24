import { useCallback } from "react";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { type RhythmicPresetId } from "../lib/studioPresets";
import { mixedPresetSettings } from "../lib/presetMix";

export function useRhythmicPresetActions(store: RhythmicStudioStore) {
  const applyQuickPreset = useCallback((id: RhythmicPresetId) => {
    // Presets now change the run, not the backdrop. Keeping the current background
    // avoids a hard scene cut and makes manual preset changes match Auto Mix.
    const nextSettings = mixedPresetSettings(store.settings, id);
    store.applyVisualPreset(id, nextSettings);
    store.setOverrides([]);
    store.setSelectedNode(null);
  }, [store]);

  const togglePresetMix = useCallback(() => {
    store.setPresetMixEnabled(!store.presetMixEnabled);
    store.setSelectedNode(null);
  }, [store]);

  return { applyQuickPreset, togglePresetMix };
}
