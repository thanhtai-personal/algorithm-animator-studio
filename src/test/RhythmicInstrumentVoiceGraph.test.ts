import { describe, expect, it } from "vitest";
import { playSynthVoice } from "../features/rhythmic-studio/lib/synthVoices";
import type { SynthPreset } from "../features/rhythmic-studio/types";

interface VoiceGraphEvent {
  kind: "oscillator" | "noise";
  start: number;
  stop: number;
  frequency?: number;
  oscillatorType?: OscillatorType;
}

class FakeParam {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
}

class FakeNode {
  connect() { return this; }
  disconnect() {}
}

function voiceSignature(preset: SynthPreset) {
  const graph: VoiceGraphEvent[] = [];
  const context = {
    currentTime: 0,
    sampleRate: 48_000,
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBiquadFilter: () => Object.assign(new FakeNode(), { type: "lowpass", frequency: new FakeParam(), Q: new FakeParam() }),
    createStereoPanner: () => Object.assign(new FakeNode(), { pan: new FakeParam() }),
    createOscillator: () => {
      const node = Object.assign(new FakeNode(), {
        type: "sine" as OscillatorType,
        frequency: new FakeParam(),
        detune: new FakeParam(),
        startTime: 0,
        start(when: number) { node.startTime = when; },
        stop(when: number) {
          graph.push({ kind: "oscillator", start: node.startTime, stop: when, frequency: node.frequency.value, oscillatorType: node.type });
        },
      });
      return node;
    },
    createBuffer: (_channels: number, frames: number) => ({
      getChannelData: () => new Float32Array(frames),
    }),
    createBufferSource: () => {
      const node = Object.assign(new FakeNode(), {
        buffer: null,
        startTime: 0,
        start(when: number) { node.startTime = when; },
        stop(when: number) { graph.push({ kind: "noise", start: node.startTime, stop: when }); },
      });
      return node;
    },
  };

  playSynthVoice(context as unknown as AudioContext, new FakeNode() as unknown as AudioNode, 60, 0.8, 1_200, preset);
  return {
    oscillators: graph.filter((event) => event.kind === "oscillator").length,
    noiseBursts: graph.filter((event) => event.kind === "noise").length,
    maxStop: Math.max(...graph.map((event) => event.stop)),
    frequencies: graph.filter((event) => event.frequency).map((event) => Math.round(event.frequency ?? 0)),
  };
}

describe("instrument-specific Web Audio voice graphs", () => {
  it("builds observably different drum, cymbal, gong and flute voices", () => {
    const signatures = (["tom", "cymbal", "gong", "flute"] as const).map(voiceSignature);
    expect(new Set(signatures.map((item) => JSON.stringify(item))).size).toBe(4);
  });

  it("gives each requested instrument its defining envelope/source shape", () => {
    const drum = voiceSignature("tom");
    const cymbal = voiceSignature("cymbal");
    const gong = voiceSignature("gong");
    const flute = voiceSignature("flute");

    expect(drum.noiseBursts).toBeGreaterThan(0);
    expect(drum.maxStop).toBeLessThan(0.8);
    expect(cymbal.noiseBursts).toBeGreaterThan(0);
    expect(cymbal.oscillators).toBeGreaterThanOrEqual(4);
    expect(gong.maxStop).toBeGreaterThan(2);
    expect(gong.oscillators).toBeGreaterThan(cymbal.oscillators);
    expect(flute.noiseBursts).toBeGreaterThan(0);
    expect(flute.maxStop).toBeGreaterThan(1);
  });
});
