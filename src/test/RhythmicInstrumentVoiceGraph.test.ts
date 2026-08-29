import { describe, expect, it, vi } from "vitest";
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
  disconnected = false;
  connect() { return this; }
  disconnect() { this.disconnected = true; }
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
  it("disconnects a completed voice from the live audio bus", () => {
    vi.useFakeTimers();
    try {
      const panners: FakeNode[] = [];
      const context = {
        currentTime: 0,
        sampleRate: 48_000,
        createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
        createBiquadFilter: () => Object.assign(new FakeNode(), { type: "lowpass", frequency: new FakeParam(), Q: new FakeParam() }),
        createStereoPanner: () => {
          const panner = Object.assign(new FakeNode(), { pan: new FakeParam() });
          panners.push(panner);
          return panner;
        },
        createOscillator: () => Object.assign(new FakeNode(), {
          type: "sine" as OscillatorType,
          frequency: new FakeParam(),
          detune: new FakeParam(),
          start: () => undefined,
          stop: () => undefined,
        }),
      };

      playSynthVoice(
        context as unknown as AudioContext,
        new FakeNode() as unknown as AudioNode,
        60,
        0.8,
        1_200,
        "piano",
      );
      expect(panners[0]?.disconnected).toBe(false);

      vi.advanceTimersByTime(6_000);

      expect(panners[0]?.disconnected).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("builds distinct trumpet, guitar and Vietnamese bronze drum voices", () => {
    const signatures = (["trumpet", "guitar", "bronze-drum"] as const).map(voiceSignature);
    expect(new Set(signatures.map((item) => JSON.stringify(item))).size).toBe(3);
    expect(signatures[0].oscillators).toBeGreaterThanOrEqual(2);
    expect(signatures[1].maxStop).toBeLessThan(1.2);
    expect(signatures[2].maxStop).toBeGreaterThan(1.5);
  });

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
