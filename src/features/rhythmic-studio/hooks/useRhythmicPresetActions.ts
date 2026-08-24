import { useCallback } from "react";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { presetById, type RhythmicPresetId } from "../lib/studioPresets";
import { DEFAULT_SETTINGS } from "../defaults";

export function useRhythmicPresetActions(store: RhythmicStudioStore) {
  const applyQuickPreset = useCallback((id: RhythmicPresetId) => {
    // Manual selection must take ownership immediately. Leaving Auto Mix enabled
    // would make the UI look unresponsive because the time-based resolver keeps
    // replacing the manually selected preset on the next render frame.
    const preset = presetById(id).settings;
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
    store.selectPreset(id, { ...DEFAULT_SETTINGS, ...persistentRuntime, ...preset, ...lockedBackground });
  }, [store]);

  const togglePresetMix = useCallback(() => {
    const nextEnabled = !store.presetMixEnabled;
    if (nextEnabled) store.setPresetMixSeed(1 + Math.floor(Math.random() * 1_000_000_000));
    store.setPresetMixEnabled(nextEnabled);
    store.setSelectedNode(null);
  }, [store]);

  return { applyQuickPreset, togglePresetMix };
}
