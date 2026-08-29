export type ProceduralSfxKind =
  | "off" | "pop" | "click" | "beep" | "marimba" | "piano" | "key" | "retro" | "blip"
  | "swap-snap" | "swap-whoosh" | "swap-tick" | "swap-punch" | "swap-spark" | "engine"
  | "data-step" | "crane-hook" | "crane-lift" | "crane-drive" | "crane-set";
export type AssetSfxId = `asset-sfx:${string}`;
export type SfxKind = ProceduralSfxKind | AssetSfxId;
export type MusicPreset = "off" | "lofi" | "ambient" | "chill" | "upbeat" | "custom";

export class AudioEngine {
  ctx: AudioContext;
  master: GainNode;
  sfxGain: GainNode;
  musicGain: GainNode;
  voiceGain: GainNode;
  dest?: MediaStreamAudioDestinationNode;
  musicEl?: HTMLAudioElement;
  musicSrc?: MediaElementAudioSourceNode;
  voiceEl?: HTMLAudioElement;
  voiceSrc?: MediaElementAudioSourceNode;
  private musicLoopTimer: number | null = null;
  private musicLoopDelayMs = 0;
  private musicPlaying = false;
  private musicPlaylist: string[] = [];
  private musicPlaylistIndex = 0;
  private sfxBuffers = new Map<AssetSfxId, AudioBuffer>();
  private sfxBufferPromises = new Map<AssetSfxId, Promise<AudioBuffer>>();

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
    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.value = 0.85;
    this.voiceGain.connect(this.master);
  }

  resume() {
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setSfxVolume(v: number) { this.sfxGain.gain.value = v; }
  setMusicVolume(v: number) { this.musicGain.gain.value = v; }
  setVoiceVolume(v: number) { this.voiceGain.gain.value = v; }

  loadAssetSfx(id: AssetSfxId, url: string): Promise<AudioBuffer> {
    const cached = this.sfxBuffers.get(id);
    if (cached) return Promise.resolve(cached);
    const existing = this.sfxBufferPromises.get(id);
    if (existing) return existing;
    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load SFX: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => this.ctx.decodeAudioData(buf))
      .then((audioBuffer) => {
        this.sfxBuffers.set(id, audioBuffer);
        this.sfxBufferPromises.delete(id);
        return audioBuffer;
      })
      .catch((err) => {
        this.sfxBufferPromises.delete(id);
        throw err;
      });
    this.sfxBufferPromises.set(id, promise);
    return promise;
  }

  getRecordStream(): MediaStream {
    if (!this.dest) {
      this.dest = this.ctx.createMediaStreamDestination();
      this.sfxGain.connect(this.dest);
      this.musicGain.connect(this.dest);
      this.voiceGain.connect(this.dest);
    }
    return this.dest.stream;
  }

  setMusicSource(url: string | null) {
    this.stopCustomMusic();
    this.musicPlaylist = url ? [url] : [];
    this.musicPlaylistIndex = 0;
    if (this.musicSrc) {
      try { this.musicSrc.disconnect(); } catch { /* noop */ }
    }
    if (!url) { this.musicEl = undefined; this.musicSrc = undefined; return; }
    const el = new Audio(url);
    el.loop = false;
    el.preload = "metadata";
    el.playbackRate = 1;
    el.crossOrigin = "anonymous";
    el.addEventListener("ended", () => this.scheduleCustomLoop());
    this.musicEl = el;
    this.musicSrc = this.ctx.createMediaElementSource(el);
    this.musicSrc.connect(this.musicGain);
  }

  setMusicSources(urls: string[]) {
    const playlist = urls.filter(Boolean);
    this.setMusicSource(playlist[0] ?? null);
    this.musicPlaylist = playlist;
  }

  setVoiceSource(url: string | null) {
    this.stopVoice(true);
    if (this.voiceSrc) {
      try { this.voiceSrc.disconnect(); } catch { /* noop */ }
    }
    if (!url) { this.voiceEl = undefined; this.voiceSrc = undefined; return; }
    const el = new Audio(url);
    el.loop = false;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    this.voiceEl = el;
    this.voiceSrc = this.ctx.createMediaElementSource(el);
    this.voiceSrc.connect(this.voiceGain);
  }

  hasVoiceSource() {
    return Boolean(this.voiceEl?.src);
  }

  async waitForVoiceReady(timeoutMs = 15000): Promise<void> {
    const el = this.voiceEl;
    if (!el) throw new Error("Chưa có file voice-over để nhúng vào video.");
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        window.clearTimeout(timer);
        el.removeEventListener("canplaythrough", onReady);
        el.removeEventListener("canplay", onReady);
        el.removeEventListener("loadeddata", onReady);
        el.removeEventListener("error", onError);
      };
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };
      const onReady = () => finish(resolve);
      const onError = () => finish(() => reject(new Error("Không tải được file voice-over.")));
      const timer = window.setTimeout(() => {
        if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) finish(resolve);
        else finish(() => reject(new Error("Voice-over tải quá lâu. Hãy kiểm tra backend/file audio.")));
      }, timeoutMs);

      el.addEventListener("canplaythrough", onReady, { once: true });
      el.addEventListener("canplay", onReady, { once: true });
      el.addEventListener("loadeddata", onReady, { once: true });
      el.addEventListener("error", onError, { once: true });
      el.load();
    });
  }

  async playVoice(startSeconds = 0): Promise<void> {
    if (!this.voiceEl) return;
    this.resume();
    await this.waitForVoiceReady();
    try { this.voiceEl.currentTime = Math.max(0, startSeconds); } catch { /* noop */ }
    this.voiceEl.playbackRate = 1;
    this.voiceEl.preservesPitch = true;
    await this.voiceEl.play().catch(() => undefined);
  }

  stopVoice(reset: boolean) {
    if (!this.voiceEl) return;
    this.voiceEl.pause();
    if (reset) {
      try { this.voiceEl.currentTime = 0; } catch { /* noop */ }
    }
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
    if (preset !== "custom") this.pauseCustomMusic(false);
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
    this.resume();
    if (this.currentPreset !== "off" && this.currentPreset !== "custom") {
      this.setMusicPreset(this.currentPreset);
    }
    if (this.currentPreset === "custom") this.playCustomMusic();
  }
  stopMusic() {
    this.stopProcedural();
    this.pauseCustomMusic(true);
  }

  private playCustomMusic() {
    if (!this.musicEl) return;
    this.clearCustomLoopTimer();
    this.musicPlaying = true;
    this.musicEl.playbackRate = 1;
    this.musicEl.preservesPitch = true;
    this.musicEl.play().catch(() => {});
  }

  private pauseCustomMusic(reset: boolean) {
    this.clearCustomLoopTimer();
    this.musicPlaying = false;
    if (!this.musicEl) return;
    this.musicEl.pause();
    this.musicEl.playbackRate = 1;
    if (reset) this.musicEl.currentTime = 0;
  }

  private stopCustomMusic() {
    this.pauseCustomMusic(true);
    if (this.musicEl) {
      this.musicEl.src = "";
      this.musicEl.load();
    }
  }

  private scheduleCustomLoop() {
    if (!this.musicPlaying || !this.musicEl) return;
    this.clearCustomLoopTimer();
    this.musicLoopTimer = window.setTimeout(() => {
      if (!this.musicPlaying || !this.musicEl) return;
      if (this.musicPlaylist.length > 1) {
        this.musicPlaylistIndex = (this.musicPlaylistIndex + 1) % this.musicPlaylist.length;
        this.musicEl.src = this.musicPlaylist[this.musicPlaylistIndex];
        this.musicEl.load();
      } else {
        this.musicEl.currentTime = 0;
      }
      this.playCustomMusic();
    }, this.musicLoopDelayMs);
  }

  private clearCustomLoopTimer() {
    if (this.musicLoopTimer == null) return;
    window.clearTimeout(this.musicLoopTimer);
    this.musicLoopTimer = null;
  }

  /**
   * Play one SFX. Optional `pitch` (0..1) shifts frequency — used to tie sound
   * to bar value (similar to classic sorting visualizers).
   */
  playSfx(kind: SfxKind, pitch = 0.5) {
    if (kind === "off") return;
    this.resume();
    if (isAssetSfxId(kind)) {
      this.playAssetSfx(kind);
      return;
    }
    const t0 = this.ctx.currentTime;
    const p = Math.max(0, Math.min(1, pitch));

    const oneShot = (type: OscillatorType, f0: number, f1: number, dur: number, gain = 0.35, offset = 0) => {
      const start = t0 + offset;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, start);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), start + dur);
      g.gain.setValueAtTime(gain, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(g).connect(this.sfxGain);
      o.start(start); o.stop(start + dur + 0.02);
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
      case "swap-snap": {
        oneShot("square", 1800, 900, 0.035, 0.22);
        oneShot("triangle", 420, 210, 0.1, 0.2, 0.025);
        break;
      }
      case "swap-whoosh": {
        oneShot("sawtooth", 160, 980, 0.18, 0.12);
        oneShot("sine", 660, 1320, 0.1, 0.08, 0.045);
        break;
      }
      case "swap-tick": {
        oneShot("square", 1400, 1400, 0.025, 0.16);
        oneShot("square", 1700, 1700, 0.025, 0.14, 0.075);
        break;
      }
      case "swap-punch": {
        oneShot("sine", 150, 70, 0.13, 0.28);
        oneShot("square", 520, 260, 0.045, 0.16);
        break;
      }
      case "swap-spark": {
        oneShot("triangle", 880, 1320, 0.08, 0.14);
        oneShot("sine", 1760, 2340, 0.09, 0.1, 0.04);
        break;
      }
      case "engine": {
        oneShot("sawtooth", 70 + p * 45, 95 + p * 55, 0.13, 0.12);
        oneShot("square", 42 + p * 28, 38 + p * 22, 0.11, 0.08, 0.02);
        break;
      }
      case "data-step": {
        oneShot("sine", 520 + p * 180, 680 + p * 220, 0.055, 0.09);
        oneShot("triangle", 1040 + p * 220, 860 + p * 180, 0.08, 0.035, 0.015);
        break;
      }
      case "crane-hook": {
        oneShot("triangle", 820, 520, 0.07, 0.11);
        oneShot("sine", 1640, 980, 0.05, 0.045, 0.025);
        break;
      }
      case "crane-lift": {
        oneShot("sawtooth", 92, 142, 0.26, 0.065);
        oneShot("sine", 188, 238, 0.30, 0.075, 0.02);
        break;
      }
      case "crane-drive": {
        oneShot("sawtooth", 78, 108, 0.32, 0.055);
        oneShot("triangle", 156, 196, 0.24, 0.045, 0.035);
        break;
      }
      case "crane-set": {
        oneShot("sine", 150, 68, 0.18, 0.12);
        oneShot("triangle", 460, 260, 0.085, 0.06, 0.025);
        break;
      }
    }
  }

  private playAssetSfx(id: AssetSfxId) {
    const buffer = this.sfxBuffers.get(id);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.9;
    source.connect(gain).connect(this.sfxGain);
    source.start();
  }

  async loadCustomSfx(file: File): Promise<AudioBuffer> {
    const buf = await file.arrayBuffer();
    return await this.ctx.decodeAudioData(buf);
  }
}

export function isAssetSfxId(kind: SfxKind): kind is AssetSfxId {
  return kind.startsWith("asset-sfx:");
}

export const audioEngine = new AudioEngine();
