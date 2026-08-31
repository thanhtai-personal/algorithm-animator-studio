export const RHYTHMIC_MASTER_GAIN = 0.88;
export const DEFAULT_COLLISION_VOLUME = 0.62;
// Collision voices are short transients and otherwise sound noticeably quieter
// than the sustained MIDI/original-audio buses. The output compressor still
// catches dense overlaps, while this gain keeps a single hit clearly audible.
export const COLLISION_VOICE_GAIN = 1.45;
export const MIDI_SESSION_GAIN = 0.82;
// MIDI carries the song, so a normal melody note must not sit 5-6 dB below
// the collision transient. Dense chords are still caught by the output
// compressor; these values restore clarity without raising the master bus.
export const MIDI_VOICE_GAIN = 0.78;
export const MIDI_DRUM_GAIN = 0.62;

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
