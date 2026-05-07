# Zalo Mini App Commerce Client

Client cho kenh Zalo Mini App trong monorepo My Money Cloud.
App nay tap trung vao UI + SDK bridge; business logic source-of-truth o `apps/server` qua endpoint contract `api/v1/**`.

## 1) Muc tieu module
- Mo kenh ban hang/checkout tren Zalo Mini App.
- Tai su dung he thong auth/commerce/payment backend hien co.
- Giu kien truc nhat quan:
  - `Component -> Hook -> Query -> Service -> API`
  - store-first hydration (React Query lay du lieu, MobX store so huu state UI).

## 2) Tinh nang da co trong app

### 2.1 Platform bootstrap + feature flag gate
- Goi `GET /api/v1/zalo-mini-app/config` de lay runtime config.
- Chan toan bo flow khi `enabled=false` (feature flag tat).
- Hien thi trang thai SDK:
  - `supported` khi chay trong runtime Zalo
  - `mock mode` khi chay local ngoai Zalo.

### 2.2 Zalo SDK adapter (co fallback mock)
- Adapter tap trung tai `src/features/platform/services/zaloSdkService.ts`.
- Ho tro cac ham:
  - `authorize`
  - `getAccessToken`
  - `getUserInfo`
  - `openPayment`
  - `showOAWidget`
- Khi khong co runtime Zalo that, app tra mock token/user de test UI/API flow.

### 2.3 Auth mini app session
- Nut "Dang nhap voi Zalo" thuc hien:
  1. authorize + lay access token tu SDK
  2. lay user info tu SDK
  3. tao session backend qua `POST /api/v1/zalo-mini-app/auth/session`
- Session token duoc luu localStorage de giu trang thai dang nhap.
- Ho tro "Dang xuat" (xoa session token local).

### 2.4 Catalog + cart
- Lay catalog tu `GET /api/showroom/products` (hien tai lay danh sach chung).
- Map du lieu sang DTO mini app roi hydrate vao MobX store.
- Them/xoa san pham trong gio, tinh tong tam tinh ngay tren client.

### 2.5 Order draft
- Tao don nhap tu gio hang qua `POST /api/v1/zalo-mini-app/orders/draft`.
- Co truong ghi chu don.
- Co query doc lai draft theo `draftId` qua:
  - `GET /api/v1/zalo-mini-app/orders/draft?draftId=...`

### 2.6 Checkout + payment flow
- Luong checkout:
  1. tao draft neu chua co
  2. tao payment order: `POST /api/v1/zalo-mini-app/payment/create-order`
  3. goi `openPayment` qua Zalo SDK
  4. check trang thai giao dich:
     - `GET /api/v1/zalo-mini-app/payment/check-transaction?externalOrderId=...`
- Hien thi `externalOrderId` va status giao dich tren UI.

### 2.7 OA support
- Mo OA widget ho tro tu config `oaId`:
  - goi `showOAWidget` qua SDK adapter.

### 2.8 Makeup booking (clone tu web product page)
- Co section dat lich makeup ngay trong mini app:
  - nhap cau lenh text -> parse -> do du lieu vao form xac nhan.
- Parse booking qua API:
  - `POST /api/v1/makeup/events/parse`
- Tao lich makeup qua public flow:
  - `POST /api/v1/makeup/events` voi `requestAsPublic=true`.
- Co luong canh bao trung lich va nut confirm override de luu lai.
- Co month-view calendar de theo doi cac lich vua tao trong phien mini app.

## 3) Nang luc backend module da san sang (apps/server)
- Payment callback endpoint:
  - `POST /api/v1/zalo-mini-app/payment/callback`
- Webhook endpoint:
  - `POST /api/v1/zalo-mini-app/webhooks`
- Signature verify cho callback/webhook (`x-zalo-signature`).
- Idempotency xu ly su kien duplicate.
- Co bo bang du lieu rieng cho mini app:
  - identities, sessions, order drafts, payment transactions, webhook events.

Chi tiet setup/ops:
- `docs/guides/007_zalo_mini_app_setup.md`
- `docs/guides/008_zalo_mini_app_ops_runbook.md`
- `docs/guides/006_zalo_mini_app_integration_strategy.md`

## 4) Cau truc thu muc chinh
```text
src/
  features/
    platform/   # config gate, SDK bridge, bootstrap
    auth/       # login Zalo + tao mini app session
    products/   # catalog query + store
    cart/       # gio hang state
    orders/     # tao/doc order draft
    checkout/   # create payment order + check transaction
    support/    # OA widget support
  lib/
    contracts.ts
    httpClient.ts
```

## 5) Chay local

### 5.1 Chay backend truoc
```bash
cd apps/web
npm install
npm run dev
```

Dam bao da setup SQL + ENV + feature flag theo:
- `docs/guides/007_zalo_mini_app_setup.md`

### 5.2 Chay mini app client
```bash
cd apps/zalo-mini-apps/kata-booking
npm install
npm run dev
```

Hoac chay theo Zalo CLI:
```bash
cd apps/zalo-mini-apps/kata-booking
npm run start
```

Mac dinh Vite chay o:
- `http://localhost:5176`

## 6) ENV client
Tao `apps/zalo-mini-apps/kata-booking/.env`:

```bash
VITE_NEST_API_BASE_URL=http://localhost:3056
VITE_API_BASE_URL=http://localhost:3000
```

`VITE_NEST_API_BASE_URL` la key chuan cho Nest API.
`VITE_API_BASE_URL` duoc giu lam fallback compatibility cho endpoint legacy chua cutover (hien tai: `/api/showroom/products`).
Neu khong khai bao, app dung default `http://localhost:3000`.
`branchId` cho booking public duoc backend tu resolve theo branch mac dinh da seed (uu tien showroom default).

## 7) Validation nhanh
Trong `apps/zalo-mini-apps/kata-booking`:

```bash
npm run lint
npm run typecheck
npm run build
```

Tai lieu build chi tiet:
- `apps/zalo-mini-apps/kata-booking/docs/build_guide.md`
- `apps/zalo-mini-apps/kata-booking/docs/public_app_guide.md`

## 8) Ghi chu pham vi hien tai
- Catalog hien tai chua co UI filter/phan trang nang cao theo branch.
- Khi tao draft ma khong truyen `branchId`, backend tu fallback branch phu hop.
- SDK token verify voi Open API Zalo that chua duoc wiring day du trong luong local mock.
- Makeup booking mini app hien uu tien text input (voice parser web chua port sang mini app).
- Khong bao gio dua `appSecret` len client.
