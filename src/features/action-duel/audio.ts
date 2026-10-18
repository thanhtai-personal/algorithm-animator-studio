import { DRAGON_HIT, DRAGON_RELEASE, DUEL_ATTACKS } from "./choreography";
import { DUEL_DURATION } from "./scene";

/**
 * Original synthesized soundtrack: dark electronic pulse, palm charge,
 * flying dragon roar and frame-accurate impacts. No copyrighted or remotely fetched audio assets.
 */
export function makeDuelAudioBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = 24_000;
  const length = Math.round(DUEL_DURATION * sampleRate);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const melody = [0, 7, 3, 10, 5, 12, 3, 7, -2, 5, 0, 10, 3, 7, 12, 5];
  let noiseState = 73819;
  const tau = 2 * Math.PI;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    noiseState = (Math.imul(1664525, noiseState) + 1013904223) >>> 0;
    const noise = (noiseState / 2147483648) - 1;

    // Dark electronic bass, moving pad and an 8-bit-inspired repeating motif.
    const bassFreq = 55 + Math.sin(t * .44) * 2;
    const bass = .105 * Math.sin(tau * bassFreq * t);
    const pad = .061 * (Math.sin(tau * 110 * t) + .4 * Math.sin(tau * 164.81 * t));
    const note = melody[Math.floor(t * 2.65) % melody.length];
    const noteFreq = 220 * Math.pow(2, note / 12);
    const noteEnv = Math.exp(-((t * 2.65) % 1) * 7);
    const lead = .072 * noteEnv * Math.sin(tau * noteFreq * t + .8 * Math.sin(tau * 8 * t));

    // Mechanical kick + sparse high-hat (no samples needed).
    const beat = t % .5;
    const kick = .15 * Math.exp(-beat * 28)
      * Math.sin(tau * (75 * beat + 90 * beat * beat));
    const hi = .022 * Math.exp(-((t + .25) % .25) * 95) * noise;

    let strike = 0;
    let chargeHum = 0;
    let dragonRoar = 0;
    let pan = 0;
    for (const attack of DUEL_ATTACKS) {
      const dt = t - attack.at;
      if (dt < 0 || dt > attack.duration + .39) continue;
      const p = dt / attack.duration;
      if (p >= 0 && p < DRAGON_RELEASE) {
        const envelope = Math.sin(Math.PI * p / DRAGON_RELEASE);
        chargeHum += attack.power * envelope *
          (.060 * Math.sin(tau * (140 + 250 * p) * dt)
            + .038 * Math.sin(tau * 330 * dt) + .02 * noise);
        pan = -.32;
      }
      if (p >= DRAGON_RELEASE && p < DRAGON_HIT) {
        const flight = (p - DRAGON_RELEASE) / (DRAGON_HIT - DRAGON_RELEASE);
        const envelope = Math.sin(Math.PI * flight) * attack.power;
        // FM-modulated growl and rushing air are the dragon's flight SFX.
        const growlPhase = tau * (88 * dt + 38 * dt * dt);
        const growl = Math.sin(growlPhase + 2.5 * Math.sin(tau * 29 * dt));
        dragonRoar += envelope * (.17 * growl
          + .08 * Math.sin(tau * (305 + 260 * flight) * dt)
          + .11 * noise);
        pan = -.5 + flight;
      }
      const hit = dt - attack.duration * DRAGON_HIT;
      if (hit >= 0 && hit < .39) {
        const decay = Math.exp(-hit * 16);
        strike += attack.power * decay *
          (.27 * Math.sin(tau * (71 - 30 * hit) * hit)
            + .115 * noise
            + .07 * Math.sin(tau * 440 * hit));
        pan = .33;
      }
    }

    const fade = Math.min(1, t * 5, Math.max(0, (DUEL_DURATION - t) * 2.5));
    const music = bass + pad + lead + kick + hi;
    const sfx = chargeHum + dragonRoar + strike;
    const l = (music + sfx * (1 - pan)) * fade;
    const r = (music + sfx * (1 + pan)) * fade;
    left[i] = Math.tanh(l * 1.35) * .78;
    right[i] = Math.tanh(r * 1.35) * .78;
  }
  return buffer;
}

export class DuelAudioEngine {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private capture: MediaStreamAudioDestinationNode | null = null;

  async prepare(): Promise<void> {
    if (!this.context) {
      if (typeof AudioContext === "undefined") {
        throw new Error("Web Audio API is unavailable.");
      }
      this.context = new AudioContext();
    }
    if (!this.buffer) this.buffer = makeDuelAudioBuffer(this.context);
    await this.context.resume();
  }

  /** Starts both audible playback and an optional recordable audio track. */
  start(offsetSeconds = 0, rate = 1, record = false): MediaStreamTrack | null {
    this.stop();
    if (!this.context || !this.buffer) throw new Error("Audio is not prepared.");
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.playbackRate.value = rate;
    source.connect(this.context.destination);
    if (record) {
      this.capture = this.context.createMediaStreamDestination();
      source.connect(this.capture);
    }
    this.source = source;
    source.start(0, Math.min(DUEL_DURATION - .001, Math.max(0, offsetSeconds)));
    return this.capture?.stream.getAudioTracks()[0] ?? null;
  }

  stop(): void {
    if (this.source) {
      try { this.source.stop(); } catch { /* The source may have finished. */ }
      this.source.disconnect();
      this.source = null;
    }
    this.capture?.stream.getTracks().forEach((track) => track.stop());
    this.capture?.disconnect();
    this.capture = null;
  }

  async dispose(): Promise<void> {
    this.stop();
    if (this.context && this.context.state !== "closed") await this.context.close();
    this.context = null;
    this.buffer = null;
  }
}
