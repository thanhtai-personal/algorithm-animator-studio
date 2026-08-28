import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { wallScoreReferenceHits } from "../features/rhythmic-studio/lib/korobeinikiReferenceLayout";
import type {
  InstrumentFamily,
  NoteEvent,
  PlatformStyle,
} from "../features/rhythmic-studio/types";

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

  it("rotates the playing face toward the solved collision normal", () => {
    const settings = settingsFor("marimba");
    const course = buildMarbleCourse(EVENTS, settings, WIDTH);

    expect(course.some((platform) => Math.abs(platform.tiltRad) > 0.08)).toBe(true);
    course.forEach((platform) => {
      const faceNormalX = Math.sin(platform.tiltRad);
      const faceNormalY = -Math.cos(platform.tiltRad);
      expect(faceNormalX).toBeCloseTo(platform.normalX, 5);
      expect(faceNormalY).toBeCloseTo(platform.normalY, 5);

      const visualX = platform.visualX ?? platform.x;
      const visualY = platform.visualY ?? platform.y;
      expect(platform.hitX - visualX).toBeCloseTo(platform.normalX * settings.ballSize, 5);
      expect(platform.hitY - visualY).toBeCloseTo(platform.normalY * settings.ballSize, 5);
    });
  });

  it("compresses a fast note interval spatially instead of accelerating the marble", () => {
    const hits = buildMarbleCourse(EVENTS, settingsFor("flute"), WIDTH);
    const regularStep = Math.hypot(hits[1].hitX - hits[0].hitX, hits[1].hitY - hits[0].hitY);
    const fastStep = Math.hypot(hits[2].hitX - hits[1].hitX, hits[2].hitY - hits[1].hitY);

    expect(fastStep).toBeLessThan(regularStep * 0.75);
  });
});
