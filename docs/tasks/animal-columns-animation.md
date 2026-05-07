# Animal Columns Animation Tasks

## Goal

Add an optional column rendering mode where each data column is displayed as an animal sprite instead of a bar. Sprite assets live under `src/assets/sprites` and are numbered by height weight from `1` to `20`. Each animal sprite has its own height weight, and numeric input data maps to those weights when the user enables Animal Columns mode. Animal columns have two animation states: idle and jumping. Swap animation triggers the jumping state.

## Scope

- Add a new visual mode: `Bar columns` and `Animal columns`.
- Keep the current bar renderer as the default.
- Do not block existing algorithms, export, audio, or auth behavior.
- Sprite assets are available under `src/assets/sprites`.
- Sprite files are numbered by relative height/weight from `1` through `20`.
- Each sprite image is a sprite sheet that contains multiple frames in one image, not separate idle/jump files.

## Data Model

1. Add animal sprite registry
   - Define a registry type with:
     - `id`
     - `label`
     - `src`
     - `heightWeight`
     - `spriteSheet`
     - `actions`
     - optional `widthScale`
     - optional `baselineOffset`
   - Load entries from `src/assets/sprites`.
   - Register sprite weights `1` through `20` based on the file numbering.
   - Keep the registry separate from renderer logic, for example `src/lib/animalColumns.ts`.

2. Add reusable Sprite class
   - Create a dedicated sprite class, for example `src/lib/sprites/Sprite.ts`.
   - The class should support `new Sprite(options)` with parameters for:
     - image source or loaded image
     - frame width
     - frame height
     - sheet columns
     - sheet rows
     - frame definitions
     - action/state definitions
     - default action
     - frame duration
     - scale
     - baseline offset
   - The class should expose methods such as:
     - `setAction(actionName)`
     - `getAction()`
     - `update(deltaMs)`
     - `draw(ctx, x, y, options)`
     - `resetAction(actionName)`
   - The class must be able to cut frames from a sprite sheet image using source rects.
   - Actions should be declarative, for example:
     - `idle`: one or more standing frames
     - `jump`: one or more jump frames
   - The current task requires at least `idle` and `jump`.

3. Sprite sheet structure
   - A sprite image contains multiple poses/frames in a grid-like sheet.
   - Example structure from the provided reference:
     - top row contains standing/idle poses
     - lower row contains jump/motion poses
   - Do not assume every sheet has the exact same pixel size.
   - Store frame rectangles or grid metadata in the registry per sprite/set.
   - If a sheet has transparent padding, registry metadata should define usable frame bounds or offsets.

4. Map array values to animals
   - When Animal Columns mode is enabled, each input value maps to an animal by height weight.
   - Sorting/searching algorithm logic still uses the numeric array values.
   - Renderer resolves each value to the closest matching animal weight.
   - Define deterministic mapping for duplicate values.
   - Map normalized input values into the available weight range `1..20`.
   - Example:
     - smallest value maps near sprite `1`
     - largest value maps near sprite `20`
     - middle values map proportionally and round to nearest available weight

5. Keep sprite state separate from algorithm data
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
     - sprite instance cache

2. Create sprite instance/cache layer
   - Create sprite instances from the registry.
   - Cache loaded images and Sprite instances by sprite id.
   - Avoid recreating image objects every frame.
   - Renderer should request the correct action before drawing:
     - `idle` by default
     - `jump` for active swap columns

3. Render idle state
   - Idle animals stand on the same baseline as current bars.
   - Height/scale should communicate the mapped value.
   - Keep labels/value display readable.
   - Use the Sprite class `idle` action.

4. Render jump state
   - During swap animation, animals at `frame.swap` use the Sprite class `jump` action.
   - Apply vertical jump offset using transition progress.
   - Jump should peak around mid-transition and return to baseline.
   - If the `jump` action is missing, use `idle` frames with vertical offset.
   - The swap animation is the trigger for the animal column jump state.

5. Integrate with existing frame renderer
   - Extend `renderFrame` options with a visual mode setting.
   - Route bar rendering to current renderer when mode is `bar`.
   - Route animal rendering when mode is `animal`.
   - Preserve code panel rendering and platform dimensions.

6. Export compatibility
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
   - Use existing folder:
     - `src/assets/sprites`
   - Use existing height-numbered convention:
     - `1.*`
     - `2.*`
     - ...
     - `20.*`
   - The file number is the sprite `heightWeight`.

2. Add asset loading strategy
   - Use Vite asset imports or `import.meta.glob`.
   - Cache loaded images.
   - Renderer should never block indefinitely if an image fails to load.
   - Use the Sprite class to slice each loaded sheet into frames/actions.

3. Sprite metadata requirements
   - Document expected sprite requirements:
     - transparent PNG/WebP
     - one sprite sheet per weight
     - idle and jump poses in the sheet
     - consistent baseline
     - recommended max size
      - grid dimensions or explicit frame rectangles

4. Default action metadata
   - Define initial metadata for the provided sheet pattern:
     - `idle`: standing pose frame(s)
     - `jump`: jump/motion pose frame(s)
   - If exact frame rectangles need tuning after asset inspection, keep metadata centralized in the registry.

## Acceptance Criteria

- User can switch between normal bar columns and Animal Columns.
- Guest users can still preview algorithms, but attempting to change Animal Columns config redirects to login.
- Admin users can enable Animal Columns and adjust its config.
- Numeric input values map deterministically to animal sprite weights.
- Sprite files in `src/assets/sprites` map to weights `1..20`.
- Sprite rendering uses a reusable `Sprite` class that can slice a sprite sheet into frames.
- Sprite actions are declarative and include at least `idle` and `jump`.
- Animal columns render in idle state by default.
- Swap animation makes the swapped animal columns jump.
- Exported video shows the same Animal Columns animation as live preview.
- Missing sprite assets do not crash the app; fallback rendering is visible.
- Existing bar rendering behavior is unchanged when Animal Columns is off.

## Notes

- Animal sprite images are expected in `src/assets/sprites`.
- Do not implement network loading for sprites unless required; prefer bundled assets.
- Keep touched source files under 400 lines by splitting Sprite class, renderer, registry, and UI controls into separate modules.
