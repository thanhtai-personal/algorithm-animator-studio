import type { NoteEvent } from "../types";

export interface OnsetDetectorOptions {
  minGapMs?: number;
  sensitivity?: number;
  maxEvents?: number;
}

interface FrameAnalysis {
  energy: Float32Array;
  flux: Float32Array;
  hop: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function monoSamples(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const mono = new Float32Array(length);
  if (!channels) return mono;
  for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
    const source = buffer.getChannelData(channelIndex);
    for (let i = 0; i < length; i += 1) mono[i] += source[i] / channels;
  }
  return mono;
}

function analyzeFrames(samples: Float32Array, sampleRate: number): FrameAnalysis {
  const frameSize = Math.max(512, 2 ** Math.round(Math.log2(sampleRate * 0.012)));
  const hop = Math.max(128, Math.floor(frameSize / 2));
  const frameCount = Math.max(0, Math.floor((samples.length - frameSize) / hop) + 1);
  const energy = new Float32Array(frameCount);
  const flux = new Float32Array(frameCount);
  let previousRms = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hop;
    let sumSquares = 0;
    let positiveDelta = 0;
    for (let i = 0; i < frameSize; i += 1) {
      const value = samples[start + i] ?? 0;
      sumSquares += value * value;
      if (i > 0) positiveDelta += Math.max(0, Math.abs(value) - Math.abs(samples[start + i - 1] ?? 0));
    }
    const rms = Math.sqrt(sumSquares / frameSize);
    energy[frame] = rms;
    const energyRise = Math.max(0, rms - previousRms);
    flux[frame] = energyRise * 0.74 + (positiveDelta / frameSize) * 0.26;
    previousRms = rms;
  }
  return { energy, flux, hop };
}

function percentile(values: Float32Array, ratio: number) {
  if (!values.length) return 0;
  const sorted = Array.from(values).sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * ratio)))] ?? 0;
}

function localMean(values: Float32Array, index: number, radius: number) {
  const start = Math.max(0, index - radius);
  const end = Math.min(values.length, index + radius + 1);
  let sum = 0;
  for (let i = start; i < end; i += 1) sum += values[i];
  return sum / Math.max(1, end - start);
}

export function detectAudioOnsets(buffer: AudioBuffer, options: OnsetDetectorOptions = {}): NoteEvent[] {
  const sampleRate = buffer.sampleRate;
  const { energy, flux, hop } = analyzeFrames(monoSamples(buffer), sampleRate);
  if (energy.length < 3) return [];

  const minGapMs = options.minGapMs ?? 130;
  const sensitivity = clamp(options.sensitivity ?? 0.48, 0.05, 0.95);
  const maxEvents = options.maxEvents ?? 5000;
  const medianEnergy = percentile(energy, 0.5);
  const upperEnergy = percentile(energy, 0.88);
  const medianFlux = percentile(flux, 0.5);
  const upperFlux = percentile(flux, 0.86);
  const silenceFloor = Math.max(0.0025, medianEnergy * 1.28, upperEnergy * 0.055);
  const absoluteFluxFloor = Math.max(0.00012, medianFlux * 1.4, upperFlux * 0.075);
  const localRadius = Math.max(5, Math.round((sampleRate / hop) * 0.22));
  const thresholdMultiplier = 1.22 + sensitivity * 1.7;
  const scale = [60, 62, 64, 67, 69, 72, 74, 76];
  const events: NoteEvent[] = [];
  let lastMs = -Infinity;

  for (let frame = 2; frame < flux.length - 2; frame += 1) {
    const value = flux[frame];
    if (energy[frame] < silenceFloor || value < absoluteFluxFloor) continue;
    const threshold = Math.max(absoluteFluxFloor, localMean(flux, frame, localRadius) * thresholdMultiplier);
    const localPeak = value >= flux[frame - 1] && value >= flux[frame + 1] && value >= flux[frame - 2] && value >= flux[frame + 2];
    if (!localPeak || value <= threshold) continue;

    const timeMs = (frame * hop / sampleRate) * 1000;
    if (timeMs - lastMs < minGapMs) {
      const previous = events[events.length - 1];
      if (previous && value > (previous.velocity - 0.45) * upperFlux * 2.4) {
        previous.timeMs = timeMs;
        previous.velocity = clamp(0.52 + value / Math.max(upperFlux, 1e-6) * 0.34, 0.52, 1);
        lastMs = timeMs;
      }
      continue;
    }

    const strength = clamp(value / Math.max(upperFlux, absoluteFluxFloor), 0, 1.4);
    events.push({
      id: `audio-${events.length}`,
      timeMs,
      midi: scale[events.length % scale.length],
      velocity: clamp(0.48 + strength * 0.37, 0.48, 1),
      durationMs: 160,
    });
    lastMs = timeMs;
    if (events.length >= maxEvents) break;
  }

  return events;
}
