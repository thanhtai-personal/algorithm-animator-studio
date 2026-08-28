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
    stopCue = vi.fn();
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

  it("matches scheduled MIDI voices to rendered platforms by note id instead of source index", async () => {
    const store = new RhythmicStudioStore();
    const late = { id: "late-guitar", timeMs: 900, midi: 64, velocity: 0.8, durationMs: 220 };
    const early = { id: "early-trumpet", timeMs: 100, midi: 67, velocity: 0.8, durationMs: 220 };
    store.setSource(
      [late, early],
      { type: "midi", name: "unsorted.mid", durationMs: 1_200, eventCount: 2 },
      { key: "info.builtin" },
    );
    store.patch("instrumentNativeAudio", true);
    Object.assign(store, {
      preparedPlatforms: [
        { index: 0, event: early, visualStyle: "trumpet-horn" },
        { index: 1, event: late, visualStyle: "guitar-body" },
      ],
    });
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.resetAndPlay());
    const options = audioMocks.scheduleMidi.mock.calls[0]?.[2];

    expect(options?.presetForEvent?.(late, 0)).toBe("guitar");
    expect(options?.presetForEvent?.(early, 1)).toBe("trumpet");
  });

  it("uses the active mixed-instrument section for MIDI notes omitted from the visual timeline", async () => {
    const store = new RhythmicStudioStore();
    const visible = { id: "visible", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 220 };
    const switched = { id: "switched", timeMs: 500, midi: 64, velocity: 0.8, durationMs: 220 };
    const dense = { id: "dense", timeMs: 520, midi: 67, velocity: 0.8, durationMs: 220 };
    store.setSource(
      [visible, switched, dense],
      { type: "midi", name: "dense.mid", durationMs: 800, eventCount: 3 },
      { key: "info.builtin" },
    );
    store.patch("instrumentNativeAudio", true);
    store.patch("instrumentFamily", "mixed");
    Object.assign(store, {
      instrumentMixSegments: [
        { id: "guitar-section", startMs: 0, endMs: 400, family: "guitar" },
        { id: "trumpet-section", startMs: 400, endMs: 800, family: "trumpet" },
      ],
      preparedPlatforms: [
        { index: 0, event: visible, visualStyle: "guitar-body" },
        { index: 1, event: switched, visualStyle: "trumpet-horn" },
      ],
    });
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.resetAndPlay());
    const options = audioMocks.scheduleMidi.mock.calls[0]?.[2];

    expect(options?.presetForEvent?.(dense, 2)).toBe("trumpet");
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
