import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRhythmicPlayback } from "../features/rhythmic-studio/hooks/useRhythmicPlayback";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";

const audioMocks = vi.hoisted(() => ({ attachOriginalAudio: vi.fn(async () => undefined) }));

vi.mock("../features/rhythmic-studio/lib/audioEngine", () => ({
  AudioEngine: class {
    attachOriginalAudio = audioMocks.attachOriginalAudio;
    ensure = vi.fn(async () => undefined);
    stopMidi = vi.fn();
    stopCue = vi.fn();
    scheduleMidi = vi.fn(async () => undefined);
    playNote = vi.fn(async () => undefined);
    setVolume = vi.fn();
    setMusicVolume = vi.fn();
    setReverb = vi.fn();
    setBrightness = vi.fn();
    setStereoWidth = vi.fn();
  },
}));

describe("original-song presentation sync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("waits for the 3D collision frame before starting the source audio", async () => {
    const store = new RhythmicStudioStore();
    store.setSource(
      [{ id: "onset", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 180 }],
      { type: "audio", name: "song.wav", durationMs: 1_000, eventCount: 1 },
      { key: "info.builtin" },
      "blob:sync-song",
    );
    const play = vi.fn(async () => undefined);
    const audio = { currentTime: 0, playbackRate: 1, play, pause: vi.fn() } as unknown as HTMLAudioElement;
    const { result } = renderHook(() => useRhythmicPlayback(store));
    result.current.audioElementRef.current = audio;

    let start: Promise<void>;
    act(() => { start = result.current.startPlaybackAudio(0); });
    await act(async () => Promise.resolve());
    expect(play).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(23));
    expect(play).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    await start!;

    expect(audioMocks.attachOriginalAudio).toHaveBeenCalledWith(audio);
    expect(play).toHaveBeenCalledOnce();
  });

  it("does not start delayed audio after playback is stopped", async () => {
    const store = new RhythmicStudioStore();
    store.setSource([], { type: "audio", name: "song.wav", durationMs: 1_000, eventCount: 0 }, { key: "info.builtin" }, "blob:sync-song");
    const play = vi.fn(async () => undefined);
    const audio = { currentTime: 0, playbackRate: 1, play, pause: vi.fn() } as unknown as HTMLAudioElement;
    const { result } = renderHook(() => useRhythmicPlayback(store));
    result.current.audioElementRef.current = audio;

    let start: Promise<void>;
    act(() => { start = result.current.startPlaybackAudio(0); });
    await act(async () => Promise.resolve());
    act(() => result.current.stopPlaybackAudio());
    await act(async () => vi.advanceTimersByTimeAsync(24));
    await start!;

    expect(play).not.toHaveBeenCalled();
  });

  it("pauses and resumes original audio immediately without stopping visual playback", async () => {
    const store = new RhythmicStudioStore();
    store.setSource([], { type: "audio", name: "song.wav", durationMs: 2_000, eventCount: 0 }, { key: "info.builtin" }, "blob:sync-song");
    store.beginPlayback(480, 2_000, false);
    const play = vi.fn(async () => undefined);
    const pause = vi.fn();
    const audio = { currentTime: 0, playbackRate: 1, play, pause } as unknown as HTMLAudioElement;
    const { result } = renderHook(() => useRhythmicPlayback(store));
    result.current.audioElementRef.current = audio;

    await act(async () => result.current.setOriginalAudioEnabled(false));
    expect(store.settings.playOriginalSong).toBe(false);
    expect(pause).toHaveBeenCalledOnce();
    expect(store.playing).toBe(true);

    let resume: Promise<void>;
    act(() => { resume = result.current.setOriginalAudioEnabled(true); });
    await act(async () => vi.advanceTimersByTimeAsync(24));
    await resume!;

    expect(store.settings.playOriginalSong).toBe(true);
    expect(audio.currentTime).toBeCloseTo(0.48, 6);
    expect(play).toHaveBeenCalledOnce();
    expect(store.playing).toBe(true);
  });
});
