import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createPatchworkGeometry } from "../features/rhythmic-studio/components/RhythmicMarble3D";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { presetObstaclePlan } from "../features/rhythmic-studio/engine/presetObstaclePlan";
import { ballStyleText } from "../features/rhythmic-studio/ballStyleI18n";
import { drawPresetPlatform } from "../features/rhythmic-studio/lib/presetPlatformRenderer";
import { showcaseText } from "../features/rhythmic-studio/showcaseI18n";
import { CourseItemPreview } from "../features/rhythmic-studio/presentation/atoms/RhythmicOptionPreviews";
import { BALL_STYLES, INSTRUMENT_FAMILIES, PLATFORM_STYLES } from "../features/rhythmic-studio/types";

describe("FDown 57c8 reference catalog", () => {
  it("adds one distinct ball and one distinct instrument family without duplicating dual rails", () => {
    expect(BALL_STYLES).toContain("patchwork");
    expect(PLATFORM_STYLES).toContain("metallophone-plate");
    expect(PLATFORM_STYLES.filter((style) => style === "dual-rail")).toHaveLength(1);
    expect(INSTRUMENT_FAMILIES).toContain("metallophone");
    expect(ballStyleText("vi", "patchwork")).toBe("Bóng đa diện ghép màu");
    expect(showcaseText("vi", "family.metallophone")).toContain("Metallophone");
  });

  it("shows a dedicated two-bolt mounted plate preview", () => {
    const { container } = render(<CourseItemPreview style="metallophone-plate" />);
    expect(container.querySelectorAll('[data-metallophone-bolt="true"]')).toHaveLength(2);
    expect(container.querySelector('[data-metallophone-mount="true"]')).not.toBeNull();
  });

  it("builds a genuinely faceted 3D patchwork sphere with many face colors", () => {
    const geometry = createPatchworkGeometry();
    const position = geometry.getAttribute("position");
    const color = geometry.getAttribute("color");
    const distinct = new Set<string>();
    for (let index = 0; index < color.count; index += 1) {
      distinct.add(`${color.getX(index).toFixed(3)}:${color.getY(index).toFixed(3)}:${color.getZ(index).toFixed(3)}`);
    }

    expect(geometry.index).toBeNull();
    expect(color.count).toBe(position.count);
    expect(distinct.size).toBeGreaterThanOrEqual(6);
    geometry.dispose();
  });

  it("renders the mounted plate with its U frame in retained 2D mode", () => {
    const gradient = { addColorStop: vi.fn() };
    const context = {
      save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), stroke: vi.fn(), arc: vi.fn(),
      createLinearGradient: vi.fn(() => gradient),
    } as unknown as CanvasRenderingContext2D;
    const platform = {
      width: 120, thickness: 16, color: "#22c8e8",
    } as MarblePlatform;

    expect(drawPresetPlatform(context, "metallophone-plate", 60, platform, 0.8, 0, DEFAULT_SETTINGS)).toBe(true);
    expect(context.quadraticCurveTo).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledTimes(5);
  });

  it("uses the new plate throughout the metallophone family course", () => {
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "metallophone" as const };
    expect(presetObstaclePlan(0, settings)?.style).toBe("metallophone-plate");
    expect(presetObstaclePlan(8, settings)?.style).toBe("dual-rail");
  });
});
