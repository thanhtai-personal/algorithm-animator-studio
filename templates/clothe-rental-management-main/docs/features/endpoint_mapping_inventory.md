# Endpoint Mapping Inventory

## Metadata
- Last updated: 2026-04-01 (Task 013)
- Source scan: `apps/web/src/app/api/**/route.ts`
- Production API base URL target: `https://kata-center-api.vercel.app`
- Standard env keys:
  - `NEST_API_BASE_URL` (server/Next runtime)
  - `VITE_NEST_API_BASE_URL` (Vite mini apps)

## Architecture Lock (V2)
- `apps/server` là API source-of-truth cho business domains.
- Chỉ `apps/server` được phép truy cập Supabase DB.
- `apps/web/src/app/api/**` chỉ giữ vai trò compatibility/forwarding trong migration window.
- Migrate endpoint bắt buộc giữ contract parity trước khi remove legacy routes.

## Migration Snapshot
- Task 001 đã migrate nhóm ưu tiên:
  - auth/session (`/api/v1/auth/*`)
  - mini-app config + auth/session + rental/access (`/api/v1/zalo-mini-app/*`)
- Task 002 khóa inventory + contract baseline cho toàn bộ legacy routes để làm đầu vào task 004 -> 013.
- Task 004 mở rộng auth migration:
  - thêm `sign-up` + `delete-account` tại Nest (`/api/v1/auth/*`)
  - legacy auth routes tương ứng (`/api/auth/*`) chuyển sang forwarding.
- Task 005 migrate settings/system endpoints sang Nest:
  - nhóm `/api/settings/**` trên web chuyển sang forwarding `/api/v1/settings/**`
  - giữ feature-flag mini-app config theo DB authoritative source trên Nest.
- Task 006 migrate products/inventory/customers endpoints sang Nest:
  - nhóm `/api/products/**`, `/api/inventory/**`, `/api/customers/**` trên web chuyển sang forwarding `/api/v1/*` tương ứng
  - source-of-truth CRUD/list/search cho 3 domain nằm ở `apps/server` theo module domain.
- Task 007 migrate orders/returns/payments/reports endpoints sang Nest:
  - nhóm `/api/orders/**`, `/api/return-orders/**`, `/api/payments/**`, `/api/reports/**` trên web chuyển sang forwarding `/api/v1/*` tương ứng
  - source-of-truth lifecycle đơn hàng/trả hàng, payment flow, và report formulas nằm ở `apps/server` theo module domain.
- Task 008 migrate makeup/procurement/media endpoints sang Nest:
  - nhóm `/api/makeup/**`, `/api/procurement/**`, `/api/media/**` trên web chuyển sang forwarding `/api/v1/*` tương ứng
  - source-of-truth booking/inventory makeup, procurement intake/import, media upload/quota nằm ở `apps/server` theo module domain.
- Task 009 migrate toàn bộ zalo-mini-app endpoints sang Nest:
  - nhóm `/api/zalo-mini-app/**` trên web chuyển sang forwarding `/api/v1/zalo-mini-app/**`
  - source-of-truth mini-app config/auth/rental/payment/webhook/voice nằm ở `apps/server/src/modules/mini-app/**`
- Task 010 cutover web client callers sang Nest v1 contract:
  - các services ở `apps/web/src/features/**/services/*.ts` (domain đã migrate) chuyển từ `/api/**` sang `/api/v1/**`
  - thêm compatibility proxy `apps/web/src/app/api/v1/[...path]/route.ts` để forward toàn bộ `v1` requests về `apps/server`
- Task 011 cutover mini-app callers sang Nest v1 contract:
  - các services ở `apps/zalo-mini-apps/**/src/features/**/services/*.ts` và `src/lib/voice/voiceTranscriptionClient.ts` chuyển sang `/api/v1/**` cho domain đã migrate
  - chuẩn hóa env key mini-app `VITE_NEST_API_BASE_URL` (giữ `VITE_API_BASE_URL` fallback cho compatibility window)
- Task 012 remove web API routes + cleanup legacy layer cho domain đã cutover:
  - remove toàn bộ route groups đã migrate khỏi `apps/web/src/app/api/**`: `auth`, `customers`, `inventory`, `makeup`, `media`, `orders`, `payments`, `procurement`, `products`, `reports`, `return-orders`, `settings`, `zalo-mini-app`
  - remove các route compatibility trùng lặp ở `apps/web/src/app/api/v1/auth/**` và `apps/web/src/app/api/v1/zalo-mini-app/**` (giữ `apps/web/src/app/api/v1/[...path]/route.ts` làm proxy chuẩn)
  - remove legacy web server services/data-access không còn caller cho domain đã cutover:
    - services: `customersService`, `inventoryService`, `ordersService`, `paymentsService`, `reportsService`, `returnOrdersService`, toàn bộ `zaloMiniApp*Service`
    - data-access: `customers`, `inventory`, `orders`, `payments`, `reports`, `returnOrders`, toàn bộ `zaloMiniApp*`
  - route groups còn giữ lại (ngoại lệ kiến trúc do domain chưa migrate): `calendar`, `customer/account`, `dashboard`, `notifications`, `public/branding`, `sales`, `showroom`, `voice`, và `v1/[...path]`
- Task 013 chốt release gate + observability cho phase cutover:
  - chuẩn hóa log payload theo endpoint group tại `apps/server` với tags `[api-request]` và `[api-error]`
  - thêm script gate `apps/server/scripts/release-gate/check-nest-cutover-readiness.mjs` để verify:
    - không tái xuất hiện legacy route/service/data-access đã remove
    - không còn legacy `/api/**` caller cho domain cutover trong web/mini-app consumers
  - bổ sung runbook/sign-off matrix: `docs/release/nest_api_cutover_release_gate.md`

## Task 001 + 004 Migrated Endpoints

| Legacy endpoint (apps/web) | Nest source-of-truth | Compatibility state | Main consumers | Status |
|---|---|---|---|---|
| `POST /api/auth/sign-in` | `POST /api/v1/auth/sign-in` | web route forwards to Nest | web auth UI, mini-app auth services | `legacy-forward` |
| `POST /api/auth/refresh` | `POST /api/v1/auth/refresh` | web route forwards to Nest | mini-app auth services | `legacy-forward` |
| `POST /api/auth/sign-out` | `POST /api/v1/auth/sign-out` | web route forwards to Nest | web/mini-app auth services | `legacy-forward` |
| `POST /api/auth/sign-up` | `POST /api/v1/auth/sign-up` | web route forwards to Nest | web auth UI, mini-app auth services | `legacy-forward` |
| `DELETE /api/auth/delete-account` | `DELETE /api/v1/auth/delete-account` | web route forwards to Nest | web auth UI, mini-app auth services | `legacy-forward` |
| `GET /api/auth/user` | `GET /api/v1/auth/user` | web route forwards to Nest | web auth bootstrap, mini-app auth context | `legacy-forward` |
| `GET /api/zalo-mini-app/config` | `GET /api/v1/zalo-mini-app/config` | web route forwards to Nest | all mini-app platform bootstraps | `legacy-forward` |
| `POST /api/zalo-mini-app/auth/session` | `POST /api/v1/zalo-mini-app/auth/session` | web route forwards to Nest | `kata-booking` auth bootstrap | `legacy-forward` |
| `GET /api/zalo-mini-app/rental/access` | `GET /api/v1/zalo-mini-app/rental/access` | web route forwards to Nest | `kata-rental-order`, `kata-rental-revenue` | `legacy-forward` |

## Contract Lock - Critical Endpoint Groups

| Endpoint group | Method/path baseline | Auth mode | Role/branch scope baseline | Request/response/error lock | Pagination/filter lock |
|---|---|---|---|---|---|
| Auth session | `POST /api/v1/auth/sign-in`, `POST /api/v1/auth/sign-up`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/sign-out`, `DELETE /api/v1/auth/delete-account`, `GET /api/v1/auth/user` | `public+session` (sign-in/sign-up/refresh), `authenticated` (sign-out/delete-account/user) | profile/session scoped | Giữ nguyên envelope + token/cookie behavior hiện tại; lỗi auth giữ status semantics hiện có | n/a |
| Mini-app platform | `GET /api/v1/zalo-mini-app/config`, `POST /api/v1/zalo-mini-app/auth/session`, `GET /api/v1/zalo-mini-app/rental/access` | `mini-app-session` | app/channel scoped | Không đổi schema config/session/access; không swallow lỗi permission thành `enabled=false` giả | config/access dùng query params hiện tại |
| Orders/returns/payments | `/api/orders/**`, `/api/return-orders/**`, `/api/payments/**` | `authenticated` | branch + RBAC | Giữ parity state machine (`DEBT`, settle/refund, payment status). Mapping lỗi giữ semantics hiện tại | list/export endpoints giữ parity query filters |
| Settings/feature flags | `/api/settings/**`, `/api/zalo-mini-app/config` | `authenticated` (admin) + mini-app session | owner_admin/manager + branch scope | Giữ parity cập nhật settings và flags; lỗi quyền phải phản ánh đúng | list endpoints giữ parity query params |

## Consumer Mapping Snapshot (Task 002)

- Caller reference scan sources:
  - `apps/web/src/features/**/services/*.ts`
  - `apps/zalo-mini-apps/**/src/features/**/services/*.ts`
  - `apps/zalo-mini-apps/**/src/lib/httpClient.ts`
- Total caller API reference lines: **173**
- Mobile scan:
  - Found 1 direct API caller in mobile: `apps/mobile/src/lib/voice/useVoiceParser.ts` -> `/api/ai/parse`.
  - Endpoint này không thuộc `apps/web/src/app/api/**` inventory hiện tại, cần follow-up riêng khi chuẩn hóa mobile gateway qua `apps/server`.

### Consumer files by API domain

| API domain | Consumer files count | Sample consumer files |
|---|---:|---|
| `calendar` | 1 | `apps/web/src/features/calendar/services/calendarClientService.ts` |
| `customer` | 1 | `apps/web/src/features/product-landing/services/customerAccountClientService.ts` |
| `customers` | 1 | `apps/web/src/features/customers/services/customersClientService.ts` |
| `dashboard` | 1 | `apps/web/src/features/dashboard/services/dashboardClientService.ts` |
| `inventory` | 1 | `apps/web/src/features/inventory/services/inventoryClientService.ts` |
| `makeup` | 3 | `apps/web/src/features/makeup/services/makeupClientService.ts`, `apps/zalo-mini-apps/kata-booking/src/features/makeup/services/zaloMiniAppMakeupService.ts`, `apps/zalo-mini-apps/kata-calendar/src/features/calendar/services/zaloMiniAppCalendarService.ts` |
| `media` | 1 | `apps/web/src/features/media/services/mediaClientService.ts` |
| `notifications` | 1 | `apps/web/src/features/notifications/services/notificationsClientService.ts` |
| `orders` | 3 | `apps/web/src/features/calendar/services/calendarClientService.ts`, `apps/web/src/features/dashboard/services/dashboardClientService.ts`, `apps/web/src/features/orders/services/ordersClientService.ts` |
| `payments` | 1 | `apps/web/src/features/payments/services/paymentsClientService.ts` |
| `procurement` | 1 | `apps/web/src/features/procurement/services/procurementClientService.ts` |
| `products` | 2 | `apps/web/src/features/inventory/services/inventoryClientService.ts`, `apps/web/src/features/products/services/productsClientService.ts` |
| `public` | 1 | `apps/web/src/features/branding/services/brandingClientService.ts` |
| `reports` | 2 | `apps/web/src/features/dashboard/services/dashboardClientService.ts`, `apps/web/src/features/reports/services/reportsClientService.ts` |
| `return-orders` | 1 | `apps/web/src/features/orders/services/returnOrdersClientService.ts` |
| `sales` | 2 | `apps/web/src/features/sales/services/salesClientService.ts`, `apps/web/src/features/settings/services/settingsClientService.ts` |
| `settings` | 1 | `apps/web/src/features/settings/services/settingsClientService.ts` |
| `showroom` | 4 | `apps/web/src/features/product-landing/services/productLandingClientService.ts`, `apps/web/src/features/products/services/productsClientService.ts`, `apps/web/src/features/showroom/services/showroomClientService.ts`, `apps/zalo-mini-apps/kata-booking/src/features/products/services/zaloMiniAppCatalogService.ts` |
| `v1/auth` | 4 | `apps/web/src/features/auth/services/authBrowserService.ts`, `apps/zalo-mini-apps/kata-calendar/src/features/auth/services/zaloMiniAppAuthApiService.ts`, `apps/zalo-mini-apps/kata-rental-order/src/features/auth/services/zaloMiniAppAuthApiService.ts`, `apps/zalo-mini-apps/kata-rental-revenue/src/features/auth/services/zaloMiniAppAuthApiService.ts` |
| `v1/zalo-mini-app` | 7 | `apps/zalo-mini-apps/kata-booking/src/features/auth/services/zaloMiniAppAuthApiService.ts`, `apps/zalo-mini-apps/kata-booking/src/features/platform/services/platformApiService.ts`, `apps/zalo-mini-apps/kata-calendar/src/features/platform/services/platformApiService.ts`, `apps/zalo-mini-apps/kata-rental-order/src/features/platform/services/platformApiService.ts`, ... (+3 files) |
| `zalo-mini-app` | 4 | `apps/zalo-mini-apps/kata-booking/src/features/checkout/services/zaloMiniAppCheckoutApiService.ts`, `apps/zalo-mini-apps/kata-booking/src/features/orders/services/zaloMiniAppOrderDraftService.ts`, `apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/services/rentalOrderApiService.ts`, `apps/zalo-mini-apps/kata-rental-revenue/src/features/rental-revenue/services/rentalRevenueApiService.ts` |

### Consumer hot files (top 20 by endpoint refs)

| Consumer file | Distinct endpoint patterns |
|---|---:|
| `apps/web/src/features/makeup/services/makeupClientService.ts` | 16 |
| `apps/web/src/features/settings/services/settingsClientService.ts` | 12 |
| `apps/web/src/features/procurement/services/procurementClientService.ts` | 8 |
| `apps/web/src/features/sales/services/salesClientService.ts` | 8 |
| `apps/web/src/features/inventory/services/inventoryClientService.ts` | 6 |
| `apps/web/src/features/reports/services/reportsClientService.ts` | 6 |
| `apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/services/rentalOrderApiService.ts` | 5 |
| `apps/web/src/features/customers/services/customersClientService.ts` | 3 |
| `apps/web/src/features/dashboard/services/dashboardClientService.ts` | 3 |
| `apps/web/src/features/media/services/mediaClientService.ts` | 3 |
| `apps/web/src/features/notifications/services/notificationsClientService.ts` | 3 |
| `apps/web/src/features/orders/services/ordersClientService.ts` | 3 |
| `apps/web/src/features/orders/services/returnOrdersClientService.ts` | 3 |
| `apps/web/src/features/payments/services/paymentsClientService.ts` | 3 |
| `apps/web/src/features/products/services/productsClientService.ts` | 3 |
| `apps/web/src/features/showroom/services/showroomClientService.ts` | 3 |
| `apps/zalo-mini-apps/kata-booking/src/features/makeup/services/zaloMiniAppMakeupService.ts` | 3 |
| `apps/zalo-mini-apps/kata-rental-order/src/features/auth/services/zaloMiniAppAuthApiService.ts` | 3 |
| `apps/zalo-mini-apps/kata-rental-revenue/src/features/auth/services/zaloMiniAppAuthApiService.ts` | 3 |
| `apps/zalo-mini-apps/kata-rental-revenue/src/features/rental-revenue/services/rentalRevenueApiService.ts` | 3 |

## Full Endpoint Inventory Matrix (Task 009)

- Route handlers scanned: **135**
- Status counts: `legacy-forward=107`, `migrated=9`, `todo=19`

### Domain counts

| Domain | Routes |
|---|---:|
| auth | 6 |
| calendar | 1 |
| customer | 1 |
| customers | 3 |
| dashboard | 1 |
| inventory | 5 |
| makeup | 17 |
| media | 3 |
| notifications | 3 |
| orders | 14 |
| payments | 3 |
| procurement | 8 |
| products | 7 |
| public | 1 |
| reports | 6 |
| return-orders | 7 |
| sales | 8 |
| settings | 11 |
| showroom | 3 |
| v1/auth | 6 |
| v1/zalo-mini-app | 3 |
| voice | 1 |
| zalo-mini-app | 17 |

### Route-by-route mapping (contract lock baseline)

| Legacy endpoint | Methods | Owner module (`apps/server`) | Status | Auth mode | Role/branch scope | Request/Response lock | Pagination/filter | Main consumers | Route file |
|---|---|---|---|---|---|---|---|---|---|
| `/api/auth/delete-account` | DELETE | `auth` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/auth/delete-account/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/auth/delete-account/route.ts` |
| `/api/auth/refresh` | POST | `auth` | `legacy-forward` | `public+session` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/auth/refresh/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/auth/refresh/route.ts` |
| `/api/auth/sign-in` | POST | `auth` | `legacy-forward` | `public+session` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/auth/sign-in/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/auth/sign-in/route.ts` |
| `/api/auth/sign-out` | POST | `auth` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/auth/sign-out/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/auth/sign-out/route.ts` |
| `/api/auth/sign-up` | POST | `auth` | `legacy-forward` | `public+session` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/auth/sign-up/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/auth/sign-up/route.ts` |
| `/api/auth/user` | GET | `auth` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/auth/user/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/auth/user/route.ts` |
| `/api/calendar/events` | GET | `calendar` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/calendar/events/route.ts`) | query params list/filter (preserve parity from legacy handler) | web calendar | `apps/web/src/app/api/calendar/events/route.ts` |
| `/api/customer/account` | GET, PATCH | `customers` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/customer/account/route.ts`) | query params list/filter (preserve parity from legacy handler) | web customers; product-landing account | `apps/web/src/app/api/customer/account/route.ts` |
| `/api/customers/:customerId` | GET, PATCH | `customers` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/customers/[customerId]/route.ts`) | n/a | web customers; product-landing account | `apps/web/src/app/api/customers/[customerId]/route.ts` |
| `/api/customers` | GET, POST | `customers` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/customers/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/customers/route.ts` |
| `/api/customers/typeahead` | GET | `customers` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/customers/typeahead/route.ts`) | query params list/filter (preserve parity from legacy handler) | web customers; product-landing account | `apps/web/src/app/api/customers/typeahead/route.ts` |
| `/api/dashboard/overview` | GET | `dashboard` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/dashboard/overview/route.ts`) | query params list/filter (preserve parity from legacy handler) | web dashboard | `apps/web/src/app/api/dashboard/overview/route.ts` |
| `/api/inventory/:itemId` | GET | `inventory` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/inventory/[itemId]/route.ts`) | n/a | web inventory feature | `apps/web/src/app/api/inventory/[itemId]/route.ts` |
| `/api/inventory/:itemId/status` | PATCH | `inventory` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/inventory/[itemId]/status/route.ts`) | n/a | web inventory feature | `apps/web/src/app/api/inventory/[itemId]/status/route.ts` |
| `/api/inventory/bulk-status` | PATCH | `inventory` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/inventory/bulk-status/route.ts`) | n/a | web inventory feature | `apps/web/src/app/api/inventory/bulk-status/route.ts` |
| `/api/inventory` | GET | `inventory` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/inventory/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/inventory/route.ts` |
| `/api/inventory/scan` | GET | `inventory` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/inventory/scan/route.ts`) | query params list/filter (preserve parity from legacy handler) | web inventory feature | `apps/web/src/app/api/inventory/scan/route.ts` |
| `/api/makeup/admin/overview` | GET | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/admin/overview/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/admin/overview/route.ts` |
| `/api/makeup/artists/:artistProfileId/schedule` | GET | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/artists/[artistProfileId]/schedule/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/artists/[artistProfileId]/schedule/route.ts` |
| `/api/makeup/artists/public` | GET | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/artists/public/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/artists/public/route.ts` |
| `/api/makeup/artists` | GET | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/artists/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/artists/route.ts` |
| `/api/makeup/events/:eventId` | PATCH | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/events/[eventId]/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/events/[eventId]/route.ts` |
| `/api/makeup/events/conflicts` | GET | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/events/conflicts/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/events/conflicts/route.ts` |
| `/api/makeup/events/parse` | POST | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/events/parse/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/events/parse/route.ts` |
| `/api/makeup/events` | GET, POST | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/events/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/events/route.ts` |
| `/api/makeup/inventory/:itemId` | PATCH | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/inventory/[itemId]/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/inventory/[itemId]/route.ts` |
| `/api/makeup/inventory` | GET, POST | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/inventory/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/inventory/route.ts` |
| `/api/makeup/orders/:orderId` | PATCH | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/orders/[orderId]/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/orders/[orderId]/route.ts` |
| `/api/makeup/orders` | GET, POST | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/orders/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/orders/route.ts` |
| `/api/makeup/packages/:packageId` | PATCH | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/packages/[packageId]/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/packages/[packageId]/route.ts` |
| `/api/makeup/packages` | GET, POST | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/packages/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/packages/route.ts` |
| `/api/makeup/purchase-invoices/:invoiceId` | PATCH | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/purchase-invoices/[invoiceId]/route.ts`) | n/a | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/purchase-invoices/[invoiceId]/route.ts` |
| `/api/makeup/purchase-invoices` | GET, POST | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/purchase-invoices/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/purchase-invoices/route.ts` |
| `/api/makeup/stats/my` | GET | `makeup` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/makeup/stats/my/route.ts`) | query params list/filter (preserve parity from legacy handler) | web makeup; calendar/booking mini-app | `apps/web/src/app/api/makeup/stats/my/route.ts` |
| `/api/media/:mediaId` | DELETE | `media` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/media/[mediaId]/route.ts`) | n/a | web media management | `apps/web/src/app/api/media/[mediaId]/route.ts` |
| `/api/media` | GET, POST | `media` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/media/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/media/route.ts` |
| `/api/media/upload-complete` | POST | `media` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/media/upload-complete/route.ts`) | n/a | web media management | `apps/web/src/app/api/media/upload-complete/route.ts` |
| `/api/notifications/:notificationId/read` | PATCH | `notifications` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/notifications/[notificationId]/read/route.ts`) | n/a | web notifications | `apps/web/src/app/api/notifications/[notificationId]/read/route.ts` |
| `/api/notifications/read-all` | PATCH | `notifications` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/notifications/read-all/route.ts`) | n/a | web notifications | `apps/web/src/app/api/notifications/read-all/route.ts` |
| `/api/notifications` | GET | `notifications` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/notifications/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/notifications/route.ts` |
| `/api/orders/:orderId/cancel` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/cancel/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/cancel/route.ts` |
| `/api/orders/:orderId/complete` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/complete/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/complete/route.ts` |
| `/api/orders/:orderId/incidents` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/incidents/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/incidents/route.ts` |
| `/api/orders/:orderId/items/:orderItemId` | PATCH, DELETE | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/items/[orderItemId]/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/items/[orderItemId]/route.ts` |
| `/api/orders/:orderId/items` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/items/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/items/route.ts` |
| `/api/orders/:orderId/payments/:paymentId/status` | PATCH | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/payments/[paymentId]/status/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/payments/[paymentId]/status/route.ts` |
| `/api/orders/:orderId/payments` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/payments/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/payments/route.ts` |
| `/api/orders/:orderId/pickup` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/pickup/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/pickup/route.ts` |
| `/api/orders/:orderId/return` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/return/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/return/route.ts` |
| `/api/orders/:orderId` | GET, PATCH | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/route.ts` |
| `/api/orders/:orderId/settle-debt` | POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/settle-debt/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/settle-debt/route.ts` |
| `/api/orders/:orderId/status` | PATCH | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/[orderId]/status/route.ts`) | n/a | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/[orderId]/status/route.ts` |
| `/api/orders/availability` | GET | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/availability/route.ts`) | query params list/filter (preserve parity from legacy handler) | web orders + dashboard/calendar hooks | `apps/web/src/app/api/orders/availability/route.ts` |
| `/api/orders` | GET, POST | `orders` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/orders/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/orders/route.ts` |
| `/api/payments/:paymentId/status` | PATCH | `payments` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/payments/[paymentId]/status/route.ts`) | n/a | web payments feature | `apps/web/src/app/api/payments/[paymentId]/status/route.ts` |
| `/api/payments/export` | GET | `payments` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/payments/export/route.ts`) | query params list/filter (preserve parity from legacy handler) | web payments feature | `apps/web/src/app/api/payments/export/route.ts` |
| `/api/payments` | GET | `payments` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/payments/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/payments/route.ts` |
| `/api/procurement/:receiptId` | GET, PATCH, DELETE | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/[receiptId]/route.ts`) | n/a | web procurement feature | `apps/web/src/app/api/procurement/[receiptId]/route.ts` |
| `/api/procurement/categories` | GET | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/categories/route.ts`) | query params list/filter (preserve parity from legacy handler) | web procurement feature | `apps/web/src/app/api/procurement/categories/route.ts` |
| `/api/procurement/import/commit` | POST | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/import/commit/route.ts`) | n/a | web procurement feature | `apps/web/src/app/api/procurement/import/commit/route.ts` |
| `/api/procurement/import/incomplete/export` | POST | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/import/incomplete/export/route.ts`) | n/a | web procurement feature | `apps/web/src/app/api/procurement/import/incomplete/export/route.ts` |
| `/api/procurement/import/validate` | POST | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/import/validate/route.ts`) | n/a | web procurement feature | `apps/web/src/app/api/procurement/import/validate/route.ts` |
| `/api/procurement/products` | GET | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/products/route.ts`) | query params list/filter (preserve parity from legacy handler) | web procurement feature | `apps/web/src/app/api/procurement/products/route.ts` |
| `/api/procurement` | GET, POST | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/procurement/route.ts` |
| `/api/procurement/template` | GET | `procurement` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/procurement/template/route.ts`) | query params list/filter (preserve parity from legacy handler) | web procurement feature | `apps/web/src/app/api/procurement/template/route.ts` |
| `/api/products/:productId/items/:itemId` | PATCH, DELETE | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/[productId]/items/[itemId]/route.ts`) | n/a | web products/inventory features | `apps/web/src/app/api/products/[productId]/items/[itemId]/route.ts` |
| `/api/products/:productId/items` | POST | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/[productId]/items/route.ts`) | n/a | web products/inventory features | `apps/web/src/app/api/products/[productId]/items/route.ts` |
| `/api/products/:productId/pricing` | PATCH | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/[productId]/pricing/route.ts`) | n/a | web products/inventory features | `apps/web/src/app/api/products/[productId]/pricing/route.ts` |
| `/api/products/:productId` | GET, PATCH, DELETE | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/[productId]/route.ts`) | n/a | web products/inventory features | `apps/web/src/app/api/products/[productId]/route.ts` |
| `/api/products/:productId/variants/:variantId` | PATCH, DELETE | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/[productId]/variants/[variantId]/route.ts`) | n/a | web products/inventory features | `apps/web/src/app/api/products/[productId]/variants/[variantId]/route.ts` |
| `/api/products/:productId/variants` | POST | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/[productId]/variants/route.ts`) | n/a | web products/inventory features | `apps/web/src/app/api/products/[productId]/variants/route.ts` |
| `/api/products` | GET, POST | `products` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/products/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/products/route.ts` |
| `/api/public/branding` | GET | `branding/public-content` | `todo` | `public` | `public` | lock-by-parity (`apps/web/src/app/api/public/branding/route.ts`) | query params list/filter (preserve parity from legacy handler) | web branding/public clients | `apps/web/src/app/api/public/branding/route.ts` |
| `/api/reports/incidents/export` | GET | `reports` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/reports/incidents/export/route.ts`) | query params list/filter (preserve parity from legacy handler) | web reports/dashboard | `apps/web/src/app/api/reports/incidents/export/route.ts` |
| `/api/reports/incidents` | GET | `reports` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/reports/incidents/route.ts`) | query params list/filter (preserve parity from legacy handler) | web reports/dashboard | `apps/web/src/app/api/reports/incidents/route.ts` |
| `/api/reports/revenue/export` | GET | `reports` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/reports/revenue/export/route.ts`) | query params list/filter (preserve parity from legacy handler) | web reports/dashboard | `apps/web/src/app/api/reports/revenue/export/route.ts` |
| `/api/reports/revenue` | GET | `reports` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/reports/revenue/route.ts`) | query params list/filter (preserve parity from legacy handler) | web reports/dashboard | `apps/web/src/app/api/reports/revenue/route.ts` |
| `/api/reports/utilization/export` | GET | `reports` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/reports/utilization/export/route.ts`) | query params list/filter (preserve parity from legacy handler) | web reports/dashboard | `apps/web/src/app/api/reports/utilization/export/route.ts` |
| `/api/reports/utilization` | GET | `reports` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/reports/utilization/route.ts`) | query params list/filter (preserve parity from legacy handler) | web reports/dashboard | `apps/web/src/app/api/reports/utilization/route.ts` |
| `/api/return-orders/:returnOrderId/cancel` | POST | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/[returnOrderId]/cancel/route.ts`) | n/a | web return-orders feature | `apps/web/src/app/api/return-orders/[returnOrderId]/cancel/route.ts` |
| `/api/return-orders/:returnOrderId/complete` | POST | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/[returnOrderId]/complete/route.ts`) | n/a | web return-orders feature | `apps/web/src/app/api/return-orders/[returnOrderId]/complete/route.ts` |
| `/api/return-orders/:returnOrderId` | GET | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/[returnOrderId]/route.ts`) | n/a | web return-orders feature | `apps/web/src/app/api/return-orders/[returnOrderId]/route.ts` |
| `/api/return-orders/:returnOrderId/settle` | POST | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/[returnOrderId]/settle/route.ts`) | n/a | web return-orders feature | `apps/web/src/app/api/return-orders/[returnOrderId]/settle/route.ts` |
| `/api/return-orders/:returnOrderId/status` | PATCH | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/[returnOrderId]/status/route.ts`) | n/a | web return-orders feature | `apps/web/src/app/api/return-orders/[returnOrderId]/status/route.ts` |
| `/api/return-orders` | GET, POST | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/route.ts`) | query params list/filter (preserve parity from legacy handler) | tbd | `apps/web/src/app/api/return-orders/route.ts` |
| `/api/return-orders/sources` | GET | `returns` | `legacy-forward` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/return-orders/sources/route.ts`) | query params list/filter (preserve parity from legacy handler) | web return-orders feature | `apps/web/src/app/api/return-orders/sources/route.ts` |
| `/api/sales/products/:productId` | GET, PATCH | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/products/[productId]/route.ts`) | n/a | web sales/settings | `apps/web/src/app/api/sales/products/[productId]/route.ts` |
| `/api/sales/products` | GET, POST | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/products/route.ts`) | query params list/filter (preserve parity from legacy handler) | web sales/settings | `apps/web/src/app/api/sales/products/route.ts` |
| `/api/sales/shift/close` | POST | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/shift/close/route.ts`) | n/a | web sales/settings | `apps/web/src/app/api/sales/shift/close/route.ts` |
| `/api/sales/shift/current-detail` | GET | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/shift/current-detail/route.ts`) | query params list/filter (preserve parity from legacy handler) | web sales/settings | `apps/web/src/app/api/sales/shift/current-detail/route.ts` |
| `/api/sales/shift/current` | GET | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/shift/current/route.ts`) | query params list/filter (preserve parity from legacy handler) | web sales/settings | `apps/web/src/app/api/sales/shift/current/route.ts` |
| `/api/sales/shift/open` | POST | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/shift/open/route.ts`) | n/a | web sales/settings | `apps/web/src/app/api/sales/shift/open/route.ts` |
| `/api/sales/shifts/:shiftId` | GET | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/shifts/[shiftId]/route.ts`) | n/a | web sales/settings | `apps/web/src/app/api/sales/shifts/[shiftId]/route.ts` |
| `/api/sales/shifts` | GET | `sales` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/sales/shifts/route.ts`) | query params list/filter (preserve parity from legacy handler) | web sales/settings | `apps/web/src/app/api/sales/shifts/route.ts` |
| `/api/settings/branches/:branchId` | PATCH | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/branches/[branchId]/route.ts`) | n/a | web settings feature | `apps/web/src/app/api/settings/branches/[branchId]/route.ts` |
| `/api/settings/branches` | GET, POST | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/branches/route.ts`) | query params list/filter (preserve parity from legacy handler) | web settings feature | `apps/web/src/app/api/settings/branches/route.ts` |
| `/api/settings/general` | GET, PATCH | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/general/route.ts`) | query params list/filter (preserve parity from legacy handler) | web settings feature | `apps/web/src/app/api/settings/general/route.ts` |
| `/api/settings/product-categories/:categoryId` | PATCH, DELETE | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/product-categories/[categoryId]/route.ts`) | n/a | web settings feature | `apps/web/src/app/api/settings/product-categories/[categoryId]/route.ts` |
| `/api/settings/product-categories` | GET, POST | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/product-categories/route.ts`) | query params list/filter (preserve parity from legacy handler) | web settings feature | `apps/web/src/app/api/settings/product-categories/route.ts` |
| `/api/settings/showroom-pages` | GET, PATCH | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/showroom-pages/route.ts`) | query params list/filter (preserve parity from legacy handler) | web settings feature | `apps/web/src/app/api/settings/showroom-pages/route.ts` |
| `/api/settings/showrooms/:showroomId` | PATCH, DELETE | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/showrooms/[showroomId]/route.ts`) | n/a | web settings feature | `apps/web/src/app/api/settings/showrooms/[showroomId]/route.ts` |
| `/api/settings/showrooms` | GET, POST | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/showrooms/route.ts`) | query params list/filter (preserve parity from legacy handler) | web settings feature | `apps/web/src/app/api/settings/showrooms/route.ts` |
| `/api/settings/users/:userId/reset-password` | POST | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/users/[userId]/reset-password/route.ts`) | n/a | web settings feature | `apps/web/src/app/api/settings/users/[userId]/reset-password/route.ts` |
| `/api/settings/users/:userId` | PATCH | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/users/[userId]/route.ts`) | n/a | web settings feature | `apps/web/src/app/api/settings/users/[userId]/route.ts` |
| `/api/settings/users` | GET, POST | `settings` | `legacy-forward` | `authenticated` | `owner_admin/manager scoped` | lock-by-parity (`apps/web/src/app/api/settings/users/route.ts`) | query params list/filter (preserve parity from legacy handler) | web settings feature | `apps/web/src/app/api/settings/users/route.ts` |
| `/api/showroom/config` | GET | `showroom` | `todo` | `public` | `public` | lock-by-parity (`apps/web/src/app/api/showroom/config/route.ts`) | query params list/filter (preserve parity from legacy handler) | web showroom; booking mini-app catalog | `apps/web/src/app/api/showroom/config/route.ts` |
| `/api/showroom/products/:productId` | GET | `showroom` | `todo` | `public` | `public` | lock-by-parity (`apps/web/src/app/api/showroom/products/[productId]/route.ts`) | n/a | web showroom; booking mini-app catalog | `apps/web/src/app/api/showroom/products/[productId]/route.ts` |
| `/api/showroom/products` | GET | `showroom` | `todo` | `public` | `public` | lock-by-parity (`apps/web/src/app/api/showroom/products/route.ts`) | query params list/filter (preserve parity from legacy handler) | web showroom; booking mini-app catalog | `apps/web/src/app/api/showroom/products/route.ts` |
| `/api/v1/auth/delete-account` | DELETE | `auth` | `migrated` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/v1/auth/delete-account/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/v1/auth/delete-account/route.ts` |
| `/api/v1/auth/refresh` | POST | `auth` | `migrated` | `public+session` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/v1/auth/refresh/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/v1/auth/refresh/route.ts` |
| `/api/v1/auth/sign-in` | POST | `auth` | `migrated` | `public+session` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/v1/auth/sign-in/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/v1/auth/sign-in/route.ts` |
| `/api/v1/auth/sign-out` | POST | `auth` | `migrated` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/v1/auth/sign-out/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/v1/auth/sign-out/route.ts` |
| `/api/v1/auth/sign-up` | POST | `auth` | `migrated` | `public+session` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/v1/auth/sign-up/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/v1/auth/sign-up/route.ts` |
| `/api/v1/auth/user` | GET | `auth` | `migrated` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/v1/auth/user/route.ts`) | n/a | web auth UI; mini-app auth services | `apps/web/src/app/api/v1/auth/user/route.ts` |
| `/api/v1/zalo-mini-app/auth/session` | POST | `zalo-mini-app` | `migrated` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/v1/zalo-mini-app/auth/session/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/v1/zalo-mini-app/auth/session/route.ts` |
| `/api/v1/zalo-mini-app/config` | GET | `zalo-mini-app` | `migrated` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/v1/zalo-mini-app/config/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/v1/zalo-mini-app/config/route.ts` |
| `/api/v1/zalo-mini-app/rental/access` | GET | `zalo-mini-app` | `migrated` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/v1/zalo-mini-app/rental/access/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/v1/zalo-mini-app/rental/access/route.ts` |
| `/api/voice/transcriptions` | POST | `voice-ai` | `todo` | `authenticated` | `branch/RBAC scoped` | lock-by-parity (`apps/web/src/app/api/voice/transcriptions/route.ts`) | n/a | web voice | `apps/web/src/app/api/voice/transcriptions/route.ts` |
| `/api/zalo-mini-app/auth/session` | POST | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/auth/session/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/auth/session/route.ts` |
| `/api/zalo-mini-app/config` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/config/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/config/route.ts` |
| `/api/zalo-mini-app/makeup/access` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/makeup/access/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/makeup/access/route.ts` |
| `/api/zalo-mini-app/makeup/events` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/makeup/events/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/makeup/events/route.ts` |
| `/api/zalo-mini-app/orders/draft` | GET, POST | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/orders/draft/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/orders/draft/route.ts` |
| `/api/zalo-mini-app/payment/callback` | POST | `zalo-mini-app` | `legacy-forward` | `signature-auth` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/payment/callback/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/payment/callback/route.ts` |
| `/api/zalo-mini-app/payment/check-transaction` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/payment/check-transaction/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/payment/check-transaction/route.ts` |
| `/api/zalo-mini-app/payment/create-order` | POST | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/payment/create-order/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/payment/create-order/route.ts` |
| `/api/zalo-mini-app/rental/access` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/access/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/access/route.ts` |
| `/api/zalo-mini-app/rental/customers` | GET, POST | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/customers/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/customers/route.ts` |
| `/api/zalo-mini-app/rental/dashboard/overview` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/dashboard/overview/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/dashboard/overview/route.ts` |
| `/api/zalo-mini-app/rental/orders/create` | POST | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/orders/create/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/orders/create/route.ts` |
| `/api/zalo-mini-app/rental/products/:productId` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/products/[productId]/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/products/[productId]/route.ts` |
| `/api/zalo-mini-app/rental/products` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/products/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/products/route.ts` |
| `/api/zalo-mini-app/rental/reports/revenue` | GET | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/rental/reports/revenue/route.ts`) | query params list/filter (preserve parity from legacy handler) | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/rental/reports/revenue/route.ts` |
| `/api/zalo-mini-app/voice/transcriptions` | POST | `zalo-mini-app` | `legacy-forward` | `mini-app-session` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/voice/transcriptions/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/voice/transcriptions/route.ts` |
| `/api/zalo-mini-app/webhooks` | POST | `zalo-mini-app` | `legacy-forward` | `signature-auth` | `mini-app scoped` | lock-by-parity (`apps/web/src/app/api/zalo-mini-app/webhooks/route.ts`) | n/a | zalo mini-apps | `apps/web/src/app/api/zalo-mini-app/webhooks/route.ts` |

## Notes
- `status` meanings:
  - `migrated`: source-of-truth đã ở Nest v1 endpoint.
  - `legacy-forward`: legacy route còn tồn tại nhưng forward sang Nest.
  - `todo`: chưa migrate source-of-truth sang Nest.
- Owner module mapping là baseline để triển khai task 004 -> 013; khi migrate thực tế có thể tách module con nhưng không được phá boundary kiến trúc V2.
