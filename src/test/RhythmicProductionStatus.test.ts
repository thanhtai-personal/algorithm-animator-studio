import { describe, expect, it } from "vitest";
import {
  activeEventPosition,
  buildProductionReadiness,
  formatStudioTimecode,
  resolveRhythmicRenderer,
} from "../features/rhythmic-studio/lib/productionStatus";
import type { NoteEvent } from "../features/rhythmic-studio/types";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";

const events: NoteEvent[] = [
  { id: "a", timeMs: 120, midi: 60, velocity: 0.8, durationMs: 180 },
  { id: "b", timeMs: 640, midi: 64, velocity: 0.9, durationMs: 180 },
  { id: "c", timeMs: 1_200, midi: 67, velocity: 0.75, durationMs: 180 },
];

describe("rhythmic production status", () => {
  it("formats editor time as stable minute, second and millisecond timecode", () => {
    expect(formatStudioTimecode(0)).toBe("00:00.000");
    expect(formatStudioTimecode(65_432)).toBe("01:05.432");
    expect(formatStudioTimecode(-120)).toBe("00:00.000");
  });

  it("reports a one-based event position at the playhead", () => {
    expect(activeEventPosition(events, 0)).toBe(0);
    expect(activeEventPosition(events, 120)).toBe(1);
    expect(activeEventPosition(events, 1_199)).toBe(2);
    expect(activeEventPosition(events, 9_000)).toBe(3);
  });

  it("prefers WebGL 3D but resolves safely to Canvas when unavailable", () => {
    expect(resolveRhythmicRenderer("three", true)).toBe("three");
    expect(resolveRhythmicRenderer("three", false)).toBe("legacy");
    expect(resolveRhythmicRenderer("legacy", true)).toBe("legacy");
  });

  it("starts new projects in 3D while retaining the explicit 2D selection", () => {
    const store = new RhythmicStudioStore();
    expect(store.rendererMode).toBe("three");

    store.setRendererMode("legacy");
    expect(store.rendererMode).toBe("legacy");
  });

  it("distinguishes exact MIDI timing from detected audio onsets", () => {
    const midi = buildProductionReadiness({
      sourceType: "midi",
      requestedRenderer: "three",
      webglAvailable: true,
      exportFps: 60,
      eventCount: 128,
    });
    const audio = buildProductionReadiness({
      sourceType: "audio",
      requestedRenderer: "three",
      webglAvailable: false,
      exportFps: 30,
      eventCount: 42,
    });

    expect(midi).toEqual({
      effectiveRenderer: "three",
      fallbackActive: false,
      timingFidelity: "midi-exact",
      readyForExport: true,
      finalQuality: true,
    });
    expect(audio).toEqual({
      effectiveRenderer: "legacy",
      fallbackActive: true,
      timingFidelity: "audio-onset",
      readyForExport: true,
      finalQuality: false,
    });
  });
});
