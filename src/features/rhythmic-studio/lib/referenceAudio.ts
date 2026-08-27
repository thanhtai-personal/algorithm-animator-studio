import { BUILTIN_MELODIES, KOROBEINIKI_MELODY_NAME } from "../defaults";
import type { RhythmicPresetId } from "./studioPresets";

const KOROBEINIKI_PRESET_ID: RhythmicPresetId = "reference-korobeiniki-tubes";
const KOROBEINIKI_REFERENCE_DURATION_MS = 14_889.796;
const REFERENCE_DURATION_TOLERANCE_MS = 220;

interface ReferenceAudioMatchInput {
  activePresetId: RhythmicPresetId | null;
  fileName: string;
  durationMs: number;
}

export function referenceEventsForImportedAudio(input: ReferenceAudioMatchInput) {
  if (input.activePresetId !== KOROBEINIKI_PRESET_ID) return null;
  const normalizedName = input.fileName.toLowerCase();
  const namedReference = normalizedName.includes("txxhsu15xu8");
  const matchedDuration = Math.abs(input.durationMs - KOROBEINIKI_REFERENCE_DURATION_MS)
    <= REFERENCE_DURATION_TOLERANCE_MS;
  if (!namedReference && !matchedDuration) return null;
  return BUILTIN_MELODIES[KOROBEINIKI_MELODY_NAME].map((event) => ({ ...event }));
}
