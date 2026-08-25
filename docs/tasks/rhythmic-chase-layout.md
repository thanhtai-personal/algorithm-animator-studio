# Spec: Rhythmic Studio — Clean Phrase Layout and Two-Marble Chase

Status: Specification, implementation plan, and task list approved on 2026-08-25; implementation in progress

## Objective

Improve the rhythmic video composer so its instrument course reads as a deliberate musical arrangement instead of a collection of randomly rotated objects. Add an optional two-marble/two-sprite chase mode that preserves every original MIDI onset while either marble can be the one that performs a strike.

The single-marble Canvas 2D and WebGL 3D modes remain available and keep their existing project compatibility.

## Reference Findings

Five videos from `C:\DATA\ai-video\download\marble ball\used` were sampled across their durations. Their reusable layout rules are:

1. A phrase keeps one dominant instrument family and one geometric motif.
2. Fast notes become connected keys, rails, or two parallel rows instead of independent distant props.
3. The frame shows one active cluster and at most one upcoming cluster, leaving deliberate negative space.
4. Every playing face points toward the marble; instrument axes follow the local travel path.
5. Repeated instruments keep consistent size, depth, tilt, and shadow direction within a phrase.
6. Scene changes happen at musical phrase boundaries, not on every note.

The brick-wall treatment is based on `FDown.vn_Tai_video_Facebook_360p (SD)_3264.mp4`: dark staggered masonry, recessed mortar, rough value variation, localized red light, and a strong vignette.

## Functional Model

### Course modes

- `single`: current one-marble behavior.
- `chase`: two independently selectable marbles/sprites share one MIDI timeline.
- `single` remains the default and follows the existing planner, camera, renderer, audio, and export paths without chase branching or changed numeric output.

### MIDI ownership in chase mode

- MIDI notes are first grouped into physical strike clusters using the existing chord/onset threshold.
- Strike clusters alternate ownership between marble A and marble B. Notes in one chord never split across marbles.
- Each source `NoteEvent` retains its exact `timeMs`; ownership never shifts, stretches, duplicates, or drops a MIDI event.
- Each marble gets a continuous physical trajectory through only its owned strike clusters.
- At each event time, the owning marble is exactly at the playable face of that event's instrument.
- Audio is emitted once per source event ID. The first valid contact for the assigned strike owns its VFX/audio trigger; a second contact cannot replay it.

This alternating-strike model is the recommended meaning of “two marbles chase each other.” Having both marbles play the entire song with a phase delay is intentionally excluded because it duplicates and offsets the original MIDI.

### Phrase layout

- Segment the timeline at long rests, clear tempo transitions, and instrument-family changes.
- Keep one visual family per phrase unless the MIDI explicitly calls for percussion plus melody.
- Sparse phrases use single instruments along one readable arc.
- Fast phrases use connected keys or parallel rails. Chase mode uses one coordinated lane per marble with a shared downward flow.
- Lane changes occur only at phrase boundaries or at a visible collision that physically explains the turn.
- All playing normals point upward in screen space and every free-flight strike visibly separates from the face on the next frame.
- A terminal rolling key places the hit at its forward edge before free flight begins.
- Rendering keeps only the active cluster plus one preloaded cluster inside the camera window; offscreen lifecycle rules remain identical in preview and export.

### Controls

- Add a compact `1 bi / 2 bi rượt nhau` mode selector to the external ball frame.
- In chase mode, show separate selectors for marble/avatar A and B.
- Each selection applies its own compatible style defaults so advanced controls cannot accidentally overwrite the selected style.
- Existing 2D/3D renderer selection, original-song audio toggle, shadows toggle, and export sizes remain unchanged.

## Tech Stack

- React 18, TypeScript, Vite
- Canvas 2D renderer and React Three Fiber/Three.js WebGL renderer
- Zustand-style studio store already used by Rhythmic Studio
- Vitest for unit and integration regressions

## Commands

- Development client: `npm run dev:client`
- Focused tests: `npm test -- src/test/RhythmicChaseCourse.test.ts src/test/RhythmicPhraseLayout.test.ts`
- Full tests: `npm test`
- Production build: `npm run build`

## Project Structure

- `src/features/rhythmic-studio/engine/` — phrase segmentation and single/chase course planning
- `src/features/rhythmic-studio/lib/` — deterministic track sampling, ownership, 2D drawing, audio event identity
- `src/features/rhythmic-studio/components/` — WebGL marbles, scene motion, lighting, and stage wiring
- `src/features/rhythmic-studio/presentation/` — mode and marble selectors
- `src/test/` — physics, ownership, rendering lifecycle, and MIDI synchronization regressions
- `docs/tasks/` — this living feature specification

## Code Style

Prefer small pure models shared by 2D and 3D:

```ts
const strike = chasePlan.strikes[eventIndex];
const point = marblePointAtTime(strike.owner, timeMs, chasePlan);

if (Math.abs(timeMs - strike.timeMs) <= CONTACT_EPSILON_MS) {
  emitHitOnce(strike.eventId, strike.owner);
}
```

New and touched source files stay at 400 lines or less. Names describe physical meaning (`strikeOwner`, `playingNormal`, `terminalEdge`) rather than renderer-specific implementation details.

## Testing Strategy

1. Pure ownership tests verify alternating strike clusters and unsplit chords.
2. Course tests verify both tracks are continuous, top-facing, non-overlapping, and at their assigned hit point at the exact MIDI timestamp.
3. Audio scheduling tests verify every event fires once and in original order regardless of owner.
4. Renderer tests verify both marbles use the same shared plan in Canvas 2D and WebGL 3D.
5. Existing lifecycle tests verify instruments render before entering the frame and disappear only after fully leaving it.
6. Manual regression uses `C:\Users\Kai.Tran\Music\midi\Pinkfong-Babyshark.mid` in single and chase modes, Canvas 2D and WebGL 3D, followed by a short export inspection.
7. Final verification runs the full Vitest suite and `npm run build`, then closes the development port and removes temporary browser/video artifacts.

## Boundaries

- Always: preserve exact MIDI timestamps, sound each event once, keep single mode, support 2D and 3D, use deterministic layouts, clean temporary artifacts, close test ports.
- Ask first: change the recommended alternating-strike ownership model, add a dependency, or alter saved-project migration semantics beyond safe defaults.
- Never: duplicate notes to fake a chase, hide bad motion with camera jumps, permit downward playing faces, remove 2D mode, or delete user project data.

## Success Criteria

- `single` and `chase` are both selectable and persist in saved projects/local storage.
- Marble A and B can independently use a ball style or sprite avatar.
- For every source event, exactly one owner reaches the instrument at `event.timeMs` with endpoint error below `0.01 px`.
- Playback and export emit the same ordered event IDs with zero duplicates and zero missing events.
- Chords are owned by one marble and sound together.
- No visible playing surface has `normalY >= -0.2`.
- A normal ballistic strike has at least `0.2 px` signed separation from its playing face after one 60 fps frame.
- Long-gap vertical travel stays within the physics profile's configured limit.
- Phrase layout uses at most two concurrent travel lanes and no more than two unrelated visible phrase clusters.
- The exact Baby Shark regression reports zero downward faces, zero endpoint discontinuities, and no stuck terminal-key exits.
- The dark brick preset appears consistently in preview and exported 2D/3D video.
- Full tests and production build pass.

## Approved Decision

The user approved alternating strike-cluster ownership on 2026-08-25. Chase mode alternates whole onset/chord clusters between marble A and marble B. Single-marble mode remains unchanged.

The user approved the implementation plan on 2026-08-25 with an explicit non-regression requirement: mode `single` must not be damaged. Every implementation task therefore has a single-mode checkpoint, and chase code must be opt-in behind `marbleMode === "chase"`.

## Implementation Plan

### 1. Shared chase contracts and safe project migration

- Add `single | chase` mode, marble B appearance settings, stable strike IDs, and `A | B` ownership types.
- Default missing saved fields to `single` so every existing project opens without changing its current output.
- Keep appearance resolution separate for A and B; changing B must never overwrite A's material profile.
- Checkpoint: migration and store tests prove old projects remain single and new chase settings round-trip.

### 2. Deterministic ownership and phrase-aware dual trajectories

- Build a pure strike-cluster model from the existing onset/chord grouping; alternate clusters, never raw notes.
- Segment musical phrases from rests, tempo/density transitions, and instrument-family changes.
- Plan one continuous track per owner while keeping a shared platform/event index so MIDI timestamps remain authoritative.
- Reuse connected keys and parallel lanes for dense phrases; retain ballistic motion for readable gaps.
- Checkpoint: exact ownership, chord integrity, endpoint error, upward normals, next-frame separation, and no overlapping unrelated clusters pass as pure engine tests.

### 3. One event scheduler, two 2D performers

- Keep the existing global ordered audio scheduler as the single source of sound events and attach the assigned owner only to contact/VFX state.
- Sample and draw two marble tracks, trails, and sprite motions in Canvas 2D without duplicating the platform list.
- Focus the camera on the bounded midpoint of A and B so neither performer causes a camera snap.
- Checkpoint: 2D renderer tests prove two visible performers and exactly one audio emission per source event.

### 4. WebGL parity and export parity

- Render two independently styled `RhythmicMarble3D` instances from the same shared chase plan.
- Apply each contact pulse only to its owning performer and instrument; keep shadows and playing-face corrections intact.
- Use the same dual-focus camera calculation in live WebGL and recorded/exported frames.
- Checkpoint: WebGL scene tests and deterministic frame sampling match Canvas ownership/timing.

### 5. Compact controls and persistence

- Add `1 bi / 2 bi rượt nhau` to the external ball frame.
- In chase mode expose compact A/B avatar and material pickers; in WebGL restrict both to real ball materials just as single mode does today.
- Add Vietnamese/English labels and persist all fields through projects and local storage.
- Checkpoint: interaction tests select, persist, reload, and switch back to single without stale B controls.

### 6. Full Baby Shark and export regression

- Run the exact `Pinkfong-Babyshark.mid` diagnostic in single/chase and Canvas/WebGL paths.
- Verify zero missing/duplicate/reordered note IDs, zero downward playing faces, bounded motion, and no stuck terminal exits.
- Inspect a short portrait and landscape export for instrument clutter, chase readability, audio sync, brick background, and both selected marbles.
- Run the full Vitest suite and production build, remove temporary artifacts, and close development/test ports.

## Dependencies and Ordering

Steps 1–2 are sequential and form the authoritative model. Steps 3 and 4 depend on that model but can then proceed independently. Step 5 depends on the contracts from step 1 and can run alongside renderer integration. Step 6 begins only after both renderers and controls are complete.

## Risks and Mitigations

- **Dense MIDI makes one owner teleport:** cluster ownership is fixed first, then each track receives its own dense-run layout; no renderer-side interpolation is allowed to invent motion.
- **A chord sounds twice:** audio remains one global source-event queue, and ownership is metadata rather than a second scheduler.
- **Two performers widen the camera too far:** clamp midpoint framing and lane width per phrase instead of zooming to every outlier.
- **Saved projects break:** all new fields are optional at the storage boundary and normalized to safe single-mode defaults.
- **2D and 3D diverge:** both consume the same ownership/trajectory plan; renderer-specific code only projects and draws it.

## Implementation Tasks

- [x] Task 0: Freeze the current one-marble behavior with characterization tests
  - Acceptance: representative sparse, chord, dense-run, terminal-key, Canvas, and WebGL single-mode outputs have deterministic assertions before chase production code is introduced.
  - Verify: `npm test -- src/test/RhythmicSingleModeBaseline.test.ts src/test/RhythmicDenseInstrumentRuns.test.ts src/test/RhythmicMidiImportRegression.test.ts`
  - Files: `src/test/RhythmicSingleModeBaseline.test.ts` only.

- [x] Task 1: Add opt-in chase settings and backward-compatible normalization
  - Acceptance: missing/new invalid fields normalize to `single`; existing settings are byte-equivalent for all old fields; B has an independent avatar/material selection; toggling chase off restores the untouched A settings.
  - Verify: first run new tests RED, then `npm test -- src/test/RhythmicChaseSettings.test.ts src/test/RhythmicSingleModeBaseline.test.ts` GREEN.
  - Files: `types.ts`, `defaults.ts`, `lib/chaseSettings.ts`, `store/RhythmicStudioStore.ts`, `src/test/RhythmicChaseSettings.test.ts`.

- [x] Task 2: Assign complete onset/chord clusters alternately to A and B
  - Acceptance: ownership is deterministic A–B, simultaneous notes never split, each source event ID appears once, timestamps and ordering remain unchanged, and single mode returns owner A without re-grouping the existing course.
  - Verify: RED/GREEN `npm test -- src/test/RhythmicChaseOwnership.test.ts src/test/RhythmicPlaybackSync.test.ts`.
  - Files: `engine/chaseStrikeOwnership.ts`, `src/test/RhythmicChaseOwnership.test.ts`.

- [x] Task 3: Produce phrase-aware dual trajectories without clutter or bad faces
  - Acceptance: each owner has a continuous route through owned strikes; dense phrases use connected keys/parallel lanes; no chord endpoint error, underside face, stuck exit, teleport, or unrelated third cluster is introduced; the original single planner is not called differently.
  - Verify: RED/GREEN `npm test -- src/test/RhythmicChaseCourse.test.ts src/test/RhythmicPhraseLayout.test.ts src/test/RhythmicSingleModeBaseline.test.ts`.
  - Files: `engine/chaseCoursePlanner.ts`, `engine/rhythmicPhraseLayout.ts`, `lib/chaseCourse.ts`, `src/test/RhythmicChaseCourse.test.ts`, `src/test/RhythmicPhraseLayout.test.ts`.

- [x] Task 4: Integrate the chase plan into prepared-course and worker boundaries
  - Acceptance: preparation returns a discriminated single/chase result; worker and synchronous fallback agree; single mode still returns the existing platform array and samples with no conversion layer.
  - Verify: RED/GREEN `npm test -- src/test/RhythmicPreparedChaseCourse.test.ts src/test/RhythmicSingleModeBaseline.test.ts`, then `npm run build`.
  - Files: `engine/marbleCoursePreparation.ts`, `engine/marbleCourseWorkerPayload.ts`, `workers/marbleCourse.worker.ts`, `hooks/usePreparedMarbleCourse.ts`, `src/test/RhythmicPreparedChaseCourse.test.ts`.

- [x] Task 5: Render and schedule two performers in Canvas 2D
  - Acceptance: Canvas draws two independently styled balls/sprites only in chase mode; midpoint camera movement is bounded; the existing single global event queue emits every source event exactly once; single mode render fingerprints stay unchanged.
  - Verify: RED/GREEN `npm test -- src/test/RhythmicChaseCanvas.test.tsx src/test/RhythmicChaseAudio.test.ts src/test/RhythmicSingleModeBaseline.test.ts`.
  - Files: `components/RhythmicCanvas.tsx`, `lib/rhythmicFrameRenderer.ts`, `lib/chaseFrameRenderer2D.ts`, `src/test/RhythmicChaseCanvas.test.tsx`, `src/test/RhythmicChaseAudio.test.ts`.

- [x] Task 6: Render two performers with matching contacts in WebGL 3D
  - Acceptance: WebGL samples the same two tracks, applies pulse/contact to the correct owner, preserves instrument shadows and top-face corrections, and instantiates exactly one marble in single mode.
  - Verify: RED/GREEN `npm test -- src/test/RhythmicChaseWebGL.test.tsx src/test/RhythmicMotionContact3D.test.ts src/test/RhythmicSingleModeBaseline.test.ts`.
  - Files: `components/RhythmicSceneContent3D.tsx`, `components/RhythmicMotion3D.ts`, `components/RhythmicChaseMarbles3D.tsx`, `components/rhythmicSceneMath3D.ts`, `src/test/RhythmicChaseWebGL.test.tsx`.

- [ ] Task 7: Add compact 1-bi/2-bi controls and persistence
  - Acceptance: the external ball frame switches modes; B controls appear only in chase; A/B style/avatar choices are independent; WebGL hides sprite options for both; save/load and local storage retain chase while old projects remain single.
  - Verify: RED/GREEN `npm test -- src/test/RhythmicChaseControls.test.tsx src/test/RhythmicChaseSettings.test.ts src/test/RhythmicBallStyleFrame.test.tsx`.
  - Files: `presentation/sections/BallStyleFrame.tsx`, `presentation/sections/ChaseBallControls.tsx`, `mediaI18n.ts`, `store/RhythmicStudioStore.ts`, `src/test/RhythmicChaseControls.test.tsx`.

- [ ] Task 8: Run exact Baby Shark, export, and cleanup regression
  - Acceptance: exact MIDI has zero missing/duplicate/reordered events, downward faces, endpoint discontinuities, and stuck exits in both modes; 2D/3D and portrait/landscape samples show readable chase framing and the brick background; single-mode output remains visually and numerically unchanged.
  - Verify: `npm test`, `npm run build`, exact MIDI diagnostic, short controlled export inspection, no console error, no `artifacts` directory, and no listener on ports 3000/5173/4173.
  - Files: `src/test/RhythmicBabySharkChaseRegression.test.ts` plus temporary outputs outside the repository, removed after inspection.
