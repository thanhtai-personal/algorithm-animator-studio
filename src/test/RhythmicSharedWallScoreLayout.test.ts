import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { wallScoreGuideRailGroups3D } from "../features/rhythmic-studio/components/RhythmicGuideRails3D";
import { buildMarbleCourse, marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import {
  wallScoreMarblePointAtPhase,
  wallScoreReferenceHits,
} from "../features/rhythmic-studio/lib/korobeinikiReferenceLayout";
import type {
  InstrumentFamily,
  NoteEvent,
  PlatformStyle,
} from "../features/rhythmic-studio/types";
import { presetById, type RhythmicPresetId } from "../features/rhythmic-studio/lib/studioPresets";
import { resolvePlatformStyle } from "../features/rhythmic-studio/lib/platformStyles";
import { usesAutomaticLongGapTube } from "../features/rhythmic-studio/lib/longGapTube";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";

const WIDTH = 720;
const EVENTS: NoteEvent[] = [
  note(0, 0),
  note(1, 230),
  note(2, 345),
  note(3, 575),
  note(4, 805),
  note(5, 1_035),
  note(6, 1_835),
  note(7, 2_065),
  note(8, 2_295),
];

const STYLE_BY_FAMILY: Record<Exclude<InstrumentFamily, "auto" | "mixed">, PlatformStyle> = {
  boomwhacker: "boomwhacker-tube",
  xylophone: "xylophone-bar",
  piano: "piano-key",
  marimba: "marimba-bar",
  pluck: "pluck-pad",
  vibraphone: "vibraphone-bar",
  metallophone: "metallophone-plate",
  gong: "gong-disc",
  flute: "flute-pipe",
};

function note(index: number, timeMs: number): NoteEvent {
  return {
    id: `shared-wall-score-${index}`,
    timeMs,
    midi: 60 + index,
    velocity: 0.82,
    durationMs: 140,
  };
}

function settingsFor(family: InstrumentFamily) {
  return {
    ...DEFAULT_SETTINGS,
    instrumentFamily: family,
    // A concrete instrument now uses the shared wall-score course regardless
    // of the legacy layout selector.
    instrumentLayout: "gallery" as const,
  };
}

describe("shared Korobeiniki wall-score instrument layout", () => {
  it("boots the active Color Pegs preset with its actual wall-score settings", () => {
    const store = new RhythmicStudioStore();

    expect(store.activePresetId).toBe("toy-pegboard");
    expect(store.settings.instrumentLayout).toBe("wall-score");
    expect(store.settings.platformPrimaryStyle).toBe("toy-peg");
    expect(buildMarbleCourse(EVENTS, store.settings, WIDTH)[0].visualStyle).toBe("toy-peg");
  });

  it.each(Object.entries(STYLE_BY_FAMILY) as [Exclude<InstrumentFamily, "auto" | "mixed">, PlatformStyle][])(
    "uses identical note positions for %s while retaining its own mesh",
    (family, expectedStyle) => {
      const course = buildMarbleCourse(EVENTS, settingsFor(family), WIDTH);
      const expectedHits = wallScoreReferenceHits(EVENTS, WIDTH);

      expect(course).toHaveLength(EVENTS.length);
      course.forEach((platform, index) => {
        expect(platform.hitX).toBeCloseTo(expectedHits[index].x, 5);
        expect(platform.hitY).toBeCloseTo(expectedHits[index].y, 5);
        expect(platform.visualStyle).toBe(expectedStyle);
      });
    },
  );

  it.each(["toy-pegboard", "neon-comet"] as RhythmicPresetId[])(
    "uses the Korobeiniki hit arrangement for %s while retaining its preset meshes",
    (presetId) => {
      const settings = { ...DEFAULT_SETTINGS, ...presetById(presetId).settings };
      const course = buildMarbleCourse(EVENTS, settings, WIDTH);
      const expectedHits = wallScoreReferenceHits(EVENTS, WIDTH);

      expect(settings.instrumentLayout).toBe("wall-score");
      expect(settings.cameraDistance).toBeGreaterThanOrEqual(1.14);
      expect(usesAutomaticLongGapTube(settings)).toBe(false);

      course.forEach((platform, index) => {
        expect(platform.hitX).toBeCloseTo(expectedHits[index].x, 5);
        expect(platform.hitY).toBeCloseTo(expectedHits[index].y, 5);
        expect(platform.visualStyle).toBe(resolvePlatformStyle(index, settings));
        expect(platform.visualStyle).toBeDefined();
        const visualX = platform.visualX ?? platform.x;
        const visualY = platform.visualY ?? platform.y;
        expect(Math.hypot(platform.hitX - visualX, platform.hitY - visualY)).toBeCloseTo(settings.ballSize, 5);
      });
    },
  );

  it("rotates the playing face toward the solved collision normal", () => {
    const settings = settingsFor("marimba");
    const course = buildMarbleCourse(EVENTS, settings, WIDTH);

    expect(course.some((platform) => Math.abs(platform.tiltRad) > 0.08)).toBe(true);
    course.forEach((platform, index) => {
      const faceNormalX = Math.sin(platform.tiltRad);
      const faceNormalY = -Math.cos(platform.tiltRad);
      expect(faceNormalX).toBeCloseTo(platform.normalX, 5);
      expect(faceNormalY).toBeCloseTo(platform.normalY, 5);

      const visualX = platform.visualX ?? platform.x;
      const visualY = platform.visualY ?? platform.y;
      expect(platform.hitX - visualX).toBeCloseTo(platform.normalX * settings.ballSize, 5);
      expect(platform.hitY - visualY).toBeCloseTo(platform.normalY * settings.ballSize, 5);

      const previous = course[index - 1];
      const incomingX = previous?.outVX ?? 0;
      const incomingY = previous
        ? previous.outVY + previous.gravity * Math.max(0.08, (platform.event.timeMs - previous.event.timeMs) / 1_000)
        : Math.max(128, settings.ballSize * 7.5);
      expect(incomingX * platform.normalX + incomingY * platform.normalY).toBeLessThan(0);
      expect(platform.outVX * platform.normalX + platform.outVY * platform.normalY).toBeGreaterThan(0);
    });
  });

  it("compresses a fast note interval spatially instead of accelerating the marble", () => {
    const hits = buildMarbleCourse(EVENTS, settingsFor("flute"), WIDTH);
    const regularStep = Math.hypot(hits[1].hitX - hits[0].hitX, hits[1].hitY - hits[0].hitY);
    const fastStep = Math.hypot(hits[2].hitX - hits[1].hitX, hits[2].hitY - hits[1].hitY);

    expect(fastStep).toBeLessThan(regularStep * 0.75);
  });

  it("uses the same rolling rail transition for a long rest", () => {
    const settings = settingsFor("piano");
    const course = buildMarbleCourse(EVENTS, settings, WIDTH);
    const longGapStart = 5;
    const midpointMs = (EVENTS[longGapStart].timeMs + EVENTS[longGapStart + 1].timeMs) / 2;
    const expected = wallScoreMarblePointAtPhase(
      course[longGapStart],
      course[longGapStart + 1],
      0.5,
    );
    const marble = marbleAtTime(midpointMs, EVENTS, course, settings);
    const rails = wallScoreGuideRailGroups3D(course, settings, longGapStart);

    expect(marble.x).toBeCloseTo(expected.x, 5);
    expect(marble.y).toBeCloseTo(expected.y, 5);
    expect(rails).toHaveLength(1);
    expect(rails[0].length).toBeGreaterThan(8);
  });
});
