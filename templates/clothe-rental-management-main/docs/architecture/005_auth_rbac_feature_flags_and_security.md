# 005 - Auth, RBAC, Feature Flags, Security

## 1) Auth model
- Identity provider chính: Supabase Auth.
- Auth API source-of-truth nằm tại `apps/server`.
- `apps/web/src/app/api/auth/*` (nếu còn) chỉ là compatibility forwarding tạm thời.
- Support sign-in:
  - email/password
  - phone/password (service sẽ resolve phone -> customer/profile -> email trước khi sign-in).

## 2) Session token handling (web)
- Token extraction ưu tiên:
  1. Bearer token trong header.
  2. Supabase auth cookie (`sb-<project>-auth-token` + chunks).
- Session/token verification nghiệp vụ thực hiện tại `apps/server`.

## 3) Profile bootstrap & sync
- `auth.users` và `public.profiles` có thể lệch thời điểm tạo.
- Data-access ở `apps/server` có logic đảm bảo profile tồn tại khi cần.
- Dùng service role trong `apps/server` để upsert profile metadata khi phát hiện thiếu.

## 4) RBAC roles
- Vai trò hệ thống thường gặp:
  - `owner_admin`, `admin`, `manager`, `staff`, `accountant`, `makeup_artist`, `customer`.
- Enforcement ở nhiều tầng:
  - DB RLS policies (chính).
  - service-level guards/check (bổ sung).

## 5) Branch-scoped authorization
- Phần lớn nghiệp vụ quản trị bị scope theo `branch_id`.
- Helper functions trong DB (ví dụ `can_access_branch`) quyết định quyền đọc/ghi theo profile access.

## 6) Feature flags

### 6.1 DB-backed flags
- `public.system_settings` chứa cờ module (ví dụ mini app, makeup, shipping).
- Việc query flags phải đi qua `apps/server`; không query DB trực tiếp từ client runtime.

### 6.2 Env-backed flags
- `ENABLED_EMAIL_SENDER` / `NEXT_PUBLIC_ENABLED_EMAIL_SENDER`.
- Các cờ debug/perf (`ZALO_MINI_APP_DEBUG`, `PERF_OBS_LOG`, ...).

## 7) Zalo Mini App security paths
- CORS guard:
  - `apps/server` (API CORS policy)
  - `apps/web/middleware.ts` chỉ cho compatibility routes nếu còn dùng
- Header session custom:
  - `x-zalo-mini-app-session` / `x-mini-app-session`.
- Webhook secret:
  - `ZALO_MINI_APP_WEBHOOK_SECRET` (fallback từ app secret nếu cấu hình như vậy).

## 8) Security checklist cho release
- [ ] Service role key chỉ chạy server-side, không expose client.
- [ ] Chỉ `apps/server` truy cập Supabase DB.
- [ ] RLS policies test bằng nhiều role thực (owner_admin/manager/staff/customer).
- [ ] CORS allowlist đúng domain thực tế mini app.
- [ ] Feature flags ở `system_settings` nhất quán với env.
- [ ] Audit trail cho action nhạy cảm (huỷ đơn, settlement, status critical).

## 9) Các lỗi thực tế thường gặp và cách khoanh vùng
- Lỗi `permission denied for table system_settings`:
  - kiểm tra request đã đi qua `apps/server` hay chưa.
  - kiểm tra RLS/grant cho bảng `system_settings`.
  - kiểm tra API endpoint server đang dùng đúng server client.
- Mini app báo disabled dù DB bật:
  - kiểm tra API thật đang gọi vào môi trường nào (dev/prod).
  - kiểm tra server query bị fallback do permission hoặc table mismatch.
  - kiểm tra config cache và base URL ở mini app (`VITE_API_BASE_URL`).
