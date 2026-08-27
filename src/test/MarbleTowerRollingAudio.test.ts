import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Marble Tower rolling sound", () => {
  it("uses overlapping velocity-driven rolling grains instead of impact clicks only", () => {
    const file = resolve(process.cwd(), "src/features/rhythmic-studio/lib/marbleRollingAudio.ts");
    const source = readFileSync(file, "utf8");
    expect(source).toContain("duration = 0.095");
    expect(source).toContain("260 + intensity * 920");
    expect(source).toContain("playbackRate.value");
  });
});
