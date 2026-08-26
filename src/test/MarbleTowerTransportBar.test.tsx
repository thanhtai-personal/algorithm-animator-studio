import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarbleTowerTransportBar } from "../features/marble-tower-video/components/MarbleTowerTransportBar";

describe("MarbleTowerTransportBar", () => {
  it("keeps Play and Reset next to the race preview", () => {
    const onToggle = vi.fn();
    const onReset = vi.fn();

    render(
      <MarbleTowerTransportBar
        playing={false}
        recording={false}
        timeMs={1_250}
        durationMs={10_000}
        onToggle={onToggle}
        onReset={onReset}
        onSeek={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play race" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset race" }));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("shows Pause and exposes a seekable progress bar while playing", () => {
    const onSeek = vi.fn();

    render(
      <MarbleTowerTransportBar
        playing
        recording={false}
        timeMs={2_500}
        durationMs={10_000}
        onToggle={vi.fn()}
        onReset={vi.fn()}
        onSeek={onSeek}
      />,
    );

    expect(screen.getByRole("button", { name: "Pause race" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: "Race timeline" }), { target: { value: "6000" } });
    expect(onSeek).toHaveBeenCalledWith(6_000);
  });
});
