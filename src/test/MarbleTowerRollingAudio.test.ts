import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

 describe("Marble Tower rolling sound", () => {
  it("uses overlapping velocity-driven rolling grains instead of impact clicks only", () => {
    const file = fileURLToPath(new URL("../features/rhythmic-studio/lib/marbleRollingAudio.ts", import.meta.url));
    const source = readFileSync(file, "utf8");
    expect(source).toContain("duration = 0.095");
    expect(source).toContain("260 + intensity * 920");
    expect(source).toContain("playbackRate.value");
  });
});
