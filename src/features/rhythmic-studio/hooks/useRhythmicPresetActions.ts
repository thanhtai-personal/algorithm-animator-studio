import { useCallback } from "react";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { presetById, type RhythmicPresetId } from "../lib/studioPresets";

export function useRhythmicPresetActions(store: RhythmicStudioStore) {
  const applyQuickPreset = useCallback((id: RhythmicPresetId) => {
    const preset = presetById(id);
    store.applyVisualPreset(id, preset.settings);
    store.setOverrides([]);
    store.setSelectedNode(null);
    store.setBackground(null, null);
  }, [store]);

  return { applyQuickPreset };
}
