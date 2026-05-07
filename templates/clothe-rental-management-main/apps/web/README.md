# apps/web - Showroom Admin (Current Source Base)

Current status:
- Auth foundation is implemented (`/auth`, `/auth/callback`, `/api/auth/*`)
- Root `/` is still a temporary auth/session panel
- Showroom business modules (`orders`, `inventory`, `products`, ...) are scaffold/planned in `src/features/*`
- Public makeup booking route is available at `/[locale]/booking` (no login required)
- Dashboard/admin makeup routes remain cloud-session protected

## Required Environment Variables (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_NEST_API_BASE_URL=http://localhost:3056
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLED_EMAIL_SENDER=false
ENABLED_EMAIL_SENDER=false
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_RELEASE=local-dev
SENTRY_DSN=...
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=local-dev
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

Notes:
- `NEXT_PUBLIC_NEST_API_BASE_URL` is the API base URL used by web clients to call Nest directly.
- `NEXT_PUBLIC_SITE_URL` is used for auth callback URL resolution.
- `enabledEmailSender` config uses env:
  - `ENABLED_EMAIL_SENDER` (server override)
  - `NEXT_PUBLIC_ENABLED_EMAIL_SENDER` (client + server fallback)
  - default is `false` (all email sending features are paused)
- If using Google OAuth, add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to Supabase Auth redirect URLs.
- `SENTRY_AUTH_TOKEN` is required only when you want automatic source map upload during build.

## Useful Commands

```bash
npm install
npm run dev
npm run lint
npx eslint src --ext .ts,.tsx
npx tsc --noEmit
```

## Current Setup Docs

- `SETUP.md` contains older setup notes from the finance template and mobile/IAP notes.
- For showroom roadmap execution, use:
  - `docs/tasks/000_task_index.md`
  - `progress/tasks.md`
  - `progress/risks.md`
- For Zalo Mini App module setup, use:
  - `docs/guides/007_zalo_mini_app_setup.md`
  - `docs/guides/006_zalo_mini_app_integration_strategy.md`
  - `docs/guides/008_zalo_mini_app_ops_runbook.md`
