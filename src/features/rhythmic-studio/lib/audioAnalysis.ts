import type { NoteEvent } from '../types';

export async function analyzeAudioFile(file: File): Promise<{ buffer: AudioBuffer; events: NoteEvent[] }> {
  const context = new AudioContext();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const channel = decoded.getChannelData(0);
    const sampleRate = decoded.sampleRate;
    const windowSize = Math.max(512, Math.floor(sampleRate * 0.02));
    const hop = Math.floor(windowSize / 2);
    const energies: number[] = [];
    for (let start = 0; start + windowSize < channel.length; start += hop) {
      let sum = 0;
      for (let i = 0; i < windowSize; i += 1) sum += channel[start + i] * channel[start + i];
      energies.push(Math.sqrt(sum / windowSize));
    }
    const sorted = [...energies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length * 0.5)] ?? 0.02;
    const peakRef = sorted[Math.floor(sorted.length * 0.9)] ?? median;
    const silenceFloor = Math.max(0.018, median * 1.55);
    const strongPeakFloor = Math.max(silenceFloor * 1.12, peakRef * 0.14);
    const events: NoteEvent[] = [];
    const minGapMs = 180;
    let lastMs = -Infinity;
    const scale = [60, 62, 64, 67, 69, 72, 74, 76];
    for (let i = 3; i < energies.length - 2; i += 1) {
      const local = (energies[i - 3] + energies[i - 2] + energies[i - 1]) / 3;
      const threshold = Math.max(0.02, local * 1.35);
      const energy = energies[i];
      const isPeak = energy > threshold && energy >= energies[i - 1] && energy >= energies[i + 1];
      if (!isPeak || energy < strongPeakFloor) continue;
      const timeMs = (i * hop / sampleRate) * 1000;
      if (timeMs - lastMs < minGapMs) continue;
      const normalized = Math.min(1, energy / Math.max(0.05, threshold * 2.2));
      events.push({
        id: `audio-${events.length}`,
        timeMs,
        midi: scale[events.length % scale.length],
        velocity: 0.5 + normalized * 0.5,
        durationMs: 180,
      });
      lastMs = timeMs;
      if (events.length >= 800) break;
    }
    if (events.length < 2) {
      const durationMs = decoded.duration * 1000;
      for (let t = 0, i = 0; t < durationMs; t += 500, i += 1) {
        events.push({ id: `fallback-${i}`, timeMs: t, midi: scale[i % scale.length], velocity: 0.65, durationMs: 180 });
      }
    }
    return { buffer: decoded, events };
  } finally {
    await context.close();
  }
}
