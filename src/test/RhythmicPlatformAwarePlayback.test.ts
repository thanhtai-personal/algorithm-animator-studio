import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRhythmicPlayback } from "../features/rhythmic-studio/hooks/useRhythmicPlayback";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { InstrumentHitEvent } from "../features/rhythmic-studio/types";

const audioMocks = vi.hoisted(() => ({
  playNote: vi.fn(async () => undefined),
  scheduleMidi: vi.fn(async () => undefined),
  prepareVoices: vi.fn(async () => undefined),
}));

vi.mock("../features/rhythmic-studio/lib/audioEngine", () => ({
  AudioEngine: class {
    playNote = audioMocks.playNote;
    ensure = vi.fn(async () => undefined);
    stopMidi = vi.fn();
    scheduleMidi = audioMocks.scheduleMidi;
    prepareVoices = audioMocks.prepareVoices;
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

  it("warms each rendered instrument voice before export capture starts", async () => {
    const store = new RhythmicStudioStore();
    const events = [
      { id: "drum-a", timeMs: 0, midi: 45, velocity: 0.8, durationMs: 220, isDrum: true },
      { id: "drum-b", timeMs: 180, midi: 47, velocity: 0.75, durationMs: 220, isDrum: true },
      { id: "gong", timeMs: 420, midi: 55, velocity: 0.88, durationMs: 620 },
    ];
    store.setSource(
      events,
      { type: "builtin", name: "warmup", durationMs: 1_200, eventCount: events.length },
      { key: "info.builtin" },
    );
    Object.assign(store, {
      preparedPlatforms: [
        { index: 0, event: events[0], visualStyle: "drum-disc" },
        { index: 1, event: events[1], visualStyle: "drum-disc" },
        { index: 2, event: events[2], visualStyle: "gong-disc" },
      ],
    });
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.preparePlaybackAudio());

    expect(audioMocks.prepareVoices).toHaveBeenCalledWith([
      expect.objectContaining({ midi: 45, preset: "tom" }),
      expect.objectContaining({ midi: 55, preset: "gong" }),
    ]);
  });
});
