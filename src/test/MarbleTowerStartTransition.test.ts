import { describe, expect, it, vi } from "vitest";
import { startRaceAtLetsGo } from "../features/marble-tower-video/components/startRaceAtLetsGo";

describe("Marble Tower start transition", () => {
  it("releases the marbles without waiting for the spoken cue or audio startup", () => {
    const never = new Promise<void>(() => undefined);
    let released = false;

    startRaceAtLetsGo({
      sourceType: "midi",
      patch: vi.fn(),
      playCue: () => never,
      startPlaybackAudio: () => never,
      releaseStart: () => { released = true; },
    });

    expect(released).toBe(true);
  });

  it("enables only the selected source before starting playback", () => {
    const patch = vi.fn();

    startRaceAtLetsGo({
      sourceType: "audio",
      patch,
      playCue: () => Promise.resolve(),
      startPlaybackAudio: () => Promise.resolve(),
      releaseStart: vi.fn(),
    });

    expect(patch).toHaveBeenCalledWith("playOriginalSong", true);
    expect(patch).not.toHaveBeenCalledWith("midiPlaybackEnabled", true);
  });
});
