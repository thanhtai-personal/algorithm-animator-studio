import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicShadowToggle } from "../features/rhythmic-studio/components/RhythmicShadowToggle";

describe("RhythmicShadowToggle", () => {
  it("exposes the current shadow state and toggles it from the quick controls", () => {
    const onChange = vi.fn();
    render(<RhythmicShadowToggle enabled lang="vi" onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Bóng nhạc cụ: Bật" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("prevents shadow changes while playback or export locks the renderer", () => {
    const onChange = vi.fn();
    render(<RhythmicShadowToggle enabled={false} disabled lang="en" onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Instrument shadows: Off" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onChange).not.toHaveBeenCalled();
  });
});
