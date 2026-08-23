# Rhythmic Studio architecture

The active Rhythmic/Marble Music path follows a layered module boundary:

1. `api/` — HTTP transport only. No React, MobX, or presentation imports.
2. `queries/` — TanStack Query wrappers around API calls.
3. `store/` — MobX global feature state and deterministic computed state.
4. `hooks/` — reusable business orchestration for playback, source import, course editing, media, projects, and export.
5. `presentation/` — atomic controls, feature sections, and workspace composition.
6. `components/` + `lib/` — rendering engine and pure domain utilities retained as low-level dependencies.

Import direction is one-way: presentation → hooks/store → queries → api. Pure `lib/` code must not call HTTP endpoints.

## File-size rule

New or refactored TypeScript/TSX files should stay below 400 lines. Prefer extracting a focused atom, hook, domain utility, or section before a file reaches that boundary.

## State rule

Cross-section studio state belongs in `RhythmicStudioStore`. React local state is reserved for ephemeral presentation state such as drawer open/closed state.

## Query rule

Server mutations and reads must be exposed through the query layer. Presentation and business hooks must not call `fetch()` directly.
