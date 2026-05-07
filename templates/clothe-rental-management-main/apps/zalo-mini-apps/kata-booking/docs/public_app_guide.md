# Huong Dan Public App (KATA Booking Mini App)

Tai lieu nay huong dan dua `apps/zalo-mini-apps/kata-booking` len production de nguoi dung mo Zalo va tim thay Mini App.

Pham vi:
- Mini App hien tai chi giu flow form dat lich makeup.
- Voice input -> tu dong phan tich -> do du lieu da nhan dien vao form -> user bo sung field con thieu -> luu lich.

## 1) Tong quan release
De app "tim duoc trong Zalo", can du 2 lop:
1. Deploy code mini app len Zalo Platform (bang `zmp deploy`).
2. Submit version de duyet va publish trong Zalo Mini App Console.

Luu y:
- Chi deploy backend web (Vercel) la chua du.
- Chi deploy mini app o che do testing thi user ben ngoai van co the khong tim thay qua search.

## 2) Prerequisites
- Node.js 18+.
- Da co Zalo Mini App da tao trong console.
- Da login CLI thanh cong (`npm run login`).
- Da setup SQL theo tai lieu:
  - `docs/guides/007_zalo_mini_app_setup.md`
- Da co `branchId` hop le cho flow luu lich.

## 3) Backend production setup (`apps/server`)

### 3.1 ENV can co
Trong `apps/server/.env.production`, dam bao it nhat:

```bash
NEST_API_BASE_URL=https://<api-domain>
ZALO_MINI_APP_RELEASE_CHANNEL=production
ZALO_MINI_APP_ALLOWED_DOMAINS=<mini-app-runtime-domain>,<web-domain>,<api-domain>
```

### 3.2 Feature flag
Bat module mini app tren DB:

```sql
update public.system_settings
set is_zalo_mini_app_enabled = true;
```

### 3.3 Verify backend
Sau khi deploy API:

```bash
curl -s https://<api-domain>/api/v1/zalo-mini-app/config
```

Ky vong:
- `enabled=true`
- co `apiBaseUrl`
- co `releaseChannel=production`

## 4) Mini app production setup (`kata-booking`)

### 4.1 ENV production
Trong `apps/zalo-mini-apps/kata-booking/.env.production`:

```bash
VITE_NEST_API_BASE_URL=https://kata-center-api.vercel.app
VITE_API_BASE_URL=https://<web-domain>
```

Luu y:
- `branchId` cua booking public duoc backend tu resolve theo du lieu seed SQL.
- Thu tu fallback: showroom default (`showrooms.is_default = true`) -> showroom active dau tien -> branch active dau tien.

### 4.2 Build + typecheck
```bash
cd apps/zalo-mini-apps/kata-booking
npm ci
npm run lint
npm run typecheck
npm run build
```

## 5) Deploy mini app len Zalo Platform
Dung CLI de deploy version:

```bash
cd apps/zalo-mini-apps/kata-booking
npm run deploy -- --testing -m "testing build"
npm run deploy -- -m "production release"
```

Ghi chu:
- `--testing`: deploy ban test.
- Khong dung `--testing`: deploy ban release de submit duyet/publish.
- `zmp deploy` su dung artifact build (mac dinh thu muc `www`).

## 6) Submit duyet va publish trong Zalo Console
Sau khi deploy release:
1. Vao Zalo Mini App Console.
2. Chon version vua deploy.
3. Dien day du metadata: ten app, icon, mo ta, category, privacy/terms, OA lien ket.
4. Submit review.
5. Khi duoc duyet, chuyen sang trang thai public.

Chi sau buoc nay app moi co kha nang duoc tim kiem tren Zalo.

## 7) Dieu kien de user tim thay app tren Zalo
- App da duoc duyet va dang o trang thai public.
- OA/app dat yeu cau xac thuc theo chinh sach hien hanh.
- Co the mo app qua:
  - Tim kiem tren Zalo
  - Link Mini App
  - QR code Mini App

Luu y moc thoi gian chinh sach:
- Tu ngay 15/10/2025: Zalo yeu cau KYB cho mini app theo chinh sach cong bo.
- Sau ngay 31/12/2025: app chua xac thuc co the bi han che khong hien thi/rang buoc phat hanh.

## 8) Smoke test truoc khi mo rong user
Chay test tren runtime that:
1. Mo mini app trong Zalo.
2. Noi 1 cau lenh dat lich.
3. Xac nhan app tu phan tich va do du lieu nhan dien duoc vao form.
4. Tu bo sung field con thieu.
5. Bam `Luu lich`.
6. Kiem tra backend da tao lich thanh cong.

Test them:
- Parse text thu cong (khong voice).
- Truong hop trung lich (co warning va luong confirm override neu backend tra conflict).
- Truong hop CORS (OPTIONS/GET `/api/v1/zalo-mini-app/config` phai 200/204, khong 403).

## 9) Su co thuong gap
- Khong tim thay app tren Zalo:
  - Dang o ban testing, chua publish production.
  - Version chua duoc duyet.
  - Chua hoan tat xac thuc/KYB.
  - Search sai tu khoa (thu dung dung ten app trong console hoac mo bang link/QR).
- CORS 403:
  - `ZALO_MINI_APP_ALLOWED_DOMAINS` chua dung origin runtime that.
  - Backend chua deploy env moi sau khi doi config.
  - Cach tim origin/runtime link khi mo trong Zalo:
    1. Mo mini app trong Zalo devtools, chay:
       - `window.location.origin`
       - `window.location.href`
    2. Xem log backend (Vercel) voi key `[mini-app-cors] preflight blocked` de lay `origin`/`referer` that.
    3. Them domain vua lay vao `ZALO_MINI_APP_ALLOWED_DOMAINS` (co the dung wildcard nhu `*.zdn.vn` neu can), redeploy backend.
- Voice xong nhung khong auto phan tich:
  - Kiem tra flow callback sau stop voice co goi parse API.
  - Kiem tra runtime co cap quyen microphone.

## 10) Rollback nhanh
Neu can tam dung public:
1. Tat feature flag:
   ```sql
   update public.system_settings
   set is_zalo_mini_app_enabled = false;
   ```
2. Deploy lai mini app version on dinh truoc do.
3. Giu callback/webhook endpoint hoat dong de tranh mat su kien dang tre.

## 11) Tai lieu lien quan
- `apps/zalo-mini-apps/kata-booking/docs/build_guide.md`
- `docs/guides/007_zalo_mini_app_setup.md`
- `docs/guides/008_zalo_mini_app_ops_runbook.md`
- `docs/guides/006_zalo_mini_app_integration_strategy.md`
