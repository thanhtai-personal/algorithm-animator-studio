# Huong Dan Setup Zalo Mini App

Tai lieu nay dung cho setup thuc te tinh nang Zalo Mini App trong repo nay.

## 1) Tong Quan Can Setup
- Database migration cho module Zalo Mini App.
- ENV cho `apps/web` (server side) de auth/payment/webhook hoat dong.
- Feature flag `is_zalo_mini_app_enabled`.
- App client `apps/zalo-mini-app` (neu can test UI flow local).
- Cau hinh callback/webhook/domain tren Zalo Mini App Console.

## 2) Setup Backend (`apps/web`)

### B2.1 Chay SQL migration
Chay migration sau theo thu tu:
1. `apps/web/sql/033_makeup_module_default_enabled_true.sql` (neu env chua co)
2. `apps/web/sql/034_zalo_mini_app_core.sql`

Neu dung Supabase SQL Editor, paste file `034_zalo_mini_app_core.sql` va run.

### B2.2 Tao ENV (`apps/web/.env.local`)
Bat buoc:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

ZALO_MINI_APP_APP_ID=...
ZALO_MINI_APP_APP_SECRET=...
ZALO_MINI_APP_OA_ID=...
ZALO_MINI_APP_API_BASE_URL=http://localhost:3000
ZALO_MINI_APP_RELEASE_CHANNEL=development
ZALO_MINI_APP_ALLOWED_DOMAINS=localhost:3000
ZALO_MINI_APP_WEBHOOK_SECRET=...
```

Tham chieu mau: `apps/web/.env.example`.

### B2.3 Chay web server
```bash
cd apps/web
npm install
npm run dev
```

## 3) Bat Feature Flag
Mac dinh module dang OFF.

Co 2 cach bat:

### Cach A - bat nhanh bang SQL
```sql
update public.system_settings
set is_zalo_mini_app_enabled = true;
```

### Cach B - bat trong admin UI
- Vao `Settings -> General -> System operations`
- Bat toggle `Enable Zalo Mini App module`
- Luu.

## 4) Setup App Client (`apps/zalo-mini-app`)
App nay la skeleton de test flow auth/catalog/cart/draft/checkout.

### B4.1 Tao ENV
Tao `apps/zalo-mini-app/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000
```

### B4.2 Chay app
```bash
cd apps/zalo-mini-app
npm install
npm run dev
```

Luu y:
- Neu chay ngoai runtime Zalo that, app su dung `mock mode` cho SDK de test flow API.
- Catalog mini app lay toan bo du lieu, khong loc theo branch.
- Luc tao draft, neu payload khong co `branchId` thi backend tu chon branch fallback theo du lieu he thong.

## 5) Smoke Test API Bat Buoc

### B5.1 Config endpoint
```bash
curl -s http://localhost:3000/api/zalo-mini-app/config
```
Ky vong:
- `enabled=true` (sau khi bat flag)
- tra ve `appId`, `oaId`, `apiBaseUrl`, `releaseChannel`.

### B5.2 Tao session
```bash
curl -X POST http://localhost:3000/api/zalo-mini-app/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "zaloUserId":"zalo-user-test-001",
    "displayName":"Test User",
    "consentScopes":["scope.userInfo"],
    "zaloAccessToken":"mock-access-token-12345678"
  }'
```
Luu lai `sessionToken` de goi cac endpoint tiep theo.

### B5.3 Tao draft
```bash
curl -X POST http://localhost:3000/api/zalo-mini-app/orders/draft \
  -H "Content-Type: application/json" \
  -H "x-zalo-mini-app-session: <sessionToken>" \
  -d '{
    "items":[{"productId":"<product_id>","quantity":1,"unitPrice":100000}],
    "note":"test draft"
  }'
```

### B5.4 Tao payment order
```bash
curl -X POST http://localhost:3000/api/zalo-mini-app/payment/create-order \
  -H "Content-Type: application/json" \
  -H "x-zalo-mini-app-session: <sessionToken>" \
  -d '{"draftId":"<draft_id>"}'
```

## 6) Setup Tren Zalo Console (Production/Staging)
- Khai bao domain API hop le trung voi `ZALO_MINI_APP_ALLOWED_DOMAINS`.
- Khai bao callback URL:
  - payment callback: `/api/zalo-mini-app/payment/callback`
  - webhook: `/api/zalo-mini-app/webhooks`
- Dong bo secret:
  - secret tren console phai khop `ZALO_MINI_APP_WEBHOOK_SECRET`.

## 7) Checklist Release Nhanh
1. SQL `034` da run thanh cong.
2. ENV Zalo day du tren deployment target.
3. Feature flag bat dung environment.
4. `GET /api/zalo-mini-app/config` tra ve dung config.
5. Callback/webhook test signature pass/fail dung ky vong.

## 8) Tai Lieu Lien Quan
- `docs/guides/006_zalo_mini_app_integration_strategy.md`
- `docs/guides/008_zalo_mini_app_ops_runbook.md`
- `apps/web/sql/README.md`
