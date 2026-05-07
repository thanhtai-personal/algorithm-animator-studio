# Skill System Guidelines

This repository uses Codex skills under `.agents/skills`, aligned with:
- https://developers.openai.com/codex/skills

## Required structure

Each skill must be a directory with:
- `SKILL.md` (required)

Optional directories/files:
- `rules/` (domain rules and checklists)
- `references/` (docs/spec snapshots)
- `scripts/` (deterministic automation)
- `assets/` (templates/resources)
- `agents/openai.yaml` (optional UI metadata + invocation policy)

## SKILL.md requirements

`SKILL.md` must start with frontmatter that includes at least:
- `name`
- `description`

Descriptions should be explicit about:
- when the skill should trigger
- when the skill should not trigger

## Repo conventions

- Prefer one focused skill per job.
- Keep instructions imperative and outcome-oriented.
- Put reusable checklists into `rules/` and reference them from `SKILL.md`.
- Avoid embedding long static docs in `SKILL.md`; move to `references/`.
- Keep skill names stable to avoid duplicate/conflicting skill identities.

## Generic-first policy

- Skills in this folder should default to generic language/framework behavior.
- Avoid hardcoded repo paths, app names, production domains, and project-specific env keys.
- If project-specific policy is required, create a separate skill with explicit naming and narrow trigger scope.
- Keep generic skills reusable across repos and only pass repo context as runtime inputs.

## Trigger strategy (de-duplication)

- Keep one primary implicit skill per domain to avoid stacked auto-trigger.
- Keep specialized/secondary skills explicit-only unless user asks directly.
- Current primary implicit skills:
  - `architecture-compliance-guard` (repo architecture guardrail baseline)
  - `vercel-react-best-practices` (React/Next performance baseline)
  - `vercel-react-native-skills` (React Native/Expo baseline)
  - `nestjs-api-migration` (API migration workflow baseline)
- Current specialized explicit skills:
  - `vercel-composition-patterns` (component architecture deep-dive)
  - `web-design-guidelines` (UI audit/review workflow)
  - `nestjs-runtime-baseline` (server bootstrap/hardening phase)

## Current skill map

- `architecture-compliance-guard` (new)
- `vercel-composition-patterns`
- `vercel-react-best-practices`
- `vercel-react-native-skills`
- `web-design-guidelines`
- `nestjs-api-migration` (new)
- `nestjs-runtime-baseline` (new)
