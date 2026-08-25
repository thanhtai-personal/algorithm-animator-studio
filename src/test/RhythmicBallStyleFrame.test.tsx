import { fireEvent, render, screen } from "@testing-library/react";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { RhythmicWorkflowControls } from "../features/rhythmic-studio/presentation/layouts/RhythmicControlColumns";

describe("Rhythmic ball style quick frame", () => {
  it("keeps the ball selector visible outside the workflow tabs", () => {
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
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    const patch = vi.fn();
    const studio = {
      settings: { ...DEFAULT_SETTINGS, ballStyle: "glass" },
      patch,
      source: { type: "builtin", name: "Neon Scale" },
      audioFileInfo: "",
      loadBuiltin: vi.fn(),
      importMidi: vi.fn(),
      importAudio: vi.fn(),
    } as unknown as RhythmicStudioController;

    render(<RhythmicWorkflowControls studio={studio} />);

    expect(screen.queryByRole("tab", { name: "Source" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marble style" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Glass" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Classic" }));
    expect(patch).toHaveBeenCalledWith("ballStyle", "classic");
  });
});
