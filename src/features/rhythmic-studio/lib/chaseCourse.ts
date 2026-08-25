import type { NoteEvent, StudioSettings } from "../types";
import {
  assignChaseStrikeOwnership,
  type ChaseOwner,
  type ChaseStrikeOwnershipPlan,
} from "../engine/chaseStrikeOwnership";
import {
  chaseLaneFor,
  physicalSettingsForChaseLane,
  placePlatformsInChaseLane,
  settingsForChaseOwner,
  type ChaseLane,
} from "../engine/chaseCoursePlanner";
import { planRhythmicPhrases, type RhythmicPhrase } from "../engine/rhythmicPhraseLayout";
import type { MarblePlatform, MarblePoint } from "../engine/marblePhysicsTypes";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import { buildMarbleCourse, marbleAtTime } from "./marbleCourse";

export interface ChaseTrack {
  owner: ChaseOwner;
  eventIndices: number[];
  events: NoteEvent[];
  platforms: MarblePlatform[];
  lane: ChaseLane;
}

export interface ChaseCoursePlan {
  events: NoteEvent[];
  ownership: ChaseStrikeOwnershipPlan;
  phrases: RhythmicPhrase[];
  tracks: Record<ChaseOwner, ChaseTrack>;
  platforms: MarblePlatform[];
}

function buildTrack(
  owner: ChaseOwner,
  events: NoteEvent[],
  ownership: ChaseStrikeOwnershipPlan,
  settings: StudioSettings,
  width: number,
  resolveSettings?: StudioSettingsResolver,
  onProgress?: (progress: number) => void,
): ChaseTrack {
  const eventIndices = events.flatMap((_event, index) => ownership.ownerByEventIndex[index] === owner ? [index] : []);
  const trackEvents = eventIndices.map((index) => events[index]);
  const lane = chaseLaneFor(owner, width);
  const physicalSettings = physicalSettingsForChaseLane(settings, owner, lane);
  const resolveTrackSettings = resolveSettings
    ? (localIndex: number) => physicalSettingsForChaseLane(
      resolveSettings(eventIndices[localIndex] ?? 0),
      owner,
      lane,
    )
    : undefined;
  const localPlatforms = buildMarbleCourse(
    trackEvents,
    physicalSettings,
    lane.width,
    resolveTrackSettings,
    onProgress,
  );
  return {
    owner,
    eventIndices,
    events: trackEvents,
    platforms: placePlatformsInChaseLane(localPlatforms, lane),
    lane,
  };
}

function mergedPlatform(
  platform: MarblePlatform,
  localIndex: number,
  track: ChaseTrack,
  ownership: ChaseStrikeOwnershipPlan,
): MarblePlatform {
  const eventIndex = track.eventIndices[localIndex];
  const strike = ownership.strikes[ownership.strikeIndexByEventIndex[eventIndex]];
  const ownerOffset = track.owner === "A" ? 0 : 1;
  return {
    ...platform,
    index: eventIndex,
    chordClusterId: strike.endIndex > strike.startIndex ? strike.index : undefined,
    denseRunId: platform.denseRunId === undefined ? undefined : platform.denseRunId * 2 + ownerOffset,
    denseSurfaceId: platform.denseSurfaceId === undefined ? undefined : platform.denseSurfaceId * 2 + ownerOffset,
  };
}

export function buildChaseCourse(
  events: NoteEvent[],
  settings: StudioSettings,
  width: number,
  resolveSettings?: StudioSettingsResolver,
  onProgress?: (progress: number) => void,
): ChaseCoursePlan {
  const ownership = assignChaseStrikeOwnership(events, "chase");
  const tracks = {
    A: buildTrack("A", events, ownership, settings, width, resolveSettings, (progress) => onProgress?.(progress * 0.48)),
    B: buildTrack("B", events, ownership, settings, width, resolveSettings, (progress) => onProgress?.(0.5 + progress * 0.48)),
  };
  const platforms = new Array<MarblePlatform>(events.length);
  for (const track of [tracks.A, tracks.B]) {
    track.platforms.forEach((platform, localIndex) => {
      const merged = mergedPlatform(platform, localIndex, track, ownership);
      platforms[merged.index] = merged;
    });
  }
  onProgress?.(1);
  return { events, ownership, phrases: planRhythmicPhrases(events), tracks, platforms };
}

export function chaseMarbleAtTime(
  owner: ChaseOwner,
  timeMs: number,
  plan: ChaseCoursePlan,
  settings: StudioSettings,
  resolveSettings?: StudioSettingsResolver,
): MarblePoint {
  const track = plan.tracks[owner];
  if (!track.events.length) {
    return { x: track.lane.centerX, y: 180, color: settings.prismStart, platformIndex: 0 };
  }
  const point = chaseTrackMarbleAtTime(owner, timeMs, plan, settings, resolveSettings);
  const localIndex = Math.min(track.eventIndices.length - 1, Math.max(0, point.platformIndex));
  return { ...point, platformIndex: track.eventIndices[localIndex] };
}

export function chaseTrackMarbleAtTime(
  owner: ChaseOwner,
  timeMs: number,
  plan: ChaseCoursePlan,
  settings: StudioSettings,
  resolveSettings?: StudioSettingsResolver,
): MarblePoint {
  const track = plan.tracks[owner];
  if (!track.events.length) {
    return { x: track.lane.centerX, y: 180, color: settings.prismStart, platformIndex: 0 };
  }
  const ownerSettings = settingsForChaseOwner(settings, owner);
  const resolveTrackSettings = resolveSettings
    ? (localIndex: number) => settingsForChaseOwner(resolveSettings(track.eventIndices[localIndex] ?? 0), owner)
    : undefined;
  return marbleAtTime(timeMs, track.events, track.platforms, ownerSettings, [], resolveTrackSettings);
}
