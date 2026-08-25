import { describe, expect, it } from "vitest";
import { rhythmicAudioPresentationDelayMs, rhythmicAudioStartTime } from "../features/rhythmic-studio/lib/playbackSync";

describe("rhythmic audio/video presentation sync", () => {
  it("holds preview audio until the collision frame can reach the display", () => {
    expect(rhythmicAudioPresentationDelayMs({ rendererMode: "three", recording: false, exportFps: 60 })).toBe(24);
    expect(rhythmicAudioPresentationDelayMs({ rendererMode: "two", recording: false, exportFps: 60 })).toBe(30);
  });

  it("uses only half-frame compensation while recording the canvas stream", () => {
    expect(rhythmicAudioPresentationDelayMs({ rendererMode: "three", recording: true, exportFps: 30 })).toBe(20);
    expect(rhythmicAudioPresentationDelayMs({ rendererMode: "three", recording: true, exportFps: 60 })).toBe(12);
    expect(rhythmicAudioPresentationDelayMs({ rendererMode: "two", recording: true, exportFps: 120 })).toBe(8);
  });

  it("converts the visual compensation into an absolute Web Audio start time", () => {
    expect(rhythmicAudioStartTime(12.5, 24)).toBeCloseTo(12.524, 6);
    expect(rhythmicAudioStartTime(12.5, -20, 8)).toBeCloseTo(12.508, 6);
  });
});
