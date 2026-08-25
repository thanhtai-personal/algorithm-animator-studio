import { fireEvent, render, screen, within } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { describe, expect, it, vi } from "vitest";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { presetText } from "../features/rhythmic-studio/presetI18n";
import { QuickPresetBar } from "../features/rhythmic-studio/presentation/QuickPresetBar";
import { RhythmicPresetControls } from "../features/rhythmic-studio/presentation/layouts/RhythmicControlColumns";

describe("QuickPresetBar guidance", () => {
  it("keeps mix guidance out of the layout and exposes it on focus", async () => {
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    const studio = {
      currentPresetId: "toy-pegboard",
      applyQuickPreset: vi.fn(),
      presetMixEnabled: false,
      presetMixPlanActive: false,
      presetMixSegmentCount: 0,
      togglePresetMix: vi.fn(),
    } as unknown as RhythmicStudioController;
    const guidance = presetText("en", "mix.hint");

    render(
      <TooltipProvider delayDuration={0}>
        <QuickPresetBar studio={studio} embedded />
      </TooltipProvider>,
    );

    expect(screen.queryByText(guidance)).not.toBeInTheDocument();

    fireEvent.focus(screen.getByRole("button", { name: /^Mix:/ }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(guidance);
  });

  it("places one compact Mix control beside the scene-deck title", async () => {
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "vi");
    const studio = {
      currentPresetId: "toy-pegboard",
      applyQuickPreset: vi.fn(),
      presetMixEnabled: false,
      presetMixPlanActive: false,
      presetMixSegmentCount: 0,
      togglePresetMix: vi.fn(),
    } as unknown as RhythmicStudioController;

    render(
      <TooltipProvider delayDuration={0}>
        <RhythmicPresetControls studio={studio} />
      </TooltipProvider>,
    );

    const header = screen.getByText("Kho cảnh").closest("header");
    expect(header).not.toBeNull();
    expect(screen.queryByText("Chọn thế giới vật lý trước khi tinh chỉnh từng chi tiết.")).not.toBeInTheDocument();

    const mixButton = within(header as HTMLElement).getByRole("button", { name: /^Mix:/ });
    expect(mixButton).toHaveTextContent(/^Mix$/);
    expect(screen.getAllByRole("button", { name: /^Mix:/ })).toHaveLength(1);

    fireEvent.click(mixButton);
    expect(studio.togglePresetMix).toHaveBeenCalledOnce();

    fireEvent.focus(mixButton);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(presetText("vi", "mix.hint"));
  });
});
