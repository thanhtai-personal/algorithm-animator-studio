import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { useRhythmicProjectActions } from "../features/rhythmic-studio/hooks/useRhythmicProjectActions";
import { saveRhythmicProject } from "../features/rhythmic-studio/lib/projectStorage";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { InstrumentMixSegment } from "../features/rhythmic-studio/types";

describe("mixed instrument project persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("deep-snapshots the instrument schedule when saving", () => {
    const plan: InstrumentMixSegment[] = [
      { id: "piano", family: "piano", startMs: 0, endMs: 2_000 },
      { id: "flute", family: "flute", startMs: 2_000, endMs: 5_040 },
    ];
    const project = saveRhythmicProject(
      "Mix",
      { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" },
      undefined,
      [],
      false,
      plan,
    );

    plan[0].family = "gong";
    expect(project.instrumentMixSegments?.[0].family).toBe("piano");
  });

  it("restores the mixed preset identity and its custom schedule", () => {
    const store = new RhythmicStudioStore();
    const loadBuiltin = vi.fn();
    const project = saveRhythmicProject(
      "Mix",
      { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" },
      undefined,
      [],
      false,
      [
        { id: "gong", family: "gong", startMs: 0, endMs: 2_000 },
        { id: "flute", family: "flute", startMs: 2_000, endMs: 5_040 },
      ],
    );
    const { result } = renderHook(() => useRhythmicProjectActions(store, loadBuiltin));

    act(() => result.current.loadProject(project));

    expect(store.activePresetId).toBe("mixed-instruments");
    expect(store.instrumentMixSegments.map((segment) => segment.family)).toEqual(["gong", "flute"]);
  });
});
