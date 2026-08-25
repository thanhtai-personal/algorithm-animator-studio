import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BallStylePreview } from "../features/rhythmic-studio/presentation/atoms/RhythmicOptionPreviews";
import { ballStyleText } from "../features/rhythmic-studio/ballStyleI18n";
import { BALL_STYLES, type BallStyle } from "../features/rhythmic-studio/types";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { drawPresetMarble } from "../features/rhythmic-studio/lib/presetMarbleRenderer";
import { trailProfile } from "../features/rhythmic-studio/components/RhythmicVfx3D";
import { RhythmicMarble3D } from "../features/rhythmic-studio/components/RhythmicMarble3D";

const REFERENCE_BALL_STYLES = ["flower", "fire", "water", "rainbow", "patchwork", "multicolor-glass"] as const;

describe("reference marble styles", () => {
  it("exposes every collected reference marble in the shared picker", () => {
    for (const style of REFERENCE_BALL_STYLES) {
      expect(BALL_STYLES).toContain(style);
      expect(ballStyleText("en", style as BallStyle)).not.toBe(style);
      expect(ballStyleText("vi", style as BallStyle)).not.toBe(style);
    }
  });

  it.each(REFERENCE_BALL_STYLES)("renders a dedicated %s picker preview", (style) => {
    const { container } = render(<BallStylePreview style={style as BallStyle} />);
    expect(container.querySelectorAll("div").length).toBeGreaterThan(3);
  });

  it.each(REFERENCE_BALL_STYLES)("renders %s in the retained 2D mode", (style) => {
    const gradient = { addColorStop: vi.fn() };
    const method = () => vi.fn();
    const context = {
      save: method(), restore: method(), translate: method(), rotate: method(), scale: method(),
      beginPath: method(), arc: method(), ellipse: method(), fill: method(), stroke: method(), clip: method(),
      fillRect: method(), moveTo: method(), lineTo: method(), closePath: method(),
      createRadialGradient: vi.fn(() => gradient), createLinearGradient: vi.fn(() => gradient),
    } as unknown as CanvasRenderingContext2D;
    const settings = { ...DEFAULT_SETTINGS, ballStyle: style as BallStyle };

    expect(drawPresetMarble(context, { x: 80, y: 120, color: "#42d9ff", platformIndex: 0 }, 0, 0.4, settings)).toBe(true);
    expect(context.fill).toHaveBeenCalled();
  });

  it("renders the normal multicolor glass marble as a clear shell with a colored core in every renderer", () => {
    const preview = render(<BallStylePreview style={"multicolor-glass" as BallStyle} />);
    expect(preview.container.querySelector('[data-marble-core="multicolor-glass"]')).toBeInTheDocument();

    const fill = vi.fn();
    const gradient = { addColorStop: vi.fn() };
    const method = () => vi.fn();
    const context = {
      save: method(), restore: method(), translate: method(), rotate: method(), scale: method(),
      beginPath: method(), arc: method(), ellipse: method(), fill, stroke: method(), clip: method(),
      fillRect: method(), moveTo: method(), lineTo: method(), closePath: method(),
      createRadialGradient: vi.fn(() => gradient), createLinearGradient: vi.fn(() => gradient),
    } as unknown as CanvasRenderingContext2D;
    drawPresetMarble(context, { x: 80, y: 120, color: "#42d9ff", platformIndex: 0 }, 0, 0.2, {
      ...DEFAULT_SETTINGS,
      ballStyle: "multicolor-glass" as BallStyle,
    });
    expect(fill.mock.calls.length).toBeGreaterThanOrEqual(7);

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const webgl = render(<RhythmicMarble3D settings={{
      ...DEFAULT_SETTINGS,
      ballStyle: "multicolor-glass" as BallStyle,
      glowAnimation: false,
    }} />);
    consoleError.mockRestore();
    expect(webgl.container.querySelector('group[name="multicolor-glass-core"]')).toBeInTheDocument();
  });

  it("gives the fire marble a persistent readable 3D trail", () => {
    const base = { ...DEFAULT_SETTINGS, terrainProfile: "xylophone" as const, trailLength: 14 };
    const fire = trailProfile({ ...base, ballStyle: "fire" });
    const standard = trailProfile({ ...base, ballStyle: "solid" });
    expect(fire.duration).toBeGreaterThan(standard.duration * 2);
    expect(fire.count).toBeGreaterThanOrEqual(8);
  });

  it("keeps a readable 3D light trail while Magic is enabled", () => {
    const magic = trailProfile({ ...DEFAULT_SETTINGS, glowAnimation: true, trailLength: 0 });
    const plain = trailProfile({ ...DEFAULT_SETTINGS, glowAnimation: false, trailLength: 0 });

    expect(magic.count).toBeGreaterThanOrEqual(5);
    expect(magic.duration).toBeGreaterThanOrEqual(100);
    expect(plain).toEqual({ duration: 0, count: 0 });
  });
});
