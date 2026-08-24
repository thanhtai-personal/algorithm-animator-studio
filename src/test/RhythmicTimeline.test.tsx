import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicTimeline } from "../features/rhythmic-studio/components/RhythmicTimeline";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const events: NoteEvent[] = [
  { id: "beat-a", timeMs: 500, midi: 60, velocity: 0.8, durationMs: 160 },
  { id: "beat-b", timeMs: 1_500, midi: 64, velocity: 0.9, durationMs: 160 },
  { id: "beat-c", timeMs: 3_000, midi: 67, velocity: 0.7, durationMs: 160 },
];

describe("RhythmicTimeline seeking", () => {
  it("seeks to the pointer position on the full duration", () => {
    const onSeek = vi.fn();
    render(<RhythmicTimeline events={events} timeMs={1_000} durationMs={4_000} onSeek={onSeek} />);
    const timeline = screen.getByRole("slider");
    vi.spyOn(timeline, "getBoundingClientRect").mockReturnValue({
      left: 100,
      width: 400,
      right: 500,
      top: 0,
      bottom: 64,
      height: 64,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.click(timeline, { clientX: 300 });

    expect(onSeek).toHaveBeenCalledWith(2_000);
  });

  it("supports fine and coarse keyboard seeking", () => {
    const onSeek = vi.fn();
    render(<RhythmicTimeline events={events} timeMs={1_000} durationMs={4_000} onSeek={onSeek} />);
    const timeline = screen.getByRole("slider");

    fireEvent.keyDown(timeline, { key: "ArrowRight" });
    fireEvent.keyDown(timeline, { key: "ArrowLeft", shiftKey: true });
    fireEvent.keyDown(timeline, { key: "End" });

    expect(onSeek).toHaveBeenNthCalledWith(1, 1_250);
    expect(onSeek).toHaveBeenNthCalledWith(2, 0);
    expect(onSeek).toHaveBeenNthCalledWith(3, 4_000);
  });
});
