import type { SynthPreset } from "../types";

function midiToHz(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12); }

export class AudioEngine {
  private context: AudioContext | null = null;
  private mix: GainNode | null = null;
  private synthBus: GainNode | null = null;
  private recordDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaElement: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;

  async ensure() {
    if (!this.context) {
      this.context = new AudioContext();
      this.mix = this.context.createGain();
      this.synthBus = this.context.createGain();
      this.recordDestination = this.context.createMediaStreamDestination();
      this.synthBus.connect(this.mix);
      this.mix.connect(this.context.destination);
      this.mix.connect(this.recordDestination);
    }
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  setVolume(value: number) { if (this.synthBus) this.synthBus.gain.value = value; }
  getRecordStream() { return this.recordDestination?.stream ?? null; }

  async attachOriginalAudio(element: HTMLAudioElement | null) {
    await this.ensure();
    if (!element || !this.context || !this.mix) return;
    if (this.mediaElement === element && this.mediaSource) return;
    if (this.mediaSource) this.mediaSource.disconnect();
    this.mediaElement = element;
    this.mediaSource = this.context.createMediaElementSource(element);
    this.mediaSource.connect(this.mix);
  }

  async playNote(midi: number, velocity: number, durationMs: number, preset: SynthPreset) {
    const context = await this.ensure();
    if (!this.synthBus) return;
    const now = context.currentTime;
    const duration = Math.max(0.08, Math.min(2.5, durationMs / 1000));
    const gain = context.createGain();
    const base = Math.max(0.001, Math.min(1, velocity));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(base * 0.28, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(this.synthBus);

    const osc = context.createOscillator();
    osc.frequency.value = midiToHz(midi);
    osc.type = preset === "vibraphone" ? "triangle" : "sine";
    osc.connect(gain);

    if (preset === "fm") {
      const mod = context.createOscillator(); const modGain = context.createGain();
      mod.frequency.value = midiToHz(midi) * 2; modGain.gain.value = midiToHz(midi) * 0.8;
      mod.connect(modGain); modGain.connect(osc.frequency); mod.start(now); mod.stop(now + duration);
    } else if (preset === "piano") {
      const overtone = context.createOscillator(); const overGain = context.createGain();
      overtone.frequency.value = midiToHz(midi) * 2; overGain.gain.value = 0.08;
      overtone.connect(overGain); overGain.connect(this.synthBus); overtone.start(now); overtone.stop(now + Math.min(duration, 0.55));
    } else if (preset === "chime" || preset === "bell") {
      const overtone = context.createOscillator(); const overGain = context.createGain();
      overtone.frequency.value = midiToHz(midi) * (preset === "bell" ? 2.7 : 3.01);
      overGain.gain.setValueAtTime(base * 0.07, now); overGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.75);
      overtone.connect(overGain); overGain.connect(this.synthBus); overtone.start(now); overtone.stop(now + duration);
    }

    osc.start(now); osc.stop(now + duration);
  }
}
