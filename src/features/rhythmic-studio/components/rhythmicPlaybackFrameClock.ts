export interface RhythmicPlaybackFrameClock {
  playbackToken: number;
  playbackStartMs: number;
  epochMs: number;
  needsSceneSnap: boolean;
}

interface RhythmicPlaybackFrameInput {
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  nowMs: number;
}

export function createRhythmicPlaybackFrameClock(
  playbackToken: number,
  playbackStartMs: number,
  nowMs: number,
): RhythmicPlaybackFrameClock {
  return {
    playbackToken,
    playbackStartMs,
    epochMs: nowMs - playbackStartMs,
    needsSceneSnap: true,
  };
}

export function advanceRhythmicPlaybackFrameClock(
  current: RhythmicPlaybackFrameClock,
  input: RhythmicPlaybackFrameInput,
) {
  const reset = current.playbackToken !== input.playbackToken
    || current.playbackStartMs !== input.playbackStartMs;
  const preparedClock = reset
    ? createRhythmicPlaybackFrameClock(input.playbackToken, input.playbackStartMs, input.nowMs)
    : current;
  const snapScene = preparedClock.needsSceneSnap;
  const clock = snapScene
    ? { ...preparedClock, needsSceneSnap: false }
    : preparedClock;
  const timeMs = Math.min(
    input.playbackEndMs,
    Math.max(input.playbackStartMs, input.nowMs - clock.epochMs),
  );
  return { clock, timeMs, reset, snapScene };
}
