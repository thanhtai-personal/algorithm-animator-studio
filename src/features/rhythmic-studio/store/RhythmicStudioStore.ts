import { makeAutoObservable } from "mobx";
import { BUILTIN_MELODIES, DEFAULT_SETTINGS } from "../defaults";
import { listRhythmicProjects } from "../lib/projectStorage";
import { buildRhythmicTimeline, timelineDuration } from "../lib/timeline";
import type { LyricFormat } from "../lib/lyrics";
import type { RhythmicTextKey } from "../i18n";
import type { RhythmicPresetId } from "../lib/studioPresets";
import type {
  AudioSourceMeta,
  CourseItemOverride,
  LyricCue,
  NoteEvent,
  StoredProject,
  StudioSettings,
} from "../types";

export type MessageToken = { key: RhythmicTextKey; values?: Record<string, string | number> };

const DEFAULT_SOURCE: AudioSourceMeta = {
  type: "builtin",
  name: "Neon Scale",
  durationMs: 5040,
  eventCount: BUILTIN_MELODIES["Neon Scale"].length,
};

export class RhythmicStudioStore {
  settings: StudioSettings = { ...DEFAULT_SETTINGS };
  sourceEvents: NoteEvent[] = [...BUILTIN_MELODIES["Neon Scale"]];
  source: AudioSourceMeta = DEFAULT_SOURCE;
  audioUrl: string | null = null;
  audioInfoToken: MessageToken = { key: "info.builtin" };
  statusToken: MessageToken = { key: "status.ready" };
  playing = false;
  playingClip = false;
  playbackToken = 0;
  playbackStartMs = 0;
  playbackEndMs = 0;
  timeMs = 0;
  trimStartMs = 0;
  trimEndMs = 0;
  recording = false;
  recordingFormat: "webm" | "mp4" | null = null;
  projectName = "My rhythmic run";
  projects: StoredProject[] = listRhythmicProjects();
  courseOverrides: CourseItemOverride[] = [];
  selectedNodeIndex: number | null = null;
  backgroundUrl: string | null = null;
  backgroundName: string | null = null;
  lyricRaw = "";
  lyrics: LyricCue[] = [];
  lyricFormat: LyricFormat | null = null;
  activePresetId: RhythmicPresetId | null = "toy-pegboard";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.playbackEndMs = this.durationMs;
    this.trimEndMs = this.durationMs;
  }

  get timeline() {
    return buildRhythmicTimeline(this.sourceEvents, this.settings);
  }

  get durationMs() {
    const sourceEnd = this.source.durationMs / Math.max(0.1, this.settings.playbackSpeed) + this.settings.syncOffsetMs;
    return Math.max(timelineDuration(this.timeline), sourceEnd, 1000);
  }

  patch<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) {
    this.settings = { ...this.settings, [key]: value };
    this.activePresetId = null;
  }

  applyVisualPreset(id: RhythmicPresetId, settings: Partial<StudioSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.activePresetId = id;
  }

  replaceSettings(settings: StudioSettings) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.activePresetId = null;
  }

  setSource(events: NoteEvent[], source: AudioSourceMeta, info: MessageToken, audioUrl: string | null = null) {
    this.sourceEvents = events;
    this.source = source;
    this.audioInfoToken = info;
    this.audioUrl = audioUrl;
    this.courseOverrides = [];
    this.selectedNodeIndex = null;
    this.playing = false;
    this.timeMs = 0;
    this.playbackToken += 1;
    this.resetRanges(source.durationMs || this.durationMs);
  }

  resetRanges(durationMs = this.durationMs) {
    this.playbackStartMs = 0;
    this.playbackEndMs = durationMs;
    this.trimStartMs = 0;
    this.trimEndMs = durationMs;
    this.playingClip = false;
  }

  setTrimRange(startMs: number, endMs: number) {
    const duration = this.durationMs;
    const start = Math.max(0, Math.min(startMs, Math.max(0, duration - 1000)));
    const end = Math.min(duration, Math.max(start + 1000, endMs));
    this.trimStartMs = start;
    this.trimEndMs = end;
  }


  setAudioUrl(url: string | null) { this.audioUrl = url; }

  beginPlayback(startMs: number, endMs: number, clip: boolean) {
    this.playbackStartMs = startMs;
    this.playbackEndMs = endMs;
    this.playingClip = clip;
    this.playbackToken += 1;
    this.timeMs = startMs;
    this.playing = true;
  }

  pausePlayback() { this.playing = false; }

  resetPlayback() {
    this.playing = false;
    this.playbackToken += 1;
    this.timeMs = 0;
    this.playbackStartMs = 0;
    this.playbackEndMs = this.durationMs;
    this.playingClip = false;
  }

  finishPlayback() { this.playing = false; this.playingClip = false; }

  setRecording(active: boolean, format: "webm" | "mp4" | null = null) {
    this.recording = active;
    this.recordingFormat = format;
  }

  syncDuration(durationMs: number, oldDuration: number) {
    if (this.trimEndMs <= 0 || Math.abs(this.trimEndMs - oldDuration) < 250) this.trimEndMs = durationMs;
    else this.trimEndMs = Math.min(this.trimEndMs, durationMs);
    this.trimStartMs = Math.min(this.trimStartMs, Math.max(0, durationMs - 1000));
    if (this.playbackEndMs <= 0 || Math.abs(this.playbackEndMs - oldDuration) < 250) this.playbackEndMs = durationMs;
    else this.playbackEndMs = Math.min(this.playbackEndMs, durationMs);
  }

  setStatus(token: MessageToken) { this.statusToken = token; }
  setProjects(projects: StoredProject[]) { this.projects = projects; }
  setProjectName(name: string) { this.projectName = name; }
  setTimeMs(value: number) { this.timeMs = value; }
  setPlaying(value: boolean) { this.playing = value; }
  setBackground(url: string | null, name: string | null) { this.backgroundUrl = url; this.backgroundName = name; }
  setLyrics(raw: string, cues: LyricCue[], format: LyricFormat | null) { this.lyricRaw = raw; this.lyrics = cues; this.lyricFormat = format; }
  setLyricRaw(raw: string) { this.lyricRaw = raw; }
  setSelectedNode(index: number | null) { this.selectedNodeIndex = index; }
  setOverrides(overrides: CourseItemOverride[]) { this.courseOverrides = overrides; }
}
