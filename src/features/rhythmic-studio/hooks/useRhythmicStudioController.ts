import { useEffect, useMemo, useRef } from "react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { melodyLabel, rhythmicText } from "../i18n";
import { useRhythmicStudioStore } from "../store/RhythmicStudioStoreContext";
import { useRhythmicPlayback } from "./useRhythmicPlayback";
import { useRhythmicSourceActions } from "./useRhythmicSourceActions";
import { useRhythmicMediaActions } from "./useRhythmicMediaActions";
import { useRhythmicCourseActions } from "./useRhythmicCourseActions";
import { useRhythmicProjectActions } from "./useRhythmicProjectActions";
import { useRhythmicExportActions } from "./useRhythmicExportActions";
import { useRhythmicPresetActions } from "./useRhythmicPresetActions";

export function useRhythmicStudioController() {
  const lang = useSystemLang();
  const store = useRhythmicStudioStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playback = useRhythmicPlayback(store);
  const sources = useRhythmicSourceActions(store, playback.stopPlaybackAudio);
  const media = useRhythmicMediaActions(store);
  const course = useRhythmicCourseActions(store);
  const projects = useRhythmicProjectActions(store, sources.loadBuiltin);
  const exporter = useRhythmicExportActions(store, canvasRef, playback);
  const presets = useRhythmicPresetActions(store);

  useEffect(() => {
    if (store.projectName === "My rhythmic run") store.setProjectName(rhythmicText(lang, "default.projectName"));
  }, [lang, store]);

  const previousDuration = useRef(store.durationMs);
  useEffect(() => {
    const duration = store.durationMs;
    const oldDuration = previousDuration.current;
    previousDuration.current = duration;
    store.syncDuration(duration, oldDuration);
  }, [store, store.durationMs]);

  const status = useMemo(() => {
    const token = store.statusToken;
    const values = token.key === "status.loaded" && token.values?.name
      ? { ...token.values, name: melodyLabel(lang, String(token.values.name)) }
      : token.values;
    return rhythmicText(lang, token.key, values);
  }, [lang, store.statusToken]);

  const audioFileInfo = useMemo(
    () => rhythmicText(lang, store.audioInfoToken.key, store.audioInfoToken.values),
    [lang, store.audioInfoToken],
  );

  const displayLyrics = useMemo(() => {
    if (store.lyricFormat === "plain") return store.lyrics;
    const speed = Math.max(0.1, store.settings.playbackSpeed);
    return store.lyrics.map((cue) => {
      const startMs = Math.max(0, cue.startMs / speed + store.settings.syncOffsetMs);
      const endMs = Math.max(startMs + 120, cue.endMs / speed + store.settings.syncOffsetMs);
      return { ...cue, startMs, endMs };
    });
  }, [store.lyricFormat, store.lyrics, store.settings.playbackSpeed, store.settings.syncOffsetMs]);

  return {
    store,
    settings: store.settings,
    patch: store.patch,
    sourceEvents: store.sourceEvents,
    source: store.source,
    audioUrl: store.audioUrl,
    audioFileInfo,
    playing: store.playing,
    playingClip: store.playingClip,
    playbackToken: store.playbackToken,
    playbackStartMs: store.playbackStartMs,
    playbackEndMs: store.playbackEndMs,
    timeMs: store.timeMs,
    setTimeMs: store.setTimeMs,
    trimStartMs: store.trimStartMs,
    trimEndMs: store.trimEndMs,
    setTrimRange: store.setTrimRange,
    recording: store.recording,
    recordingFormat: store.recordingFormat,
    status,
    projectName: store.projectName,
    setProjectName: store.setProjectName,
    projects: store.projects,
    canvasRef,
    audioElementRef: playback.audioElementRef,
    timeline: store.timeline,
    durationMs: store.durationMs,
    courseOverrides: store.courseOverrides,
    selectedNodeIndex: store.selectedNodeIndex,
    backgroundUrl: store.backgroundUrl,
    backgroundName: store.backgroundName,
    activePresetId: store.activePresetId,
    rendererMode: store.rendererMode,
    setRendererMode: store.setRendererMode,
    lyricRaw: store.lyricRaw,
    setLyricRaw: store.setLyricRaw,
    lyrics: displayLyrics,
    lyricFormat: store.lyricFormat,
    onNote: playback.onNote,
    onEnded: playback.onEnded,
    togglePlayback: playback.togglePlayback,
    resetPlayback: playback.resetPlayback,
    previewTrim: playback.previewTrim,
    ...sources,
    ...media,
    ...course,
    ...projects,
    ...presets,
    ...exporter,
  };
}

export type RhythmicStudioController = ReturnType<typeof useRhythmicStudioController>;
