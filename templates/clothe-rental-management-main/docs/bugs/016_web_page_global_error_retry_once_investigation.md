# Bug 016 - Web pages often require one retry before loading

## Summary
Many web pages in `apps/web` currently show the global error fallback on first load, then recover after the user clicks the retry button once. This appears to be a shared client startup problem rather than a single page route bug.

## Repro steps (reported)
- Navigate to a web route in the application.
- Page frequently renders the global error UI with the retry button.
- Clicking `Thử lại` / `Try again` once usually recovers and loads the page.
- Multiple pages are affected rather than a single isolated route.

## Key files reviewed
- `apps/web/src/app/global-error.tsx`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/lib/i18n.tsx`
- `apps/web/src/features/auth/components/AuthGate.tsx`
- `apps/web/src/features/auth/hooks/routing/useAuthRouting.ts`
- `apps/web/src/features/auth/hooks/bootstrap/useAuthBootstrap.ts`
- `apps/web/src/features/pwa/components/PwaServiceWorkerBootstrap.tsx`
- `apps/web/src/components/feedback/AppModalProvider.tsx`
- `apps/web/src/features/app-shell/components/ThemeAppearanceSync.tsx`
- `apps/web/src/store/authStore.ts`

## Findings
1. `app/global-error.tsx` is the global client-side error boundary for the app. It renders the retry UI and logs exceptions to Sentry.
2. The app root is wrapped in `Providers` from `apps/web/src/app/providers.tsx`, which creates a shared React Query client and mounts:
   - `useAuthBootstrap()` for auth/session bootstrap
   - `I18nProvider` for locale/currency state
   - `ThemeAppearanceSync` for theme initialization
   - `PwaServiceWorkerBootstrap` for service worker registration
   - `AppModalProvider` for modal/dialog support
   - `AuthGate` to block page render until auth bootstrapping/redirect decisions complete
3. `useAuthBootstrap()` does the following on first render:
   - loads persisted local session state from `authStore.load()`
   - fetches current Supabase session via `authBrowserService.getCurrentSession()`
   - fetches current auth profile context via `getCurrentAuthContext()`
   - subscribes to auth state changes
   - always marks `authStore.isBootstrapped = true` in `finally`
4. `useAuthRouting()` uses Next.js `usePathname()` and current auth state to determine if the current route is allowed and whether a redirect is needed.
5. `app/page.tsx` and `app/[locale]/layout.tsx` were reviewed and ruled out as sources of the hook-count/runtime error because they are simple server-side redirect/validation components.
6. Shared initialization code is the strongest candidate for a systemic bug because the issue affects many pages and the app shell is common to all routes.

## Likely failure candidates
- Shared app-shell initialization race in `apps/web/src/app/providers.tsx`:
  - `useAuthBootstrap()` and `AuthGate` are responsible for auth state startup.
  - A transient auth bootstrap failure, profile refresh failure, or stale route redirect could cause the first render to fall into the error boundary.
- Shared client-only provider/side-effect code that runs at app startup:
  - `ThemeAppearanceSync` applies theme tokens and writes CSS custom properties.
  - `PwaServiceWorkerBootstrap` registers service worker and reloads on controller change.
  - `AppModalProvider` calculates language direction/labels from `document.documentElement.lang`.
  - `I18nProvider` reads locale from `window.location.pathname` and `localStorage`.
- Auth bootstrapping or Supabase auth helpers:
  - `authBrowserService.getCurrentSession()` may depend on browser auth client or API state.
  - If the first auth bootstrap request is transiently bad, the app may still surface an error boundary until retry.
- Global Next.js error fallback behavior:
  - The presence of a global error boundary means any first-render exception in a shared client root component will show the retry screen.

## What is not confirmed yet
- No specific page module or route component has been identified as the root cause.
- No runtime Sentry exception data was available from this code-only investigation.
- No actual browser reproduction log or console stack trace is available in this report.

## Recommended next steps
1. Reproduce the bug in a browser and capture the console stack trace when the global error UI appears.
2. Inspect Sentry logs for the exception captured by `apps/web/src/app/global-error.tsx`.
3. Focus on shared root providers and app-shell initialization rather than page-specific code.
4. If the error is auth-related, prioritize `apps/web/src/features/auth/hooks/bootstrap/useAuthBootstrap.ts` and `apps/web/src/features/auth/services/authBrowserService.ts`.
5. If the error is client-initialization related, inspect `ThemeAppearanceSync`, `I18nProvider`, and `PwaServiceWorkerBootstrap` for unsafe first-render behavior.

## Immediate recommendation
Treat this as an app-shell / shared initialization bug rather than a feature-specific page error. The first retry recovery pattern strongly suggests an initialization race or transient startup error in the shared client providers.
