import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { RhythmicCanvas } from "../features/rhythmic-studio/components/RhythmicCanvas";
import { RhythmicScene3D } from "../features/rhythmic-studio/components/RhythmicScene3D";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <canvas data-testid="three-canvas" />,
}));
vi.mock("../features/rhythmic-studio/lib/rhythmicFrameRenderer", () => ({
  drawRhythmicFrame: vi.fn(),
}));

const sharedProps = {
  events: [],
  settings: DEFAULT_SETTINGS,
  durationMs: 1_000,
  playing: false,
  playbackToken: 0,
  playbackStartMs: 0,
  playbackEndMs: 1_000,
  courseOverrides: [],
  selectedNodeIndex: null,
  onSelectNode: vi.fn(),
  recording: false,
  onNote: vi.fn(),
  onTime: vi.fn(),
  onEnded: vi.fn(),
  platforms: [],
  resolveSettings: () => DEFAULT_SETTINGS,
};

describe("rhythmic renderer output dimensions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the native 1280×720 backing buffer in Canvas 2D", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const canvasRef = { current: null };

    const { container } = render(
      <RhythmicCanvas
        {...sharedProps}
        frameWidth={1280}
        frameHeight={720}
        backgroundUrl={null}
        lyrics={[]}
        targetFps={60}
        canvasRef={canvasRef}
      />,
    );

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
  });

  it("gives the WebGL stage the selected 16:9 aspect", () => {
    render(
      <RhythmicScene3D
        {...sharedProps}
        timeMs={0}
        frameWidth={1280}
        frameHeight={720}
      />,
    );

    expect(screen.getByTestId("rhythmic-three-frame")).toHaveStyle({ aspectRatio: "1280 / 720" });
  });
});
