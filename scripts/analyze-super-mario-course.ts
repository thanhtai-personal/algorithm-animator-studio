import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_SETTINGS } from "../src/features/rhythmic-studio/defaults";
import type { MarblePlatform, Vec2 } from "../src/features/rhythmic-studio/engine/marblePhysicsTypes";
import { buildMarbleCourse } from "../src/features/rhythmic-studio/lib/marbleCourse";
import { parseMidi } from "../src/features/rhythmic-studio/lib/midiParser";
import { RHYTHMIC_STUDIO_PRESETS } from "../src/features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../src/features/rhythmic-studio/lib/timeline";

const requestedPresetArg = process.argv[2];
const requestedPreset = requestedPresetArg && requestedPresetArg !== "all" ? requestedPresetArg : undefined;
const MIDI_PATH = resolve(process.argv[3] || "src/assets/audios/midis/SuperMarioMakerTitleTheme.mid");
const COURSE_WIDTH = 720;
const EPSILON = 1e-5;

function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

function magnitude(vector: Vec2) {
  return Math.hypot(vector.x, vector.y);
}

function normalized(vector: Vec2): Vec2 {
  const size = magnitude(vector);
  return size > EPSILON ? { x: vector.x / size, y: vector.y / size } : { x: 0, y: 0 };
}

function incomingAt(platforms: MarblePlatform[], index: number): Vec2 | null {
  if (index <= 0) return null;
  const previous = platforms[index - 1];
  const current = platforms[index];
  const dt = Math.max(0.001, (current.event.timeMs - previous.event.timeMs) / 1000);
  if (previous.motionMode === "hold" || previous.motionMode === "roll") {
    return { x: previous.outVX, y: previous.outVY };
  }
  return { x: previous.outVX, y: previous.outVY + previous.gravity * dt };
}

function axisNormalError(platform: MarblePlatform) {
  const angle = platform.visualTiltRad ?? platform.tiltRad;
  const tangent = { x: Math.cos(angle), y: Math.sin(angle) };
  return Math.abs(dot(tangent, { x: platform.normalX, y: platform.normalY }));
}

function endpointError(platforms: MarblePlatform[], index: number) {
  const start = platforms[index];
  const end = platforms[index + 1];
  if (!end || start.motionMode === "hold") return 0;
  const dt = Math.max(0.001, (end.event.timeMs - start.event.timeMs) / 1000);
  const expected = start.motionMode === "roll"
    ? { x: start.hitX + start.outVX * dt, y: start.hitY + start.outVY * dt }
    : {
        x: start.hitX + start.outVX * dt,
        y: start.hitY + start.outVY * dt + 0.5 * start.gravity * dt * dt,
      };
  return Math.hypot(expected.x - end.hitX, expected.y - end.hitY);
}

function analyzeCourse(platforms: MarblePlatform[]) {
  let axisMismatch = 0;
  let endpointMismatch = 0;
  let hiddenImpulse = 0;
  let passiveRollReversal = 0;
  let invalidApproach = 0;
  let invalidDeparture = 0;
  let tangentialReversal = 0;
  let maxEndpointError = 0;
  const rollReversalDetails: object[] = [];
  const axisMismatchDetails: object[] = [];

  for (let index = 0; index < platforms.length; index += 1) {
    const platform = platforms[index];
    const normalError = axisNormalError(platform);
    if (!platform.visualHidden && platform.contactMode === "surface" && normalError > 0.02) {
      axisMismatch += 1;
      if (axisMismatchDetails.length < 16) axisMismatchDetails.push({
        index,
        normalError: Number(normalError.toFixed(3)),
        motionMode: platform.motionMode,
        denseRunId: platform.denseRunId,
        denseSurfaceId: platform.denseSurfaceId,
        tiltRad: Number(platform.tiltRad.toFixed(3)),
        visualTiltRad: platform.visualTiltRad === undefined ? null : Number(platform.visualTiltRad.toFixed(3)),
        normal: { x: Number(platform.normalX.toFixed(3)), y: Number(platform.normalY.toFixed(3)) },
      });
    }
    const positionError = endpointError(platforms, index);
    maxEndpointError = Math.max(maxEndpointError, positionError);
    if (positionError > 0.05) endpointMismatch += 1;

    const incoming = incomingAt(platforms, index);
    if (!incoming) continue;
    const outgoing = { x: platform.outVX, y: platform.outVY };
    const normal = normalized({ x: platform.normalX, y: platform.normalY });
    const tangent = { x: -normal.y, y: normal.x };
    const incomingNormal = dot(incoming, normal);
    const outgoingNormal = dot(outgoing, normal);
    const incomingTangent = dot(incoming, tangent);
    const outgoingTangent = dot(outgoing, tangent);

    if (platform.visualHidden && magnitude({ x: outgoing.x - incoming.x, y: outgoing.y - incoming.y }) > 2) hiddenImpulse += 1;
    if (platform.motionMode === "roll") {
      const outgoingDirection = normalized(outgoing);
      const entryProjection = dot(incoming, outgoingDirection);
      if (entryProjection < -2) {
        passiveRollReversal += 1;
        if (rollReversalDetails.length < 24) {
          rollReversalDetails.push({
            arrayIndex: index,
            eventIndex: platform.index,
            timeMs: Number(platform.event.timeMs.toFixed(1)),
            denseRunId: platform.denseRunId,
            denseSurfaceId: platform.denseSurfaceId,
            previousDenseSurfaceId: platforms[index - 1]?.denseSurfaceId,
            previousMode: platforms[index - 1]?.motionMode,
            entryProjection: Number(entryProjection.toFixed(2)),
            incoming: { x: Number(incoming.x.toFixed(2)), y: Number(incoming.y.toFixed(2)) },
            outgoing: { x: Number(outgoing.x.toFixed(2)), y: Number(outgoing.y.toFixed(2)) },
            previousHit: { x: Number(platforms[index - 1].hitX.toFixed(2)), y: Number(platforms[index - 1].hitY.toFixed(2)) },
            hit: { x: Number(platform.hitX.toFixed(2)), y: Number(platform.hitY.toFixed(2)) },
            nextHit: platforms[index + 1]
              ? { x: Number(platforms[index + 1].hitX.toFixed(2)), y: Number(platforms[index + 1].hitY.toFixed(2)) }
              : null,
          });
        }
      }
      if (Math.abs(outgoingNormal) > 1) invalidDeparture += 1;
      continue;
    }
    if (platform.motionMode === "hold") continue;
    if (incomingNormal >= -1) invalidApproach += 1;
    if (outgoingNormal <= 1) invalidDeparture += 1;
    if (incomingTangent * outgoingTangent < -4) tangentialReversal += 1;
  }

  return {
    platforms: platforms.length,
    visiblePlatforms: platforms.filter((platform) => !platform.visualHidden).length,
    denseSegments: platforms.filter((platform) => platform.motionMode === "roll").length,
    axisMismatch,
    endpointMismatch,
    maxEndpointError: Number(maxEndpointError.toFixed(4)),
    hiddenImpulse,
    passiveRollReversal,
    invalidApproach,
    invalidDeparture,
    tangentialReversal,
    axisMismatchDetails,
    rollReversalDetails,
  };
}

const midiBytes = readFileSync(MIDI_PATH);
const midiBuffer = midiBytes.buffer.slice(midiBytes.byteOffset, midiBytes.byteOffset + midiBytes.byteLength) as ArrayBuffer;
const rawEvents = parseMidi(midiBuffer);
const presets = requestedPreset
  ? RHYTHMIC_STUDIO_PRESETS.filter((preset) => preset.id === requestedPreset)
  : RHYTHMIC_STUDIO_PRESETS;
if (!presets.length) throw new Error(`Unknown preset: ${requestedPreset}`);
const results = presets.map((preset) => {
  const settings = { ...DEFAULT_SETTINGS, ...preset.settings };
  const timeline = buildRhythmicTimeline(rawEvents, settings);
  const platforms = buildMarbleCourse(timeline, settings, COURSE_WIDTH);
  return {
    preset: preset.id,
    rawEvents: rawEvents.length,
    timelineEvents: timeline.length,
    durationMs: Number(timeline.at(-1)?.timeMs.toFixed(1) ?? 0),
    ...analyzeCourse(platforms),
  };
});

process.stdout.write(`${JSON.stringify({ midi: MIDI_PATH, results }, null, 2)}\n`);
