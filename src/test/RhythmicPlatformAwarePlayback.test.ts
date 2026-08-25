import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRhythmicPlayback } from "../features/rhythmic-studio/hooks/useRhythmicPlayback";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { InstrumentHitEvent } from "../features/rhythmic-studio/types";

const audioMocks = vi.hoisted(() => ({ playNote: vi.fn(async () => undefined) }));

vi.mock("../features/rhythmic-studio/lib/audioEngine", () => ({
  AudioEngine: class {
    playNote = audioMocks.playNote;
    ensure = vi.fn(async () => undefined);
    stopMidi = vi.fn();
    scheduleMidi = vi.fn(async () => undefined);
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

    expect(audioMocks.playNote).toHaveBeenCalledWith(60, 0.8, 300, voice);
  });
});
