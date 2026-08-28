import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { MarblePlatform, Vec2 } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { REFERENCE_VIDEO_PRESET_IDS } from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";

function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

function incomingAt(platforms: MarblePlatform[], index: number): Vec2 {
  const previous = platforms[index - 1];
  const current = platforms[index];
  const dt = Math.max(0.001, (current.event.timeMs - previous.event.timeMs) / 1000);
  return previous.motionMode === "ballistic" || previous.motionMode === undefined
    ? { x: previous.outVX, y: previous.outVY + previous.gravity * dt }
    : { x: previous.outVX, y: previous.outVY };
}

const PHYSICS_PRESET_IDS = REFERENCE_VIDEO_PRESET_IDS;

describe.each(PHYSICS_PRESET_IDS)("Super Mario Maker physics · %s", (presetId) => {
  let platforms: MarblePlatform[] = [];

  beforeAll(() => {
    const bytes = readFileSync(resolve("src/assets/audios/midis/SuperMarioMakerTitleTheme.mid"));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const settings = { ...DEFAULT_SETTINGS, ...presetById(presetId).settings };
    const timeline = buildRhythmicTimeline(parseMidi(buffer), settings);
    platforms = buildMarbleCourse(timeline, settings, 720);
  }, 30_000);

  it("aligns each visible surface instrument with its physical collision normal", () => {
    for (const platform of platforms) {
      if (platform.visualHidden || platform.contactMode !== "surface") continue;
      const angle = platform.visualTiltRad ?? platform.tiltRad;
      const tangent = { x: Math.cos(angle), y: Math.sin(angle) };
      const normal = { x: platform.normalX, y: platform.normalY };
      expect(Math.abs(dot(tangent, normal)), `${presetId} platform ${platform.index}`).toBeLessThan(0.02);
    }
  });

  it("never reverses a passive rolling lane against its incoming motion", () => {
    for (let index = 1; index < platforms.length; index += 1) {
      const platform = platforms[index];
      if (platform.motionMode !== "roll") continue;
      const incoming = incomingAt(platforms, index);
      const outgoing = { x: platform.outVX, y: platform.outVY };
      const speed = Math.hypot(outgoing.x, outgoing.y);
      const outgoingDirection = { x: outgoing.x / speed, y: outgoing.y / speed };
      expect(dot(incoming, outgoingDirection), `${presetId} platform ${platform.index}`).toBeGreaterThanOrEqual(-2);
    }
  });
});
