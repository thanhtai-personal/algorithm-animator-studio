import type { SynthPreset } from "../types";

const EPSILON = 0.0001;

function midiToHz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function connectEnvelope(
  context: AudioContext,
  bus: AudioNode,
  now: number,
  peak: number,
  attack: number,
  releaseSeconds: number,
) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(EPSILON, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(EPSILON, peak), now + attack);
  gain.gain.exponentialRampToValueAtTime(EPSILON, now + Math.max(attack + 0.02, releaseSeconds));
  gain.connect(bus);
  return gain;
}

function oscillator(
  context: AudioContext,
  target: AudioNode,
  now: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
  gain = 1,
) {
  const osc = context.createOscillator();
  const level = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, frequency), now);
  level.gain.value = gain;
  osc.connect(level);
  level.connect(target);
  osc.start(now);
  osc.stop(now + Math.max(0.03, duration));
  return osc;
}

function createNoise(context: AudioContext, seconds: number) {
  const frameCount = Math.max(1, Math.ceil(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}

function noiseBurst(
  context: AudioContext,
  bus: AudioNode,
  now: number,
  duration: number,
  peak: number,
  filterType: BiquadFilterType,
  frequency: number,
  q = 0.8,
) {
  const source = createNoise(context, duration);
  const filter = context.createBiquadFilter();
  const envelope = connectEnvelope(context, bus, now, peak, 0.004, duration);
  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, now);
  filter.Q.value = q;
  source.connect(filter);
  filter.connect(envelope);
  source.start(now);
  source.stop(now + duration);
}

function tonalVoice(
  context: AudioContext,
  bus: AudioNode,
  now: number,
  hz: number,
  duration: number,
  peak: number,
  partials: Array<[number, number, OscillatorType]>,
  attack = 0.008,
) {
  const envelope = connectEnvelope(context, bus, now, peak, attack, duration);
  partials.forEach(([ratio, level, type]) => oscillator(context, envelope, now, hz * ratio, duration, type, level));
}

function playPercussion(context: AudioContext, bus: AudioNode, now: number, preset: SynthPreset, peak: number) {
  if (preset === "kick") {
    const envelope = connectEnvelope(context, bus, now, peak * 0.8, 0.003, 0.42);
    const osc = oscillator(context, envelope, now, 150, 0.44, "sine");
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.28);
    return;
  }
  if (preset === "snare") {
    noiseBurst(context, bus, now, 0.22, peak * 0.6, "highpass", 1400, 0.7);
    tonalVoice(context, bus, now, 185, 0.16, peak * 0.18, [[1, 1, "triangle"]]);
    return;
  }
  if (preset === "clap") {
    [0, 0.028, 0.055].forEach((offset, index) => noiseBurst(context, bus, now + offset, 0.09, peak * (0.36 - index * 0.06), "bandpass", 1700, 0.65));
    return;
  }
  if (preset === "hihat") {
    noiseBurst(context, bus, now, 0.095, peak * 0.38, "highpass", 6500, 0.5);
    return;
  }
  if (preset === "impact") {
    noiseBurst(context, bus, now, 0.3, peak * 0.42, "lowpass", 850, 1.2);
    const envelope = connectEnvelope(context, bus, now, peak * 0.5, 0.004, 0.34);
    const osc = oscillator(context, envelope, now, 96, 0.36, "sine");
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.3);
  }
}

function playSweep(context: AudioContext, bus: AudioNode, now: number, preset: SynthPreset, hz: number, peak: number) {
  if (preset === "laser") {
    const envelope = connectEnvelope(context, bus, now, peak * 0.5, 0.003, 0.32);
    const osc = oscillator(context, envelope, now, Math.max(700, hz * 4), 0.34, "sawtooth", 0.75);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, hz * 0.45), now + 0.3);
    return;
  }
  if (preset === "whoosh") {
    const source = createNoise(context, 0.55);
    const filter = context.createBiquadFilter();
    const envelope = connectEnvelope(context, bus, now, peak * 0.35, 0.05, 0.54);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.42);
    filter.Q.value = 0.7;
    source.connect(filter);
    filter.connect(envelope);
    source.start(now);
    source.stop(now + 0.55);
  }
}

export function playSynthVoice(
  context: AudioContext,
  bus: AudioNode,
  midi: number,
  velocity: number,
  durationMs: number,
  preset: SynthPreset,
) {
  const now = context.currentTime;
  const hz = midiToHz(midi);
  const baseDuration = Math.max(0.08, Math.min(2.5, durationMs / 1000));
  const peak = Math.max(0.03, Math.min(1, velocity)) * 0.34;

  if (["kick", "snare", "clap", "hihat", "impact"].includes(preset)) {
    playPercussion(context, bus, now, preset, peak);
    return;
  }
  if (preset === "laser" || preset === "whoosh") {
    playSweep(context, bus, now, preset, hz, peak);
    return;
  }

  switch (preset) {
    case "piano":
      tonalVoice(context, bus, now, hz, Math.min(0.85, baseDuration), peak, [[1, 1, "triangle"], [2, 0.18, "sine"], [3, 0.07, "sine"]]);
      break;
    case "fm": {
      const envelope = connectEnvelope(context, bus, now, peak, 0.006, baseDuration);
      const carrier = oscillator(context, envelope, now, hz, baseDuration, "sine");
      const mod = context.createOscillator();
      const modGain = context.createGain();
      mod.frequency.value = hz * 2;
      modGain.gain.value = hz * 0.9;
      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      mod.start(now);
      mod.stop(now + baseDuration);
      break;
    }
    case "vibraphone": {
      const envelope = connectEnvelope(context, bus, now, peak, 0.008, Math.max(0.5, baseDuration));
      const tremolo = context.createGain();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      tremolo.gain.value = 0.7;
      lfo.frequency.value = 5.2;
      lfoGain.gain.value = 0.28;
      lfo.connect(lfoGain);
      lfoGain.connect(tremolo.gain);
      tremolo.connect(envelope);
      oscillator(context, tremolo, now, hz, Math.max(0.5, baseDuration), "sine");
      lfo.start(now);
      lfo.stop(now + Math.max(0.5, baseDuration));
      break;
    }
    case "bell":
      tonalVoice(context, bus, now, hz, Math.max(0.7, baseDuration), peak, [[1, 1, "sine"], [2.7, 0.34, "sine"], [4.1, 0.16, "sine"]]);
      break;
    case "marimba":
      tonalVoice(context, bus, now, hz, 0.34, peak, [[1, 1, "sine"], [4, 0.16, "triangle"]], 0.003);
      break;
    case "kalimba":
      tonalVoice(context, bus, now, hz, 0.58, peak, [[1, 1, "triangle"], [2.05, 0.16, "sine"], [5.8, 0.05, "sine"]], 0.003);
      break;
    case "glass":
      tonalVoice(context, bus, now, hz, Math.max(0.65, baseDuration), peak, [[1, 1, "sine"], [2.32, 0.28, "sine"], [4.25, 0.12, "sine"]]);
      break;
    case "steel-drum":
      tonalVoice(context, bus, now, hz, 0.72, peak, [[1, 1, "triangle"], [1.5, 0.18, "sine"], [2.02, 0.22, "sine"], [3.1, 0.08, "sine"]], 0.004);
      break;
    case "metal-hit":
      tonalVoice(context, bus, now, hz * 1.5, 0.28, peak, [[1, 1, "square"], [1.37, 0.26, "sine"], [2.18, 0.14, "sine"]], 0.002);
      break;
    case "woodblock":
      tonalVoice(context, bus, now, Math.max(500, hz * 2.2), 0.12, peak, [[1, 1, "sine"], [1.48, 0.22, "triangle"]], 0.002);
      break;
    case "pluck":
      tonalVoice(context, bus, now, hz, 0.3, peak, [[1, 1, "sawtooth"], [2, 0.1, "triangle"]], 0.002);
      break;
    case "sparkle":
      tonalVoice(context, bus, now, hz * 2, 0.55, peak * 0.8, [[1, 1, "sine"], [2.75, 0.22, "sine"], [5.1, 0.08, "sine"]], 0.002);
      break;
    case "chime":
    default:
      tonalVoice(context, bus, now, hz, Math.max(0.5, baseDuration), peak, [[1, 1, "sine"], [3.01, 0.2, "sine"], [4.02, 0.08, "sine"]]);
      break;
  }
}
