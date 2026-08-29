import type { NoteEvent, SynthPreset } from "../types";

const EPSILON = 0.0001;
const noiseBufferCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();

export interface SynthVoiceOptions {
  when?: number;
  brightness?: number;
  stereoWidth?: number;
  gainScale?: number;
}

function midiToHz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function voiceOutput(context: AudioContext, bus: AudioNode, midi: number, options: SynthVoiceOptions) {
  const filter = context.createBiquadFilter();
  const brightness = Math.max(0, Math.min(1, options.brightness ?? 0.62));
  filter.type = "lowpass";
  filter.frequency.value = 2600 + brightness * 11800;
  filter.Q.value = 0.45 + brightness * 0.8;
  const pan = context.createStereoPanner();
  pan.pan.value = Math.sin(midi * 0.73) * Math.max(0, Math.min(1, options.stereoWidth ?? 0.3));
  filter.connect(pan);
  pan.connect(bus);
  return filter;
}

function envelope(context: AudioContext, target: AudioNode, when: number, peak: number, attack: number, hold: number, release: number) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(EPSILON, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(EPSILON, peak), when + attack);
  gain.gain.setValueAtTime(Math.max(EPSILON, peak * 0.9), when + attack + hold);
  gain.gain.exponentialRampToValueAtTime(EPSILON, when + attack + hold + release);
  gain.connect(target);
  return gain;
}

function osc(context: AudioContext, target: AudioNode, when: number, frequency: number, duration: number, type: OscillatorType, gain = 1, detune = 0) {
  const oscillator = context.createOscillator();
  const level = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), when);
  oscillator.detune.value = detune;
  level.gain.value = gain;
  oscillator.connect(level);
  level.connect(target);
  oscillator.start(when);
  oscillator.stop(when + Math.max(0.04, duration));
  return oscillator;
}

function noise(context: AudioContext, seconds: number) {
  const frames = Math.max(1, Math.ceil(context.sampleRate * seconds));
  let contextCache = noiseBufferCache.get(context);
  if (!contextCache) {
    contextCache = new Map();
    noiseBufferCache.set(context, contextCache);
  }
  let buffer = contextCache.get(frames);
  if (!buffer) {
    buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    const fadeFrames = Math.max(8, Math.min(Math.round(context.sampleRate * 0.008), Math.floor(frames / 3)));
    for (let i = 0; i < frames; i += 1) {
      const edge = Math.min(1, i / fadeFrames, (frames - 1 - i) / fadeFrames);
      data[i] = (Math.random() * 2 - 1) * Math.max(0, edge);
    }
    contextCache.set(frames, buffer);
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}

function noiseBurst(context: AudioContext, target: AudioNode, when: number, duration: number, peak: number, type: BiquadFilterType, frequency: number, q = 0.8) {
  const source = noise(context, duration);
  const filter = context.createBiquadFilter();
  const env = envelope(context, target, when, peak, 0.009, 0.004, Math.max(0.03, duration - 0.013));
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, when);
  filter.Q.value = q;
  source.connect(filter);
  filter.connect(env);
  source.start(when);
  source.stop(when + duration);
}

function partials(context: AudioContext, target: AudioNode, when: number, hz: number, duration: number, peak: number, values: Array<[number, number, OscillatorType]>, attack = 0.006) {
  const env = envelope(context, target, when, peak, attack, Math.min(0.045, duration * 0.08), Math.max(0.04, duration - attack));
  values.forEach(([ratio, level, type], index) => osc(context, env, when, hz * ratio, duration + index * 0.012, type, level, index % 2 ? 2.5 : -1.5));
}

function pianoVoice(context: AudioContext, target: AudioNode, when: number, hz: number, duration: number, peak: number) {
  const env = envelope(context, target, when, peak, 0.009, 0.02, Math.min(1.55, Math.max(0.26, duration * 1.18)));
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(9800, 2600 + hz * 5.5), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(850, 1200 + hz * 1.6), when + Math.min(0.9, duration));
  filter.Q.value = 0.7;
  filter.connect(env);
  osc(context, filter, when, hz, duration + 0.9, "triangle", 0.78, -2.5);
  osc(context, filter, when, hz, duration + 0.82, "sine", 0.5, 2.2);
  osc(context, filter, when, hz * 2, duration + 0.56, "sine", 0.13);
}

function bassVoice(context: AudioContext, target: AudioNode, when: number, hz: number, duration: number, peak: number) {
  const sustain = Math.max(0.24, Math.min(1.8, duration));
  const env = envelope(context, target, when, peak * 0.92, 0.006, sustain * 0.68, 0.24);
  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.setValueAtTime(Math.min(1800, 420 + hz * 5.2), when);
  body.frequency.exponentialRampToValueAtTime(Math.max(260, 240 + hz * 1.8), when + sustain);
  body.Q.value = 0.86;
  body.connect(env);
  osc(context, body, when, hz, sustain + 0.28, "triangle", 0.84, -2.5);
  osc(context, body, when, hz, sustain + 0.24, "sawtooth", 0.16, 2.5);
  osc(context, body, when, hz * 0.5, sustain + 0.2, "sine", 0.18);
}

function stringsVoice(context: AudioContext, target: AudioNode, when: number, hz: number, duration: number, peak: number) {
  const sustain = Math.max(0.34, Math.min(2.4, duration + 0.2));
  const env = envelope(context, target, when, peak * 0.72, 0.045, Math.max(0.12, sustain * 0.72), 0.36);
  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = Math.min(6200, 1600 + hz * 4.2);
  body.Q.value = 0.48;
  body.connect(env);
  osc(context, body, when, hz, sustain + 0.38, "sawtooth", 0.24, -7);
  osc(context, body, when, hz, sustain + 0.38, "sawtooth", 0.24, 7);
  osc(context, body, when, hz, sustain + 0.32, "triangle", 0.5);
  osc(context, body, when, hz * 2, sustain + 0.22, "sine", 0.08);
}

function malletVoice(context: AudioContext, target: AudioNode, when: number, hz: number, peak: number, kind: "marimba" | "kalimba" | "wood") {
  const duration = kind === "wood" ? 0.12 : kind === "marimba" ? 0.52 : 0.74;
  const env = envelope(context, target, when, peak, kind === "wood" ? 0.005 : 0.006, 0.006, duration);
  const body = context.createBiquadFilter();
  body.type = "bandpass";
  body.frequency.value = kind === "wood" ? Math.max(680, hz * 2.4) : hz;
  body.Q.value = kind === "wood" ? 3.8 : 2.1;
  body.connect(env);
  osc(context, body, when, kind === "wood" ? Math.max(650, hz * 2.2) : hz, duration + 0.08, "sine", 1);
  osc(context, body, when, hz * (kind === "marimba" ? 4 : 2.02), duration * 0.72, "sine", kind === "wood" ? 0.1 : 0.14);
}

function percussion(context: AudioContext, target: AudioNode, when: number, preset: SynthPreset, peak: number) {
  if (preset === "kick") {
    const env = envelope(context, target, when, peak * 0.84, 0.002, 0.008, 0.38);
    const body = osc(context, env, when, 132, 0.43, "sine", 1);
    body.frequency.exponentialRampToValueAtTime(46, when + 0.28);
    return;
  }
  if (preset === "snare") {
    noiseBurst(context, target, when, 0.19, peak * 0.55, "highpass", 1550, 0.72);
    partials(context, target, when, 178, 0.12, peak * 0.16, [[1, 1, "triangle"]], 0.002);
    return;
  }
  if (preset === "clap") {
    [0, 0.026, 0.052].forEach((offset, i) => noiseBurst(context, target, when + offset, 0.075, peak * (0.28 - i * 0.035), "bandpass", 1850, 0.72));
    return;
  }
  if (preset === "hihat") {
    noiseBurst(context, target, when, 0.085, peak * 0.3, "highpass", 7200, 0.48);
    return;
  }
  noiseBurst(context, target, when, 0.25, peak * 0.34, "lowpass", 920, 1.1);
  const env = envelope(context, target, when, peak * 0.43, 0.002, 0.008, 0.32);
  const body = osc(context, env, when, 88, 0.36, "sine", 1);
  body.frequency.exponentialRampToValueAtTime(39, when + 0.28);
}

function tomVoice(context: AudioContext, target: AudioNode, when: number, hz: number, peak: number) {
  noiseBurst(context, target, when, 0.11, peak * 0.22, "bandpass", 1250, 0.9);
  const env = envelope(context, target, when, peak * 0.8, 0.002, 0.01, 0.38);
  const body = osc(context, env, when, Math.max(92, hz * 0.68), 0.44, "sine", 1);
  body.frequency.exponentialRampToValueAtTime(Math.max(56, hz * 0.34), when + 0.3);
}

function cymbalVoice(context: AudioContext, target: AudioNode, when: number, hz: number, peak: number) {
  noiseBurst(context, target, when, 0.7, peak * 0.34, "highpass", 4800, 0.54);
  partials(context, target, when, Math.max(520, hz * 2.1), 0.62, peak * 0.28, [
    [1, 1, "square"],
    [1.37, 0.5, "square"],
    [1.91, 0.31, "triangle"],
    [2.63, 0.18, "square"],
    [3.89, 0.09, "triangle"],
  ], 0.0015);
}

function gongVoice(context: AudioContext, target: AudioNode, when: number, hz: number, peak: number) {
  noiseBurst(context, target, when, 0.16, peak * 0.1, "bandpass", 1100, 0.72);
  partials(context, target, when, Math.max(72, hz * 0.52), 2.65, peak * 0.72, [
    [1, 1, "sine"],
    [1.41, 0.5, "sine"],
    [1.93, 0.36, "triangle"],
    [2.58, 0.24, "sine"],
    [3.17, 0.17, "triangle"],
    [4.06, 0.1, "sine"],
    [5.43, 0.055, "sine"],
  ], 0.018);
}

function fluteVoice(context: AudioContext, target: AudioNode, when: number, hz: number, duration: number, peak: number) {
  noiseBurst(context, target, when, 0.13, peak * 0.12, "bandpass", Math.min(6400, hz * 8), 0.58);
  const sustain = Math.max(0.42, duration + 0.22);
  const env = envelope(context, target, when, peak * 0.76, 0.055, Math.max(0.08, duration * 0.64), 0.28);
  const carrier = osc(context, env, when, hz, sustain, "sine", 0.9);
  osc(context, env, when, hz * 2, sustain * 0.94, "sine", 0.1, 1.2);
  const vibrato = context.createOscillator();
  const depth = context.createGain();
  vibrato.frequency.value = 5.1;
  depth.gain.value = Math.min(5.5, hz * 0.012);
  vibrato.connect(depth);
  depth.connect(carrier.frequency);
  vibrato.start(when + 0.08);
  vibrato.stop(when + sustain);
}

function trumpetVoice(context: AudioContext, target: AudioNode, when: number, hz: number, duration: number, peak: number) {
  const sustain = Math.max(0.38, Math.min(1.8, duration + 0.16));
  const env = envelope(context, target, when, peak * 0.78, 0.035, sustain * 0.72, 0.24);
  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.setValueAtTime(Math.min(8_600, 2_200 + hz * 7), when);
  body.Q.value = 1.2;
  body.connect(env);
  osc(context, body, when, hz, sustain + 0.25, "sawtooth", 0.42, -4);
  osc(context, body, when, hz, sustain + 0.25, "square", 0.16, 4);
  osc(context, body, when, hz * 2, sustain + 0.18, "triangle", 0.12);
}

function guitarVoice(context: AudioContext, target: AudioNode, when: number, hz: number, peak: number) {
  noiseBurst(context, target, when, 0.045, peak * 0.08, "highpass", 2_800, 0.52);
  const env = envelope(context, target, when, peak * 0.82, 0.002, 0.01, 0.62);
  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.setValueAtTime(Math.min(7_200, 1_400 + hz * 5.4), when);
  body.frequency.exponentialRampToValueAtTime(Math.max(680, hz * 2.2), when + 0.55);
  body.Q.value = 1.4;
  body.connect(env);
  osc(context, body, when, hz, 0.76, "sawtooth", 0.36, -2.5);
  osc(context, body, when, hz, 0.72, "triangle", 0.66, 2.5);
}

function bronzeDrumVoice(context: AudioContext, target: AudioNode, when: number, hz: number, peak: number) {
  noiseBurst(context, target, when, 0.2, peak * 0.13, "bandpass", 780, 0.84);
  partials(context, target, when, Math.max(58, hz * 0.42), 2.35, peak * 0.78, [
    [1, 1, "sine"],
    [1.47, 0.48, "triangle"],
    [2.12, 0.31, "sine"],
    [2.76, 0.2, "triangle"],
    [3.68, 0.11, "sine"],
    [5.2, 0.05, "sine"],
  ], 0.009);
}

function sweep(context: AudioContext, target: AudioNode, when: number, preset: SynthPreset, hz: number, peak: number) {
  if (preset === "laser") {
    const env = envelope(context, target, when, peak * 0.38, 0.002, 0.01, 0.28);
    const body = osc(context, env, when, Math.max(660, hz * 3.2), 0.32, "sawtooth", 0.5);
    body.frequency.exponentialRampToValueAtTime(Math.max(95, hz * 0.55), when + 0.28);
    return;
  }
  const source = noise(context, 0.5);
  const filter = context.createBiquadFilter();
  const env = envelope(context, target, when, peak * 0.27, 0.035, 0.04, 0.42);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(420, when);
  filter.frequency.exponentialRampToValueAtTime(3800, when + 0.36);
  filter.Q.value = 0.72;
  source.connect(filter); filter.connect(env); source.start(when); source.stop(when + 0.5);
}

export function presetForMidiEvent(event: NoteEvent): SynthPreset {
  if (event.isDrum) {
    if ([35, 36].includes(event.midi)) return "kick";
    if ([38, 39, 40].includes(event.midi)) return "snare";
    if ([42, 44, 46].includes(event.midi)) return "hihat";
    if ([49, 51, 52, 55, 57, 59].includes(event.midi)) return "metal-hit";
    return "woodblock";
  }
  const program = Math.max(0, Math.min(127, event.program ?? 0));
  if (program <= 7) return program <= 3 ? "piano" : "fm";
  if (program <= 15) return program <= 11 ? "vibraphone" : "marimba";
  if (program <= 23) return "chime";
  if (program <= 31) return "pluck";
  if (program <= 39) return "bass";
  if (program <= 55) return "strings";
  if (program <= 63) return "trumpet";
  if (program <= 79) return "flute";
  if (program <= 95) return program <= 87 ? "fm" : "glass";
  if (program <= 103) return "sparkle";
  if (program <= 111) return program <= 107 ? "kalimba" : "marimba";
  if (program <= 119) return program % 2 ? "metal-hit" : "woodblock";
  return program % 3 === 0 ? "sparkle" : program % 3 === 1 ? "laser" : "impact";
}

export function playSynthVoice(context: AudioContext, bus: AudioNode, midi: number, velocity: number, durationMs: number, preset: SynthPreset, options: SynthVoiceOptions = {}) {
  const when = Math.max(context.currentTime, options.when ?? context.currentTime);
  const hz = midiToHz(midi);
  const duration = Math.max(0.08, Math.min(2.6, durationMs / 1000));
  const gainScale = Math.max(0.02, options.gainScale ?? 1);
  const peak = Math.max(0.025, Math.min(1, velocity)) * 0.24 * gainScale;
  const target = voiceOutput(context, bus, midi, options);

  if (["kick", "snare", "clap", "hihat", "impact"].includes(preset)) return percussion(context, target, when, preset, peak);
  if (preset === "laser" || preset === "whoosh") return sweep(context, target, when, preset, hz, peak);
  if (preset === "tom") return tomVoice(context, target, when, hz, peak);
  if (preset === "cymbal") return cymbalVoice(context, target, when, hz, peak);
  if (preset === "gong") return gongVoice(context, target, when, hz, peak);
  if (preset === "flute") return fluteVoice(context, target, when, hz, duration, peak);
  if (preset === "trumpet") return trumpetVoice(context, target, when, hz, duration, peak);
  if (preset === "guitar") return guitarVoice(context, target, when, hz, peak);
  if (preset === "bronze-drum") return bronzeDrumVoice(context, target, when, hz, peak);

  if (preset === "piano") pianoVoice(context, target, when, hz, duration, peak);
  else if (preset === "bass") bassVoice(context, target, when, hz, duration, peak);
  else if (preset === "strings") stringsVoice(context, target, when, hz, duration, peak);
  else if (preset === "fm") {
    const env = envelope(context, target, when, peak, 0.006, 0.018, Math.max(0.24, duration));
    const carrier = osc(context, env, when, hz, duration + 0.18, "sine", 0.9);
    const mod = context.createOscillator(); const amount = context.createGain();
    mod.frequency.value = hz * 1.995; amount.gain.value = Math.min(420, hz * 0.46);
    mod.connect(amount); amount.connect(carrier.frequency); mod.start(when); mod.stop(when + duration + 0.18);
  } else if (preset === "vibraphone") partials(context, target, when, hz, Math.max(0.62, duration), peak, [[1, 1, "sine"], [3.01, 0.13, "sine"], [4.02, 0.05, "sine"]]);
  else if (preset === "bell") partials(context, target, when, hz, Math.max(0.9, duration), peak, [[1, 1, "sine"], [2.71, 0.28, "sine"], [4.08, 0.12, "sine"], [5.41, 0.05, "sine"]]);
  else if (preset === "marimba" || preset === "xylophone") malletVoice(context, target, when, hz, peak, "marimba");
  else if (preset === "boomwhacker") partials(context, target, when, hz, 0.42, peak, [[1, 1, "triangle"], [2, 0.16, "sine"], [3.01, 0.06, "sine"]], 0.004);
  else if (preset === "kalimba") malletVoice(context, target, when, hz, peak, "kalimba");
  else if (preset === "woodblock") malletVoice(context, target, when, hz, peak, "wood");
  else if (preset === "glass") partials(context, target, when, hz, Math.max(0.76, duration), peak, [[1, 1, "sine"], [2.33, 0.24, "sine"], [4.19, 0.1, "sine"], [6.13, 0.035, "sine"]], 0.002);
  else if (preset === "steel-drum") partials(context, target, when, hz, 0.76, peak, [[1, 1, "triangle"], [1.5, 0.13, "sine"], [2.01, 0.2, "sine"], [3.08, 0.055, "sine"]], 0.003);
  else if (preset === "metal-hit") partials(context, target, when, hz * 1.42, 0.3, peak * 0.78, [[1, 1, "sine"], [1.37, 0.38, "sine"], [2.17, 0.16, "sine"], [3.43, 0.07, "sine"]], 0.0015);
  else if (preset === "pluck") {
    const env = envelope(context, target, when, peak, 0.002, 0.008, 0.34);
    const filter = context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = Math.min(7200, 1600 + hz * 6); filter.Q.value = 1.3; filter.connect(env);
    osc(context, filter, when, hz, 0.4, "sawtooth", 0.42); osc(context, filter, when, hz, 0.38, "triangle", 0.5, 3.2);
  } else if (preset === "sparkle") partials(context, target, when, hz * 2, 0.62, peak * 0.72, [[1, 1, "sine"], [2.74, 0.2, "sine"], [5.08, 0.06, "sine"]], 0.002);
  else partials(context, target, when, hz, Math.max(0.58, duration), peak, [[1, 1, "sine"], [3.01, 0.17, "sine"], [4.02, 0.055, "sine"]]);
}
