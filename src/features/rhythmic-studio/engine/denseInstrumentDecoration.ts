import type { NoteEvent, PlatformStyle, StudioSettings } from "../types";
import { midiInstrumentVisualStyle } from "../lib/midiInstrumentVisuals";
import { presetObstaclePlan } from "./presetObstaclePlan";
import type { DenseInstrumentKind, DenseInstrumentRun, DenseSettingsResolver, ChordCluster } from "./denseInstrumentTypes";
import { CHORD_GAP_MS } from "./denseInstrumentTypes";
import type { DenseSurfaceLayout, MarblePlatform, Vec2 } from "./marblePhysicsTypes";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  let normal = { x: tangent.y, y: -tangent.x };
  // A bar axis is visually undirected, but its playing-face normal is not. The
  // old x-positive canonicalization flipped the normal whenever the marble
  // travelled left, placing the key on the marble side of the collision point.
  if (normal.x * from.normalX + normal.y * from.normalY < 0) {
    tangent = { x: -tangent.x, y: -tangent.y };
    normal = { x: -normal.x, y: -normal.y };
  }
  return { tangent, normal, angle: Math.atan2(tangent.y, tangent.x) };
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

function denseLayoutForGap(kind: DenseInstrumentKind, gapMs: number, settings: StudioSettings): DenseSurfaceLayout {
  if (kind === "pad-strip") return "button-strip";
  const rollingSpeed = clamp(145 + settings.laneSpread * 0.1, 150, 195);
  const connectedKeyGapMs = clamp((settings.ballSize * 1.05 / rollingSpeed) * 1000, 70, 130);
  return gapMs <= connectedKeyGapMs ? "connected-keys" : "parallel-rails";
}

function denseVisualStyle(kind: DenseInstrumentKind, layout: DenseSurfaceLayout, settings: StudioSettings, event: NoteEvent, index: number): PlatformStyle {
  // A selected showcase instrument owns the whole phrase, including fast runs.
  // Connected-key geometry must not silently turn xylophone/gong/etc. into piano.
  if (settings.instrumentFamily === "mixed") return presetObstaclePlan(index, settings)?.style ?? "instrument-rail";
  if (settings.instrumentFamily === "boomwhacker") return "boomwhacker-tube";
  if (settings.instrumentFamily === "xylophone") return "xylophone-bar";
  if (settings.instrumentFamily === "piano") return "piano-key";
  if (settings.instrumentFamily === "marimba") return "marimba-bar";
  if (settings.instrumentFamily === "pluck") return "pluck-pad";
  if (settings.instrumentFamily === "vibraphone") return "vibraphone-bar";
  if (settings.instrumentFamily === "metallophone") return "metallophone-plate";
  if (settings.instrumentFamily === "gong") return "gong-disc";
  if (settings.instrumentFamily === "flute") return "flute-pipe";
  if (settings.instrumentFamily === "trumpet") return "trumpet-horn";
  if (settings.instrumentFamily === "drum") return "drum-disc";
  if (settings.instrumentFamily === "guitar") return "guitar-body";
  if (settings.instrumentFamily === "bronze-drum") return "bronze-drum";
  if (layout === "connected-keys") return "piano-key";
  if (kind === "pad-strip") return "instrument-pad";
  const midiStyle = midiInstrumentVisualStyle(event, settings);
  if (midiStyle) return midiStyle;
  return kind === "keyboard" ? "piano-key" : "instrument-pad";
}

function decorateRollingSegment(platform: MarblePlatform, next: MarblePlatform, kind: DenseInstrumentKind, settings: StudioSettings) {
  const frame = canonicalSurfaceFrame(platform, next);
  const distance = Math.hypot(next.hitX - platform.hitX, next.hitY - platform.hitY);
  const gapMs = Math.max(1, next.event.timeMs - platform.event.timeMs);
  const layout = denseLayoutForGap(kind, gapMs, settings);
  const faceCenter = { x: (platform.hitX + next.hitX) * 0.5, y: (platform.hitY + next.hitY) * 0.5 };
  platform.denseLayout = layout;
  platform.visualStyle = denseVisualStyle(kind, layout, settings, platform.event, platform.index);
  platform.visualThickness = denseSurfaceThickness(kind, settings);
  platform.visualX = faceCenter.x - frame.normal.x * settings.ballSize;
  platform.visualY = faceCenter.y - frame.normal.y * settings.ballSize;
  platform.visualWidth = layout === "connected-keys"
    ? Math.max(4.5, distance + Math.max(0.8, settings.ballSize * 0.06))
    : Math.max(settings.ballSize * 1.05, distance + Math.max(1.6, settings.ballSize * 0.18));
  platform.visualTiltRad = frame.angle;
  platform.visualHidden = false;
}

function decorateTerminalStrike(platform: MarblePlatform, previous: MarblePlatform | undefined, frame: ReturnType<typeof terminalSurfaceFrame>, kind: DenseInstrumentKind, settings: StudioSettings) {
  if (!frame) return;
  const gapMs = previous ? Math.max(1, platform.event.timeMs - previous.event.timeMs) : Number.POSITIVE_INFINITY;
  const layout = denseLayoutForGap(kind, gapMs, settings);
  platform.denseLayout = layout;
  platform.visualStyle = denseVisualStyle(kind, layout, settings, platform.event, platform.index);
  platform.visualThickness = denseSurfaceThickness(kind, settings);
  const previousWidth = previous?.visualWidth ?? 0;
  platform.visualWidth = layout === "connected-keys"
    ? Math.max(4.5, previousWidth)
    : Math.max(settings.ballSize * 1.05, 13);
  const travelTangent = normalize({ x: platform.outVX, y: platform.outVY });
  const edgeOffset = Math.max(0, platform.visualWidth * 0.5 - settings.ballSize * 0.12);
  // The terminal hit is the forward edge of the last key. Launching from its
  // center made the gravity-enabled exit trajectory cut through half a key,
  // which looked like a short pause before the next note.
  platform.visualX = platform.hitX - frame.normal.x * settings.ballSize - travelTangent.x * edgeOffset;
  platform.visualY = platform.hitY - frame.normal.y * settings.ballSize - travelTangent.y * edgeOffset;
  platform.visualTiltRad = frame.angle;
  platform.visualHidden = false;
}

function decoratePhysicalTerminalStrike(platform: MarblePlatform, kind: DenseInstrumentKind, settings: StudioSettings) {
  // This terminal note redirects the marble instead of merely extending the
  // preceding lane. Keep the planner's collision-derived center and angle so the
  // visible face explains the impulse, while retaining a readable key body.
  const layout = denseLayoutForGap(kind, Number.POSITIVE_INFINITY, settings);
  platform.denseLayout = layout;
  platform.visualStyle = denseVisualStyle(kind, layout, settings, platform.event, platform.index);
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
    const positions = platformPositionsForSurface(decorated, surface);
    const strikes = strikePositionsForSurface(decorated, positions);
    for (const position of positions) decorated[position].denseSurfaceId = surface.surfaceId;
    for (let offset = 0; offset < strikes.length; offset += 1) {
      const index = strikes[offset];
      const localSettings = resolveSettings?.(index) ?? settings;
      const next = offset < strikes.length - 1 ? decorated[strikes[offset + 1]] : undefined;
      const previous = offset > 0 ? decorated[strikes[offset - 1]] : undefined;
      const passiveExit = Boolean(previous
        && Math.hypot(platforms[index].outVX - previous.outVX, platforms[index].outVY - previous.outVY) < 1e-6);
      if (next && decorated[index].motionMode === "roll") decorateRollingSegment(decorated[index], next, surface.kind, localSettings);
      else if (decorated[index].motionMode === "roll" || passiveExit) {
        decorateTerminalStrike(decorated[index], previous, terminalSurfaceFrame(decorated, strikes, offset), surface.kind, localSettings);
      } else decoratePhysicalTerminalStrike(decorated[index], surface.kind, localSettings);
    }
  }
  return decorated;
}

export function decorateChordClusters(
  platforms: MarblePlatform[],
  clusters: ChordCluster[],
  settings?: StudioSettings,
  resolveSettings?: DenseSettingsResolver,
) {
  if (!platforms.length || !clusters.length) return platforms;
  const decorated = platforms.map((platform) => ({ ...platform }));
  for (const cluster of clusters) {
    const first = decorated[cluster.start];
    if (!first) continue;
    const localSettings = resolveSettings?.(cluster.start) ?? settings;
    first.visualStyle = localSettings && localSettings.instrumentFamily !== "auto"
      ? presetObstaclePlan(cluster.start, localSettings)?.style ?? "instrument-pad"
      : "instrument-pad";
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
