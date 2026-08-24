import { useCallback, useEffect, useMemo, useRef } from "react";
import { AudioEngine } from "../lib/audioEngine";
import type { NoteEvent, StudioSettings, SynthPreset } from "../types";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { presetObstaclePlan } from "../engine/presetObstaclePlan";
import { buildPresetMixPlan, presetMixSettingsForIndex } from "../lib/presetMix";

function presetForInstrumentCollision(settings: StudioSettings, event: NoteEvent, index: number): SynthPreset {
  if (!settings.instrumentNativeAudio) return settings.synthPreset;
  const style = presetObstaclePlan(Math.max(0, index), settings)?.style;
  if (style === "boomwhacker-tube") return event.velocity > 0.88 ? "marimba" : "woodblock";
  if (style === "xylophone-bar" || style === "marimba-bar") return "marimba";
  if (style === "piano-key" || style === "piano-keyboard") return "piano";
  if (style === "pluck-pad") return "pluck";
  if (style === "vibraphone-bar") return "vibraphone";
  if (style === "drum-disc") return "steel-drum";
  if (style === "cowbell-block") return "metal-hit";
  if (style === "bell-cone") return "bell";
  if (style === "arcade-pad") return event.midi % 2 ? "fm" : "sparkle";
  if (settings.terrainProfile === "xylophone") return settings.platformAccentStyle === "instrument-cymbal" ? "marimba" : "vibraphone";
  return settings.synthPreset;
}

export function useRhythmicPlayback(store: RhythmicStudioStore) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioEngineRef = useRef(new AudioEngine());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const playbackTimeline = store.timeline;
  const mixPlan = useMemo(
    () => buildPresetMixPlan(playbackTimeline, store.presetMixEnabled, store.presetMixSeed),
    [playbackTimeline, store.presetMixEnabled, store.presetMixSeed],
  );

  useEffect(() => audioEngineRef.current.setVolume(store.settings.synthVolume), [store.settings.synthVolume]);
  useEffect(() => audioEngineRef.current.setMusicVolume(store.settings.musicVolume), [store.settings.musicVolume]);
  useEffect(() => audioEngineRef.current.setReverb(store.settings.synthReverb), [store.settings.synthReverb]);
  useEffect(() => audioEngineRef.current.setBrightness(store.settings.synthBrightness), [store.settings.synthBrightness]);
  useEffect(() => audioEngineRef.current.setStereoWidth(store.settings.synthStereoWidth), [store.settings.synthStereoWidth]);

  const stopPlaybackAudio = useCallback(() => {
    audioElementRef.current?.pause();
    audioEngineRef.current.stopMidi();
  }, []);

  const startOriginalAudio = useCallback(async (resumeMs = 0) => {
    const audio = audioElementRef.current;
    if (!audio || !store.audioUrl || !store.settings.playOriginalSong) return;
    audio.currentTime = Math.max(0, ((resumeMs - store.settings.syncOffsetMs) * store.settings.playbackSpeed) / 1000);
    audio.playbackRate = store.settings.playbackSpeed;
    await audioEngineRef.current.attachOriginalAudio(audio);
    await audio.play();
  }, [store]);

  const startMidiAudio = useCallback(async (resumeMs = 0) => {
    if (store.source.type !== "midi" || !store.settings.midiPlaybackEnabled) return;
    if (store.settings.instrumentNativeAudio) return;
    await audioEngineRef.current.scheduleMidi(store.sourceEvents, resumeMs, {
      playbackSpeed: store.settings.playbackSpeed,
      syncOffsetMs: store.settings.syncOffsetMs,
      mode: store.settings.midiInstrumentMode,
      preset: store.settings.synthPreset,
      brightness: store.settings.synthBrightness,
      stereoWidth: store.settings.synthStereoWidth,
    });
  }, [store]);

  const startPlaybackAudio = useCallback(async (resumeMs = 0) => {
    const tasks: Promise<unknown>[] = [startMidiAudio(resumeMs)];
    if (store.source.type === "audio" && store.settings.playOriginalSong) tasks.push(startOriginalAudio(resumeMs));
    await Promise.all(tasks);
  }, [startMidiAudio, startOriginalAudio, store.source.type, store.settings.playOriginalSong]);

  const playRange = useCallback(async (startMs: number, endMs: number, clip = false) => {
    const start = Math.max(0, Math.min(startMs, store.durationMs));
    const end = Math.max(start + 1, Math.min(endMs, store.durationMs));
    await audioEngineRef.current.ensure();
    stopPlaybackAudio();
    store.beginPlayback(start, end, clip);
    store.setStatus({ key: "status.playing" });
    try { await startPlaybackAudio(start); }
    catch { store.setStatus({ key: "status.playingBlocked" }); }
  }, [startPlaybackAudio, stopPlaybackAudio, store]);

  const resetAndPlay = useCallback(() => playRange(0, store.durationMs, false), [playRange, store.durationMs]);
  const previewTrim = useCallback(() => playRange(store.trimStartMs, store.trimEndMs, true), [playRange, store.trimEndMs, store.trimStartMs]);

  const togglePlayback = useCallback(async () => {
    if (store.playing) {
      store.pausePlayback();
      stopPlaybackAudio();
      store.setStatus({ key: "status.paused" });
      return;
    }
    await audioEngineRef.current.ensure();
    const activeEnd = store.playbackEndMs || store.durationMs;
    if (store.timeMs >= store.playbackStartMs && store.timeMs < activeEnd - 120) {
      store.beginPlayback(store.timeMs, activeEnd, store.playingClip);
      store.setStatus({ key: "status.playing" });
      await startPlaybackAudio(store.timeMs).catch(() => undefined);
      return;
    }
    await resetAndPlay();
  }, [resetAndPlay, startPlaybackAudio, stopPlaybackAudio, store]);

  const resetPlayback = useCallback(() => {
    store.resetPlayback();
    stopPlaybackAudio();
    store.setStatus({ key: "status.reset" });
  }, [stopPlaybackAudio, store]);

  const onNote = useCallback((event: NoteEvent, index = 0) => {
    // MIDI playback is already sample-accurately scheduled by scheduleMidi().
    // Triggering another synth voice here doubles every note and can overload the
    // recorded mix. Keep collision-triggered SFX for built-in/audio sources only.
    if (store.source.type === "midi" && store.settings.midiPlaybackEnabled && !store.settings.instrumentNativeAudio) return;
    const frameSettings = presetMixSettingsForIndex(store.settings, mixPlan, index);
    void audioEngineRef.current.playNote(event.midi, event.velocity, event.durationMs, presetForInstrumentCollision(frameSettings, event, index));
  }, [mixPlan, store]);

  const onEnded = useCallback(() => {
    store.finishPlayback();
    store.setStatus({ key: store.recording ? "status.finalizing" : "status.finished" });
    if (store.recording && recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopPlaybackAudio();
  }, [stopPlaybackAudio, store]);

  return {
    audioElementRef,
    audioEngineRef,
    recorderRef,
    stopPlaybackAudio,
    startPlaybackAudio,
    playRange,
    resetAndPlay,
    previewTrim,
    togglePlayback,
    resetPlayback,
    onNote,
    onEnded,
  };
}
