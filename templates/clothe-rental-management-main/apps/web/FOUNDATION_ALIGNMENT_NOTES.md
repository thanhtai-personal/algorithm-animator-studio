# Foundation Alignment Notes (Task 001)

Date: 2026-02-26

## Changes Applied
- Lint script updated from `next lint` to `eslint .` for Next 16 compatibility.
- Added `apps/web/README.md` with current source-base status + required env vars.
- Scaffolded showroom feature folders under `src/features/*` (structure only, no business implementation).
- Clarified `UserSettings` type contract:
  - split persisted schema-aligned fields vs legacy finance local-only compatibility fields
  - removed legacy AI defaults from auth/session bootstrap defaults

## Important Remaining Mismatches (Not Fixed in Task 001)
- `apps/web/sql/000_create_relations.sql` is still finance schema, not showroom schema (handled in Task 002).
- `apps/web/SETUP.md` still includes legacy finance/mobile content (kept for reference; not source of truth for showroom tasks).
- Many legacy finance libs/types/features still exist in `src/lib/**`, `src/types/**` and can cause global `tsc` errors outside auth/showroom scope.
- Locale routing `app/[locale]/...` is not implemented yet (Task 004).
- Showroom modules are scaffold only (no routes/services/stores yet).

## Implementation Notes
- `UserSettings` legacy fields (`ai_*`, `use_ai`, `pro_mode`, `ignore_voice_verify`) are still allowed as optional compatibility fields to avoid broad refactor during foundation alignment.
- Future tasks should not add new dependencies on legacy finance AI fields.

