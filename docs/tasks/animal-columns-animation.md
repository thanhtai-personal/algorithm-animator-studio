# Animal Columns Animation Tasks

## Goal

Add an optional column rendering mode where each data column is displayed as an animal sprite instead of a bar. The sprite assets will be provided later. Each animal sprite has its own height weight, and numeric input data maps to those weights when the user enables Animal Columns mode. Animal columns have two animation states: idle and jumping. Swap animation triggers the jumping state.

## Scope

- Add a new visual mode: `Bar columns` and `Animal columns`.
- Keep the current bar renderer as the default.
- Do not block existing algorithms, export, audio, or auth behavior.
- Sprite assets are not available yet, so implement the feature behind placeholder asset metadata or a mock registry that can be filled later.

## Data Model

1. Add animal sprite registry
   - Define a registry type with:
     - `id`
     - `label`
     - `idleSrc`
     - `jumpSrc`
     - `heightWeight`
     - optional `widthScale`
     - optional `baselineOffset`
   - Start with placeholder entries that use empty asset paths or temporary generated placeholders.
   - Keep the registry separate from renderer logic, for example `src/lib/animalColumns.ts`.

2. Map array values to animals
   - When Animal Columns mode is enabled, each input value maps to an animal by height weight.
   - Sorting/searching algorithm logic still uses the numeric array values.
   - Renderer resolves each value to the closest matching animal weight.
   - Define deterministic mapping for duplicate values.

3. Keep sprite state separate from algorithm data
   - Animal state should be computed from the current frame and transition state.
   - Do not mutate algorithm frames to store visual state.

## UI Tasks

1. Add visual mode control
   - Add a config control in Appearance panel:
     - `Bar columns`
     - `Animal columns`
   - This is a config action, so guest users should be redirected to login under the current admin config guard.

2. Add Animal Columns settings
   - Show only when visual mode is `Animal columns`.
   - Add controls for:
     - sprite set selection if multiple sets exist later
     - sprite scale
     - jump intensity
     - whether highlighted animals also jump
   - Keep controls compact and consistent with the existing shadcn UI.

3. Add missing asset state
   - If sprites are not configured yet, show a small inline warning in the panel.
   - Renderer should fall back to bars or simple placeholders instead of crashing.

## Rendering Tasks

1. Create animal renderer
   - Add a renderer module, for example:
     - `src/lib/renderers/animalColumnRenderer.ts`
   - Input should include:
     - array values
     - current highlight/swap/sorted indices
     - previous frame
     - transition progress
     - animal registry
     - visual mode settings

2. Render idle state
   - Idle animals stand on the same baseline as current bars.
   - Height/scale should communicate the mapped value.
   - Keep labels/value display readable.

3. Render jump state
   - During swap animation, animals at `frame.swap` use `jumpSrc`.
   - Apply vertical jump offset using transition progress.
   - Jump should peak around mid-transition and return to baseline.
   - If jump sprite is missing, use idle sprite with vertical offset.

4. Integrate with existing frame renderer
   - Extend `renderFrame` options with a visual mode setting.
   - Route bar rendering to current renderer when mode is `bar`.
   - Route animal rendering when mode is `animal`.
   - Preserve code panel rendering and platform dimensions.

5. Export compatibility
   - Exported videos must include animal rendering.
   - Swap transitions during export must trigger jump state.
   - Placeholder/fallback rendering must work in export too.

## State Management Tasks

1. Extend studio hook state
   - Add:
     - `columnVisualMode`
     - `animalSpriteSet`
     - `animalSpriteScale`
     - `animalJumpIntensity`
     - `animalHighlightJump`
   - Apply existing config guard to setters.

2. Pass visual config to renderer
   - Canvas live preview and export path must pass the same visual config.
   - Avoid duplicating render option construction.

3. Preserve default behavior
   - Existing users should see normal bars until they explicitly enable Animal Columns.

## Asset Integration Tasks

1. Prepare asset folder
   - Add intended folder path:
     - `src/assets/sprites/animals`
   - Use clear naming convention:
     - `{animal-id}-idle.png`
     - `{animal-id}-jump.png`

2. Add asset loading strategy
   - Use Vite asset imports or `import.meta.glob`.
   - Cache loaded images.
   - Renderer should never block indefinitely if an image fails to load.

3. Future asset handoff
   - Document expected sprite requirements:
     - transparent PNG/WebP
     - idle and jump state per animal
     - consistent baseline
     - recommended max size

## Acceptance Criteria

- User can switch between normal bar columns and Animal Columns.
- Guest users can still preview algorithms, but attempting to change Animal Columns config redirects to login.
- Admin users can enable Animal Columns and adjust its config.
- Numeric input values map deterministically to animal sprite weights.
- Animal columns render in idle state by default.
- Swap animation makes the swapped animal columns jump.
- Exported video shows the same Animal Columns animation as live preview.
- Missing sprite assets do not crash the app; fallback rendering is visible.
- Existing bar rendering behavior is unchanged when Animal Columns is off.

## Notes

- Animal sprite images will be provided later.
- Do not implement network loading for sprites unless required; prefer bundled assets.
- Keep touched source files under 400 lines by splitting renderer, registry, and UI controls into separate modules.
