import type { MidiInstrumentMode, NoteEvent, SynthPreset } from "../types";
import { playSynthVoice, presetForMidiEvent } from "./synthVoices";

interface MidiScheduleOptions {
  playbackSpeed: number;
  syncOffsetMs: number;
  mode: MidiInstrumentMode;
  preset: SynthPreset;
  brightness: number;
  stereoWidth: number;
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

function cleanMusicGain(value: number) {
  // The UI intentionally allows >100% music volume. Keep that perceived boost,
  // but reserve encoder headroom so mastered source audio + impact SFX do not
  // arrive at MediaRecorder already clipped.
  return Math.min(1.16, Math.max(0, value) * 0.82);
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
  private brightness = 0.62;
  private stereoWidth = 0.34;
  private musicVolume = 1.3;
  private sfxVolume = 0.26;
  private reverbAmount = 0.22;

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
      compressor.threshold.value = -9;
      compressor.knee.value = 12;
      compressor.ratio.value = 2.1;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.18;

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

      this.master.gain.value = 0.78;
      this.musicBus.gain.value = cleanMusicGain(this.musicVolume);
      this.sfxInput.gain.value = this.sfxVolume;
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
    this.sfxVolume = Math.max(0, Math.min(1, value));
    if (this.sfxInput) this.sfxInput.gain.value = this.sfxVolume;
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

  async playNote(midi: number, velocity: number, durationMs: number, preset: SynthPreset) {
    const context = await this.ensure();
    if (!this.sfxInput) return;
    playSynthVoice(context, this.sfxInput, midi, velocity, durationMs, preset, {
      brightness: this.brightness,
      stereoWidth: this.stereoWidth,
      gainScale: 0.82,
    });
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
    session.gain.value = 0.72;
    session.connect(this.musicBus);
    this.midiSession = session;
    const speed = Math.max(0.1, options.playbackSpeed);
    const base = context.currentTime + 0.03;
    let index = events.findIndex((event) => event.timeMs / speed + options.syncOffsetMs >= resumeMs - 2);
    if (index < 0) return;

    const scheduleWindow = () => {
      if (this.midiSession !== session) return;
      const elapsedMs = Math.max(0, context.currentTime - base) * 1000 + resumeMs;
      const horizonMs = elapsedMs + 1450;
      while (index < events.length) {
        const event = events[index];
        const visualTime = event.timeMs / speed + options.syncOffsetMs;
        if (visualTime > horizonMs) break;
        index += 1;
        if (visualTime < resumeMs - 2) continue;
        const when = base + Math.max(0, visualTime - resumeMs) / 1000;
        const preset = options.mode === "auto" ? presetForMidiEvent(event) : options.preset;
        playSynthVoice(context, session, event.midi, event.velocity, event.durationMs / speed, preset, {
          when,
          brightness: Math.min(0.82, options.brightness * 0.9 + 0.08),
          stereoWidth: options.stereoWidth,
          gainScale: event.isDrum ? 0.34 : 0.26,
        });
      }
      if (index >= events.length && this.midiTimer) { clearInterval(this.midiTimer); this.midiTimer = null; }
    };
    scheduleWindow();
    if (index < events.length) this.midiTimer = setInterval(scheduleWindow, 180);
  }
}
