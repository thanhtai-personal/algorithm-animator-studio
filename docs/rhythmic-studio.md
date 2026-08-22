# Rhythmic Studio

Route: `/algorithms/rhythmic`

Rhythmic Studio is integrated into KAI Studio's Algorithm Studio group. It creates 9:16 collision videos whose ball impacts are driven by a deterministic note/hit timeline.

## Inputs

- Built-in synthesized melodies.
- Standard MIDI files: note timing, velocity and duration are parsed locally in the browser.
- Audio files supported by the browser: a lightweight RMS onset detector creates rhythmic hits. This is beat/onset detection, not full melody transcription.

## Controls

- Playback speed, sync offset, minimum collision spacing and minimum impact distance.
- Auto-sync gap handling.
- Decoupled ball speed, acceleration mode/factor/rate, min/max speed caps, curve intensity and path length.
- Rhythmic shield ring, radius, destroy mode and size multiplier.
- Pulse, glow, ring sensitivity, animation sensitivity, spectral density, trail and particles.
- Shell/prism/background colors, ball size, synth preset and synth volume.

## Preview and export

- Canvas preview: 720x1280, 9:16.
- Web Audio synth follows collisions; imported source audio can play simultaneously.
- Export uses `canvas.captureStream(60)` plus the Web Audio recording destination and `MediaRecorder`.
- MIME support is detected at runtime; WebM is not relabeled as MP4.
- For MP4, run `scripts/convert-rhythmic-webm-to-mp4.bat input.webm` on a machine with FFmpeg available.

## Projects

Settings/source metadata are saved to `localStorage` under `kai-studio.rhythmic-projects.v1`. Browser File objects are intentionally not persisted, so MIDI/audio sources must be re-imported after a reload.

## Verification in this change

- MIDI parser and timeline were type-checked with TypeScript 5.8.3 and executed against a generated two-note Standard MIDI file: C4 at 0 ms and E4 at 500 ms.
- All new/touched source files stay below the repository's 400-line rule.
- `npm ci` was attempted but the sandbox dependency install timed out. Therefore a full Vite production build could not be certified in this environment.
