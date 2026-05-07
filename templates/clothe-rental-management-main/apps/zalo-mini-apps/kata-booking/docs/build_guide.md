# Huong Dan Build Zalo Mini App

Tai lieu nay mo ta cach build app `apps/zalo-mini-apps/kata-booking` de test va deploy.
Client nay duoc build bang Vite (static output trong thu muc `www/`).

## 1) Prerequisites
- Node.js 18+ va npm.
- Backend `apps/server` da setup module Zalo Mini App.
- Da co gia tri `VITE_NEST_API_BASE_URL` tro den Nest API.

Neu chay trong WSL voi `nvm`:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

## 2) ENV cho build
Bat buoc:

```bash
VITE_NEST_API_BASE_URL=http://localhost:3056
```

Compatibility fallback (khuyen nghi giu trong migration window):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

Co 2 cach truyen ENV:

1. Tao file `apps/zalo-mini-apps/kata-booking/.env` (dev) hoac `.env.production` (prod).
2. Truyen truc tiep truoc lenh build.

Vi du build production bang env inline:

```bash
cd apps/zalo-mini-apps/kata-booking
VITE_NEST_API_BASE_URL=https://kata-center-api.vercel.app VITE_API_BASE_URL=https://your-web-domain.com npm run build
```

## 3) Build local smoke
Chay tu thu muc app:

```bash
cd apps/zalo-mini-apps/kata-booking
npm install
npm run lint
npm run typecheck
npm run build
```

Ket qua thanh cong:
- Khong co lint/typecheck error.
- Build tao ra thu muc `apps/zalo-mini-apps/kata-booking/www`.

## 4) Preview ban build
Sau khi build, preview local:

```bash
cd apps/zalo-mini-apps/kata-booking
npm run preview -- --host 0.0.0.0 --port 4176
```

Mo trinh duyet: `http://localhost:4176`

## 5) Build cho CI/CD
Mau script:

```bash
cd apps/zalo-mini-apps/kata-booking
npm ci
npm run lint
npm run typecheck
npm run build
```

Artifact can deploy: toan bo noi dung thu muc `www/`.

## 6) Deploy checklist (Zalo Mini App)
1. Deploy `www/` len static host co HTTPS.
2. Dam bao `VITE_NEST_API_BASE_URL` tro den backend dung environment.
3. Tren backend `apps/server`, bat feature flag `is_zalo_mini_app_enabled` neu san sang release.
4. Dong bo cau hinh callback/webhook tren Zalo Console:
   - `/api/v1/zalo-mini-app/payment/callback`
   - `/api/v1/zalo-mini-app/webhooks`
5. Dong bo `ZALO_MINI_APP_ALLOWED_DOMAINS` tren `apps/server` dung voi domain su dung thuc te.

## 7) Su co thuong gap
- UI hien "Mini app dang duoc tat boi feature flag":
  - Kiem tra `system_settings.is_zalo_mini_app_enabled`.
- Loi goi API / network:
  - Kiem tra `VITE_NEST_API_BASE_URL`.
  - Kiem tra backend `apps/server` dang chay.
- `openPayment` khong mo payment khi test local:
  - Binh thuong khi khong chay trong runtime Zalo that (mock mode).

## 8) Tai lieu lien quan
- `apps/zalo-mini-apps/kata-booking/README.md`
- `docs/guides/007_zalo_mini_app_setup.md`
- `docs/guides/008_zalo_mini_app_ops_runbook.md`
- `docs/guides/006_zalo_mini_app_integration_strategy.md`
