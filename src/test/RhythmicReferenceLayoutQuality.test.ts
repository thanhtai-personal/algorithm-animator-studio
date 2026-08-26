import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  platformClearance,
  platformVisualClearanceRequirement,
} from "../features/rhythmic-studio/engine/marbleCourseConstraints";
import { instrumentVisualFootprint } from "../features/rhythmic-studio/engine/instrumentVisualFootprint";
import { buildPhysicsCourse } from "../features/rhythmic-studio/engine/marbleCoursePlanner";
import { REFERENCE_VIDEO_PRESET_IDS } from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function referenceStressEvents(): NoteEvent[] {
  const gaps = [96, 104, 118, 145, 210, 320, 460, 125, 112, 380, 170, 520];
  let timeMs = 0;
  return Array.from({ length: 68 }, (_, index) => {
    if (index) timeMs += gaps[(index - 1) % gaps.length];
    return {
      id: `reference-layout-${index}`,
      timeMs,
      midi: 48 + ((index * 7) % 32),
      velocity: 0.66 + (index % 5) * 0.06,
      durationMs: 78,
      isDrum: index % 9 === 5,
    };
  });
}

function sharesPlayableSurface(a: ReturnType<typeof buildPhysicsCourse>[number], b: ReturnType<typeof buildPhysicsCourse>[number]) {
  return (a.denseSurfaceId !== undefined && a.denseSurfaceId === b.denseSurfaceId)
    || (a.denseRunId !== undefined && a.denseRunId === b.denseRunId)
    || (a.chordClusterId !== undefined && a.chordClusterId === b.chordClusterId);
}

describe("reference-video layout quality", () => {
  it.each(REFERENCE_VIDEO_PRESET_IDS)("keeps %s instruments in clean non-overlapping rows", (presetId) => {
    const settings = { ...DEFAULT_SETTINGS, ...presetById(presetId).settings };
    const platforms = buildPhysicsCourse(referenceStressEvents(), settings, 720, () => "#d1d5db");

    for (let currentIndex = 0; currentIndex < platforms.length; currentIndex += 1) {
      const current = platforms[currentIndex];
      if (current.visualHidden) continue;
      for (let previousIndex = Math.max(0, currentIndex - 56); previousIndex < currentIndex - 1; previousIndex += 1) {
        const previous = platforms[previousIndex];
        if (previous.visualHidden || sharesPlayableSurface(current, previous)) continue;
        const clearance = platformClearance(current, previous);
        const required = Math.max(
          platformVisualClearanceRequirement(current, previous),
          (instrumentVisualFootprint(current).thickness + instrumentVisualFootprint(previous).thickness) * 0.5 + 2,
        );
        expect(clearance, `${presetId} bodies ${previous.index}:${current.index}`).toBeGreaterThanOrEqual(required - 0.01);
      }
    }
  });

  it.each(["reference-wooden-marimba", "reference-faceted-metallophone", "reference-era-corridor"] as const)(
    "keeps the real Baby Shark course tidy in %s",
    (presetId) => {
      const bytes = readFileSync("C:\\Users\\Kai.Tran\\Music\\midi\\Pinkfong-Babyshark.mid");
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const settings = { ...DEFAULT_SETTINGS, ...presetById(presetId).settings };
      const events = buildRhythmicTimeline(parseMidi(buffer), settings);
      const platforms = buildPhysicsCourse(events, settings, 720, () => "#d1d5db");

      for (let currentIndex = 0; currentIndex < platforms.length; currentIndex += 1) {
        const current = platforms[currentIndex];
        if (current.visualHidden) continue;
        for (let previousIndex = Math.max(0, currentIndex - 56); previousIndex < currentIndex - 1; previousIndex += 1) {
          const previous = platforms[previousIndex];
          if (previous.visualHidden || sharesPlayableSurface(current, previous)) continue;
          const required = platformVisualClearanceRequirement(current, previous);
          const detail = [previous, current].map((platform) => ({
            index: platform.index,
            style: platform.visualStyle,
            x: platform.visualX ?? platform.x,
            y: platform.visualY ?? platform.y,
            width: platform.visualWidth ?? platform.width,
            thickness: platform.visualThickness ?? platform.thickness,
            denseSurfaceId: platform.denseSurfaceId,
            timeMs: platform.event.timeMs,
            hitX: platform.hitX,
            hitY: platform.hitY,
            normalX: platform.normalX,
            normalY: platform.normalY,
          }));
          expect(platformClearance(current, previous), `${presetId} ${JSON.stringify(detail)}`).toBeGreaterThanOrEqual(required - 0.01);
        }
      }
    },
    60_000,
  );
});
