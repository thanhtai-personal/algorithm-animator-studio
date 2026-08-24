export const RHYTHMIC_MASTER_GAIN = 0.88;
export const DEFAULT_COLLISION_VOLUME = 0.62;
export const COLLISION_VOICE_GAIN = 0.98;
export const MIDI_SESSION_GAIN = 0.82;
export const MIDI_VOICE_GAIN = 0.55;
export const MIDI_DRUM_GAIN = 0.45;

const VOICE_BASE_PEAK = 0.24;

export function cleanMusicGain(value: number) {
  return Math.min(1.16, Math.max(0, value) * 0.82);
}

export function estimatedCollisionPeak(velocity: number, volume: number) {
  return Math.max(0.025, Math.min(1, velocity))
    * VOICE_BASE_PEAK
    * COLLISION_VOICE_GAIN
    * Math.max(0, Math.min(1, volume))
    * RHYTHMIC_MASTER_GAIN;
}

export function estimatedMidiPeak(velocity: number, musicVolume: number) {
  return Math.max(0.025, Math.min(1, velocity))
    * VOICE_BASE_PEAK
    * MIDI_VOICE_GAIN
    * MIDI_SESSION_GAIN
    * cleanMusicGain(musicVolume)
    * RHYTHMIC_MASTER_GAIN;
}
