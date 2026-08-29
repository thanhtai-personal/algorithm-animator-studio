import { describe, expect, it } from "vitest";
import { canUseAlgorithm3DVideo } from "@/lib/algorithmVideoRenderMode";

describe("algorithm video render mode", () => {
  it("allows 3D for the classic bar renderer", () => {
    expect(canUseAlgorithm3DVideo({
      shortVideoType: "classic",
      columnVisualMode: "bar",
      hasWorldScene: false,
    })).toBe(true);
  });

  it("keeps specialized 2D/Phaser modes on their original renderer", () => {
    expect(canUseAlgorithm3DVideo({ shortVideoType: "kinetic-typography", columnVisualMode: "bar", hasWorldScene: false })).toBe(false);
    expect(canUseAlgorithm3DVideo({ shortVideoType: "classic", columnVisualMode: "animal", hasWorldScene: false })).toBe(false);
    expect(canUseAlgorithm3DVideo({ shortVideoType: "classic", columnVisualMode: "bar", hasWorldScene: true })).toBe(false);
  });
});
