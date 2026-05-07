# 003 - Kiến Trúc `apps/web` (UI-First + Compatibility Layer)

## 1) Vai trò kiến trúc của `apps/web`
- `apps/web` là runtime UI chính cho dashboard/admin/public pages.
- `apps/web` không phải data backend source-of-truth.
- Mọi truy cập business data phải đi qua API của `apps/server`.

## 2) Tech stack
- Next.js `16.1.x` (App Router)
- React `19.2.x`
- TypeScript `5.8.x`
- TanStack Query `5.x`
- MobX `6.x`
- TailwindCSS + Radix UI + Lucide

## 3) Route surface (App Router)

### 3.1 Public/entry routes
- `/[locale]/auth`, `/[locale]/auth/callback`
- `/[locale]/booking`
- `/[shopDomain]`, `/[shopDomain]/search`
- `/offline`

### 3.2 Dashboard routes (localized)
Các module chính dưới `apps/web/src/app/[locale]/(dashboard)`:
- `dashboard`
- `orders`, `orders/[orderId]`, `orders/new`, `orders/debt`
- `inventory`, `inventory/[itemId]`, `inventory/scan`
- `products`, `products/[productId]`
- `customers`, `customers/[customerId]`
- `payments`
- `reports` (`revenue`, `utilization`, `incidents`)
- `calendar`
- `settings` (`general`, `users`, `branches`, `categories`, `showrooms`, `showroom-pages`, `shifts`)
- `sales`, `procurement`, `makeup/*`, `media`

## 4) API strategy trong web

### 4.1 `apps/web/src/app/api/**`
- Chỉ dùng cho:
  - compatibility forwarding tạm thời,
  - integration đặc thù Next runtime khi chưa chuyển ngay sang Nest.
- Không được chứa business logic mới.
- Không được truy cập Supabase DB trực tiếp.

### 4.2 API source-of-truth
- API source-of-truth bắt buộc ở `apps/server`.
- Web client services phải gọi API base URL của `apps/server`.

## 5) Client data flow chuẩn (web)
```text
Component -> Hook -> Query/Mutation -> Service -> apps/server API
```

Quy tắc:
- Component không gọi thẳng network.
- Query/mutation quản fetch/retry/invalidate.
- Service layer chỉ quản transport/DTO mapping.

## 6) Middleware kiến trúc
`apps/web/middleware.ts` xử lý:
- locale normalization và route guard ở tầng web UI.
- policy header/CORS cho compatibility routes (nếu còn dùng).

Không dùng middleware web để thay thế authorization nghiệp vụ thuộc backend.

## 7) Performance observability (web runtime)
- Utility route/perf vẫn có thể tồn tại cho compatibility endpoints.
- Không mở rộng observability cho legacy endpoint để giữ lâu dài.
- Ưu tiên observability tại `apps/server` cho business APIs.

## 8) Cấu trúc features (web)
Feature modules hiện có:
`app-shell, auth, branding, calendar, customers, dashboard, inventory, makeup, media, notifications, orders, payments, procurement, product-landing, products, pwa, reports, sales, settings, showroom, transactions`.

## 9) Cấu hình môi trường quan trọng (web)

### 9.1 API backend
- `NEXT_PUBLIC_API_BASE_URL` (trỏ `apps/server` theo môi trường)
- `NEXT_PUBLIC_SITE_URL`

### 9.2 Voice/AI
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_TRANSCRIPTION_MODEL`
- `VOICE_TRANSCRIPTION_API_KEY`, `VOICE_TRANSCRIPTION_BASE_URL`, `VOICE_TRANSCRIPTION_MODEL`, `VOICE_TRANSCRIPTION_PROMPT`

### 9.3 Mini app / channel integration
- `ZALO_MINI_APP_APP_ID`, `ZALO_MINI_APP_APP_SECRET`, `ZALO_MINI_APP_OA_ID`
- `ZALO_MINI_APP_API_BASE_URL`, `ZALO_MINI_APP_RELEASE_CHANNEL`
- `ZALO_MINI_APP_ALLOWED_DOMAINS`, `ZALO_MINI_APP_WEBHOOK_SECRET`
- `ZALO_MINI_APP_DEBUG`, `ZALO_MINI_APP_DEV_PROFILE_ID`

### 9.4 Ops/perf/feature toggles
- `PERF_OBS_LOG`, `PERF_OBS_WARN_MS`
- `MEDIA_STORAGE_LIMIT_BYTES`
- `ENABLED_EMAIL_SENDER`, `NEXT_PUBLIC_ENABLED_EMAIL_SENDER`
- `NEXT_PUBLIC_PRODUCT_IMAGE_BUCKET`

## 10) Điều cấm trong `apps/web`
- Query Supabase DB trực tiếp từ route handlers/service layer web.
- Thêm business endpoint mới trong `apps/web/src/app/api/**`.
- Duplicate business rules đã thuộc ownership của `apps/server`.
