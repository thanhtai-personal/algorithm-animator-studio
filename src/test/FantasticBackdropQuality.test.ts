import { describe, expect, it } from "vitest";
import { selectFantasticBackdropQuality } from "@/lib/fantasticBackdropQuality";

describe("Fantastic backdrop quality budget", () => {
  it("caps the normal animation below the previous 30 FPS / 3.2 MP budget", () => {
    const quality = selectFantasticBackdropQuality({
      reducedMotion: false,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      viewportPixels: 1920 * 1080,
    });

    expect(quality).toMatchObject({
      rayCount: 120,
      targetFps: 20,
      maxBackingPixels: 1_600_000,
      dprCap: 1,
      pointerMotion: true,
    });
  });

  it("uses a smaller non-interactive budget on constrained devices", () => {
    const quality = selectFantasticBackdropQuality({
      reducedMotion: false,
      hardwareConcurrency: 4,
      deviceMemory: 4,
      viewportPixels: 1920 * 1080,
    });

    expect(quality).toMatchObject({
      rayCount: 72,
      targetFps: 12,
      maxBackingPixels: 900_000,
      dprCap: 0.8,
      pointerMotion: false,
    });
  });

  it("protects high-resolution displays even when CPU and memory are strong", () => {
    const quality = selectFantasticBackdropQuality({
      reducedMotion: false,
      hardwareConcurrency: 16,
      deviceMemory: 16,
      viewportPixels: 3_840 * 2_160,
    });

    expect(quality.maxBackingPixels).toBe(900_000);
    expect(quality.targetFps).toBe(12);
  });

  it("renders one lightweight static frame when reduced motion is requested", () => {
    const quality = selectFantasticBackdropQuality({
      reducedMotion: true,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      viewportPixels: 1920 * 1080,
    });

    expect(quality.targetFps).toBe(0);
    expect(quality.rayCount).toBe(40);
    expect(quality.maxBackingPixels).toBe(480_000);
    expect(quality.pointerMotion).toBe(false);
  });
});
