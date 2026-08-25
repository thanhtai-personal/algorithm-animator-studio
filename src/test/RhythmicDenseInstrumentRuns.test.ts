import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse, marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import type { NoteEvent } from "../features/rhythmic-studio/types";
import {
  CHORD_GAP_MS,
  chordClusters,
  rollingRouteCandidate,
  type DenseInstrumentRun,
} from "../features/rhythmic-studio/engine/denseInstrumentRuns";
import { courseWorldBounds } from "../features/rhythmic-studio/engine/marbleCourseConstraints";
import { marblePhysicsProfile } from "../features/rhythmic-studio/engine/marblePhysicsProfiles";

function note(index: number, timeMs: number, isDrum = false): NoteEvent {
  return {
    id: `dense-${index}`,
    timeMs,
    midi: 60 + (index % 12),
    velocity: 0.82,
    durationMs: 90,
    isDrum,
  };
}

const settings = {
  ...DEFAULT_SETTINGS,
  instrumentFamily: "auto" as const,
  terrainProfile: "balanced" as const,
  ballSize: 14,
  laneSpread: 300,
  platformWidth: 100,
};

describe("rhythmic dense instrument routing", () => {
  it("turns a new rolling surface away from the wall instead of rotating in place", () => {
    const events = Array.from({ length: 5 }, (_, index) => note(index, index * 90));
    const run: DenseInstrumentRun = { id: 0, surfaceId: 0, start: 0, end: 4, kind: "keyboard" };
    const bounds = courseWorldBounds(settings, 720);
    const margin = Math.max(settings.ballSize * 1.25, settings.platformThickness * 0.72, 14);
    const hit = { x: bounds.max - margin, y: 180 };

    const route = rollingRouteCandidate(
      hit,
      { x: 190, y: 20 },
      events,
      0,
      run,
      1,
      settings,
      720,
      true,
    );

    expect(route.target.x).toBeLessThan(hit.x - 2);
    expect(Math.abs(route.outgoing.x)).toBeGreaterThan(20);
    expect(route.motionMode).toBe("ballistic");
  });

  it("gives every rolling lane a visibly downhill surface", () => {
    const events = Array.from({ length: 5 }, (_, index) => note(index, index * 100));
    const run: DenseInstrumentRun = { id: 0, surfaceId: 0, start: 0, end: 4, kind: "keyboard" };
    const route = rollingRouteCandidate(
      { x: 360, y: 180 },
      { x: 180, y: 18 },
      events,
      0,
      run,
      1,
      settings,
      720,
      true,
    );
    const dx = Math.abs(route.target.x - 360);
    const dy = route.target.y - 180;

    expect(dx).toBeGreaterThan(2);
    expect(dy / dx).toBeGreaterThanOrEqual(0.12);
  });

  it("turns a long dense phrase before its rolling steps collapse near a wall", () => {
    const gaps = [222.222, 222.222, 111.111, 111.111];
    let timeMs = 0;
    const events = Array.from({ length: 72 }, (_, index) => {
      const event = note(index, timeMs);
      timeMs += gaps[index % gaps.length];
      return event;
    });
    events.push(note(events.length, timeMs + 620));

    const platforms = buildMarbleCourse(events, settings, 720);
    const minimumHorizontalStep = Math.max(2.2, settings.ballSize * 0.16);
    for (let index = 0; index < platforms.length - 1; index += 1) {
      if (platforms[index].motionMode !== "roll") continue;
      const dx = Math.abs(platforms[index + 1].hitX - platforms[index].hitX);
      expect(dx, `rolling segment ${index}`).toBeGreaterThanOrEqual(minimumHorizontalStep - 1e-6);
    }
  });

  it("moves 240 ms fast passages onto a parallel rail surface instead of distant bounces", () => {
    const events = Array.from({ length: 7 }, (_, index) => note(index, index * 240));
    events.push(note(7, 2_400));

    const platforms = buildMarbleCourse(events, settings, 720);
    const fast = platforms.slice(0, 7);

    expect(fast.slice(0, -1).every((platform) => platform.motionMode === "roll")).toBe(true);
    expect(fast.every((platform) => platform.denseLayout === "parallel-rails")).toBe(true);
  });

  it("reduces strike spacing with the MIDI gap and switches ultra-fast melody to connected keys", () => {
    const events = [
      note(0, 0),
      note(1, 240),
      note(2, 400),
      note(3, 480),
      note(4, 560),
      note(5, 1_100),
    ];

    const platforms = buildMarbleCourse(events, settings, 720);
    const distance = (index: number) => Math.hypot(
      platforms[index + 1].hitX - platforms[index].hitX,
      platforms[index + 1].hitY - platforms[index].hitY,
    );

    expect(distance(0)).toBeGreaterThan(distance(1));
    expect(distance(1)).toBeGreaterThan(distance(2));
    expect(platforms[0].denseLayout).toBe("parallel-rails");
    expect(platforms[2].denseLayout).toBe("connected-keys");
    expect(platforms[3].denseLayout).toBe("connected-keys");
    expect(platforms.slice(2, 4).every((platform) => platform.visualStyle === "piano-key")).toBe(true);
  });

  it("keeps ultra-fast percussion as persistent light buttons instead of piano keys", () => {
    const events = Array.from({ length: 6 }, (_, index) => note(index, index * 72, true));
    events.push(note(6, 900, true));

    const platforms = buildMarbleCourse(events, settings, 720);
    expect(platforms.slice(0, 6).every((platform) => platform.denseLayout === "button-strip")).toBe(true);
    expect(platforms.slice(0, 6).every((platform) => platform.visualStyle === "instrument-pad")).toBe(true);
  });

  it("turns auto-mode dense notes into a continuous keyboard and rolls off without a velocity snap", () => {
    const events = Array.from({ length: 8 }, (_, index) => note(index, index * 125));
    events.push(note(8, 8 * 125 + 520));

    const platforms = buildMarbleCourse(events, settings, 720);
    const dense = platforms.slice(0, 8);

    expect(dense.every((platform) => platform.denseRunId !== undefined)).toBe(true);
    expect(dense.every((platform) => platform.visualStyle === "piano-key")).toBe(true);
    expect(dense.every((platform) => platform.visualHidden !== true)).toBe(true);
    expect(dense.slice(0, -1).every((platform) => platform.motionMode === "roll")).toBe(true);

    const beforeExit = dense[dense.length - 2];
    const exit = dense[dense.length - 1];
    expect(exit.outVX).toBeCloseTo(beforeExit.outVX, 8);
    expect(exit.outVY).toBeCloseTo(beforeExit.outVY, 8);
    const exitSpeed = Math.hypot(exit.outVX, exit.outVY);
    const exitTangent = { x: exit.outVX / exitSpeed, y: exit.outVY / exitSpeed };
    const exitFaceCenter = {
      x: (exit.visualX ?? exit.x) + exit.normalX * settings.ballSize,
      y: (exit.visualY ?? exit.y) + exit.normalY * settings.ballSize,
    };
    const exitEdgeProjection = (exit.hitX - exitFaceCenter.x) * exitTangent.x
      + (exit.hitY - exitFaceCenter.y) * exitTangent.y;
    expect(exitEdgeProjection).toBeGreaterThan((exit.visualWidth ?? exit.width) * 0.35);

    for (let index = 1; index < events.length; index += 1) {
      const before = marbleAtTime(events[index].timeMs - 0.01, events, platforms, settings);
      const exact = marbleAtTime(events[index].timeMs, events, platforms, settings);
      expect(Math.hypot(before.x - exact.x, before.y - exact.y)).toBeLessThan(0.02);
    }
  });

  it("uses a contiguous pad strip for dense percussion instead of melodic keys", () => {
    const events = Array.from({ length: 6 }, (_, index) => note(index, index * 130, true));
    events.push(note(6, 1400, true));

    const platforms = buildMarbleCourse(events, settings, 720);
    expect(platforms.slice(0, 6).every((platform) => platform.visualStyle === "instrument-pad")).toBe(true);
  });

  it("keeps the selected instrument family visible through dense runs", () => {
    const events = Array.from({ length: 8 }, (_, index) => note(index, index * 125, true));
    events.push(note(8, 1600, true));
    const platforms = buildMarbleCourse(events, { ...settings, instrumentFamily: "boomwhacker" }, 720);
    const dense = platforms.slice(0, 8).filter((platform) => !platform.visualHidden);

    expect(dense.length).toBeGreaterThan(3);
    expect(dense.every((platform) => platform.visualStyle === "boomwhacker-tube")).toBe(true);
  });
  it("keeps planner modules on one physical dense surface", () => {
    const events = Array.from({ length: 30 }, (_, index) => note(index, index * 125));
    events.push(note(30, 30 * 125 + 620));

    const platforms = buildMarbleCourse(events, settings, 720);
    const dense = platforms.slice(0, 30);
    const runIds = new Set(dense.flatMap((platform) => platform.denseRunId === undefined ? [] : [platform.denseRunId]));
    const surfaceIds = new Set(dense.flatMap((platform) => platform.denseSurfaceId === undefined ? [] : [platform.denseSurfaceId]));

    expect(runIds.size).toBeGreaterThan(1);
    expect(surfaceIds.size).toBe(1);
    expect(dense.filter((platform) => !platform.visualHidden).every((platform) => (platform.visualWidth ?? 0) >= settings.ballSize)).toBe(true);
  });

  it("treats a two-hit micro-burst as one short playable surface instead of a teleporting bounce", () => {
    const events = [
      note(0, 0),
      note(1, 33.333),
      note(2, 420),
    ];

    const platforms = buildMarbleCourse(events, settings, 720);
    expect(platforms[0].denseRunId).toBeDefined();
    expect(platforms[1].denseRunId).toBeDefined();
    expect(platforms[0].motionMode).toBe("roll");

    const before = marbleAtTime(events[1].timeMs - 0.01, events, platforms, settings);
    const exact = marbleAtTime(events[1].timeMs, events, platforms, settings);
    expect(Math.hypot(before.x - exact.x, before.y - exact.y)).toBeLessThan(0.02);
  });

  it("does not chain 16.7 ms arpeggio hits into one long chord hold", () => {
    const events = [
      note(0, 0),
      note(1, 16.667),
      note(2, 33.333),
      note(3, 50),
      note(4, 420),
    ];

    const clusters = chordClusters(events);
    expect(clusters.every((cluster) => events[cluster.end].timeMs - events[cluster.start].timeMs <= CHORD_GAP_MS)).toBe(true);

    const platforms = buildMarbleCourse(events, settings, 720);
    const holdSpans = platforms.slice(0, -1)
      .filter((platform) => platform.motionMode === "hold")
      .map((platform) => events[platform.index + 1].timeMs - events[platform.index].timeMs);
    expect(holdSpans.every((span) => span <= CHORD_GAP_MS)).toBe(true);
    expect(platforms.slice(0, 3).some((platform) => platform.motionMode === "roll")).toBe(true);

    for (let index = 0; index < 3; index += 1) {
      const spanSeconds = (events[index + 1].timeMs - events[index].timeMs) / 1000;
      const speed = Math.hypot(platforms[index].outVX, platforms[index].outVY);
      if (platforms[index].motionMode === "roll") {
        const start = { x: platforms[index].hitX, y: platforms[index].hitY };
        const end = { x: platforms[index + 1].hitX, y: platforms[index + 1].hitY };
        expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeCloseTo(speed * spanSeconds, 5);
        expect(speed).toBeLessThan(240);
      }
    }
  });

  it("keeps dense visual faces on the actual hit polyline at bends", () => {
    const events = Array.from({ length: 18 }, (_, index) => note(index, index * 92));
    events.push(note(18, 2300));
    const platforms = buildMarbleCourse(events, settings, 720);
    const dense = platforms.filter((platform) => platform.denseSurfaceId !== undefined && !platform.visualHidden);
    expect(dense.length).toBeGreaterThan(4);

    for (const platform of dense) {
      const normalLength = Math.hypot(platform.normalX, platform.normalY);
      const normal = { x: platform.normalX / normalLength, y: platform.normalY / normalLength };
      const faceX = (platform.visualX ?? platform.x) + normal.x * settings.ballSize;
      const faceY = (platform.visualY ?? platform.y) + normal.y * settings.ballSize;
      const perpendicular = Math.abs((platform.hitX - faceX) * normal.x + (platform.hitY - faceY) * normal.y);
      expect(perpendicular).toBeLessThan(1e-6);
    }
  });

  it("keeps the marble on the playable side of dense surfaces in both travel directions", () => {
    const events = Array.from({ length: 72 }, (_, index) => note(index, index * 118));
    events.push(note(72, 9_300));
    const platforms = buildMarbleCourse(events, settings, 720);
    let leftMovingSegments = 0;

    for (let index = 0; index < platforms.length - 1; index += 1) {
      const platform = platforms[index];
      if (platform.motionMode !== "roll" || platform.visualHidden) continue;
      const next = platforms[index + 1];
      if (next.hitX < platform.hitX) leftMovingSegments += 1;
      const normalLength = Math.hypot(platform.normalX, platform.normalY);
      const normalX = platform.normalX / normalLength;
      const normalY = platform.normalY / normalLength;
      expect(normalY, `rolling face ${index}`).toBeLessThan(-0.2);
      const surfaceX = platform.visualX ?? platform.x;
      const surfaceY = platform.visualY ?? platform.y;
      const signedClearance = (platform.hitX - surfaceX) * normalX
        + (platform.hitY - surfaceY) * normalY;
      expect(signedClearance, `rolling surface ${index}`).toBeCloseTo(settings.ballSize, 5);
    }

    expect(leftMovingSegments).toBeGreaterThan(0);
  });

  it("never flips an ordinary instrument onto its underside during a fast phrase", () => {
    const events = Array.from({ length: 12 }, (_, index) => note(index, index * 261));
    const platforms = buildMarbleCourse(events, settings, 720);

    for (const platform of platforms.filter((item) => !item.visualHidden)) {
      expect(platform.normalY, `instrument ${platform.index}`).toBeLessThan(-0.2);
    }
  });

  it("bounds long-gap fallback travel and leaves every struck face immediately", () => {
    const gaps = [261, 261, 1_500];
    let timeMs = 0;
    const events = Array.from({ length: 12 }, (_, index) => {
      const event = note(index, timeMs);
      timeMs += gaps[index % gaps.length];
      return event;
    });
    const platforms = buildMarbleCourse(events, settings, 720);
    const profile = marblePhysicsProfile(settings);

    for (let index = 0; index < platforms.length - 1; index += 1) {
      const platform = platforms[index];
      const next = platforms[index + 1];
      const dt = (events[index + 1].timeMs - events[index].timeMs) / 1_000;
      const maximumDrop = Math.max(260, profile.longGapDropPerSecond * dt * 1.8);
      expect(next.hitY - platform.hitY, `vertical travel ${index}`).toBeLessThanOrEqual(maximumDrop + 1e-6);
      if (platform.motionMode !== "ballistic") continue;

      const afterImpact = marbleAtTime(events[index].timeMs + 1_000 / 60, events, platforms, settings);
      const signedDeparture = (afterImpact.x - platform.hitX) * platform.normalX
        + (afterImpact.y - platform.hitY) * platform.normalY;
      expect(signedDeparture, `post-impact separation ${index}`).toBeGreaterThan(0.2);
    }
  });

});
