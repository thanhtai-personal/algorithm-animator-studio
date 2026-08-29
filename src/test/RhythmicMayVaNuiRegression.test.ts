import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { prepareMarbleCourse } from "../features/rhythmic-studio/engine/marbleCoursePreparation";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { buildAutomaticInstrumentMix } from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import { platformsMountedFor3D } from "../features/rhythmic-studio/lib/platformViewport";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";

const MIDI_PATH = "C:\\Users\\Kai.Tran\\Music\\midi\\May Va Nui.mid";

describe("May Va Nui.mid mixed-instrument regression", () => {
  it("keeps the long arrangement on its lead melody after the intro", () => {
    const bytes = readFileSync(MIDI_PATH);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const sourceEvents = parseMidi(buffer);
    const settings = { ...DEFAULT_SETTINGS, ...presetById("mixed-instruments").settings };
    const timeline = buildRhythmicTimeline(sourceEvents, settings);
    const leadStartMs = Math.min(
      ...sourceEvents.filter((event) => event.channel === 0).map((event) => event.timeMs),
    );
    const melodySection = timeline.filter((event) => event.timeMs >= leadStartMs);

    expect(sourceEvents).toHaveLength(6_815);
    expect(timeline.length).toBeLessThan(600);
    expect(melodySection.length).toBeGreaterThan(400);
    expect(melodySection.every((event) => event.channel === 0)).toBe(true);
  });

  it("keeps the active 3D instrument window bounded throughout the long song", () => {
    const bytes = readFileSync(MIDI_PATH);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const sourceEvents = parseMidi(buffer);
    const settings = { ...DEFAULT_SETTINGS, ...presetById("mixed-instruments").settings };
    const timeline = buildRhythmicTimeline(sourceEvents, settings);
    const instrumentMixSegments = buildAutomaticInstrumentMix(timeline);
    const course = prepareMarbleCourse({
      events: timeline,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 1,
      instrumentMixSegments,
    });
    const maximumMounted = Math.max(
      ...course.platforms.map((platform) => (
        platformsMountedFor3D(course.platforms, platform.index, settings).length
      )),
    );

    expect(maximumMounted).toBeLessThan(80);
  });
});
