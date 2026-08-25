import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { prepareMarbleCourse } from "../features/rhythmic-studio/engine/marbleCoursePreparation";
import { createMarbleCourseWorkerPayload } from "../features/rhythmic-studio/engine/marbleCourseWorkerPayload";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { platformsMountedFor3D } from "../features/rhythmic-studio/lib/platformViewport";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";

describe("SuperMarioMakerTitleTheme.mid import regression", () => {
  let sourceCount = 0;
  let timelineCount = 0;
  let platforms: MarblePlatform[] = [];

  beforeAll(() => {
    const bytes = readFileSync(resolve("src/assets/audios/midis/SuperMarioMakerTitleTheme.mid"));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const notes = parseMidi(buffer);
    const events = buildRhythmicTimeline(notes, DEFAULT_SETTINGS);
    const input = createMarbleCourseWorkerPayload({
      events,
      settings: DEFAULT_SETTINGS,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 1,
    });
    sourceCount = notes.length;
    timelineCount = events.length;
    platforms = prepareMarbleCourse(input).platforms;
  }, 10_000);

  it("parses and prepares the exact user MIDI without dropping the preview course", () => {
    expect(sourceCount).toBe(881);
    expect(timelineCount).toBe(528);
    expect(platforms).toHaveLength(timelineCount);
    expect(DEFAULT_SETTINGS.midiInstrumentMode).toBe("auto");
    expect(new Set(platforms.map((platform) => platform.event.program))).toEqual(new Set([4, 33, 48]));
    const stylesByProgram = (program: number) => new Set(
      platforms
        .filter((platform) => platform.event.program === program && platform.chordClusterId === undefined)
        .map((platform) => platform.visualStyle),
    );
    expect(stylesByProgram(4)).toEqual(new Set(["piano-key"]));
    expect(stylesByProgram(33)).toEqual(new Set(["pluck-pad"]));
    expect(stylesByProgram(48)).toEqual(new Set(["instrument-wire"]));
  });

  it("does not mount the full 149-second WebGL course on its first frame", () => {
    const mounted = platformsMountedFor3D(platforms, 0);
    expect(mounted.length).toBeGreaterThan(12);
    expect(mounted.length).toBeLessThan(80);
  });
});
