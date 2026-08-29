import { describe, expect, it } from "vitest";
import { canUseAlgorithm3DVideo, isAlgorithm3DHyperMode, isAlgorithm3DRenderMode } from "@/lib/algorithmVideoRenderMode";

describe("algorithm video render mode", () => {
  it("allows 3D for the classic bar renderer", () => {
    expect(canUseAlgorithm3DVideo({
      shortVideoType: "classic",
      columnVisualMode: "bar",
      hasWorldScene: false,
    })).toBe(true);
  });

  it("treats Hyper as a 3D render mode", () => {
    expect(isAlgorithm3DRenderMode("3d-hyper")).toBe(true);
    expect(isAlgorithm3DHyperMode("3d-hyper")).toBe(true);
  });

  it("keeps specialized 2D/Phaser modes on their original renderer", () => {
    expect(canUseAlgorithm3DVideo({ shortVideoType: "kinetic-typography", columnVisualMode: "bar", hasWorldScene: false })).toBe(false);
    expect(canUseAlgorithm3DVideo({ shortVideoType: "classic", columnVisualMode: "animal", hasWorldScene: false })).toBe(false);
    expect(canUseAlgorithm3DVideo({ shortVideoType: "classic", columnVisualMode: "bar", hasWorldScene: true })).toBe(false);
  });
});
