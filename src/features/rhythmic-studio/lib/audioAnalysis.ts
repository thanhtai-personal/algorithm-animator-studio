import type { NoteEvent } from "../types";
import { detectAudioOnsets } from "../engine/audioOnsetDetector";

export async function analyzeAudioFile(file: File): Promise<{ buffer: AudioBuffer; events: NoteEvent[] }> {
  const context = new AudioContext();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const events = detectAudioOnsets(decoded);
    return { buffer: decoded, events };
  } finally {
    await context.close();
  }
}
