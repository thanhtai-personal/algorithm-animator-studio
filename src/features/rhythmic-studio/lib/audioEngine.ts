import type { SynthPreset } from "../types";
import { playSynthVoice } from "./synthVoices";

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

  setVolume(value: number) {
    if (this.synthBus) this.synthBus.gain.value = value;
  }

  getRecordStream() {
    return this.recordDestination?.stream ?? null;
  }

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
    playSynthVoice(context, this.synthBus, midi, velocity, durationMs, preset);
  }
}
