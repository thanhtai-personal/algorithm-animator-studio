import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  DEFAULT_SECONDARY_MARBLE,
  normalizeChaseSettings,
} from "../features/rhythmic-studio/lib/chaseSettings";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { StudioSettings } from "../features/rhythmic-studio/types";

describe("two-marble settings compatibility", () => {
  it("normalizes legacy projects to the untouched one-marble default", () => {
    const legacy = { ...DEFAULT_SETTINGS } as Partial<StudioSettings> & Record<string, unknown>;
    delete legacy.marbleMode;
    delete legacy.secondaryMarble;

    expect(normalizeChaseSettings(legacy)).toEqual({
      marbleMode: "single",
      secondaryMarble: DEFAULT_SECONDARY_MARBLE,
    });
  });

  it("rejects invalid persisted chase values without changing old settings", () => {
    const normalized = normalizeChaseSettings({
      marbleMode: "many",
      secondaryMarble: { ballStyle: "unknown", marbleAvatar: "animal-999" },
    });

    expect(normalized.marbleMode).toBe("single");
    expect(normalized.secondaryMarble).toEqual(DEFAULT_SECONDARY_MARBLE);
  });

  it("changes B material defaults independently from marble A", () => {
    const store = new RhythmicStudioStore();
    const originalA = {
      ballStyle: store.settings.ballStyle,
      ballBaseColor: store.settings.ballBaseColor,
      ballStripeColor: store.settings.ballStripeColor,
      ballSize: store.settings.ballSize,
    };

    store.setSecondaryMarbleStyle("fire");

    expect(store.settings.secondaryMarble).toMatchObject({
      ballStyle: "fire",
      ballBaseColor: "#ff4b18",
      ballStripeColor: "#ffe96a",
      ballSize: 17,
    });
    expect(store.settings).toMatchObject(originalA);
  });

  it("switches chase off without mutating either appearance", () => {
    const store = new RhythmicStudioStore();
    store.setSecondaryMarbleStyle("multicolor-glass");
    store.setSecondaryMarbleAvatar("animal-4");
    store.patch("marbleMode", "chase");
    const before = JSON.parse(JSON.stringify(store.settings)) as StudioSettings;

    store.patch("marbleMode", "single");

    expect(store.settings.marbleMode).toBe("single");
    expect(store.settings.secondaryMarble).toEqual(before.secondaryMarble);
    expect(store.settings.ballStyle).toBe(before.ballStyle);
    expect(store.settings.marbleAvatar).toBe(before.marbleAvatar);
  });
});
