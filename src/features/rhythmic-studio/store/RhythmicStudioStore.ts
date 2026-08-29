import { makeAutoObservable } from "mobx";
import { BUILTIN_MELODIES, DEFAULT_SETTINGS } from "../defaults";
import { listRhythmicProjects } from "../lib/projectStorage";
import { buildRhythmicTimeline, timelineDuration } from "../lib/timeline";
import { settingsForBallStyle } from "../lib/ballStyleProfiles";
import { normalizeRhythmicOutputPreset } from "../lib/outputSize";
import { normalizeChaseSettings, secondaryMarbleForStyle } from "../lib/chaseSettings";
import type { LyricFormat } from "../lib/lyrics";
import type { RhythmicTextKey } from "../i18n";
import {
  MIXED_INSTRUMENT_PRESET_ID,
  presetById,
  type RhythmicPresetId,
} from "../lib/studioPresets";
import {
  addInstrumentMixSegment,
  buildAutomaticInstrumentMix,
  normalizeInstrumentMixSegments,
  removeInstrumentMixSegment,
  updateInstrumentMixSegmentDuration,
  updateInstrumentMixSegmentFamily,
  type PhraseInstrumentFamily,
} from "../lib/phraseInstrumentMix";
import { normalizeBackgroundPreset } from "../types";
import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type {
  AudioSourceMeta,
  CourseItemOverride,
  LyricCue,
  NoteEvent,
  StoredProject,
  StudioSettings,
  RhythmicRendererMode,
  BallStyle,
  MarbleAvatar,
  InstrumentMixSegment,
} from "../types";

export type MessageToken = { key: RhythmicTextKey; values?: Record<string, string | number> };

const DEFAULT_SOURCE: AudioSourceMeta = {
  type: "builtin",
  name: "Neon Scale",
  durationMs: 5040,
  eventCount: BUILTIN_MELODIES["Neon Scale"].length,
};

const DEFAULT_ACTIVE_PRESET_ID: RhythmicPresetId = "toy-pegboard";

function createInitialSettings(): StudioSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...presetById(DEFAULT_ACTIVE_PRESET_ID).settings,
    secondaryMarble: { ...DEFAULT_SETTINGS.secondaryMarble },
  };
}

export class RhythmicStudioStore {
  settings: StudioSettings = createInitialSettings();
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
  activePresetId: RhythmicPresetId | null = DEFAULT_ACTIVE_PRESET_ID;
  presetMixEnabled = false;
  presetMixSeed = 1;
  instrumentMixSegments: InstrumentMixSegment[] = [];
  rendererMode: RhythmicRendererMode = "three";
  // Runtime-only copy of the exact prepared course. Audio scheduling reads this
  // so a rendered drum/gong/key receives its matching voice without waiting for
  // frame callbacks (which can be late during capture).
  preparedPlatforms: MarblePlatform[] = [];

  constructor() {
    makeAutoObservable(this, { preparedPlatforms: false }, { autoBind: true });
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
    const previousInstrumentFamily = this.settings.instrumentFamily;
    const styleSettings = key === "ballStyle"
      ? settingsForBallStyle(value as StudioSettings["ballStyle"])
      : null;
    const next = { ...this.settings, [key]: value, ...styleSettings };
    next.backgroundPreset = normalizeBackgroundPreset(next.backgroundPreset);
    this.settings = next;
    if (key === "instrumentFamily") {
      if (next.instrumentFamily === "mixed") {
        this.activePresetId = MIXED_INSTRUMENT_PRESET_ID;
        if (previousInstrumentFamily !== "mixed" || !this.instrumentMixSegments.length) {
          this.resetInstrumentMixPlan();
        }
      } else if (previousInstrumentFamily === "mixed" || this.activePresetId === MIXED_INSTRUMENT_PRESET_ID) {
        this.activePresetId = null;
        this.instrumentMixSegments = [];
        this.preparedPlatforms = [];
      }
    }
    // Keep the selected preset identity while the user fine-tunes it. Clearing the
    // id here made preset cards appear impossible to select when a controlled field
    // emitted a follow-up change after the preset was applied.
  }

  setSecondaryMarbleStyle(ballStyle: BallStyle) {
    this.settings = {
      ...this.settings,
      secondaryMarble: secondaryMarbleForStyle(ballStyle, this.settings.secondaryMarble.marbleAvatar),
    };
  }

  setSecondaryMarbleAvatar(marbleAvatar: MarbleAvatar) {
    this.settings = {
      ...this.settings,
      secondaryMarble: { ...this.settings.secondaryMarble, marbleAvatar },
    };
  }


  selectPreset(id: RhythmicPresetId, settings: Partial<StudioSettings>) {
    const next = { ...this.settings, ...settings };
    next.backgroundPreset = normalizeBackgroundPreset(next.backgroundPreset);
    this.presetMixEnabled = false;
    this.settings = next;
    this.activePresetId = id;
    this.courseOverrides = [];
    this.selectedNodeIndex = null;
    this.preparedPlatforms = [];
    if (id === MIXED_INSTRUMENT_PRESET_ID) this.resetInstrumentMixPlan();
    else this.instrumentMixSegments = [];
  }

  applyVisualPreset(id: RhythmicPresetId, settings: Partial<StudioSettings>) {
    const next = { ...this.settings, ...settings };
    next.backgroundPreset = normalizeBackgroundPreset(next.backgroundPreset);
    this.settings = next;
    this.activePresetId = id;
    if (id === MIXED_INSTRUMENT_PRESET_ID) this.resetInstrumentMixPlan();
    else this.instrumentMixSegments = [];
  }

  replaceSettings(settings: StudioSettings) {
    const next = { ...DEFAULT_SETTINGS, ...settings, ...normalizeChaseSettings(settings) };
    next.backgroundPreset = normalizeBackgroundPreset(next.backgroundPreset);
    next.outputPreset = normalizeRhythmicOutputPreset(next.outputPreset);
    this.settings = next;
    this.activePresetId = null;
    this.instrumentMixSegments = [];
  }

  setSource(events: NoteEvent[], source: AudioSourceMeta, info: MessageToken, audioUrl: string | null = null) {
    this.sourceEvents = events;
    this.source = source;
    this.audioInfoToken = info;
    this.audioUrl = audioUrl;
    this.courseOverrides = [];
    this.selectedNodeIndex = null;
    this.preparedPlatforms = [];
    this.playing = false;
    this.timeMs = 0;
    this.playbackToken += 1;
    this.resetRanges(source.durationMs || this.durationMs);
    if (this.activePresetId === MIXED_INSTRUMENT_PRESET_ID) this.resetInstrumentMixPlan();
  }

  resetInstrumentMixPlan() {
    this.instrumentMixSegments = buildAutomaticInstrumentMix(this.timeline, this.durationMs);
    this.preparedPlatforms = [];
  }

  setInstrumentMixSegments(segments: readonly InstrumentMixSegment[]) {
    this.instrumentMixSegments = normalizeInstrumentMixSegments(segments, this.timeline, this.durationMs);
    this.preparedPlatforms = [];
  }

  setInstrumentMixFamily(id: string, family: PhraseInstrumentFamily) {
    this.instrumentMixSegments = updateInstrumentMixSegmentFamily(this.instrumentMixSegments, id, family);
    this.preparedPlatforms = [];
  }

  setInstrumentMixDuration(id: string, durationSeconds: number) {
    this.instrumentMixSegments = updateInstrumentMixSegmentDuration(
      this.instrumentMixSegments,
      id,
      durationSeconds,
      this.timeline,
      this.durationMs,
    );
    this.preparedPlatforms = [];
  }

  addInstrumentMixSection() {
    this.instrumentMixSegments = addInstrumentMixSegment(
      this.instrumentMixSegments,
      this.timeline,
      this.durationMs,
    );
    this.preparedPlatforms = [];
  }

  removeInstrumentMixSection(id: string) {
    this.instrumentMixSegments = removeInstrumentMixSegment(
      this.instrumentMixSegments,
      id,
      this.timeline,
      this.durationMs,
    );
    this.preparedPlatforms = [];
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
  setRendererMode(mode: RhythmicRendererMode) { this.rendererMode = mode; }
  setActivePresetId(id: RhythmicPresetId | null) { this.activePresetId = id; }
  setPresetMixEnabled(enabled: boolean) { this.presetMixEnabled = enabled; }
  setPresetMixSeed(seed: number) { this.presetMixSeed = Math.max(1, Math.floor(seed)); }
  setSelectedNode(index: number | null) { this.selectedNodeIndex = index; }
  setOverrides(overrides: CourseItemOverride[]) { this.courseOverrides = overrides; }
  setPreparedPlatforms(platforms: MarblePlatform[]) { this.preparedPlatforms = platforms; }
}
