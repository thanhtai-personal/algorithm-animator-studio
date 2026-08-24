import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRhythmicPlayback } from "../features/rhythmic-studio/hooks/useRhythmicPlayback";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";

const audioMocks = vi.hoisted(() => ({
  ensure: vi.fn(async () => undefined),
  stopMidi: vi.fn(),
  scheduleMidi: vi.fn(async () => undefined),
}));

vi.mock("../features/rhythmic-studio/lib/audioEngine", () => ({
  AudioEngine: class {
    ensure = audioMocks.ensure;
    stopMidi = audioMocks.stopMidi;
    scheduleMidi = audioMocks.scheduleMidi;
    attachOriginalAudio = vi.fn(async () => undefined);
    playNote = vi.fn(async () => undefined);
    setVolume = vi.fn();
    setMusicVolume = vi.fn();
    setReverb = vi.fn();
    setBrightness = vi.fn();
    setStereoWidth = vi.fn();
  },
}));

describe("rhythmic playback seek", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a paused preview without starting audio", async () => {
    const store = new RhythmicStudioStore();
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.seekPlayback(900));

    expect(store.timeMs).toBe(900);
    expect(store.playing).toBe(false);
    expect(audioMocks.ensure).not.toHaveBeenCalled();
  });

  it("restarts an active performance from the selected timeline point", async () => {
    const store = new RhythmicStudioStore();
    store.beginPlayback(0, store.durationMs, false);
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.seekPlayback(1_400));

    expect(store.timeMs).toBe(1_400);
    expect(store.playbackStartMs).toBe(1_400);
    expect(store.playing).toBe(true);
    expect(audioMocks.ensure).toHaveBeenCalledOnce();
    expect(audioMocks.stopMidi).toHaveBeenCalled();
  });
});
