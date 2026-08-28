import { describe, expect, it } from "vitest";
import { instrumentSurfaceAlignment2D } from "../features/rhythmic-studio/lib/instrumentPlayingGeometry2D";
import type { PlatformStyle } from "../features/rhythmic-studio/types";

describe("2D instrument playing geometry", () => {
  it.each<PlatformStyle>([
    "tube-cylinder",
    "boomwhacker-tube",
    "instrument-cymbal",
    "gong-disc",
    "flute-pipe",
    "trumpet-horn",
    "guitar-body",
    "bronze-drum",
    "instrument-wire",
  ])("moves the visible upper boundary of %s onto the physical contact line", (style) => {
    const geometry = instrumentSurfaceAlignment2D(style, 120, 16);

    expect(geometry).not.toBeNull();
    expect(geometry!.sourceTopY + geometry!.translateY).toBeCloseTo(0, 6);
    expect(geometry!.sourceBottomY + geometry!.translateY).toBeCloseTo(geometry!.footY, 6);
    expect(geometry!.footY).toBeGreaterThan(0);
  });
});
