import { useCallback, useEffect, useRef } from "react";
import { AudioEngine } from "../lib/audioEngine";
import type { InstrumentHitEvent, SynthPreset } from "../types";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { instrumentVoiceForPlatform } from "../lib/instrumentHitProfiles";
import { rhythmicAudioPresentationDelayMs } from "../lib/playbackSync";
import { presetForMidiEvent } from "../lib/synthVoices";
import { instrumentHitForPlatform } from "../lib/instrumentHitEvent";

function presetForInstrumentCollision(store: RhythmicStudioStore, hit: InstrumentHitEvent): SynthPreset {
  const { settings } = store;
  if (!settings.instrumentNativeAudio) return settings.synthPreset;
  const midiFallback = settings.midiInstrumentMode === "auto" ? presetForMidiEvent(hit.event) : settings.synthPreset;
  return instrumentVoiceForPlatform(hit.platformStyle, hit.event, midiFallback);
}

export function useRhythmicPlayback(store: RhythmicStudioStore) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioEngineRef = useRef(new AudioEngine());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioStartGenerationRef = useRef(0);

  const presentationDelayMs = useCallback(() => rhythmicAudioPresentationDelayMs({
    rendererMode: store.rendererMode,
    recording: store.recording,
    exportFps: store.settings.exportFps,
  }), [store]);

  useEffect(() => audioEngineRef.current.setVolume(store.settings.synthVolume), [store.settings.synthVolume]);
  useEffect(() => audioEngineRef.current.setMusicVolume(store.settings.musicVolume), [store.settings.musicVolume]);
  useEffect(() => audioEngineRef.current.setReverb(store.settings.synthReverb), [store.settings.synthReverb]);
  useEffect(() => audioEngineRef.current.setBrightness(store.settings.synthBrightness), [store.settings.synthBrightness]);
  useEffect(() => audioEngineRef.current.setStereoWidth(store.settings.synthStereoWidth), [store.settings.synthStereoWidth]);

  const stopOriginalAudio = useCallback(() => {
    audioStartGenerationRef.current += 1;
    audioElementRef.current?.pause();
  }, []);

  const stopPlaybackAudio = useCallback(() => {
    stopOriginalAudio();
    audioEngineRef.current.stopMidi();
  }, [stopOriginalAudio]);

  const startOriginalAudio = useCallback(async (resumeMs = 0) => {
    const audio = audioElementRef.current;
    if (!audio || !store.audioUrl || !store.settings.playOriginalSong) return;
    const generation = audioStartGenerationRef.current;
    await audioEngineRef.current.attachOriginalAudio(audio);
    await new Promise((resolve) => window.setTimeout(resolve, presentationDelayMs()));
    if (generation !== audioStartGenerationRef.current) return;
    audio.currentTime = Math.max(0, ((resumeMs - store.settings.syncOffsetMs) * store.settings.playbackSpeed) / 1000);
    audio.playbackRate = store.settings.playbackSpeed;
    await audio.play();
  }, [presentationDelayMs, store]);

  const startMidiAudio = useCallback(async (resumeMs = 0) => {
    if (store.source.type !== "midi" || !store.settings.midiPlaybackEnabled) return;
    await audioEngineRef.current.scheduleMidi(store.sourceEvents, resumeMs, {
      playbackSpeed: store.settings.playbackSpeed,
      syncOffsetMs: store.settings.syncOffsetMs,
      mode: store.settings.midiInstrumentMode,
      preset: store.settings.synthPreset,
      brightness: store.settings.synthBrightness,
      stereoWidth: store.settings.synthStereoWidth,
      presentationDelayMs: presentationDelayMs(),
      presetForEvent: store.settings.instrumentNativeAudio
        ? (event, index) => {
            if (!store.preparedPlatforms[index]) {
              return store.settings.midiInstrumentMode === "auto"
                ? presetForMidiEvent(event)
                : store.settings.synthPreset;
            }
            const hit = instrumentHitForPlatform(
              index,
              store.preparedPlatforms,
              store.settings,
              store.courseOverrides,
            );
            return presetForInstrumentCollision(store, hit);
          }
        : undefined,
    });
  }, [presentationDelayMs, store]);

  const startPlaybackAudio = useCallback(async (resumeMs = 0) => {
    const tasks: Promise<unknown>[] = [startMidiAudio(resumeMs)];
    if (store.source.type === "audio" && store.settings.playOriginalSong) tasks.push(startOriginalAudio(resumeMs));
    await Promise.all(tasks);
  }, [startMidiAudio, startOriginalAudio, store.source.type, store.settings.playOriginalSong]);

  const preparePlaybackAudio = useCallback(async () => {
    const voices = [];
    const presets = new Set<SynthPreset>();
    const timeline = store.timeline;
    for (let index = 0; index < timeline.length; index += 1) {
      const event = timeline[index];
      const platform = store.preparedPlatforms[index];
      const preset = platform
        ? presetForInstrumentCollision(store, instrumentHitForPlatform(
            index,
            store.preparedPlatforms,
            store.settings,
            store.courseOverrides,
          ))
        : (store.settings.midiInstrumentMode === "auto" ? presetForMidiEvent(event) : store.settings.synthPreset);
      if (presets.has(preset)) continue;
      presets.add(preset);
      voices.push({ midi: event.midi, velocity: event.velocity, durationMs: event.durationMs, preset });
    }
    await audioEngineRef.current.prepareVoices(voices);
  }, [store]);

  const setOriginalAudioEnabled = useCallback(async (enabled: boolean) => {
    store.patch("playOriginalSong", enabled);
    if (!enabled) {
      stopOriginalAudio();
      return;
    }
    if (!store.playing || store.source.type !== "audio") return;
    try { await startOriginalAudio(store.timeMs); }
    catch { store.setStatus({ key: "status.playingBlocked" }); }
  }, [startOriginalAudio, stopOriginalAudio, store]);

  const setMidiAudioEnabled = useCallback(async (enabled: boolean) => {
    store.patch("midiPlaybackEnabled", enabled);
    if (!enabled) {
      audioEngineRef.current.stopMidi();
      return;
    }
    if (!store.playing || store.source.type !== "midi") return;
    try { await startMidiAudio(store.timeMs); }
    catch { store.setStatus({ key: "status.playingBlocked" }); }
  }, [startMidiAudio, store]);

  const setSourceAudioEnabled = useCallback((enabled: boolean) => (
    store.source.type === "midi"
      ? setMidiAudioEnabled(enabled)
      : setOriginalAudioEnabled(enabled)
  ), [setMidiAudioEnabled, setOriginalAudioEnabled, store.source.type]);

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

  const seekPlayback = useCallback(async (requestedMs: number) => {
    const nextMs = Math.max(0, Math.min(requestedMs, store.durationMs));
    const wasPlaying = store.playing;
    const activeEnd = store.playbackEndMs || store.durationMs;
    const playingClip = store.playingClip;
    stopPlaybackAudio();
    if (!wasPlaying || nextMs >= activeEnd - 1) {
      store.setTimeMs(nextMs);
      if (nextMs >= activeEnd - 1) store.setPlaying(false);
      return;
    }
    await playRange(nextMs, activeEnd, playingClip);
  }, [playRange, stopPlaybackAudio, store]);

  const onNote = useCallback((hit: InstrumentHitEvent) => {
    // MIDI playback is already sample-accurately scheduled by scheduleMidi().
    // Triggering another synth voice here doubles every note and can overload the
    // recorded mix. Keep collision-triggered SFX for built-in/audio sources only.
    if (store.source.type === "midi" && store.settings.midiPlaybackEnabled) return;
    const { event } = hit;
    void audioEngineRef.current.playNote(
      event.midi,
      event.velocity,
      event.durationMs,
      presetForInstrumentCollision(store, hit),
      presentationDelayMs(),
    );
  }, [presentationDelayMs, store]);

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
    setOriginalAudioEnabled,
    setMidiAudioEnabled,
    setSourceAudioEnabled,
    startPlaybackAudio,
    preparePlaybackAudio,
    playRange,
    resetAndPlay,
    previewTrim,
    togglePlayback,
    resetPlayback,
    seekPlayback,
    onNote,
    onEnded,
  };
}
