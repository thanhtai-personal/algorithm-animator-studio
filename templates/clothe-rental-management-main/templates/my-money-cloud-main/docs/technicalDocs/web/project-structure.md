# Web Project Structure

## Repo map
- `Next-cli/`: Next.js App Router web client (primary).
- `Native-cli/`: Expo React Native client that mirrors the same offline-first rules.
- `voice-transaction-entry-main/`: Vite playground for voice-transaction entry.
- `docs/`: Product and technical docs (this folder).

## Next-cli anatomy
```
Next-cli/src
├─ app/           # App Router routes + API routes
├─ components/    # Shared UI kit (layout, icons, shadcn-style atoms/molecules)
├─ features/      # Feature modules (domain-owned components/hooks/queries/services/etc.)
├─ hooks/         # Global hooks (use-mobile, use-toast)
├─ lib/           # Cross-cutting libs (i18n, supabase, offline, theme, utils)
└─ store/         # MobX stores (auth, cache, offline queue, local prefs/data, theme)
```
- `src/app/`: `layout.tsx` + `providers.tsx` wire I18n, React Query, AuthProvider, Theme/ProMode, AppLock, PWA prompts. Route groups include `/home`, `/onboarding`, `/auth/*`, `/delete-account`, `/privacy`, and `/app/version`. API routes live under `/api/*` (transactions, categories, stats, user/settings, ai/parse, auth, force-reset).
- `src/features/`: Each feature follows MCP layout (adapters/services/queries/hooks/components/types/utils/constants). Present features: `account`, `app-shell`, `auth`, `categories`, `dashboard`, `manage`, `onboarding`, `profile`, `stats`, `store`, `transactions`, `voice-transaction`, `wallet`.
- `src/components/`: Shared layout pieces (headers/sidebars), icons, and UI primitives (buttons, inputs, cards, drawers, toasts).
- `src/lib/`: Supabase config (`supabase/config|client|server|request|anonKey`), offline helpers (`offlineCache`, `offlineSync`, `useOfflineSync`), local storage helpers (`localStore`, `storageAdapter`), theme/i18n/pro-mode providers, app-lock helpers, currency/exchange utilities, and general utils.
- `src/store/`: MobX stores for session/settings (`authStore`), cache (`transactionCacheStore`, `categoryCacheStore`), offline queue (`offlineQueueStore`), local data (`localTransactionStore`, `localCategoryStore`), onboarding prefs (`localPrefStore`), and theme variant (`themeVariantStore`).

## Layering & conventions (MCP)
- Contract: Component → Hook → Query → Service → API → Supabase. Services only run inside React Query hooks; components never call services or storage directly.
- Server state lives in React Query; client/offline/local state lives in MobX + `storageAdapter`. Local mode uses `local*Service` + `local*Store`.
- Feature ownership: feature organisms stay inside their feature folders; shared atoms/molecules live in `src/components/`. Cross-feature logic belongs in `src/lib/`.

## Data & sync touchpoints
- Services call Next API routes (`transactionService`, `categoryService`, stats, `/api/user/settings`), which adapt to Supabase (including `anon_key` handling for anonymous users).
- Offline/persistence: `offlineCache` + cache stores scope transaction/category data per user in localStorage; `offlineQueueStore` stores pending ops; `syncPendingOperations` replays when back online; `useOfflineSync` surfaces status to UI.
- Auth/settings: `useAuthController` manages Supabase session + anonymous flows, realtime subscription to `user_settings`, anonymous merge/claim via Supabase RPCs, and app lock/version guards through app-shell components.
- Theming/i18n: `ThemeVariantProvider`/`ThemeVariantSync`, `I18nProvider`, `ProModeProvider`; theme variant is also persisted in `themeVariantStore`.

## Mobile note (Native-cli)
- Expo client follows the same feature-first layout and offline rules, using MobX + React Query with platform adapters (AsyncStorage/SecureStore) instead of `storageAdapter`. Data/contracts stay aligned with the MCP layering to keep web and mobile in sync.
