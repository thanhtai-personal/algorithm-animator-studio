import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { audioEngine } from "@/lib/audio";
import {
  ALGORITHM_3D_COMPLETION_JINGLE_SECONDS,
  playAlgorithm3DCompletionJingle,
} from "@/features/algorithm-video-3d/algorithm3dCompletionAudio";

vi.mock("@/lib/audio", () => ({
  audioEngine: {
    playSfx: vi.fn(),
  },
}));

describe("algorithm 3D completion audio", () => {
  const playSfx = vi.mocked(audioEngine.playSfx);

  beforeEach(() => {
    vi.useFakeTimers();
    playSfx.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays a rising ending jingle and leaves enough tail for the final note", () => {
    playAlgorithm3DCompletionJingle();

    expect(playSfx).toHaveBeenCalledTimes(1);
    expect(playSfx).toHaveBeenNthCalledWith(1, "marimba", 0.30);

    vi.advanceTimersByTime(980);

    expect(playSfx).toHaveBeenCalledTimes(7);
    expect(playSfx).toHaveBeenNthCalledWith(6, "piano", 0.82);
    expect(playSfx).toHaveBeenNthCalledWith(7, "swap-spark", 0.92);
    expect(ALGORITHM_3D_COMPLETION_JINGLE_SECONDS).toBeGreaterThan(1.3);
  });
});
