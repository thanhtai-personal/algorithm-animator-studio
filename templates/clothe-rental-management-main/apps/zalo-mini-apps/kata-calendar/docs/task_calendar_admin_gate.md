# Task: Calendar Admin Gate Cho KATA Calendar

## Mục tiêu
Chuyển `kata-calendar` sang màn hình lịch đã đặt, chỉ cho phép user có role admin hoặc chuyên viên makeup truy cập.

## Task Breakdown
1. [x] Dựng lại source app `apps/zalo-mini-apps/kata-calendar` (Vite + React + React Query).
2. [x] Thêm flow đăng nhập mini app bằng Zalo authorize + tạo session backend.
3. [x] Thêm API backend mini app cho calendar:
   - [x] `GET /api/v1/zalo-mini-app/makeup/access`
   - [x] `GET /api/v1/zalo-mini-app/makeup/events`
4. [x] Áp quyền truy cập calendar: chỉ `owner_admin`/`manager`/`makeup_artist`.
5. [x] Clone giao diện lịch tháng theo màn calendar admin makeup (read-only):
   - [x] điều hướng tháng
   - [x] grid theo ngày
   - [x] danh sách lịch trong ngày
6. [x] Cập nhật CORS local dev cho cổng app `5177`.
7. [x] Cập nhật tài liệu build/public cho `kata-calendar`.
8. [x] Chạy validate:
   - [x] `apps/web`: typecheck + eslint file đổi
   - [x] `apps/zalo-mini-apps/kata-calendar`: lint + typecheck + build
