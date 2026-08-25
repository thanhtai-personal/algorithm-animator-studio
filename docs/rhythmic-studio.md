# Marble Music Studio

Route: `/algorithms/rhythmic`

Marble Music Studio is integrated into KAI Studio's Algorithm Studio group. It creates beat-bounce videos in portrait 9:16 and landscape 16:9: every accepted note/hit generates a neon platform and the marble lands on that platform at the exact event timestamp while the camera scrolls through the course.

## Inputs

- Built-in synthesized melodies.
- Standard MIDI files: note timing, pitch, velocity and duration are parsed locally in the browser. Pitch influences horizontal platform position.
- Audio files supported by the browser: a lightweight RMS onset detector creates rhythmic hits. This is beat/onset detection, not full melody transcription.

## Course and motion

- Beat timing controls platform-contact timestamps.
- Platform width, thickness, vertical gap, lane spread, minimum horizontal jump and tilt are adjustable.
- Eight procedural platform looks are available: neon tube lamp, neon edge bar, glass light plate, metal neon rail, dual rail, light pods, tech pad and prism segments.
- Styles can be single, alternating, accent-based or deterministically shuffled in the same generated course.
- Bounce height, curved flight path, acceleration shaping, camera anchor and camera follow can be tuned.
- The camera tracks the marble through a procedural vertical platform staircase rather than a circular shield arena.
- Impact ripple, platform glow, marble glow, trail, particles and neon colors react to collisions.
- Optional beat numbers help inspect generated platform order.

## Audio

- Imported source audio only starts when the Marble Music Play/Export action starts playback.
- Original audio/MIDI music and collision SFX use separate mixer buses, then pass through a safety compressor for cleaner headroom.
- Collision SFX have independent level, tone brightness, stereo width and room reverb controls.
- MIDI parsing preserves channel, Program Change and channel-10 drums. Full MIDI notes are scheduled independently from the filtered marble-hit timeline so chords/accompaniment are not discarded just because visual hits are spaced out.
- Auto MIDI mode maps General MIDI program families and drum notes to the richer in-browser voice set. This improves orchestration substantially, but it is still synthesized Web Audio rather than a bundled sample SoundFont.
- A short look-ahead scheduler prevents long MIDI files from creating thousands of Web Audio voices at load/start time.

## Preview and export

- Canvas preview/export: selectable 720x1280 (9:16) or 1280x720 (16:9).
- Export uses `canvas.captureStream(60)` plus the Web Audio recording destination and `MediaRecorder`.
- MIME support is detected at runtime; WebM is not relabeled as MP4.
- For MP4, run `scripts/convert-rhythmic-webm-to-mp4.bat input.webm` on a machine with FFmpeg available.

## Projects

Settings/source metadata are saved to `localStorage` under `kai-studio.rhythmic-projects.v1`. Older Rhythmic presets remain loadable because missing Marble Music settings are merged with current defaults. Browser File objects are intentionally not persisted, so MIDI/audio sources must be re-imported after a reload.

## Chill mode behavior

Chill mode no longer starts music because the user is idle. Enabling Chill mode only makes the player available; playback starts from an explicit Play action.
