---
name: my-money-cloud-engineer
description: Implement, debug, and review code for My Money Cloud (Next-cli web + Native-cli-remake mobile) while preserving strict layering, store-first hydration, offline-first behavior, auth/anonymous/onboarding invariants, and voice transaction stability. Use when working on auth, onboarding, transactions, categories, sync queue, Supabase data flow, settings, or AI voice input issues.
---

# My Money Cloud Engineer

## Overview

Use this skill to ship fixes/features in the My Money Cloud monorepo without breaking core architecture and critical user flows.
Keep patches minimal, verify data flow end-to-end, and prioritize offline-safe behavior.

## Required Reads

1. Read `.mcp.full.md`.
2. Read `AGENTS.md`.
3. Read `docs/000_authen-and-data-flow.md`.
4. Read `docs/test-case/auth-cases.md` when touching auth/onboarding/anonymous/logout.
5. Read `references/project-map.md` for high-signal file map and checklists.

## Architecture Contract

- Enforce strict flow: `Component -> Hook -> Query -> Service -> API/Supabase`.
- Keep dependencies downward only.
- Keep components UI-only.
- Keep business orchestration in hooks.
- Keep request lifecycle in TanStack Query.
- Keep persistence and UI-visible state in MobX stores.
- Render from store after query merge (store-first hydration).

## Workflow

1. Identify target app (`Next-cli` or `Native-cli-remake`) and feature boundary.
2. Trace data path by layer before editing.
3. Patch smallest set of files that fixes root cause.
4. Validate behavior for online and offline paths when relevant.
5. Run lint/type checks for the changed app and report gaps if environment blocks checks.

## Critical Invariants

- Do not break anonymous-to-account migration behavior.
- Do not bypass onboarding gate (`currency` drives onboarding completion).
- Do not silently drop pending offline queue data on logout/account switch.
- Do not allow stale voice parse callbacks to reopen or mutate closed modals.
- Do not require manual page refresh for transaction/category list consistency.

## Domain Playbooks

### Auth and Onboarding

- Verify expected flow against `docs/test-case/auth-cases.md`.
- Preserve behavior for first login, skip login, second login, anon-to-existing-account, and logout with pending sync.

### Transactions and Categories

- Ensure create/update/delete changes appear immediately via store update or proper invalidation.
- Ensure default categories exist after onboarding and remain valid in anonymous mode.

### Voice AI (Mobile)

- Use `expo-speech-recognition`.
- Use `stop` only when final transcript is needed.
- Use `abort`/cancel for modal close, reset, and app background transitions.
- Protect modal flow against stale async parse races.

## Validation

Run from target app folder:

- Web: `npm run lint`
- Mobile: `npm run lint`

When using WSL + nvm:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

For Expo in constrained environment:

```bash
EXPO_NO_TELEMETRY=1 EXPO_HOME="$PWD/.expo-home" npm run lint
```

If checks cannot run, explicitly report why and list manual verification done.

## Output Standard

- State root-cause first.
- List changed files and why.
- Call out risks/regressions checked.
- Provide focused next steps only when needed.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Not every skill requires all three types of resources.**
