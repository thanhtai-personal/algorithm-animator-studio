import { describe, expect, it } from "vitest";
import { instrumentKeyPressAtTime } from "../features/rhythmic-studio/lib/instrumentResponse";

describe("rolling instrument response", () => {
  it("presses a piano key at contact and smoothly releases it", () => {
    expect(instrumentKeyPressAtTime(1_000, 999)).toBe(0);
    expect(instrumentKeyPressAtTime(1_000, 1_000)).toBe(1);
    expect(instrumentKeyPressAtTime(1_000, 1_020)).toBeLessThan(1);
    expect(instrumentKeyPressAtTime(1_000, 1_080)).toBeGreaterThan(0);
    expect(instrumentKeyPressAtTime(1_000, 1_120)).toBe(0);
  });
});
