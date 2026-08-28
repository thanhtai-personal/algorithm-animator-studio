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
    stopCue = vi.fn();
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

  it("passes the renderer presentation delay into sample-accurate MIDI scheduling", async () => {
    const store = new RhythmicStudioStore();
    store.setSource(
      [{ id: "midi-note", timeMs: 500, midi: 64, velocity: 0.82, durationMs: 240 }],
      { type: "midi", name: "sync.mid", durationMs: 1_000, eventCount: 1 },
      { key: "info.builtin" },
    );
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.resetAndPlay());

    expect(audioMocks.scheduleMidi).toHaveBeenCalledWith(
      store.sourceEvents,
      0,
      expect.objectContaining({ presentationDelayMs: 24 }),
    );
  });

  it("can toggle the synthesized MIDI source track while visual collision voices stay enabled", async () => {
    const store = new RhythmicStudioStore();
    store.setSource(
      [{ id: "midi-note", timeMs: 500, midi: 64, velocity: 0.82, durationMs: 240, program: 33 }],
      { type: "midi", name: "SuperMarioMakerTitleTheme.mid", durationMs: 1_000, eventCount: 1 },
      { key: "info.builtin" },
    );
    store.patch("instrumentNativeAudio", true);
    store.patch("midiPlaybackEnabled", false);
    store.beginPlayback(320, 1_000, false);
    const { result } = renderHook(() => useRhythmicPlayback(store));

    await act(async () => result.current.setSourceAudioEnabled(true));

    expect(store.settings.midiPlaybackEnabled).toBe(true);
    expect(audioMocks.scheduleMidi).toHaveBeenCalledWith(
      store.sourceEvents,
      320,
      expect.objectContaining({ mode: store.settings.midiInstrumentMode }),
    );

    await act(async () => result.current.setSourceAudioEnabled(false));
    expect(store.settings.midiPlaybackEnabled).toBe(false);
    expect(audioMocks.stopMidi).toHaveBeenCalled();
    expect(store.playing).toBe(true);
  });
});
