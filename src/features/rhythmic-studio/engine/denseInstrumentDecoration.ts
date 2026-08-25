import type { NoteEvent, PlatformStyle, StudioSettings } from "../types";
import { midiInstrumentVisualStyle } from "../lib/midiInstrumentVisuals";
import type { DenseInstrumentKind, DenseInstrumentRun, DenseSettingsResolver, ChordCluster } from "./denseInstrumentTypes";
import { CHORD_GAP_MS } from "./denseInstrumentTypes";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";

const normalize = (vector: Vec2): Vec2 => {
  const size = Math.hypot(vector.x, vector.y);
  return size > 1e-6 ? { x: vector.x / size, y: vector.y / size } : { x: 1, y: 0 };
};

function platformPositionsForSurface(platforms: MarblePlatform[], surface: DenseInstrumentRun) {
  const positions: number[] = [];
  for (let position = 0; position < platforms.length; position += 1) {
    const eventIndex = platforms[position]?.index;
    if (eventIndex !== undefined && eventIndex >= surface.start && eventIndex <= surface.end) positions.push(position);
  }
  return positions;
}

function strikePositionsForSurface(platforms: MarblePlatform[], positions: number[]) {
  const result: number[] = [];
  let strikeAnchorMs = Number.NEGATIVE_INFINITY;
  for (const position of positions) {
    const eventTimeMs = platforms[position]?.event.timeMs;
    if (eventTimeMs === undefined) continue;
    if (!result.length || eventTimeMs - strikeAnchorMs > CHORD_GAP_MS) {
      result.push(position);
      strikeAnchorMs = eventTimeMs;
    }
  }
  return result;
}

function canonicalSurfaceFrame(from: MarblePlatform, to: MarblePlatform) {
  let tangent = normalize({ x: to.hitX - from.hitX, y: to.hitY - from.hitY });
  if (tangent.x < 0) tangent = { x: -tangent.x, y: -tangent.y };
  return { tangent, normal: { x: tangent.y, y: -tangent.x }, angle: Math.atan2(tangent.y, tangent.x) };
}

function terminalSurfaceFrame(platforms: MarblePlatform[], strikeIndices: number[], offset: number) {
  const current = platforms[strikeIndices[offset]];
  const previous = offset > 0 ? platforms[strikeIndices[offset - 1]] : undefined;
  if (!current) return null;
  return previous ? canonicalSurfaceFrame(previous, current) : { tangent: { x: 1, y: 0 }, normal: { x: 0, y: -1 }, angle: 0 };
}

function denseSurfaceThickness(kind: DenseInstrumentKind, settings: StudioSettings) {
  return Math.max(5.5, settings.ballSize * (kind === "keyboard" ? 0.38 : 0.44));
}

function denseVisualStyle(kind: DenseInstrumentKind, settings: StudioSettings, event: NoteEvent): PlatformStyle {
  if (settings.instrumentFamily === "boomwhacker") return "boomwhacker-tube";
  if (settings.instrumentFamily === "xylophone") return "xylophone-bar";
  if (settings.instrumentFamily === "piano") return "piano-key";
  if (settings.instrumentFamily === "marimba") return "marimba-bar";
  if (settings.instrumentFamily === "pluck") return "pluck-pad";
  if (settings.instrumentFamily === "vibraphone") return "vibraphone-bar";
  if (settings.instrumentFamily === "metallophone") return "metallophone-plate";
  if (kind === "pad-strip") return "instrument-pad";
  const midiStyle = midiInstrumentVisualStyle(event, settings);
  if (midiStyle) return midiStyle;
  return kind === "keyboard" ? "piano-key" : "instrument-pad";
}

function decorateRollingSegment(platform: MarblePlatform, next: MarblePlatform, kind: DenseInstrumentKind, settings: StudioSettings) {
  const frame = canonicalSurfaceFrame(platform, next);
  const distance = Math.hypot(next.hitX - platform.hitX, next.hitY - platform.hitY);
  const faceCenter = { x: (platform.hitX + next.hitX) * 0.5, y: (platform.hitY + next.hitY) * 0.5 };
  platform.visualStyle = denseVisualStyle(kind, settings, platform.event);
  platform.visualThickness = denseSurfaceThickness(kind, settings);
  platform.visualX = faceCenter.x - frame.normal.x * settings.ballSize;
  platform.visualY = faceCenter.y - frame.normal.y * settings.ballSize;
  platform.visualWidth = Math.max(settings.ballSize * 1.05, distance + Math.max(1.6, settings.ballSize * 0.18));
  platform.visualTiltRad = frame.angle;
  platform.visualHidden = false;
}

function decorateTerminalStrike(platform: MarblePlatform, frame: ReturnType<typeof terminalSurfaceFrame>, kind: DenseInstrumentKind, settings: StudioSettings) {
  if (!frame) return;
  platform.visualStyle = denseVisualStyle(kind, settings, platform.event);
  platform.visualThickness = denseSurfaceThickness(kind, settings);
  platform.visualX = platform.hitX - frame.normal.x * settings.ballSize;
  platform.visualY = platform.hitY - frame.normal.y * settings.ballSize;
  platform.visualWidth = Math.max(settings.ballSize * 1.05, 13);
  platform.visualTiltRad = frame.angle;
  platform.visualHidden = false;
}

function decoratePhysicalTerminalStrike(platform: MarblePlatform, kind: DenseInstrumentKind, settings: StudioSettings) {
  // This terminal note redirects the marble instead of merely extending the
  // preceding lane. Keep the planner's collision-derived center and angle so the
  // visible face explains the impulse, while retaining a readable key body.
  platform.visualStyle = denseVisualStyle(kind, settings, platform.event);
  platform.visualThickness = denseSurfaceThickness(kind, settings);
  platform.visualWidth = Math.max(platform.visualWidth ?? 0, settings.ballSize * 1.05, 13);
  platform.visualHidden = false;
}

export function decorateDenseInstrumentRuns(platforms: MarblePlatform[], runs: DenseInstrumentRun[], settings: StudioSettings, resolveSettings?: DenseSettingsResolver) {
  if (!platforms.length || !runs.length) return platforms;
  const decorated = platforms.map((platform) => ({ ...platform }));
  const surfaces = new Map<number, DenseInstrumentRun>();
  for (const run of runs) {
    const current = surfaces.get(run.surfaceId);
    if (!current) surfaces.set(run.surfaceId, { ...run });
    else {
      current.start = Math.min(current.start, run.start);
      current.end = Math.max(current.end, run.end);
    }
  }
  for (const surface of surfaces.values()) {
    const surfaceSettings = resolveSettings?.(surface.start) ?? settings;
    if (surfaceSettings.instrumentLayout === "corridor") continue;
    const positions = platformPositionsForSurface(decorated, surface);
    const strikes = strikePositionsForSurface(decorated, positions);
    for (const position of positions) decorated[position].denseSurfaceId = surface.surfaceId;
    for (let offset = 0; offset < strikes.length; offset += 1) {
      const index = strikes[offset];
      const localSettings = resolveSettings?.(index) ?? settings;
      const next = offset < strikes.length - 1 ? decorated[strikes[offset + 1]] : undefined;
      if (next) decorateRollingSegment(decorated[index], next, surface.kind, localSettings);
      else if (decorated[index].motionMode === "roll") {
        decorateTerminalStrike(decorated[index], terminalSurfaceFrame(decorated, strikes, offset), surface.kind, localSettings);
      } else decoratePhysicalTerminalStrike(decorated[index], surface.kind, localSettings);
    }
  }
  return decorated;
}

export function decorateChordClusters(platforms: MarblePlatform[], clusters: ChordCluster[]) {
  if (!platforms.length || !clusters.length) return platforms;
  const decorated = platforms.map((platform) => ({ ...platform }));
  for (const cluster of clusters) {
    const first = decorated[cluster.start];
    if (!first) continue;
    first.visualStyle = "instrument-pad";
    first.visualThickness = Math.max(5.8, first.thickness * 0.24);
    first.visualWidth = first.denseRunId !== undefined
      ? Math.max(first.visualWidth ?? 0, Math.min(first.width * 0.27, 30))
      : first.visualWidth ?? Math.max(first.width * 0.82, 78);
    for (let index = cluster.start + 1; index <= cluster.end && index < decorated.length; index += 1) {
      decorated[index].visualHidden = true;
    }
  }
  return decorated;
}
