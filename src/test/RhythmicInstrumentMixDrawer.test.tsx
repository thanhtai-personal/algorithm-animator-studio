import { fireEvent, render, screen, within } from "@testing-library/react";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { describe, expect, it, vi } from "vitest";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { InstrumentMixDrawer } from "../features/rhythmic-studio/presentation/InstrumentMixDrawer";

function controller({ active = true, mixed = true } = {}) {
  return {
    activePresetId: active ? "mixed-instruments" : "toy-pegboard",
    settings: { instrumentFamily: mixed ? "mixed" : "piano" },
    instrumentMixSegments: [
      { id: "first", family: "piano", startMs: 0, endMs: 4_200 },
      { id: "second", family: "gong", startMs: 4_200, endMs: 8_000 },
    ],
    resetInstrumentMixPlan: vi.fn(),
    setInstrumentMixFamily: vi.fn(),
    setInstrumentMixDuration: vi.fn(),
    addInstrumentMixSection: vi.fn(),
    removeInstrumentMixSection: vi.fn(),
  } as unknown as RhythmicStudioController;
}

describe("InstrumentMixDrawer", () => {
  it("only appears for the mixed preset and edits segment duration in seconds", () => {
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "vi");
    const hiddenStudio = controller({ active: true, mixed: false });
    const { rerender } = render(<InstrumentMixDrawer studio={hiddenStudio} />);
    expect(screen.queryByRole("button", { name: "Chỉnh phối nhạc cụ" })).not.toBeInTheDocument();

    const studio = controller({ active: false, mixed: true });
    rerender(<InstrumentMixDrawer studio={studio} />);
    fireEvent.click(screen.getByRole("button", { name: "Chỉnh phối nhạc cụ" }));

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Nhạc cụ hỗn hợp")).toBeVisible();
    expect(within(drawer).getAllByText(/Đoạn \d/)).toHaveLength(2);

    fireEvent.change(within(drawer).getByRole("combobox", { name: "Nhạc cụ 1" }), { target: { value: "trumpet" } });
    expect(studio.setInstrumentMixFamily).toHaveBeenCalledWith("first", "trumpet");

    const duration = within(drawer).getByRole("spinbutton", { name: "Thời gian đoạn 1 (giây)" });
    fireEvent.change(duration, { target: { value: "5.5" } });
    fireEvent.blur(duration);
    expect(studio.setInstrumentMixDuration).toHaveBeenCalledWith("first", 5.5);

    fireEvent.click(within(drawer).getByRole("button", { name: "Tự động theo MIDI" }));
    expect(studio.resetInstrumentMixPlan).toHaveBeenCalledOnce();
  });
});
