# My Money Cloud – Agent Settings

This file defines project-specific operating rules for coding agents working in this repository.

## 1) Project Scope

- Monorepo with 2 active apps:
- `Next-cli/` = Web (Next.js App Router, React 19, TanStack Query, MobX, Supabase)
- `Native-cli-remake/` = Mobile (Expo/React Native, TanStack Query, MobX, Supabase)
- Shared business domains: auth, categories, transactions, stats, settings, offline sync.

## 2) Source of Truth

- Read and follow:
- `.mcp.full.md` for architecture constitution
- `docs/000_authen-and-data-flow.md` for auth + anon + sync flow
- `docs/test-case/auth-cases.md` for expected user journeys

When conflicts happen, prioritize `.mcp.full.md`.

## 3) Architecture Contract (Non-Negotiable)

- Enforce strict flow: `Component -> Hook -> Query -> Service -> API/Supabase`
- Keep dependencies downward only; no cross-layer leaks.
- Components:
- UI only
- No direct service calls
- No business logic
- Hooks:
- Orchestrate business logic
- One responsibility per hook
- Queries:
- Own server request lifecycle
- Services called only from queries/mutations
- Stores (MobX):
- Own UI-visible state and local persistence
- Expose intent-based actions

## 4) Data Flow Contract

- Follow store-first hydration:
- Fetch via React Query
- Merge into MobX store
- UI renders from store
- Do not introduce duplicate state ownership between Query result and Store.

## 5) Auth / Anonymous / Onboarding Contract

- Always preserve offline-first behavior.
- Key invariants:
- Anonymous mode can exist with local data and no cloud user.
- `currency` presence is onboarding completion signal.
- Switching from anon -> existing cloud account must avoid silent data loss.
- Logout while pending offline queue must warn user before destructive actions.
- Do not bypass confirmation paths in auth migration flows.

## 6) Transactions & Categories Contract

- On create/update/delete:
- Update store immediately
- Persist local storage via store actions
- Queue offline sync when required
- Default categories must be available after onboarding and during anon flows.
- Never require hard refresh for list consistency; invalidate/query refresh or store update must happen in same user flow.

## 7) Voice AI Contract (Mobile)

- Current voice stack: `expo-speech-recognition` (not `@react-native-voice/voice`).
- Closing/canceling voice capture must abort native recognition session cleanly.
- Guard against stale async parse results reopening/modifying modal state after close/reset.
- Keep confirmation form scrollable and ensure submit action visibility.
- For VND amount input on mobile/PWA flows, avoid double keyboard behavior when custom keypad is active.

## 8) Platform Boundaries

- Web-only server logic belongs in `Next-cli/src/server/**` and `Next-cli/src/app/api/**`.
- Client code must not import server-only modules.
- Feature internals stay inside each feature folder; avoid cross-feature deep imports.

## 9) Working Rules for Edits

- Make minimal, targeted patches.
- Do not refactor unrelated files in same change.
- Keep naming/style consistent with existing codebase.
- Prefer fixing root cause over UI-only workaround.
- If behavior touches auth/offline/voice flow, include explicit regression checks in summary.

## 10) Validation Commands

Run from app folder being changed:

- Web:
- `cd Next-cli && npm run lint`
- Mobile:
- `cd Native-cli-remake && npm run lint`

If running in WSL with `nvm`, initialize shell first:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

For Expo CLI in constrained environments:

```bash
EXPO_NO_TELEMETRY=1 EXPO_HOME="$PWD/.expo-home" npm run lint
```

## 11) Completion Checklist

- Architecture flow unchanged (`Component -> Hook -> Query -> Service`).
- Offline/anon/auth invariants preserved.
- No stale modal or stale async race in voice transaction flow.
- No user-visible regression in onboarding -> home navigation.
- Report clearly what was validated and what could not be validated.
