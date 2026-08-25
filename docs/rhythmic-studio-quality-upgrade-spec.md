# Spec: Rhythmic Studio production-workspace upgrade

## Assumptions

1. The requested target is a polished creator workflow and export-ready marble-music video, not a clone of the Steam game's full sandbox.
2. The existing course planner, WebGL renderer, 2D Canvas renderer, audio engine, presets, project storage, trim flow, and export pipeline remain the technical foundation.
3. The workspace keeps 9:16 social video as its backward-compatible default and adds a user-selected 16:9 landscape output as defined in `docs/rhythmic-landscape-export-spec.md`.
4. Desktop and Electron are the primary editing surfaces; tablet and mobile must remain usable through responsive stacking.
5. OpenStudio is used only as product/interaction research. Its AGPL source code will not be copied into this repository.

## Objective

Turn `/algorithms/rhythmic` into a focused marble-music production workspace that makes the path from source import to a final 3D, 60 FPS export obvious and fast.

The editor should combine:

- The Steam reference's direct, playful instrument-wall identity, visible trajectory, material/preset choices, MIDI-driven construction, lighting, and immediate render workflow.
- OpenStudio's professional hierarchy: persistent transport, readable timecode and status, an interactive timeline, focused inspector panels, and explicit render readiness.
- KAI Studio's existing strengths: deterministic note timing, collision-aware course planning, 2D/WebGL fallback, instrument showcases, preset mixing, synced audio, trimming, and authenticated export behavior.

## Tech Stack

- React 18, TypeScript, Vite
- MobX and `mobx-react-lite` for feature state
- Tailwind CSS and existing shadcn/Radix primitives
- lucide-react icons and sonner notifications
- Canvas 2D, React Three Fiber/WebGL, Web Audio, and MediaRecorder
- Vitest with Testing Library and jsdom

## Commands

```bash
# Development client
npm run dev:client

# Focused and full tests
npm test -- src/test/RhythmicStudioWorkspace.test.tsx
npm test

# TypeScript production build (required before handoff)
npm run build
```

## Project Structure

```text
src/features/rhythmic-studio/
  components/      low-level preview, timeline, trim, and inspector UI
  hooks/           playback and editor orchestration
  presentation/    workspace composition, panels, and focused controls
  store/           cross-panel observable state
  lib/             pure timing, rendering, and media helpers
  i18n.ts          English/Vietnamese feature copy
src/test/           behavior and regression tests
docs/               product and implementation specifications
```

## Design Direction

Use a cinematic instrument-lab aesthetic: graphite/near-black workspace, warm brass-orange as the main action accent, cool cyan for timing/meters, restrained texture, crisp technical labels, and strong separation between stage, transport, and inspectors.

The memorable element is the vertical 9:16 instrument wall presented as the hero object inside a professional production console. The interface must feel purpose-built for marble music, not like a generic dashboard of cards.

The layout hierarchy on wide screens is:

```text
Compact command bar
  Scene/preset rail | 9:16 stage + transport | Inspector/workflow tabs
                    | Interactive timeline   |
                    | Trim and render dock    |
```

At narrower widths, panels stack without hiding source, playback, timeline, or export actions.

## Code Style

- Keep touched/new source files at 400 lines or less.
- Keep route files as composition shells and behavior in hooks/store/pure helpers.
- Prefer typed props, named components, existing aliases, and existing UI primitives.
- Keep English and Vietnamese copy together through the feature's current i18n helpers.
- Reuse common buttons, tabs, badges, sliders, sheets, and tooltips instead of creating parallel primitives.

```tsx
interface StudioTimecodeProps {
  timeMs: number;
  durationMs: number;
  eventIndex: number;
  eventCount: number;
}

export function StudioTimecode(props: StudioTimecodeProps) {
  return <output className="font-mono tabular-nums">{formatTimecode(props.timeMs)}</output>;
}
```

## Functional Scope

### 1. Production workspace hierarchy

- Replace the generic page header/card stack with a compact command bar and a clear three-zone production layout.
- Keep Projects, Randomize, Save, and Info available without competing with Play or Export.
- Place quick scene presets in a dedicated rail with visible thumbnails and active state.
- Group detailed controls into workflow-oriented tabs/sections so the editor no longer requires scrolling through every parameter to reach the next task.
- Avoid nested cards; use frames, dividers, docked panels, and toolbars.

### 2. Stage and render readiness

- Treat the selected 9:16 or 16:9 preview as the dominant surface; the stage must show the actual export framing.
- Prefer the existing 3D WebGL renderer for recommended final-quality work when WebGL is available, while keeping Canvas 2D as a first-class creative video mode and automatic compatibility fallback.
- Display source type, timing fidelity, active renderer, output size, FPS, event count, and current status close to the stage.
- Add a concise readiness summary that distinguishes exact MIDI timing from audio-onset timing and makes unsupported MP4 behavior explicit.
- Keep a valid first frame and the existing no-fake-extension export guarantees.

### 3. DAW-style transport and timeline

- Consolidate reset, play/pause, current time, duration, trim state, and export actions into a stable transport/dock.
- Make the event timeline seekable with pointer and keyboard input.
- Seeking while paused updates the preview immediately. Seeking while playing restarts synchronized audio/animation from the selected point without creating duplicate MIDI voices.
- Show current playhead, trim in/out range, beat density, and event markers with readable contrast.
- Preserve the existing trim preview and full/trimmed export behavior.

### 4. Workflow-focused inspectors

- Organize controls around four understandable jobs: Source, Scene, Motion/Look, and Sound/Finish.
- Keep high-frequency choices visible: MIDI/audio import, scene preset, instrument family/layout, renderer, play, trim, and export.
- Keep expert controls accessible but visually secondary.
- Retain project save/load and all current settings; this is a reorganization, not a destructive simplification.

### 5. Responsive and accessible behavior

- Wide desktop: three-zone workspace with sticky side panels and a centered stage that fits the selected 9:16 or 16:9 frame.
- Laptop/tablet: stage remains first; rails/inspectors move below or into tabs.
- Mobile: single-column flow with no horizontal page scroll.
- Interactive icon controls have accessible names, visible focus, pressed/selected state, and minimum practical hit areas.
- Honor reduced-motion preferences for editor chrome animations; do not alter exported video motion.

## Testing Strategy

Follow test-first development for behavior changes.

- Unit tests for timecode/event-index/readiness helpers.
- Component tests for timeline pointer seek, keyboard seek, trim visualization, and accessible transport labels.
- Store/hook tests for seeking while paused and resuming from a selected time.
- Existing collision-aware course and dense-instrument tests remain green.
- Runtime verification checks responsive layout, console errors, play/pause/seek, preset selection, and export-button states.
- Final verification is `npm test` followed by `npm run build` after the last source change.

## Boundaries

### Always

- Preserve exact note-impact timestamps and audio/video synchronization.
- Preserve Canvas 2D as a user-selectable creative mode, its automatic fallback behavior, and runtime MIME detection.
- Keep authenticated/admin export guards intact.
- Keep touched/new source files at 400 lines or less.
- Add English and Vietnamese copy for new visible text.
- Test changed behavior before implementation and keep the build green after each slice.

### Ask first

- Add runtime or UI dependencies.
- Change project-storage schema or invalidate saved presets.
- Add output sizes beyond the approved 720p portrait/landscape presets or change supported containers.
- Replace the course planner, audio engine, renderer, or export architecture.

### Never

- Copy AGPL implementation code from OpenStudio.
- Relabel WebM data as MP4.
- Remove, hide, or downgrade the 2D Canvas renderer from a first-class user choice.
- Start playback or audio without an explicit user action.
- Broaden changes into unrelated app navigation or generated shadcn files.

## Success Criteria

- At 1440 px width, the stage, preset rail, inspector, transport, and timeline are visible as one coherent production workspace with no page-level horizontal overflow.
- At 390 px width, the same workflow is usable in a single column with no clipped actions or horizontal overflow.
- A user can complete Source → Scene → Preview/Seek → Trim → Export without hunting through the advanced settings area.
- The timeline supports pointer seeking and keyboard seeking and keeps preview/audio synchronized.
- The workspace clearly reports MIDI-exact versus audio-onset timing fidelity.
- WebGL-capable browsers open in the preferred 3D workflow, users can deliberately switch to and export from 2D Canvas, and unsupported environments continue in Canvas 2D with an understandable notice.
- 60 FPS, selected aspect/resolution, renderer, source, event count, and export readiness are visible before recording.
- Existing presets, custom course overrides, project actions, lyrics/background media, playback, trim, and export remain functional.
- New behavior is covered by tests; the full current test suite and `npm run build` pass.
- No new or touched source file exceeds 400 lines.

## Out of Scope for This Milestone

- A freeform physics-object builder matching every Steam-game object.
- New sample libraries, VST hosting, mixing plugins, or OpenStudio's native audio backend.
- Multitrack waveform editing, automation lanes, or a full DAW mixer.
- Output sizes beyond portrait 720×1280 and landscape 1280×720, or a new server-side rendering architecture.
- Copying the Steam game's branding, artwork, or proprietary assets.

## Implementation Tasks

- [ ] Task 1: Add failing tests for timeline seek, timecode/readiness data, and 3D-preferred fallback behavior.
  - Acceptance: tests describe the new behavior and fail against the current implementation.
  - Verify: focused Vitest command.
  - Files: new focused test file(s), test-only helper imports.
- [ ] Task 2: Implement the seek/readiness domain helpers and playback orchestration.
  - Acceptance: paused and playing seek behavior is deterministic and synchronized.
  - Verify: focused tests and build.
  - Files: timeline helper, playback hook/store/controller, tests; no more than five files.
- [ ] Task 3: Build the production command bar, preset rail, workflow inspector, and responsive shell.
  - Acceptance: wide and narrow workspace hierarchies satisfy the design criteria without removing controls.
  - Verify: component tests, responsive runtime inspection, and build.
  - Files: workspace/layout components, scoped style file, i18n; split into small increments.
- [ ] Task 4: Consolidate stage transport, interactive timeline, trim, readiness, and export dock.
  - Acceptance: core playback-to-export workflow is visible and keyboard accessible.
  - Verify: component tests, manual flow, and build.
  - Files: focused stage/timeline/transport components and tests.
- [ ] Task 5: Run regression and production verification.
  - Acceptance: full tests and build pass; touched source files satisfy the line rule; no unrelated files changed.
  - Verify: `npm test`, `npm run build`, line-count and git-diff review.

## Open Question

Approval is required before implementation. If no scope changes are requested, the assumptions and success criteria above become the implementation contract.
