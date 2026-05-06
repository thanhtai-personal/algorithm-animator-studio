export type SfxKind = "off" | "pop" | "click" | "beep";

export class AudioEngine {
  ctx: AudioContext;
  master: GainNode;
  sfxGain: GainNode;
  musicGain: GainNode;
  dest?: MediaStreamAudioDestinationNode;
  musicEl?: HTMLAudioElement;
  musicSrc?: MediaElementAudioSourceNode;

  constructor() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.master);
  }

  resume() {
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setSfxVolume(v: number) { this.sfxGain.gain.value = v; }
  setMusicVolume(v: number) { this.musicGain.gain.value = v; }

  /** Get an audio MediaStream usable for MediaRecorder. */
  getRecordStream(): MediaStream {
    if (!this.dest) {
      this.dest = this.ctx.createMediaStreamDestination();
      this.sfxGain.connect(this.dest);
      this.musicGain.connect(this.dest);
    }
    return this.dest.stream;
  }

  setMusicSource(url: string | null) {
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl.src = "";
    }
    if (this.musicSrc) {
      try { this.musicSrc.disconnect(); } catch { /* noop */ }
    }
    if (!url) { this.musicEl = undefined; this.musicSrc = undefined; return; }
    const el = new Audio(url);
    el.loop = true;
    el.crossOrigin = "anonymous";
    this.musicEl = el;
    this.musicSrc = this.ctx.createMediaElementSource(el);
    this.musicSrc.connect(this.musicGain);
  }

  startMusic() { if (this.musicEl) this.musicEl.play().catch(() => {}); }
  stopMusic() { if (this.musicEl) { this.musicEl.pause(); this.musicEl.currentTime = 0; } }

  playSfx(kind: SfxKind, customBuffer?: AudioBuffer) {
    if (kind === "off" && !customBuffer) return;
    this.resume();
    if (customBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = customBuffer;
      src.connect(this.sfxGain);
      src.start();
      return;
    }
    const t0 = this.ctx.currentTime;
    if (kind === "pop") {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, t0);
      o.frequency.exponentialRampToValueAtTime(220, t0 + 0.1);
      g.gain.setValueAtTime(0.4, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      o.connect(g).connect(this.sfxGain);
      o.start(t0); o.stop(t0 + 0.13);
    } else if (kind === "click") {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "square";
      o.frequency.value = 1200;
      g.gain.setValueAtTime(0.3, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
      o.connect(g).connect(this.sfxGain);
      o.start(t0); o.stop(t0 + 0.05);
    } else if (kind === "beep") {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.35, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      o.connect(g).connect(this.sfxGain);
      o.start(t0); o.stop(t0 + 0.16);
    }
  }

  async loadCustomSfx(file: File): Promise<AudioBuffer> {
    const buf = await file.arrayBuffer();
    return await this.ctx.decodeAudioData(buf);
  }
}

export const audioEngine = new AudioEngine();
