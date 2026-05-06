export type SfxKind = "off" | "pop" | "click" | "beep" | "marimba" | "piano" | "key" | "retro" | "blip";
export type MusicPreset = "off" | "lofi" | "ambient" | "chill" | "upbeat" | "custom";

export class AudioEngine {
  ctx: AudioContext;
  master: GainNode;
  sfxGain: GainNode;
  musicGain: GainNode;
  dest?: MediaStreamAudioDestinationNode;
  musicEl?: HTMLAudioElement;
  musicSrc?: MediaElementAudioSourceNode;

  // procedural music
  private procTimer: number | null = null;
  private procNodes: { stop: () => void }[] = [];
  private currentPreset: MusicPreset = "off";

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

  /** Play one note in the procedural music loop. */
  private playMusicNote(freq: number, dur: number, type: OscillatorType, gain = 0.15) {
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(this.musicGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  /** Start a built-in procedural background music loop. */
  setMusicPreset(preset: MusicPreset) {
    this.stopProcedural();
    this.currentPreset = preset;
    if (preset === "off" || preset === "custom") return;
    this.resume();

    // simple chord progressions / scales (Hz)
    const scales: Record<Exclude<MusicPreset, "off" | "custom">, { notes: number[]; bpm: number; type: OscillatorType; pattern: number[] }> = {
      lofi:    { notes: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25], bpm: 70,  type: "triangle", pattern: [0,2,4,2,3,1,4,2] },
      ambient: { notes: [220.00, 261.63, 329.63, 392.00, 440.00, 523.25], bpm: 50,  type: "sine",     pattern: [0,2,4,3,1,4,2,0] },
      chill:   { notes: [293.66, 349.23, 392.00, 440.00, 523.25, 587.33], bpm: 80,  type: "sine",     pattern: [0,2,4,2,5,3,1,2] },
      upbeat:  { notes: [261.63, 329.63, 392.00, 523.25, 659.25, 783.99], bpm: 110, type: "triangle", pattern: [0,2,4,2,5,3,4,2] },
    };
    const conf = scales[preset];
    const interval = (60 / conf.bpm) * 1000;
    let step = 0;
    const tick = () => {
      const idx = conf.pattern[step % conf.pattern.length];
      const f = conf.notes[idx];
      this.playMusicNote(f, 0.6, conf.type, 0.18);
      // soft bass every 4th
      if (step % 4 === 0) this.playMusicNote(f / 2, 1.2, "sine", 0.12);
      step++;
    };
    tick();
    this.procTimer = window.setInterval(tick, interval);
  }

  private stopProcedural() {
    if (this.procTimer != null) { clearInterval(this.procTimer); this.procTimer = null; }
    this.procNodes.forEach((n) => n.stop());
    this.procNodes = [];
  }

  startMusic() {
    if (this.currentPreset !== "off" && this.currentPreset !== "custom") {
      this.setMusicPreset(this.currentPreset);
    }
    if (this.musicEl) this.musicEl.play().catch(() => {});
  }
  stopMusic() {
    this.stopProcedural();
    if (this.musicEl) { this.musicEl.pause(); this.musicEl.currentTime = 0; }
  }

  /**
   * Play one SFX. Optional `pitch` (0..1) shifts frequency — used to tie sound
   * to bar value (similar to classic sorting visualizers).
   */
  playSfx(kind: SfxKind, pitch = 0.5) {
    if (kind === "off") return;
    this.resume();
    const t0 = this.ctx.currentTime;
    const p = Math.max(0, Math.min(1, pitch));

    const oneShot = (type: OscillatorType, f0: number, f1: number, dur: number, gain = 0.35) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(this.sfxGain);
      o.start(t0); o.stop(t0 + dur + 0.02);
    };

    // pitched base ~ 220–880 Hz
    const pitched = 220 + p * 660;

    switch (kind) {
      case "pop":     oneShot("sine", 880, 220, 0.12); break;
      case "click":   oneShot("square", 1200, 1200, 0.04, 0.3); break;
      case "beep":    oneShot("triangle", pitched, pitched, 0.12, 0.3); break;
      case "marimba": {
        oneShot("sine", pitched * 2, pitched, 0.25, 0.25);
        oneShot("triangle", pitched, pitched / 2, 0.25, 0.12);
        break;
      }
      case "piano": {
        oneShot("triangle", pitched, pitched, 0.35, 0.25);
        oneShot("sine", pitched * 2, pitched * 2, 0.18, 0.1);
        break;
      }
      case "key":     oneShot("square", pitched, pitched, 0.06, 0.18); break;
      case "retro":   oneShot("sawtooth", pitched, pitched * 1.5, 0.08, 0.2); break;
      case "blip":    oneShot("sine", pitched * 1.5, pitched * 0.8, 0.07, 0.25); break;
    }
  }

  async loadCustomSfx(file: File): Promise<AudioBuffer> {
    const buf = await file.arrayBuffer();
    return await this.ctx.decodeAudioData(buf);
  }
}

export const audioEngine = new AudioEngine();
