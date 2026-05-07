# 007 - Kiến Trúc Mobile Và Zalo Mini Apps

## 1) `apps/mobile` (Expo)

### 1.1 Stack
- Expo `~53.0.x`
- React Native `0.79.x`
- React `19`
- `expo-router`
- TanStack Query + MobX
- API client tới `apps/server`

### 1.2 Cấu trúc logic chính
- `app/*`: route/screen shells.
- `src/lib/*`: infra chung (api, i18n, theme, voice, sentry).
- `src/constants/*`, `src/types/*`: shared contracts nội bộ mobile.

### 1.3 Cấu hình env nổi bật
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SITE_URL`
- `EXPO_PUBLIC_SENTRY_*`

## 2) Zalo Mini Apps (`apps/zalo-mini-apps/*`)

### 2.1 Danh sách app
- `kata-booking`
- `kata-calendar`
- `kata-rental-order`
- `kata-rental-revenue`

### 2.2 Stack chung
- Vite + React 18 + TypeScript
- TanStack Query + MobX
- `zmp-sdk`, `zmp-ui`

### 2.3 Entry config
- API base URL ưu tiên `import.meta.env.VITE_NEST_API_BASE_URL`
- fallback compatibility: `import.meta.env.VITE_API_BASE_URL`
- branch fallback env: `VITE_DEFAULT_BRANCH_ID` (tùy app)
- dev ports:
  - `5176`, `5177`, `5180`, `5181` (theo package scripts)

## 3) Mini app integration pattern (chuẩn hiện tại)
1. `platformApiService.fetchConfig()` gọi API config tại `apps/server`.
2. `useZaloPlatformBootstrap` hydrate config + SDK support + user info.
3. Store platform (`zaloPlatformStore`) giữ state bootstrap/auth/session.
4. Feature services gọi API domain theo base URL từ env.

## 4) Contract sharing
- Mini app dùng `src/lib/contracts.ts` để định nghĩa DTO gọi API.
- Một số contract còn chứa dấu vết legacy (ví dụ fields variant), cần align dần khi migration API/schema.

## 5) CORS/session cho mini app
- Header custom session:
  - `x-zalo-mini-app-session`
  - `x-mini-app-session`
- CORS policy xử lý tại `apps/server` (source-of-truth API).
- Domain allowlist qua `ZALO_MINI_APP_ALLOWED_DOMAINS`.

## 6) Rủi ro thường gặp
- Gọi nhầm môi trường API (`VITE_NEST_API_BASE_URL` hoặc fallback `VITE_API_BASE_URL` trỏ sai).
- Feature flag ở DB bật nhưng server query không có quyền đọc -> fallback disabled.
- Drift contract giữa mini app và API do migration chưa hoàn tất.

## 7) Khuyến nghị vận hành
- Mỗi mini app cần profile env tách bạch dev/staging/prod.
- Cố định release checklist:
  - verify endpoint config ở `apps/server`
  - verify CORS preflight
  - verify session bootstrap + auth gate
  - verify domain-specific smoke flow (booking/order/calendar/revenue).
