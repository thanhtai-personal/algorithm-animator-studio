import { useCallback, useEffect, useRef } from "react";
import { AudioEngine } from "../lib/audioEngine";
import type { NoteEvent, SynthPreset } from "../types";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";

function presetForInstrumentCollision(store: RhythmicStudioStore, event: NoteEvent): SynthPreset {
  const { settings } = store;
  if (!settings.instrumentNativeAudio) return settings.synthPreset;
  if (settings.instrumentFamily === "boomwhacker") return event.velocity > 0.88 ? "marimba" : "woodblock";
  if (settings.instrumentFamily === "xylophone") return "marimba";
  if (settings.instrumentFamily === "piano") return "piano";
  if (settings.instrumentFamily === "marimba") return "marimba";
  if (settings.instrumentFamily === "pluck") return "pluck";
  if (settings.instrumentFamily === "vibraphone") return "vibraphone";
  if (settings.instrumentFamily === "mixed") {
    const palette: SynthPreset[] = ["woodblock", "marimba", "piano", "kalimba", "vibraphone", "bell"];
    return palette[Math.abs(event.midi) % palette.length] ?? settings.synthPreset;
  }
  if (settings.terrainProfile === "xylophone") return settings.platformAccentStyle === "instrument-cymbal" ? "marimba" : "vibraphone";
  return settings.synthPreset;
}

export function useRhythmicPlayback(store: RhythmicStudioStore) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioEngineRef = useRef(new AudioEngine());
  const recorderRef = useRef<MediaRecorder | null>(null);

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

  const onNote = useCallback((event: NoteEvent) => {
    // MIDI playback is already sample-accurately scheduled by scheduleMidi().
    // Triggering another synth voice here doubles every note and can overload the
    // recorded mix. Keep collision-triggered SFX for built-in/audio sources only.
    if (store.source.type === "midi" && store.settings.midiPlaybackEnabled && !store.settings.instrumentNativeAudio) return;
    void audioEngineRef.current.playNote(event.midi, event.velocity, event.durationMs, presetForInstrumentCollision(store, event));
  }, [store]);

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
    seekPlayback,
    onNote,
    onEnded,
  };
}
