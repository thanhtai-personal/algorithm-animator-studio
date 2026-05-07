# Task 070 - Gói makeup: admin + chuyên viên tạo/setup

## Input ban đầu
- Cần bổ sung module quản lý gói makeup.
- Admin và chuyên viên makeup đều có thể tạo/setup gói makeup.
- Gói makeup cần dùng lại được khi tạo booking để chuẩn hóa giá/cost dịch vụ.

## Mục tiêu
- Bổ sung domain `makeup_packages` cho vận hành makeup.
- Cho phép admin và makeup_artist quản lý gói makeup theo policy.
- Liên kết package vào booking makeup để phục vụ thống kê sau này.

## Phụ thuộc
- `docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
- `docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md`
- `docs/tasks/modules/makeup/004_makeup_admin_artist_directory_and_schedule_visibility.md`

## Mapping màn hình/source
- Routes/UI:
  - `apps/web/src/app/[locale]/makeup/packages/page.tsx` (new)
  - `apps/web/src/features/makeup/components/MakeupPackagesPage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupPackagesPage.ts` (new)
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts`
  - `apps/web/src/features/makeup/services/makeupClientService.ts`
- Backend:
  - `apps/web/src/server/data-access/makeup.ts`
  - `apps/web/src/server/services/makeupService.ts`
  - `apps/web/src/app/api/makeup/packages/route.ts` (new)
  - `apps/web/src/app/api/makeup/packages/[packageId]/route.ts` (new)
- Types/SQL:
  - `apps/web/src/types/makeupModule.ts`
  - `apps/web/sql/027_makeup_packages_core.sql` (new)
  - `apps/web/sql/README.md`

## Quy tắc nghiệp vụ bắt buộc
- Package makeup tối thiểu gồm:
  - `code`, `name`, `durationMinutes`, `priceAmount`, `costAmount`, `isActive`, `description`.
- RBAC:
  - `admin/manager/owner_admin`: full CRUD package theo branch.
  - `makeup_artist`: được tạo/sửa package theo policy branch (không vượt branch scope).
- Booking makeup có thể gắn `packageId`.
- Khi module makeup tắt thì mutation package bị chặn theo policy module disabled.

## In-scope
- SQL migration + DTO/API CRUD cho `makeup_packages`.
- UI danh sách/tạo/sửa/active-toggle package.
- Gắn package vào create/update booking payload (optional ở MVP).
- Validate non-negative cho `priceAmount`, `costAmount`.

## Out-of-scope
- Versioning package phức tạp (effective-date, historical pricing matrix).
- Discount/coupon engine cho makeup packages.
- Thanh toán online cho makeup package.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm quản lý gói makeup cho admin + makeup_artist và liên kết package vào booking.

Yêu cầu:
1) Tạo schema/API/UI CRUD cho makeup_packages.
2) RBAC: admin full branch; makeup_artist được setup package theo policy branch.
3) Booking makeup nhận packageId (optional).
4) Validate duration/price/cost hợp lệ, không âm.
5) Chặn mutation package khi module makeup disabled.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có migration SQL cho `makeup_packages` + update runbook.
- Admin/makeup_artist thao tác package thành công theo quyền.
- Booking payload hỗ trợ `packageId`.
- Module off vẫn chặn mutation package đúng policy.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Login admin:
  - tạo/sửa/tắt gói makeup theo branch thành công.
- Login makeup_artist:
  - tạo/sửa package theo phạm vi cho phép, không vượt branch scope.
- Tạo booking có packageId:
  - lưu thành công và đọc lại đúng package.
- Tắt module makeup:
  - mutation package trả lỗi module disabled.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 070 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 069 /a - [ ] 070 | Makeup packages: admin + makeup_artist create/setup CRUD and booking package binding | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 070 |- [x] 070 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 070
  - Task file: docs/tasks/modules/makeup/005_makeup_packages_setup_admin_and_artist.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
