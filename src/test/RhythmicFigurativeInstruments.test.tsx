import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BronzeDrumMesh,
  GuitarBodyMesh,
  TrumpetHornMesh,
} from "../features/rhythmic-studio/components/RhythmicFigurativeInstrumentMeshes3D";
import { instrumentPlayingSurface3D } from "../features/rhythmic-studio/components/instrumentPlayingSurface3D";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { presetObstaclePlan } from "../features/rhythmic-studio/engine/presetObstaclePlan";
import { instrumentVoiceForPlatform } from "../features/rhythmic-studio/lib/instrumentHitProfiles";
import { drawWindMetalPlatform2D } from "../features/rhythmic-studio/lib/windMetalPlatform2D";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { INSTRUMENT_FAMILIES, type NoteEvent, type PlatformStyle } from "../features/rhythmic-studio/types";

const EVENT: NoteEvent = {
  id: "figurative-instrument",
  timeMs: 0,
  midi: 60,
  velocity: 0.8,
  durationMs: 360,
};

const MESH_PROPS = {
  w: 1,
  h: 0.14,
  d: 0.54,
  color: "#f59e0b",
  selected: false,
  glow: 0.8,
  detail: 1,
} as const;

describe("figurative mixed instruments", () => {
  it.each(["trumpet-horn", "guitar-body", "bronze-drum"] as PlatformStyle[])(
    "uses a dedicated 2D drawing for %s",
    (style) => {
      const gradient = { addColorStop: vi.fn() };
      const context = {
        save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), beginPath: vi.fn(),
        closePath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), quadraticCurveTo: vi.fn(),
        bezierCurveTo: vi.fn(), arc: vi.fn(), ellipse: vi.fn(), roundRect: vi.fn(), fill: vi.fn(),
        stroke: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(),
        createLinearGradient: vi.fn(() => gradient), createRadialGradient: vi.fn(() => gradient),
      } as unknown as CanvasRenderingContext2D;
      const platform = { width: 100, thickness: 16, color: "#f59e0b", visualCompact: false } as never;

      expect(drawWindMetalPlatform2D(context, style, platform, 0.8, DEFAULT_SETTINGS, false)).toBe(true);
      expect(context.fill).toHaveBeenCalled();
    },
  );

  it.each([
    ["trumpet", "trumpet-horn"],
    ["drum", "drum-disc"],
    ["guitar", "guitar-body"],
    ["gong", "gong-disc"],
    ["bronze-drum", "bronze-drum"],
  ] as const)("maps the %s family to its dedicated instrument shape", (family, style) => {
    expect(INSTRUMENT_FAMILIES).toContain(family);
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: family };
    expect(presetObstaclePlan(0, settings)?.style).toBe(style);
  });

  it.each([
    ["trumpet", "trumpet-horn"],
    ["drum", "drum-disc"],
    ["guitar", "guitar-body"],
    ["bronze-drum", "bronze-drum"],
  ] as const)("keeps dense %s MIDI runs on the same dedicated mesh", (family, style) => {
    const events = Array.from({ length: 14 }, (_, index) => ({
      ...EVENT,
      id: `dense-${family}-${index}`,
      timeMs: index * 82,
      midi: 55 + index,
    }));
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: family };
    const course = buildMarbleCourse(events, settings, 720);

    expect(new Set(course.map((platform) => platform.visualStyle))).toEqual(new Set([style]));
  });

  it.each([
    ["trumpet-horn", "trumpet"],
    ["drum-disc", "tom"],
    ["guitar-body", "guitar"],
    ["gong-disc", "gong"],
    ["bronze-drum", "bronze-drum"],
  ] as const)("plays the %s mesh with its matching voice", (style, voice) => {
    expect(instrumentVoiceForPlatform(style, EVENT, "piano")).toBe(voice);
  });

  it.each(["trumpet-horn", "guitar-body", "bronze-drum"] as PlatformStyle[])(
    "provides a front playing surface for %s",
    (style) => {
      const surface = instrumentPlayingSurface3D(style, 1, 0.14, 0.54, 0.18);
      expect(surface.faceKind).toBe("front");
      expect(surface.localStrikeZ).toBeGreaterThan(0);
      expect(surface.marbleContactZ).toBeGreaterThan(0);
    },
  );

  it("renders recognizable trumpet, guitar and Vietnamese bronze drum meshes", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<>
      <TrumpetHornMesh {...MESH_PROPS} style="trumpet-horn" />
      <GuitarBodyMesh {...MESH_PROPS} style="guitar-body" />
      <BronzeDrumMesh {...MESH_PROPS} style="bronze-drum" />
    </>);
    consoleError.mockRestore();

    expect(container.querySelector('[name="trumpet-horn"]')).not.toBeNull();
    expect(container.querySelector('[name="guitar-body"]')).not.toBeNull();
    expect(container.querySelector('[name="bronze-drum"]')).not.toBeNull();
    expect(container.querySelector('[name="bronze-drum-star"]')).not.toBeNull();
  });
});
