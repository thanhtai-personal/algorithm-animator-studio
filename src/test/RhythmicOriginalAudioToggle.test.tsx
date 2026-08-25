import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicOriginalAudioToggle } from "../features/rhythmic-studio/components/RhythmicOriginalAudioToggle";

describe("rhythmic original-audio quick toggle", () => {
  it("shows the current state and toggles an imported audio file", () => {
    const onChange = vi.fn();
    render(<RhythmicOriginalAudioToggle kind="original" enabled available lang="vi" onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Âm thanh gốc: Bật" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("is disabled when the current source has no original audio track", () => {
    render(<RhythmicOriginalAudioToggle kind="none" enabled={false} available={false} lang="en" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Original audio: Unavailable" })).toBeDisabled();
  });

  it("offers a MIDI sound button without claiming that a MIDI file contains recorded audio", () => {
    const onChange = vi.fn();
    render(<RhythmicOriginalAudioToggle kind="midi" enabled available lang="vi" onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Âm MIDI tổng hợp: Bật" });
    expect(button).toHaveTextContent("Âm MIDI");
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
