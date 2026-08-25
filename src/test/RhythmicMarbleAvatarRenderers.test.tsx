import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";

const sprite = vi.hoisted(() => ({
  resetAction: vi.fn(),
  update: vi.fn(),
  draw: vi.fn(() => true),
}));

vi.mock("@/lib/animalColumns", async () => {
  const actual = await vi.importActual<typeof import("@/lib/animalColumns")>("@/lib/animalColumns");
  return { ...actual, getSprite: vi.fn(() => sprite) };
});

import { RhythmicMarble3D } from "../features/rhythmic-studio/components/RhythmicMarble3D";
import { drawMarbleAvatar2D } from "../features/rhythmic-studio/lib/marbleAvatarRenderer2D";
import type { MarbleAvatarMotion2D } from "../features/rhythmic-studio/lib/marbleAvatarMotion2D";

describe("rhythmic marble avatar renderers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("draws the selected character with a flight-local pose, direction and lean in 2D/export", () => {
    const context = {
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const settings = { ...DEFAULT_SETTINGS, marbleAvatar: "animal-2" as const };
    const motion: MarbleAvatarMotion2D = {
      action: "jump", frameIndex: 3, facing: -1, angleRad: -0.1, scaleX: 1.04, scaleY: 0.96,
    };

    const drawn = drawMarbleAvatar2D(
      context,
      { x: 120, y: 200, color: "#fff", platformIndex: 0 },
      40,
      0.5,
      settings,
      motion,
    );

    expect(drawn).toBe(true);
    expect(sprite.resetAction).toHaveBeenCalledWith("jump");
    expect(sprite.update).toHaveBeenCalledWith(270);
    expect(context.translate).toHaveBeenCalledWith(120, expect.any(Number));
    expect(context.rotate).toHaveBeenCalledWith(-0.1);
    expect(context.scale).toHaveBeenCalledWith(-1.04, 0.96);
    expect(sprite.draw).toHaveBeenCalledOnce();
  });

  it("always renders a real marble sphere in WebGL even when a 2D character remains selected", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<RhythmicMarble3D settings={{
      ...DEFAULT_SETTINGS,
      marbleAvatar: "animal-8",
      glowAnimation: false,
    }} />);
    consoleError.mockRestore();

    expect(container.querySelector("spheregeometry")).toBeInTheDocument();
  });
});
