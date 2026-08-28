import { describe, expect, it } from "vitest";
import {
  advanceRhythmicPlaybackFrameClock,
  createRhythmicPlaybackFrameClock,
} from "../features/rhythmic-studio/components/rhythmicPlaybackFrameClock";

describe("rhythmic MP4 playback clock", () => {
  it("resets a running recording clock synchronously on the first frame of a new playback token", () => {
    const staleClock = createRhythmicPlaybackFrameClock(7, 0, 1_000);

    const frame = advanceRhythmicPlaybackFrameClock(staleClock, {
      playbackToken: 8,
      playbackStartMs: 0,
      playbackEndMs: 15_211,
      nowMs: 90_000,
    });

    expect(frame.reset).toBe(true);
    expect(frame.timeMs).toBe(0);
    expect(frame.clock.epochMs).toBe(90_000);
  });

  it("advances later export frames from the synchronized token epoch", () => {
    const clock = createRhythmicPlaybackFrameClock(8, 4_200, 90_000);

    const frame = advanceRhythmicPlaybackFrameClock(clock, {
      playbackToken: 8,
      playbackStartMs: 4_200,
      playbackEndMs: 6_000,
      nowMs: 90_350,
    });

    expect(frame.reset).toBe(false);
    expect(frame.timeMs).toBe(4_550);
  });

  it("requests one scene snap even when React already rebuilt the clock for the export token", () => {
    const preparedClock = createRhythmicPlaybackFrameClock(9, 0, 120_000);

    const firstFrame = advanceRhythmicPlaybackFrameClock(preparedClock, {
      playbackToken: 9,
      playbackStartMs: 0,
      playbackEndMs: 15_211,
      nowMs: 120_000,
    });
    const secondFrame = advanceRhythmicPlaybackFrameClock(firstFrame.clock, {
      playbackToken: 9,
      playbackStartMs: 0,
      playbackEndMs: 15_211,
      nowMs: 120_017,
    });

    expect(firstFrame.reset).toBe(false);
    expect(firstFrame.snapScene).toBe(true);
    expect(secondFrame.snapScene).toBe(false);
  });
});
