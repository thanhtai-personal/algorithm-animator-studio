import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { RhythmicCanvas } from "../features/rhythmic-studio/components/RhythmicCanvas";
import { hasRhythmicWebGLSupport, RhythmicScene3D } from "../features/rhythmic-studio/components/RhythmicScene3D";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ shadows, dpr, gl, frameloop }: { shadows?: boolean; dpr?: number | number[]; gl?: { preserveDrawingBuffer?: boolean }; frameloop?: string }) => (
    <canvas
      data-testid="three-canvas"
      data-shadows={String(Boolean(shadows))}
      data-dpr={String(dpr)}
      data-preserve-buffer={String(Boolean(gl?.preserveDrawingBuffer))}
      data-frameloop={frameloop}
    />
  ),
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

  it("releases the temporary WebGL capability probe", () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn(() => ({ loseContext }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension,
    } as unknown as WebGL2RenderingContext);

    expect(hasRhythmicWebGLSupport()).toBe(true);
    expect(getExtension).toHaveBeenCalledWith("WEBGL_lose_context");
    expect(loseContext).toHaveBeenCalledOnce();
  });

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

  it("turns the WebGL shadow map off when instrument shadows are disabled", () => {
    render(
      <RhythmicScene3D
        {...sharedProps}
        settings={{ ...DEFAULT_SETTINGS, instrumentShadowsEnabled: false }}
        timeMs={0}
        frameWidth={720}
        frameHeight={1280}
      />,
    );

    expect(screen.getByTestId("three-canvas")).toHaveAttribute("data-shadows", "false");
  });

  it("caps recording pixel density so capture does not drop most frames", () => {
    render(
      <RhythmicScene3D
        {...sharedProps}
        recording
        timeMs={0}
        frameWidth={720}
        frameHeight={1280}
      />,
    );

    expect(screen.getByTestId("three-canvas")).toHaveAttribute("data-dpr", "1.35");
    expect(screen.getByTestId("three-canvas")).toHaveAttribute("data-preserve-buffer", "true");
    expect(screen.getByTestId("three-canvas")).toHaveAttribute("data-frameloop", "always");
  });
});
