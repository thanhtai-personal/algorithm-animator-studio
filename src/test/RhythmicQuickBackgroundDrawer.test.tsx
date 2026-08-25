import { fireEvent, render, screen, within } from "@testing-library/react";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { RhythmicWorkflowControls } from "../features/rhythmic-studio/presentation/layouts/RhythmicControlColumns";

function studioController() {
  return {
    settings: { ...DEFAULT_SETTINGS, backgroundPreset: "spotlight" },
    patch: vi.fn(),
    source: { type: "builtin", name: "Neon Scale" },
    audioFileInfo: "",
    loadBuiltin: vi.fn(),
    importMidi: vi.fn(),
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
}

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

describe("quick background picker and advanced drawer", () => {
  it("keeps background presets outside the advanced workflow", () => {
    stubLayoutObservers();
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    const studio = studioController();

    render(<RhythmicWorkflowControls studio={studio} />);

    expect(screen.getByRole("button", { name: "Background style" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Deep space" })).toBeVisible();
    expect(screen.queryByRole("tab", { name: "Source" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Deep space" }));
    expect(studio.patch).toHaveBeenCalledWith("backgroundPreset", "deep-space");
  });

  it("opens the full workflow only inside the advanced drawer", () => {
    stubLayoutObservers();
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    const studio = studioController();

    render(<RhythmicWorkflowControls studio={studio} />);
    fireEvent.click(screen.getByRole("button", { name: "Advanced controls" }));

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("tab", { name: "Source" })).toHaveAttribute("data-state", "active");
    expect(within(drawer).queryByRole("button", { name: "Deep space" })).not.toBeInTheDocument();

    const finishTab = within(drawer).getByRole("tab", { name: "Finish" });
    fireEvent.mouseDown(finishTab, { button: 0 });
    expect(finishTab).toHaveAttribute("data-state", "active");
    fireEvent.click(within(drawer).getByRole("button", { name: "Video background" }));
    expect(within(drawer).getByText("Background tint")).toBeVisible();
    expect(within(drawer).queryByRole("button", { name: "Deep space" })).not.toBeInTheDocument();
  });
});
