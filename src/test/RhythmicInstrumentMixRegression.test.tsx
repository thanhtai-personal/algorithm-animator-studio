import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { RhythmicStudioController } from "../features/rhythmic-studio/hooks/useRhythmicStudioController";
import { korobeinikiColorForMidi } from "../features/rhythmic-studio/lib/korobeinikiReferenceLayout";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { createInstrumentMixSettingsResolver } from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import { REFERENCE_VIDEO_PRESETS } from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { MIXED_INSTRUMENT_PRESET_ID } from "../features/rhythmic-studio/lib/studioPresets";
import { InstrumentMixDrawer } from "../features/rhythmic-studio/presentation/InstrumentMixDrawer";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { NoteEvent } from "../features/rhythmic-studio/types";
import { SYSTEM_LANG_STORAGE_KEY } from "../lib/i18n";

function oneDensePhrase(): NoteEvent[] {
  return Array.from({ length: 12 }, (_, index) => ({
    id: `dense-${index}`,
    timeMs: index * 240,
    midi: 60 + index % 8,
    velocity: 0.8,
    durationMs: 220,
  }));
}

describe("mixed instrument regressions", () => {
  it("adds a manual section even when MIDI analysis finds only one phrase", () => {
    const store = new RhythmicStudioStore();
    const events = oneDensePhrase();
    store.setSource(events, {
      type: "midi",
      name: "single-phrase.mid",
      durationMs: 50_000,
      eventCount: events.length,
    }, { key: "status.ready" });
    store.selectPreset(MIXED_INSTRUMENT_PRESET_ID, {
      ...DEFAULT_SETTINGS,
      instrumentFamily: "mixed",
    });

    expect(store.instrumentMixSegments).toHaveLength(1);
    store.addInstrumentMixSection();

    expect(store.instrumentMixSegments).toHaveLength(2);
    expect(store.instrumentMixSegments[0].endMs)
      .toBe(store.instrumentMixSegments[1].startMs);
    expect(store.instrumentMixSegments.at(-1)?.endMs).toBe(store.durationMs);
  });

  it("offers Korobeiniki tubes in each section instrument selector", () => {
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
    const studio = {
      settings: { instrumentFamily: "mixed" },
      instrumentMixSegments: [
        { id: "first", family: "piano", startMs: 0, endMs: 8_000 },
      ],
      resetInstrumentMixPlan: vi.fn(),
      setInstrumentMixFamily: vi.fn(),
      setInstrumentMixDuration: vi.fn(),
      addInstrumentMixSection: vi.fn(),
      removeInstrumentMixSection: vi.fn(),
    } as unknown as RhythmicStudioController;
    render(<InstrumentMixDrawer studio={studio} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit instrument mix" }));

    const selector = within(screen.getByRole("dialog"))
      .getByRole("combobox", { name: "Instrument 1" });
    expect(within(selector).getByRole("option", { name: "Korobeiniki tubes" }))
      .toBeInTheDocument();
    fireEvent.change(selector, { target: { value: "korobeiniki-tubes" } });
    expect(studio.setInstrumentMixFamily)
      .toHaveBeenCalledWith("first", "korobeiniki-tubes");
  });

  it("reuses the Korobeiniki preset tube appearance in a mixed section", () => {
    const events = oneDensePhrase();
    const reference = REFERENCE_VIDEO_PRESETS.find(
      (preset) => preset.id === "reference-korobeiniki-tubes",
    )?.settings;
    const resolve = createInstrumentMixSettingsResolver(events, [{
      id: "korobeiniki-section",
      family: "boomwhacker",
      variant: "korobeiniki-tubes",
      startMs: 0,
      endMs: 50_000,
    }], () => ({ ...DEFAULT_SETTINGS, instrumentFamily: "mixed" }));

    expect(reference).toBeDefined();
    const resolved = resolve(0);
    expect(resolved).toMatchObject({
      colorPaletteMode: reference?.colorPaletteMode,
      prismStart: reference?.prismStart,
      prismEnd: reference?.prismEnd,
      platformPrimaryStyle: reference?.platformPrimaryStyle,
      platformSecondaryStyle: reference?.platformSecondaryStyle,
      platformAccentStyle: reference?.platformAccentStyle,
      platformMixMode: reference?.platformMixMode,
      platformAccentEvery: reference?.platformAccentEvery,
      instrumentFamily: reference?.instrumentFamily,
      instrumentLayout: reference?.instrumentLayout,
      showcaseRails: reference?.showcaseRails,
      showcaseRailDensity: reference?.showcaseRailDensity,
      showcaseDuet: reference?.showcaseDuet,
      platformWidth: reference?.platformWidth,
      platformThickness: reference?.platformThickness,
      platformGap: reference?.platformGap,
      laneSpread: reference?.laneSpread,
      platformTilt: reference?.platformTilt,
      minBounceDistance: reference?.minBounceDistance,
      bounceHeight: reference?.bounceHeight,
      platformGlow: reference?.platformGlow,
      platformDetail: reference?.platformDetail,
    });

    const course = buildMarbleCourse(
      events,
      { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" },
      720,
      resolve,
    );
    expect(course[0]).toMatchObject({
      visualStyle: "wall-boomwhacker-tube",
      visualWidth: (reference?.platformWidth ?? 0) * 0.58,
      visualThickness: 40,
      visualTiltRad: 0,
      color: korobeinikiColorForMidi(events[0].midi),
    });
  });
});
