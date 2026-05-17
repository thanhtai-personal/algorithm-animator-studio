---
name: piper-react-maintainer
description: Use when maintaining this Piper React local TTS app, including refactoring frontend/backend modules, adding Piper model support, changing generation flow, or validating clean TypeScript structure.
---

# Piper React Maintainer

## Project Shape

- Frontend is React Router under `app/`.
- Backend is Express/tsx under `server/`.
- Piper models live outside this app at `../models` relative to the project parent.
- Generated WAV files are served from `server/generated` at `/generated`.

## Structure Rules

- Keep route files thin. Put UI in `app/components`, stateful orchestration in `app/hooks`, API calls in `app/api`, constants in `app/constants`, and pure helpers in `app/utils`.
- Keep `server/index.ts` as app bootstrap only. Put endpoint wiring in `server/routes`, config in `server/config`, domain types in `server/models`, Piper execution in `server/services`, and pure helpers in `server/utils`.
- Prefer small pure functions over classes. If a class is introduced, put exactly one class per file and make the class name match the file name.
- Keep files focused and short enough to scan. Split when a file owns unrelated responsibilities.
- Preserve Vietnamese TTS handling unless explicitly asked to change it: normalize text, remove BOM, replace Vietnamese punctuation into Piper-friendly lines, and keep Windows UTF-8 env vars for Piper.

## Common Workflows

1. Read the relevant route/component/service before editing.
2. Change the narrowest module that owns the behavior.
3. Update shared types in `app/types.ts` or `server/models` when API shape changes.
4. Run `npm run typecheck`.
5. Run `npm run build` when route/component or server response shape changed.

## Model Changes

- Add or edit Piper model definitions in `server/config/piperModels.ts`.
- Ensure each model has `.onnx` and `.onnx.json` paths.
- Keep frontend default model behavior in `app/utils/modelDefaults.ts`.

## API Contract

- `/api/health` returns backend paths and Piper availability.
- `/api/models` returns selectable model metadata with availability.
- `/api/generate` validates text/model/files, prepares language-specific text, runs Piper, and returns generated file metadata plus `audioUrl`.
