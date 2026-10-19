# Task 05 — Source-driven vector reconstruction, 00:40–10:08.68

**Status:** IMPLEMENTED CODE, visual QA underway; still not frame-perfect.  
**Commit branch:** `feature/math-video-studio-v1` · PR #23.

## Source of truth

`math-sincos-v1.scene-manifest.json.referenceBeats` contains 36 ordered source-derived visual cues. Its chapter boundaries are **candidate bounds** selected from sampled frames and change peaks; do not claim precise edit decisions. New function `referenceBeatAt(frame)` resolves an exact active data cue for every global frame. Unlike old chapter-length, static artwork, the renderer now branches on the cue number.

## Animation modules

- `MathReferenceBeats.ts`: pure frame-to-cue lookup and deterministic local clock.
- `MathReferencePrimitives.tsx`: small SVG circle/axes/projection, waveform, forking, fine typography, person, protractor and note box.
- `MathReferenceChapterA.tsx`: circle/sin-cos signs (8 beats), Pythagoras area proof, white/cyan/orange waves/radian, complementary angles, tangent graph and asymptotes.
- `MathReferenceChapterB.tsx`: historic half-chord/jyā → sinus, tuning fork/audio waves, seasonal Earth tilt, Sun/shadow geometry, tide curve, tan-height tree, wheelchair access ramp, percent slope and electric three-phase signals/220–380 V, final test card/logo.
- `MathChapters.tsx`: thin dispatcher; existing `MathIntro.tsx` remains for the first 1,075 frames.

All rendering uses SVG paths computed exclusively from `frame`; no source MP4 playback or audio redistribution.

## Validation and source fidelity

For each of 35 nonintro beats: tests render a middle frame via React SSR (no NaN/Infinity), check deterministic seek and source-aligned subject cues, and assert contiguous manifest coverage. CI also exports Remotion stills at representative source timestamps and 40s preview.

**Remaining:** frame-by-frame tracing of each source beat, text/line/artwork tolerances, faithful motion easing and authorized narration. Task 05 code coverage is not the same as pixel-perfect source match. PR remains Draft.
