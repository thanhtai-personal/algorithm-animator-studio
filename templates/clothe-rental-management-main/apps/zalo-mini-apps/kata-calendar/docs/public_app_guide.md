# Hướng Dẫn Public App (KATA Calendar Mini App)

Tài liệu hướng dẫn đưa `apps/zalo-mini-apps/kata-calendar` lên production để mở trong Zalo.

Phạm vi app:
- Chỉ hiển thị lịch makeup đã đặt.
- Chỉ cho phép truy cập khi tài khoản mini app map vào profile có role:
  - `owner_admin` / `manager` (nhóm admin)
  - `makeup_artist`

## 1) Backend cần có
Các API mini app calendar:
- `GET /api/v1/zalo-mini-app/makeup/access`
- `GET /api/v1/zalo-mini-app/makeup/events`

Các API này kiểm tra:
1. Header session `x-zalo-mini-app-session` hợp lệ.
2. Identity map được vào profile nội bộ.
3. Role thuộc nhóm được phép xem lịch.

## 2) ENV backend (`apps/server`)
Trong `.env.production` cần đảm bảo:

```bash
ZALO_MINI_APP_ALLOWED_DOMAINS=<mini-app-domain>,<web-domain>
```

Nếu test local cổng `5177`, backend đã cho phép CORS dev port `5177`.

## 3) Build + deploy mini app
```bash
cd apps/zalo-mini-apps/kata-calendar
npm ci
npm run lint
npm run typecheck
npm run build
npm run deploy -- --testing -m "kata-calendar testing"
npm run deploy -- -m "kata-calendar release"
```

## 4) Publish trong Zalo Console
1. Chọn version release vừa deploy.
2. Submit review.
3. Khi approved, publish public.

## 5) Smoke test
1. Mở app trong Zalo.
2. Đăng nhập Zalo.
3. Kiểm tra role hợp lệ:
   - thấy lịch tháng + lịch theo ngày.
4. Kiểm tra role không hợp lệ:
   - thấy thông báo không có quyền truy cập.
