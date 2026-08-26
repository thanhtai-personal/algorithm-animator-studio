import { readFileSync } from "node:fs";
import { DEFAULT_SETTINGS } from "../src/features/rhythmic-studio/defaults";
import { buildPhysicsCourse } from "../src/features/rhythmic-studio/engine/marbleCoursePlanner";
import { REFERENCE_VIDEO_PRESET_IDS } from "../src/features/rhythmic-studio/lib/referenceVideoPresets";
import { parseMidi } from "../src/features/rhythmic-studio/lib/midiParser";
import { presetById } from "../src/features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../src/features/rhythmic-studio/lib/timeline";
import type { NoteEvent } from "../src/features/rhythmic-studio/types";

const events: NoteEvent[] = Array.from({ length: 68 }, (_, index) => ({
  id: `debug-${index}`,
  timeMs: index * 140,
  midi: 48 + ((index * 7) % 32),
  velocity: 0.8,
  durationMs: 80,
  isDrum: index % 9 === 5,
}));

for (const presetId of REFERENCE_VIDEO_PRESET_IDS) {
  const settings = { ...DEFAULT_SETTINGS, ...presetById(presetId).settings };
  const course = buildPhysicsCourse(events, settings, 720, () => "#fff");
  const compact = course.filter((platform) => platform.visualCompact);
  const styles = [...new Set(compact.map((platform) => platform.visualStyle ?? "default"))];
  console.log(presetId, compact.length, styles.join(",") || "none");
}

const bytes = readFileSync("C:\\Users\\Kai.Tran\\Music\\midi\\Pinkfong-Babyshark.mid");
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const babyEvents = buildRhythmicTimeline(parseMidi(buffer), DEFAULT_SETTINGS);
for (const presetId of ["reference-wooden-marimba", "reference-faceted-metallophone", "reference-era-corridor"]) {
  const settings = { ...DEFAULT_SETTINGS, ...presetById(presetId).settings };
  const course = buildPhysicsCourse(babyEvents, settings, 720, () => "#fff");
  const compact = course.filter((platform) => platform.visualCompact);
  const groups = compact.reduce<Record<string, number>>((result, platform) => {
    const key = `${platform.visualStyle ?? "default"}:${platform.denseRunId === undefined ? "ordinary" : "dense"}`;
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  console.log(`baby:${presetId}`, compact.length, JSON.stringify(groups));
}
