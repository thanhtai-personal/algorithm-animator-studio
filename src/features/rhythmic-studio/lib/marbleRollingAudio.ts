export class MarbleRollingAudio {
  private noiseBuffer: AudioBuffer | null = null;

  play(context: AudioContext, destination: AudioNode, strength: number, pan: number) {
    const intensity = Math.max(0, Math.min(1, strength / 17));
    if (intensity < 0.04) return;
    const source = context.createBufferSource();
    const tone = context.createBiquadFilter();
    const output = context.createGain();
    const panner = context.createStereoPanner();
    const buffer = this.buffer(context);
    source.buffer = buffer;
    source.playbackRate.value = 0.9 + intensity * 1.45;
    tone.type = "bandpass";
    tone.frequency.value = 260 + intensity * 920;
    tone.Q.value = 0.72 + intensity * 0.5;

    const when = context.currentTime + 0.002;
    const duration = 0.095;
    const peak = 0.012 + intensity * 0.064;
    output.gain.setValueAtTime(0.0001, when);
    output.gain.linearRampToValueAtTime(peak, when + 0.012);
    output.gain.setValueAtTime(peak * 0.9, when + duration * 0.68);
    output.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    panner.pan.value = Math.max(-1, Math.min(1, pan));

    source.connect(tone);
    tone.connect(output);
    output.connect(panner);
    panner.connect(destination);
    const maxOffset = Math.max(0, buffer.duration - duration);
    source.start(when, Math.random() * maxOffset, duration);
    source.onended = () => {
      for (const node of [source, tone, output, panner]) {
        try { node.disconnect(); } catch { /* already disconnected */ }
      }
    };
  }

  private buffer(context: AudioContext) {
    if (this.noiseBuffer) return this.noiseBuffer;
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.82 + white * 0.18;
      data[index] = previous;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }
}
