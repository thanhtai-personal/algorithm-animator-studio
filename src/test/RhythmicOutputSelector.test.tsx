import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { RhythmicTrimPanel } from "../features/rhythmic-studio/components/RhythmicTrimPanel";

function renderPanel(recording = false) {
  const onOutputPresetChange = vi.fn();
  render(
    <RhythmicTrimPanel
      durationMs={60_000}
      timeMs={5_000}
      trimStartMs={0}
      trimEndMs={30_000}
      playingClip={false}
      recording={recording}
      exportFps={60}
      outputPreset="portrait-720p"
      onFpsChange={vi.fn()}
      onOutputPresetChange={onOutputPresetChange}
      onRangeChange={vi.fn()}
      onPreview={vi.fn()}
      onExport={vi.fn()}
    />,
  );
  return onOutputPresetChange;
}

describe("rhythmic output selector", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  it("offers exact portrait and landscape sizes and patches the selection", () => {
    const onChange = renderPanel();
    const selector = screen.getByRole("combobox", { name: "Output size" });
    fireEvent.click(selector);
    fireEvent.click(screen.getByRole("option", { name: "Landscape · 16:9 · 1280×720" }));
    expect(onChange).toHaveBeenCalledWith("landscape-720p");
  });

  it("locks output size while a recording is active", () => {
    renderPanel(true);
    expect(screen.getByRole("combobox", { name: "Output size" })).toBeDisabled();
  });
});
