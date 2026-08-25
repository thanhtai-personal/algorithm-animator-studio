import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRhythmicPlayback } from "../features/rhythmic-studio/hooks/useRhythmicPlayback";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { InstrumentHitEvent } from "../features/rhythmic-studio/types";

const audioMocks = vi.hoisted(() => ({
  playNote: vi.fn(async () => undefined),
  scheduleMidi: vi.fn(async () => undefined),
}));

vi.mock("../features/rhythmic-studio/lib/audioEngine", () => ({
  AudioEngine: class {
    playNote = audioMocks.playNote;
    ensure = vi.fn(async () => undefined);
    stopMidi = vi.fn();
    scheduleMidi = audioMocks.scheduleMidi;
    attachOriginalAudio = vi.fn(async () => undefined);
    setVolume = vi.fn();
    setMusicVolume = vi.fn();
    setReverb = vi.fn();
    setBrightness = vi.fn();
    setStereoWidth = vi.fn();
  },
}));

function hit(style: InstrumentHitEvent["platformStyle"]): InstrumentHitEvent {
  return {
    event: { id: "note", timeMs: 100, midi: 60, velocity: 0.8, durationMs: 300, program: 0 },
    platformIndex: 0,
    platformStyle: style,
    noteColor: "#ff5d68",
    chordEvents: [],
    chordColors: [],
  };
}

describe("platform-aware collision playback", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["drum-disc", "tom"],
    ["instrument-cymbal", "cymbal"],
    ["gong-disc", "gong"],
    ["flute-pipe", "flute"],
  ] as const)("plays %s with its own %s voice", async (style, voice) => {
    const store = new RhythmicStudioStore();
    store.patch("instrumentNativeAudio", true);
    store.patch("instrumentFamily", "piano");
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.onNote(hit(style)));

    expect(audioMocks.playNote).toHaveBeenCalledWith(60, 0.8, 300, voice, 24);
  });

  it("schedules the rendered MIDI instrument once instead of doubling it at collision", async () => {
    const store = new RhythmicStudioStore();
    const event = { id: "drum", timeMs: 100, midi: 45, velocity: 0.8, durationMs: 220, isDrum: true };
    store.setSource(
      [event],
      { type: "midi", name: "drum.mid", durationMs: 600, eventCount: 1 },
      { key: "info.builtin" },
    );
    store.patch("instrumentNativeAudio", true);
    Object.assign(store, {
      preparedPlatforms: [{
        index: 0,
        event,
        visualStyle: "drum-disc",
      }],
    });
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.resetAndPlay());
    const options = audioMocks.scheduleMidi.mock.calls[0]?.[2];
    expect(options?.presetForEvent?.(event, 0)).toBe("tom");

    await act(async () => result.current.onNote(hit("drum-disc")));
    expect(audioMocks.playNote).not.toHaveBeenCalled();
  });
});
