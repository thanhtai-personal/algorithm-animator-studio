import manifest from "../../../docs/video-references/math-sincos-v1.scene-manifest.json";
import { clamp01, ease } from "./mathGeometry";

export type MathReferenceBeat = (typeof manifest.referenceBeats)[number];
export const REFERENCE_BEATS: readonly MathReferenceBeat[] = manifest.referenceBeats;

/** Frame-based cues always come from the reference manifest, not a second timeline. */
export function referenceBeatAt(frame: number): MathReferenceBeat {
  if (frame < REFERENCE_BEATS[0].startFrame) return REFERENCE_BEATS[0];
  return REFERENCE_BEATS.find((cue) => frame >= cue.startFrame && frame < cue.endFrame)
    ?? REFERENCE_BEATS[REFERENCE_BEATS.length - 1];
}

export function beatState(frame: number) {
  const cue = referenceBeatAt(frame);
  const duration = Math.max(1, cue.endFrame - cue.startFrame);
  const local = Math.max(0, Math.min(duration, frame - cue.startFrame));
  return { cue, local, duration, t: clamp01(local / duration), intro: ease(clamp01(local / 22)) };
}
