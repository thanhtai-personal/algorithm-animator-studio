# Hướng Dẫn Build KATA Calendar Mini App

Tài liệu mô tả cách build app `apps/zalo-mini-apps/kata-calendar` để test và deploy.
Client được build bằng Vite (output ở thư mục `www/`).

## 1) Prerequisites
- Node.js 18+ và npm.
- Backend `apps/server` đã deploy/chạy local.
- Có `VITE_NEST_API_BASE_URL` trỏ đúng về Nest API.

## 2) ENV
Bắt buộc:

```bash
VITE_NEST_API_BASE_URL=http://localhost:3056
```

Compatibility fallback trong migration window:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

Có thể đặt trong:
- `apps/zalo-mini-apps/kata-calendar/.env` (dev)
- `apps/zalo-mini-apps/kata-calendar/.env.production` (prod)

## 3) Build local
```bash
cd apps/zalo-mini-apps/kata-calendar
npm install
npm run lint
npm run typecheck
npm run build
```

Kết quả:
- Không có lỗi lint/typecheck.
- Tạo thư mục `apps/zalo-mini-apps/kata-calendar/www`.

## 4) Chạy local bằng ZMP CLI
```bash
cd apps/zalo-mini-apps/kata-calendar
npm run start
```

Mặc định app chạy cổng `5177`.

## 5) Build cho CI/CD
```bash
cd apps/zalo-mini-apps/kata-calendar
npm ci
npm run lint
npm run typecheck
npm run build
```

Artifact deploy: toàn bộ thư mục `www/`.
