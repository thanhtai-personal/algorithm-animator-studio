import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { estimatedCollisionPeak, estimatedMidiPeak } from "../features/rhythmic-studio/lib/audioMix";

describe("rhythmic audio mastering", () => {
  it("keeps the default collision mix audible with encoder headroom", () => {
    const peak = estimatedCollisionPeak(0.82, DEFAULT_SETTINGS.synthVolume);
    expect(peak).toBeGreaterThanOrEqual(0.15);
    expect(peak).toBeLessThan(0.24);
  });

  it("keeps the loudest collision below the compressor's safe input ceiling", () => {
    expect(estimatedCollisionPeak(1, 1)).toBeLessThan(0.32);
  });

  it("keeps MIDI playback audible without approaching clipping", () => {
    const peak = estimatedMidiPeak(0.82, DEFAULT_SETTINGS.musicVolume);
    expect(peak).toBeGreaterThanOrEqual(0.07);
    expect(peak).toBeLessThan(0.2);
  });
});
