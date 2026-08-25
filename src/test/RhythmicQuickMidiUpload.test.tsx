import { fireEvent, render, screen, within } from "@testing-library/react";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { RhythmicWorkflowControls } from "../features/rhythmic-studio/presentation/layouts/RhythmicControlColumns";

function stubLayoutObservers() {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal("MutationObserver", class {
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 0;
  });
}

describe("quick MIDI upload", () => {
  it("keeps one working MIDI uploader outside the advanced drawer", () => {
    stubLayoutObservers();
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    const importMidi = vi.fn();
    const studio = {
      settings: { ...DEFAULT_SETTINGS },
      source: { type: "builtin", name: "Neon Scale" },
      audioFileInfo: "",
      patch: vi.fn(),
      loadBuiltin: vi.fn(),
      importMidi,
      importAudio: vi.fn(),
      backgroundName: null,
      importBackground: vi.fn(),
      clearBackground: vi.fn(),
      lyricRaw: "",
      setLyricRaw: vi.fn(),
      lyrics: [],
      lyricFormat: null,
      importLyrics: vi.fn(),
      applyLyrics: vi.fn(),
      clearLyrics: vi.fn(),
    } as unknown as RhythmicStudioController;

    render(<RhythmicWorkflowControls studio={studio} />);

    const uploadLabel = screen.getByText("Upload MIDI notes").closest("label");
    expect(uploadLabel).not.toBeNull();
    const input = uploadLabel?.querySelector('input[type="file"]') as HTMLInputElement;
    const midiFile = new File([new Uint8Array([77, 84, 104, 100])], "melody.mid", { type: "audio/midi" });
    fireEvent.change(input, { target: { files: [midiFile] } });
    expect(importMidi).toHaveBeenCalledWith(midiFile);

    fireEvent.click(screen.getByRole("button", { name: "Advanced controls" }));
    expect(within(screen.getByRole("dialog")).queryByText("Upload MIDI notes")).not.toBeInTheDocument();
    expect(screen.getAllByText("Upload MIDI notes")).toHaveLength(1);
  });
});
