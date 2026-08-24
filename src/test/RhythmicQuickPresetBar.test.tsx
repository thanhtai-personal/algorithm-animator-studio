import { fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { describe, expect, it, vi } from "vitest";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { presetText } from "../features/rhythmic-studio/presetI18n";
import { QuickPresetBar } from "../features/rhythmic-studio/presentation/QuickPresetBar";

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

    fireEvent.focus(screen.getByRole("button", { name: /auto preset mix/i }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(guidance);
  });
});
