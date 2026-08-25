import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicMagicToggle } from "../features/rhythmic-studio/components/RhythmicMagicToggle";

describe("RhythmicMagicToggle", () => {
  it("shows and toggles the 3D Magic state", () => {
    const onChange = vi.fn();
    render(<RhythmicMagicToggle enabled lang="vi" onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Magic 3D: Bật" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("is unavailable in the 2D renderer", () => {
    render(<RhythmicMagicToggle enabled={false} available={false} lang="en" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "3D Magic: Unavailable" })).toBeDisabled();
  });
});
