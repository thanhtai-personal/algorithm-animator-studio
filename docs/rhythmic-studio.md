# Marble Music Studio

Route: `/algorithms/rhythmic`

Marble Music Studio is integrated into KAI Studio's Algorithm Studio group. It creates 9:16 beat-bounce videos: every accepted note/hit generates a neon platform and the marble lands on that platform at the exact event timestamp while the camera scrolls through the course.

## Inputs

- Built-in synthesized melodies.
- Standard MIDI files: note timing, pitch, velocity and duration are parsed locally in the browser. Pitch influences horizontal platform position.
- Audio files supported by the browser: a lightweight RMS onset detector creates rhythmic hits. This is beat/onset detection, not full melody transcription.

## Course and motion

- Beat timing controls platform-contact timestamps.
- Platform width, thickness, vertical gap, lane spread, minimum horizontal jump and tilt are adjustable.
- Bounce height, curved flight path, acceleration shaping, camera anchor and camera follow can be tuned.
- The camera tracks the marble through a procedural vertical platform staircase rather than a circular shield arena.
- Impact ripple, platform glow, marble glow, trail, particles and neon colors react to collisions.
- Optional beat numbers help inspect generated platform order.

## Audio

- Imported source audio only starts when the Marble Music Play/Export action starts playback.
- Web Audio synth hits fire at platform collisions; imported source audio can play simultaneously.
- MIDI is the precision path for note-for-note melody videos; song import remains onset/beat mode.

## Preview and export

- Canvas preview: 720x1280, 9:16.
- Export uses `canvas.captureStream(60)` plus the Web Audio recording destination and `MediaRecorder`.
- MIME support is detected at runtime; WebM is not relabeled as MP4.
- For MP4, run `scripts/convert-rhythmic-webm-to-mp4.bat input.webm` on a machine with FFmpeg available.

## Projects

Settings/source metadata are saved to `localStorage` under `kai-studio.rhythmic-projects.v1`. Older Rhythmic presets remain loadable because missing Marble Music settings are merged with current defaults. Browser File objects are intentionally not persisted, so MIDI/audio sources must be re-imported after a reload.

## Chill mode behavior

Chill mode no longer starts music because the user is idle. Enabling Chill mode only makes the player available; playback starts from an explicit Play action.
