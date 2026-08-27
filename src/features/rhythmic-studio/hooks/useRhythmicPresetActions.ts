import { useCallback } from "react";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { presetById, type RhythmicPresetId } from "../lib/studioPresets";
import { DEFAULT_SETTINGS } from "../defaults";
import { referenceEventsForImportedAudio } from "../lib/referenceAudio";

export interface LoadBuiltinOptions {
  preserveAudio?: boolean;
}

export function useRhythmicPresetActions(
  store: RhythmicStudioStore,
  loadBuiltin?: (name: string, options?: LoadBuiltinOptions) => void,
  clearBackground?: () => void,
) {
  const applyQuickPreset = useCallback((id: RhythmicPresetId) => {
    // Manual selection must take ownership immediately. Leaving Auto Mix enabled
    // would make the UI look unresponsive because the time-based resolver keeps
    // replacing the manually selected preset on the next render frame.
    const selectedPreset = presetById(id);
    const preset = selectedPreset.settings;
    const lockedBackground = {
      backgroundPreset: store.settings.backgroundPreset,
      backgroundColor: store.settings.backgroundColor,
      backgroundMotion: store.settings.backgroundMotion,
      backgroundImageOpacity: store.settings.backgroundImageOpacity,
      backgroundImageBlur: store.settings.backgroundImageBlur,
      backgroundImageFit: store.settings.backgroundImageFit,
    };
    const persistentRuntime = {
      titleText: store.settings.titleText,
      playbackSpeed: store.settings.playbackSpeed,
      syncOffsetMs: store.settings.syncOffsetMs,
      playOriginalSong: store.settings.playOriginalSong,
      midiPlaybackEnabled: store.settings.midiPlaybackEnabled,
      midiInstrumentMode: store.settings.midiInstrumentMode,
      instrumentNativeAudio: store.settings.instrumentNativeAudio,
      instrumentShadowsEnabled: store.settings.instrumentShadowsEnabled,
      synthPreset: store.settings.synthPreset,
      synthVolume: store.settings.synthVolume,
      musicVolume: store.settings.musicVolume,
      synthReverb: store.settings.synthReverb,
      synthBrightness: store.settings.synthBrightness,
      synthStereoWidth: store.settings.synthStereoWidth,
      lyricsEnabled: store.settings.lyricsEnabled,
      lyricStyle: store.settings.lyricStyle,
      lyricPosition: store.settings.lyricPosition,
      lyricFontSize: store.settings.lyricFontSize,
      lyricColor: store.settings.lyricColor,
      lyricAccentColor: store.settings.lyricAccentColor,
      lyricShadow: store.settings.lyricShadow,
      lyricShowNext: store.settings.lyricShowNext,
    };
    if (selectedPreset.builtinMelody) {
      const preserveAudio = store.source.type === "audio"
        && referenceEventsForImportedAudio({
          activePresetId: id,
          fileName: store.source.name,
          durationMs: store.source.durationMs,
        }) !== null;
      if (preserveAudio) loadBuiltin?.(selectedPreset.builtinMelody, { preserveAudio: true });
      else loadBuiltin?.(selectedPreset.builtinMelody);
      if (clearBackground) clearBackground();
      else store.setBackground(null, null);
    }
    const backgroundPolicy = selectedPreset.builtinMelody ? {} : lockedBackground;
    store.selectPreset(id, { ...DEFAULT_SETTINGS, ...persistentRuntime, ...preset, ...backgroundPolicy });
  }, [clearBackground, loadBuiltin, store]);

  const togglePresetMix = useCallback(() => {
    const nextEnabled = !store.presetMixEnabled;
    if (nextEnabled) store.setPresetMixSeed(1 + Math.floor(Math.random() * 1_000_000_000));
    store.setPresetMixEnabled(nextEnabled);
    store.setSelectedNode(null);
  }, [store]);

  return { applyQuickPreset, togglePresetMix };
}
