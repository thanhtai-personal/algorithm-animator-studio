# Spec: Rhythmic Studio landscape export

## Status

Awaiting human approval before implementation.

## Assumptions to approve

1. The new horizontal option is 16:9 at 1280×720. The existing portrait option remains 9:16 at 720×1280.
2. Selecting an output size changes the stage preview immediately so the recorded framing is visible before export.
3. The selection applies consistently to full and trimmed export, WebM and MP4, and both Canvas 2D and WebGL 3D.
4. The physics course keeps its existing stable world-coordinate width. Landscape mode expands the camera viewport instead of stretching, cropping, or rebuilding old presets around a different physics space.
5. The chosen output preset is stored in `StudioSettings`, so saved projects retain it. Older projects fall back to portrait through the existing default-settings merge.

## Objective

Let a Rhythmic Studio user choose between portrait social video and horizontal widescreen video while preserving the current marble timing, physical path, audio synchronization, visual quality, and first-class 2D/3D renderer choices.

The initial presets are:

| Preset | Aspect | Size |
| --- | --- | --- |
| Portrait | 9:16 | 720×1280 |
| Landscape | 16:9 | 1280×720 |

Success means the selected size is the actual encoded video resolution, not merely a label, CSS resize, stretched frame, or filename hint.

## Tech stack

- React 18 and TypeScript
- MobX settings/store persistence
- Canvas 2D and React Three Fiber/WebGL preview
- Canvas `captureStream`, Web Audio and `MediaRecorder`
- Vitest, Testing Library and jsdom
- ffprobe for final encoded-stream verification

## Commands

```bash
# Focused behavior tests
npm test -- src/test/RhythmicOutputSize.test.ts src/test/RhythmicLandscapeStage.test.tsx

# Regression suite
npm test

# Required production build
npm run build
```

## Project structure

```text
src/features/rhythmic-studio/
  lib/outputSize.ts                   canonical output preset/dimensions
  types.ts                            persisted output preset type
  defaults.ts                         portrait backward-compatible default
  components/RhythmicStage.tsx        status and stage composition
  components/RhythmicCanvas.tsx       dimension-aware 2D canvas
  components/RhythmicScene3D.tsx      dimension-aware WebGL container
  components/RhythmicTrimPanel.tsx    quick output-size selector
  hooks/useRhythmicExportActions.ts   fixed recording surface dimensions
  i18n.ts / trimI18n.ts               English/Vietnamese labels
src/test/
  RhythmicOutputSize.test.ts
  RhythmicLandscapeStage.test.tsx
docs/
  rhythmic-landscape-export-spec.md
```

Exact touched files may be reduced during implementation. New/touched source files remain at or below 400 lines.

## Code style and contract

One pure helper is the source of truth for labels, aspect ratios and pixel dimensions:

```ts
export type RhythmicOutputPreset = "portrait-720p" | "landscape-720p";

export interface RhythmicOutputSize {
  width: number;
  height: number;
  aspectLabel: "9:16" | "16:9";
  resolutionLabel: string;
}

export function rhythmicOutputSize(preset: RhythmicOutputPreset): RhythmicOutputSize;
```

Components must consume this helper. They must not independently duplicate 720, 1280, 9:16 or 16:9 constants.

## Functional behavior

### Output selector

- Add a labeled selector beside the FPS control in the trim/export panel.
- Options show both orientation and actual resolution.
- Labels are localized in English and Vietnamese.
- The selector is disabled while recording so output dimensions cannot change mid-stream.
- Portrait remains the default for new and legacy projects.

### Preview

- Stage status badges show the selected aspect and resolution.
- Loading/error placeholder, Canvas 2D, and WebGL 3D use the selected aspect ratio.
- The preview remains bounded by the available center workspace and does not force horizontal page overflow.
- Landscape is fit inside the stage area; it does not make the side panels jump or overlap.
- Switching orientation while paused redraws the current frame immediately.
- Switching is disabled while playing or recording if changing the backing buffer could interrupt a live run.

### Canvas 2D

- The backing canvas is exactly the selected width and height.
- Camera anchor and pointer unprojection use the selected width/height.
- Background, title, lyrics, VFX, platforms, marble and course guides receive the selected frame dimensions.
- Drawing is native at the selected aspect; no `drawImage` stretch from portrait to landscape.

### WebGL 3D

- The R3F container uses the selected CSS aspect.
- The perspective camera updates naturally from the canvas aspect.
- Vertical FOV and course world coordinates remain stable; landscape reveals more horizontal space.
- Export copies the presented WebGL frame into a matching 1280×720 recording surface without distortion.
- Shadows, instrument lighting, MIDI note colors and collision framing remain correct in both orientations.

### Export

- The fixed export surface is created from the canonical selected width/height.
- The recording status includes the actual aspect and resolution.
- Full and clip exports use the same selected dimensions.
- WebM and supported MP4 output carry the expected encoded dimensions.
- Audio track acquisition and synchronization remain unchanged.
- The file extension continues to match the actual recorded/transcoded container.

### Persistence and compatibility

- `outputPreset` is part of `StudioSettings` and project persistence automatically includes it.
- Existing stored projects without the field use `portrait-720p` via `DEFAULT_SETTINGS` merge.
- Applying a visual preset does not silently reset output orientation.
- Preset Mix does not alter output orientation between segments.

## Testing strategy

Development follows red–green–refactor.

### Unit tests

- Both presets resolve to exact width, height, aspect and resolution labels.
- Unknown/missing persisted values normalize to portrait.
- Output pixel counts remain equal for portrait and landscape at this quality tier.
- Production-readiness/status data reports the selected dimensions.

### Component tests

- The selector exposes Portrait 720×1280 and Landscape 1280×720.
- Selecting Landscape patches `outputPreset` and updates status badges.
- Selector and renderer/orientation changes are locked during recording.
- Stage wrapper and 2D canvas receive the correct aspect/dimensions.
- Existing explicit 2D renderer choice remains available.

### Renderer regression tests

- 2D pointer-to-world conversion uses 1280×720 in landscape.
- Current-frame redraw receives the new dimensions after a paused switch.
- 3D container resolves to 16:9 and does not change course world-space coordinates.
- Existing camera framing, collision, shadow and dense-run tests remain green.

### Runtime/export verification

Run one deliberate automated-browser session after unit/integration tests and build pass:

1. Export a short portrait 2D fixture and verify 720×1280 with ffprobe.
2. Export a short landscape 2D fixture and verify 1280×720 with ffprobe.
3. Export a short landscape 3D fixture and verify 1280×720, audio stream presence, no stretching and no console/WebGL errors.
4. Inspect representative frames for camera framing, shadows and note-colored lights.
5. Use a temporary browser profile and output directory outside the repository, then delete both. Leave no `artifacts/` directory or test media in source.

## Boundaries

### Always

- Preserve portrait 720×1280 as an option and legacy default.
- Preserve Canvas 2D and WebGL 3D as explicit user choices.
- Use the same canonical size for preview, capture surface, status and validation.
- Keep audio/video synchronization and MIDI collision timing unchanged.
- Add English and Vietnamese labels.
- Run focused tests, full tests and `npm run build` after the final source change.

### Ask first

- Add 1080p/4K tiers, square output or arbitrary custom dimensions.
- Change bitrate by orientation or quality tier.
- Rebuild physics layouts specifically for each output orientation.
- Add dependencies or change export container support.

### Never

- Stretch a portrait frame to landscape.
- Crop without showing the exact crop in preview.
- Remove or downgrade portrait or 2D mode.
- Relabel WebM bytes as MP4.
- Leave browser profiles, screenshots, encoded clips or `artifacts/` in the repository.

## Implementation tasks

- [ ] Task 1: Add failing tests and the canonical output-size contract.
  - Acceptance: tests prove exact size mapping and backward-compatible normalization.
  - Verify: focused unit test command.
  - Files: output-size helper, settings types/defaults, unit tests.
- [ ] Task 2: Add the localized selector and responsive preview dimensions.
  - Acceptance: paused preview switches between exact portrait and landscape framing; recording locks the choice.
  - Verify: component tests and focused build.
  - Files: trim panel, stage, 2D/3D wrappers, translations, component tests split into increments.
- [ ] Task 3: Make export surface and status dimension-aware.
  - Acceptance: both full and clipped exports use the selected native dimensions.
  - Verify: export helper tests and build.
  - Files: export hook/helper, production status, tests.
- [ ] Task 4: Run regression and encoded-output verification.
  - Acceptance: portrait and landscape files report correct dimensions; 2D/3D framing and audio remain valid; no artifacts remain.
  - Verify: focused tests, full `npm test`, `npm run build`, one cleaned browser run and ffprobe evidence.

## Success criteria

- The user can choose Portrait 9:16 · 720×1280 or Landscape 16:9 · 1280×720 before export.
- Preview, status badges and encoded video all agree on the selected dimensions.
- Landscape output is rendered natively without stretching or hidden portrait cropping.
- Full/trimmed WebM and supported MP4 use the selected size.
- Both 2D and 3D remain usable and visually framed in both orientations.
- Older projects open as portrait; saved landscape projects reopen as landscape.
- MIDI timing, collision audio, shadows and note-colored lighting do not regress.
- Tests and production build pass, and browser/export artifacts are removed.

## Open question

Human approval is required before implementation. Reply `Duyệt đặc tả` to approve both this landscape-export spec and the pending instrument-audio/note-lighting spec, or state any requested change (for example, add 1920×1080 now).
