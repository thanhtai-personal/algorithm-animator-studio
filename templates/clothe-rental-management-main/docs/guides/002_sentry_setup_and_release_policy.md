# Sentry Setup Va Release Policy (Web + Mobile)

## Muc tieu
- Theo doi runtime error cho `apps/web` va `apps/mobile`.
- Gan metadata `environment` + `release` de truy vet nhanh theo phien ban.
- Van hanh fail-safe: thieu DSN khong duoc lam crash app.

## File da cau hinh
- Web:
  - `apps/web/next.config.ts`
  - `apps/web/sentry.client.config.ts`
  - `apps/web/sentry.server.config.ts`
  - `apps/web/sentry.edge.config.ts`
  - `apps/web/src/app/global-error.tsx`
- Mobile:
  - `apps/mobile/app/_layout.tsx`
  - `apps/mobile/src/lib/sentry/config.ts`
  - `apps/mobile/src/lib/sentry/index.ts`
  - `apps/mobile/src/lib/sentry/sanitizeEvent.ts`
  - `apps/mobile/metro.config.js`
  - `apps/mobile/app.json`
  - `apps/mobile/eas.json`
  - `apps/mobile/.github/workflows/eas-build.yml`

## Env vars de xai
### Web (`apps/web`)
- Runtime:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
  - `NEXT_PUBLIC_SENTRY_RELEASE`
  - `SENTRY_DSN` (optional, cho server/edge)
  - `SENTRY_ENVIRONMENT` (optional)
  - `SENTRY_RELEASE` (optional)
- Source map upload (build-time):
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`

### Mobile (`apps/mobile`)
- Runtime:
  - `EXPO_PUBLIC_SENTRY_DSN`
  - `EXPO_PUBLIC_SENTRY_ENVIRONMENT`
  - `EXPO_PUBLIC_SENTRY_RELEASE`
- Build/plugin (native symbols + sourcemaps):
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`

## Chinh sach privacy
- Truoc khi gui event, payload duoc scrub theo key nhay cam:
  - `authorization`, `cookie`, `token`, `secret`, `password`, `api_key`, `phone`, `email`.
- Gia tri nhay cam duoc thay bang `[Filtered]`.

## Chinh sach release va environment
- Web:
  - release uu tien `NEXT_PUBLIC_SENTRY_RELEASE`, fallback `SENTRY_RELEASE`.
  - environment uu tien `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, fallback `NODE_ENV`.
- Mobile:
  - release uu tien `EXPO_PUBLIC_SENTRY_RELEASE`, fallback app version.
  - environment uu tien `EXPO_PUBLIC_SENTRY_ENVIRONMENT`, fallback `NODE_ENV`.
  - EAS profiles da map san env/release co ban trong `apps/mobile/eas.json`.

## Verify nhanh
1. Web:
   - set `NEXT_PUBLIC_SENTRY_DSN`, mo app, trigger 1 runtime error.
   - kiem tra issue co tag `platform=web-client` va release/environment dung.
2. Mobile:
   - set `EXPO_PUBLIC_SENTRY_DSN`, build/chay app, trigger 1 runtime error.
   - kiem tra issue co tag `platform=mobile-ios` hoac `platform=mobile-android`.
3. Fail-safe:
   - bo DSN va restart app.
   - app van chay binh thuong, khong block auth/offline flows.
