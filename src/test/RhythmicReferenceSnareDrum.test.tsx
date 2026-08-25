import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DrumDiscMesh,
  drumGeometry3D,
} from "../features/rhythmic-studio/components/RhythmicDrumMesh3D";
import { instrumentPlayingSurface3D } from "../features/rhythmic-studio/components/instrumentPlayingSurface3D";
import { drawDrum2D, drumGeometry2D } from "../features/rhythmic-studio/lib/drumRenderer2D";
import { rhythmicText } from "../features/rhythmic-studio/i18n";

function drumCanvasContext() {
  const gradient = { addColorStop: vi.fn() };
  const strokeRect = vi.fn();
  const context = {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), stroke: vi.fn(), ellipse: vi.fn(),
    fillRect: vi.fn(), strokeRect,
    createLinearGradient: vi.fn(() => gradient), createRadialGradient: vi.fn(() => gradient),
  } as unknown as CanvasRenderingContext2D;
  return { context, strokeRect };
}

describe("reference marching snare drum", () => {
  it("names the picker item after the modeled marching snare", () => {
    expect(rhythmicText("vi", "platformStyle.drum-disc")).toBe("Trống snare marching");
    expect(rhythmicText("en", "platformStyle.drum-disc")).toBe("Marching snare drum");
  });

  it("uses a deep shell, a real front head and eight tension lugs in 3D", () => {
    const drum = drumGeometry3D(1, 0.14, 0.54);

    expect(drum.shellDepth / (drum.radius * 2)).toBeGreaterThanOrEqual(0.38);
    expect(drum.shellDepth / (drum.radius * 2)).toBeLessThanOrEqual(0.55);
    expect(drum.headRadius).toBeGreaterThan(drum.radius * 0.8);
    expect(drum.playingFaceZ).toBeGreaterThan(drum.shellDepth / 2);
    expect(drum.lugCount).toBe(8);
  });

  it("places the marble contact on the modeled drum head", () => {
    const drum = drumGeometry3D(1, 0.14, 0.54);
    const surface = instrumentPlayingSurface3D("drum-disc", 1, 0.14, 0.54, 0.18);

    expect(surface.localStrikeZ).toBeCloseTo(drum.playingFaceZ, 6);
    expect(surface.faceKind).toBe("front");
  });

  it("renders two hoops, a white head and all eight shell lugs", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <DrumDiscMesh
        w={1}
        h={0.14}
        d={0.54}
        color="#22d3ee"
        style="drum-disc"
        selected={false}
        glow={0.8}
        detail={1}
      />,
    );
    consoleError.mockRestore();

    expect(container.querySelectorAll('[name="drum-hoop"]')).toHaveLength(2);
    expect(container.querySelector('[name="drum-head"]')).not.toBeNull();
    expect(container.querySelectorAll('[name="drum-lug"]')).toHaveLength(8);
  });

  it("gives the 2D drum a deep shell instead of reusing a cymbal disc", () => {
    const drum = drumGeometry2D(100, 14);

    expect(drum.shellDepth).toBeGreaterThan(drum.faceRy * 1.4);
    expect(drum.headRx).toBeGreaterThan(drum.faceRx * 0.8);
    expect(drum.lugCount).toBe(8);
  });

  it("draws all eight visible tension rods in the dedicated 2D drum", () => {
    const { context, strokeRect } = drumCanvasContext();

    drawDrum2D(context, { width: 100, thickness: 14, color: "#22d3ee" }, 0.8, false);

    expect(strokeRect).toHaveBeenCalledTimes(8);
  });
});
