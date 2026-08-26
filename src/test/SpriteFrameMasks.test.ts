import { afterEach, describe, expect, it, vi } from "vitest";
import { Sprite } from "../lib/sprites/Sprite";

describe("Sprite frame masks", () => {
  afterEach(() => vi.restoreAllMocks());

  it("clears source annotations before preparing a sprite frame", () => {
    const clearRect = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      clearRect,
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(40 * 50 * 4) })),
      putImageData: vi.fn(),
    } as never);
    const image = { complete: true, naturalWidth: 512 } as HTMLImageElement;
    const sprite = new Sprite({
      image,
      defaultAction: "idle",
      actions: {
        idle: {
          frames: [{ x: 210, y: 539, w: 40, h: 50, clearRects: [{ x: 0, y: 0, w: 14, h: 12 }] }],
        },
      },
    });

    sprite.draw({ save: vi.fn(), restore: vi.fn() } as never, 0, 0, { width: 40, height: 50 });

    expect(clearRect).toHaveBeenCalledWith(0, 0, 14, 12);
  });
});
