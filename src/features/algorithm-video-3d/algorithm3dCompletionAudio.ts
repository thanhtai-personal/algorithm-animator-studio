import { audioEngine } from "@/lib/audio";

type CompletionNote = {
  delayMs: number;
  kind: "marimba" | "piano" | "swap-spark";
  pitch: number;
};

/**
 * Short celebratory run modeled after the reference video's ~1.3s ending cue.
 * It uses the existing SFX bus so preview and MediaRecorder export receive
 * exactly the same signal without introducing a new audio asset dependency.
 */
const COMPLETION_NOTES: readonly CompletionNote[] = [
  { delayMs: 0, kind: "marimba", pitch: 0.30 },
  { delayMs: 180, kind: "marimba", pitch: 0.44 },
  { delayMs: 360, kind: "marimba", pitch: 0.58 },
  { delayMs: 540, kind: "marimba", pitch: 0.72 },
  { delayMs: 720, kind: "marimba", pitch: 0.88 },
  { delayMs: 980, kind: "piano", pitch: 0.82 },
  { delayMs: 980, kind: "swap-spark", pitch: 0.92 },
];

export const ALGORITHM_3D_COMPLETION_JINGLE_SECONDS = 1.35;

export function playAlgorithm3DCompletionJingle() {
  for (const note of COMPLETION_NOTES) {
    if (note.delayMs === 0) {
      audioEngine.playSfx(note.kind, note.pitch);
      continue;
    }
    window.setTimeout(() => audioEngine.playSfx(note.kind, note.pitch), note.delayMs);
  }
}
