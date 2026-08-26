import type { MidiInstrumentMode, NoteEvent, SynthPreset } from "../types";
import {
  cleanMusicGain,
  COLLISION_VOICE_GAIN,
  DEFAULT_COLLISION_VOLUME,
  MIDI_DRUM_GAIN,
  MIDI_SESSION_GAIN,
  MIDI_VOICE_GAIN,
  RHYTHMIC_MASTER_GAIN,
} from "./audioMix";
import { playSynthVoice, presetForMidiEvent } from "./synthVoices";
import { rhythmicAudioStartTime } from "./playbackSync";

interface MidiScheduleOptions {
  playbackSpeed: number;
  syncOffsetMs: number;
  mode: MidiInstrumentMode;
  preset: SynthPreset;
  brightness: number;
  stereoWidth: number;
  presentationDelayMs: number;
  presetForEvent?: (event: NoteEvent, index: number) => SynthPreset;
}

export type MarbleImpactSoundKind = "wall" | "obstacle" | "obstacle-strike" | "marble" | "instrument";

let runtimeOutputBoost = 1;
let runtimeSfxBoost = 1;
let activeAudioEngine: AudioEngine | null = null;

export function setRhythmicRuntimeMixBoost(outputBoost = 1, sfxBoost = 1) {
  runtimeOutputBoost = Math.max(0.5, Math.min(2.2, outputBoost));
  runtimeSfxBoost = Math.max(0.5, Math.min(2.5, sfxBoost));
  activeAudioEngine?.refreshRuntimeMixBoost();
}

export interface SynthVoiceWarmup {
  midi: number;
  velocity: number;
  durationMs: number;
  preset: SynthPreset;
}

function createRoomImpulse(context: AudioContext, seconds = 1.05, decay = 3.4) {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, decay);
      const early = i < context.sampleRate * 0.05 ? 1.02 : 1;
      // Keep the room tail subtle. A hot white-noise impulse made repeated note
      // attacks read as crackle/paper-pop once encoded to Opus.
      data[i] = (Math.random() * 2 - 1) * envelope * early * 0.16;
    }
  }
  return impulse;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxInput: GainNode | null = null;
  private sfxTone: BiquadFilterNode | null = null;
  private sfxDry: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private reverbWet: GainNode | null = null;
  private recordDestination: MediaStreamAudioDestinationNode | null = null;
  private outputCompressor: DynamicsCompressorNode | null = null;
  private mediaElement: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private midiSession: GainNode | null = null;
  private midiTimer: ReturnType<typeof setInterval> | null = null;
  private cueSource: AudioBufferSourceNode | null = null;
  private cueBuffers = new Map<string, AudioBuffer>();
  private brightness = 0.62;
  private stereoWidth = 0.34;
  private musicVolume = 1.3;
  private sfxVolume = DEFAULT_COLLISION_VOLUME;
  private reverbAmount = 0.22;
  private warmedVoices = new Set<SynthPreset>();

  constructor() {
    activeAudioEngine = this;
  }

  refreshRuntimeMixBoost() {
    if (this.master) this.master.gain.value = RHYTHMIC_MASTER_GAIN * runtimeOutputBoost;
    if (this.sfxInput) this.sfxInput.gain.value = Math.min(2.4, this.sfxVolume * runtimeSfxBoost);
  }

  async ensure() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.sfxInput = this.context.createGain();
      this.sfxTone = this.context.createBiquadFilter();
      this.sfxDry = this.context.createGain();
      this.reverbSend = this.context.createGain();
      this.reverbWet = this.context.createGain();
      this.recordDestination = this.context.createMediaStreamDestination();

      const reverb = this.context.createConvolver();
      reverb.buffer = createRoomImpulse(this.context);
      const compressor = this.context.createDynamicsCompressor();
      this.outputCompressor = compressor;
      compressor.threshold.value = -12;
      compressor.knee.value = 8;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.14;

      this.sfxTone.type = "lowpass";
      this.sfxTone.frequency.value = 9900;
      this.sfxTone.Q.value = 0.65;
      this.sfxInput.connect(this.sfxTone);
      this.sfxTone.connect(this.sfxDry);
      this.sfxTone.connect(this.reverbSend);
      this.reverbSend.connect(reverb);
      reverb.connect(this.reverbWet);
      this.sfxDry.connect(this.master);
      this.reverbWet.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(compressor);
      compressor.connect(this.context.destination);
      compressor.connect(this.recordDestination);

      this.master.gain.value = RHYTHMIC_MASTER_GAIN * runtimeOutputBoost;
      this.musicBus.gain.value = cleanMusicGain(this.musicVolume);
      this.sfxInput.gain.value = Math.min(2.4, this.sfxVolume * runtimeSfxBoost);
      this.sfxDry.gain.value = 1 - this.reverbAmount * 0.18;
      this.reverbSend.gain.value = this.reverbAmount * 0.42;
      this.reverbWet.gain.value = this.reverbAmount * 0.48;
      this.sfxTone.frequency.value = 3400 + this.brightness * 10800;
    }
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  setMusicVolume(value: number) {
    this.musicVolume = Math.max(0, Math.min(1.6, value));
    if (this.musicBus) this.musicBus.gain.value = cleanMusicGain(this.musicVolume);
  }

  setVolume(value: number) {
    this.sfxVolume = Math.max(0, Math.min(1.6, value));
    if (this.sfxInput) this.sfxInput.gain.value = Math.min(2.4, this.sfxVolume * runtimeSfxBoost);
  }

  setReverb(value: number) {
    this.reverbAmount = Math.max(0, Math.min(1, value));
    if (this.reverbSend) this.reverbSend.gain.value = this.reverbAmount * 0.42;
    if (this.reverbWet) this.reverbWet.gain.value = this.reverbAmount * 0.48;
    if (this.sfxDry) this.sfxDry.gain.value = 1 - this.reverbAmount * 0.18;
  }

  setBrightness(value: number) {
    this.brightness = Math.max(0, Math.min(1, value));
    if (this.sfxTone) this.sfxTone.frequency.value = 3400 + this.brightness * 10800;
  }

  setStereoWidth(value: number) {
    this.stereoWidth = Math.max(0, Math.min(1, value));
  }

  private refreshRecordDestination() {
    if (!this.context || !this.outputCompressor) return;
    const currentTrack = this.recordDestination?.stream.getAudioTracks()[0];
    if (currentTrack?.readyState === "live") return;
    if (this.recordDestination) {
      try { this.outputCompressor.disconnect(this.recordDestination); } catch { /* already disconnected */ }
    }
    this.recordDestination = this.context.createMediaStreamDestination();
    this.outputCompressor.connect(this.recordDestination);
  }

  getRecordStream() {
    this.refreshRecordDestination();
    return this.recordDestination?.stream ?? null;
  }

  async attachOriginalAudio(element: HTMLAudioElement | null) {
    await this.ensure();
    if (!element || !this.context || !this.musicBus) return;
    if (this.mediaElement === element && this.mediaSource) return;
    if (this.mediaSource) this.mediaSource.disconnect();
    this.mediaElement = element;
    this.mediaSource = this.context.createMediaElementSource(element);
    this.mediaSource.connect(this.musicBus);
  }

  stopCue() {
    if (!this.cueSource) return;
    try { this.cueSource.stop(); } catch { /* already stopped */ }
    try { this.cueSource.disconnect(); } catch { /* already disconnected */ }
    this.cueSource = null;
  }

  async playCue(url: string) {
    const context = await this.ensure();
    if (!this.master) return;
    this.stopCue();
    let buffer = this.cueBuffers.get(url);
    if (!buffer) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Unable to load audio cue: ${response.status}`);
      buffer = await context.decodeAudioData(await response.arrayBuffer());
      this.cueBuffers.set(url, buffer);
    }
    await new Promise<void>((resolve) => {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = 1.18;
      source.connect(gain);
      gain.connect(this.master!);
      this.cueSource = source;
      source.onended = () => {
        if (this.cueSource === source) this.cueSource = null;
        try { source.disconnect(); } catch { /* already disconnected */ }
        try { gain.disconnect(); } catch { /* already disconnected */ }
        resolve();
      };
      source.start(context.currentTime + 0.01);
    });
  }

  async playMarbleImpact(kind: MarbleImpactSoundKind, strength: number, pan = 0, variant = 0) {
    const context = await this.ensure();
    if (!this.sfxInput) return;
    const intensity = Math.max(0, Math.min(1, (strength - 0.18) / 12.5));
    if (intensity <= 0.005) return;

    const when = context.currentTime + 0.003;
    const output = context.createGain();
    const panner = context.createStereoPanner();
    const tone = context.createBiquadFilter();
    const fundamental = context.createOscillator();
    const metallic = context.createOscillator();
    const metallicGain = context.createGain();

    const instrument = kind === "instrument";
    const marble = kind === "marble";
    const duration = instrument ? 0.2 : marble ? 0.07 : kind === "wall" ? 0.075 : kind === "obstacle" ? 0.11 : 0.16;
    const peak = instrument
      ? 0.055 + intensity * 0.28
      : marble
        ? 0.035 + intensity * 0.25
        : 0.025 + intensity * (kind === "obstacle-strike" ? 0.34 : 0.24);
    const instrumentFrequency = 220 * Math.pow(2, ((variant % 19) + 3) / 12);
    const baseFrequency = instrument
      ? instrumentFrequency
      : marble
        ? 520 + intensity * 420
        : kind === "wall"
          ? 210 + intensity * 150
          : kind === "obstacle"
            ? 330 + intensity * 230
            : 145 + intensity * 115;

    output.gain.setValueAtTime(0.0001, when);
    output.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.0025);
    output.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    tone.type = instrument ? "lowpass" : "bandpass";
    tone.frequency.value = instrument ? 5200 : marble ? 3600 + intensity * 1400 : kind === "obstacle-strike" ? 1250 : 2100 + intensity * 1700;
    tone.Q.value = instrument ? 0.55 : marble ? 1.6 : kind === "wall" ? 0.75 : 1.15;

    fundamental.type = instrument ? "sine" : kind === "obstacle-strike" ? "triangle" : "sine";
    fundamental.frequency.setValueAtTime(baseFrequency, when);
    fundamental.frequency.exponentialRampToValueAtTime(Math.max(70, baseFrequency * (instrument ? 0.995 : marble ? 0.82 : 0.58)), when + duration);
    metallic.type = instrument ? "sine" : "triangle";
    metallic.frequency.setValueAtTime(baseFrequency * (instrument ? 2.01 : marble ? 2.75 : kind === "wall" ? 3.15 : 2.45), when);
    metallic.frequency.exponentialRampToValueAtTime(baseFrequency * (instrument ? 1.98 : marble ? 1.8 : 1.55), when + duration * 0.8);
    metallicGain.gain.value = instrument ? 0.28 : marble ? 0.32 : kind === "wall" ? 0.42 : 0.64;

    fundamental.connect(tone);
    metallic.connect(metallicGain);
    metallicGain.connect(tone);
    tone.connect(output);
    output.connect(panner);
    panner.connect(this.sfxInput);
    fundamental.start(when);
    metallic.start(when);
    fundamental.stop(when + duration + 0.02);
    metallic.stop(when + duration + 0.02);
    fundamental.onended = () => {
      for (const node of [fundamental, metallic, metallicGain, tone, output, panner]) {
        try { node.disconnect(); } catch { /* already disconnected */ }
      }
    };
  }

  async playNote(midi: number, velocity: number, durationMs: number, preset: SynthPreset, presentationDelayMs = 0) {
    const context = await this.ensure();
    if (!this.sfxInput) return;
    playSynthVoice(context, this.sfxInput, midi, velocity, durationMs, preset, {
      when: rhythmicAudioStartTime(context.currentTime, presentationDelayMs),
      brightness: this.brightness,
      stereoWidth: this.stereoWidth,
      gainScale: COLLISION_VOICE_GAIN,
    });
  }

  async prepareVoices(voices: SynthVoiceWarmup[]) {
    const context = await this.ensure();
    if (!this.sfxInput) return;
    const pending = voices.filter((voice) => !this.warmedVoices.has(voice.preset));
    if (!pending.length) return;

    // Build every synth graph and reusable noise buffer before canvas capture.
    // A zero-gain connected bus keeps browsers from pruning this warm-up work.
    const silentBus = context.createGain();
    silentBus.gain.value = 0;
    silentBus.connect(this.sfxInput);
    const when = context.currentTime + 0.02;
    for (const voice of pending) {
      this.warmedVoices.add(voice.preset);
      playSynthVoice(context, silentBus, voice.midi, voice.velocity, voice.durationMs, voice.preset, {
        when,
        brightness: this.brightness,
        stereoWidth: this.stereoWidth,
        gainScale: 0.02,
      });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    setTimeout(() => { try { silentBus.disconnect(); } catch { /* already disconnected */ } }, 3_200);
  }

  stopMidi() {
    if (this.midiTimer) clearInterval(this.midiTimer);
    this.midiTimer = null;
    if (this.midiSession) {
      const session = this.midiSession;
      const context = this.context;
      if (context) {
        const now = context.currentTime;
        try {
          session.gain.cancelScheduledValues(now);
          session.gain.setValueAtTime(Math.max(0.0001, session.gain.value), now);
          session.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
          setTimeout(() => { try { session.disconnect(); } catch { /* already disconnected */ } }, 55);
        } catch { try { session.disconnect(); } catch { /* already disconnected */ } }
      } else {
        try { session.disconnect(); } catch { /* already disconnected */ }
      }
    }
    this.midiSession = null;
  }

  async scheduleMidi(events: NoteEvent[], resumeMs: number, options: MidiScheduleOptions) {
    const context = await this.ensure();
    if (!this.musicBus) return;
    this.stopMidi();
    const session = context.createGain();
    session.gain.value = MIDI_SESSION_GAIN;
    session.connect(this.musicBus);
    this.midiSession = session;
    const speed = Math.max(0.1, options.playbackSpeed);
    const schedulerGuardMs = 8;
    const base = rhythmicAudioStartTime(context.currentTime, options.presentationDelayMs, schedulerGuardMs);
    let index = events.findIndex((event) => event.timeMs / speed + options.syncOffsetMs >= resumeMs - 2);
    if (index < 0) return;

    const scheduleWindow = () => {
      if (this.midiSession !== session) return;
      const elapsedMs = Math.max(0, context.currentTime - base) * 1000 + resumeMs;
      const horizonMs = elapsedMs + 1450;
      while (index < events.length) {
        const eventIndex = index;
        const event = events[eventIndex];
        const visualTime = event.timeMs / speed + options.syncOffsetMs;
        if (visualTime > horizonMs) break;
        index += 1;
        if (visualTime < resumeMs - 2) continue;
        const when = base + Math.max(0, visualTime - resumeMs) / 1000;
        const preset = options.presetForEvent?.(event, eventIndex)
          ?? (options.mode === "auto" ? presetForMidiEvent(event) : options.preset);
        playSynthVoice(context, session, event.midi, event.velocity, event.durationMs / speed, preset, {
          when,
          brightness: Math.min(0.82, options.brightness * 0.9 + 0.08),
          stereoWidth: options.stereoWidth,
          gainScale: event.isDrum ? MIDI_DRUM_GAIN : MIDI_VOICE_GAIN,
        });
      }
      if (index >= events.length && this.midiTimer) { clearInterval(this.midiTimer); this.midiTimer = null; }
    };
    scheduleWindow();
    if (index < events.length) this.midiTimer = setInterval(scheduleWindow, 180);
  }
}
