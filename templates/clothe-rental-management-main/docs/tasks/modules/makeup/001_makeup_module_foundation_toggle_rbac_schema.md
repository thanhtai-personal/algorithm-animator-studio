# Task 066 - Nền tảng module Makeup: toggle admin + RBAC + schema domain

## Input ban đầu
- Cần bổ sung module Makeup vào hệ thống hiện tại.
- Yêu cầu cốt lõi:
  - admin bật/tắt module makeup,
  - staff/admin/manager vận hành theo branch,
  - có tài khoản chuyên gia makeup xem lịch cá nhân,
  - chuẩn bị schema/API để task booking conflict ở bước sau.

## Mục tiêu
- Tạo foundation cho module Makeup đủ để các task booking/UI phía sau bám vào.
- Bổ sung toggle cấu hình module trong settings, có hiệu lực ở route + API.
- Bổ sung RBAC role và contract domain cho makeup events.

## Phụ thuộc
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/037_add_role_customer.md`
- `docs/tasks/047_owner_admin_role_protection_seed_only.md`
- `docs/tasks/060_shift_open_close_ui_standardization_and_admin_shift_management.md`

## Mapping màn hình/source
- Settings toggle + users role:
  - `apps/web/src/features/settings/components/**`
  - `apps/web/src/features/settings/hooks/**`
  - `apps/web/src/server/services/settingsService.ts`
  - `apps/web/src/server/data-access/settings.ts`
- Auth/RBAC:
  - `apps/web/src/types/showroomAuth.ts`
  - `apps/web/src/features/auth/utils/{permissions,routeAccess,authRedirect}.ts`
  - `apps/web/src/server/data-access/auth.ts`
- Makeup domain (new):
  - `apps/web/src/types/makeupModule.ts` (new)
  - `apps/web/src/server/data-access/makeup.ts` (new)
  - `apps/web/src/server/services/makeupService.ts` (new)
  - `apps/web/src/app/api/makeup/**` (new)
- SQL:
  - `apps/web/sql/026_makeup_module_core.sql` (new)
  - `apps/web/sql/README.md`

## Quy tắc nghiệp vụ bắt buộc
- Toggle module:
  - admin có thể bật/tắt `is_makeup_module_enabled` trong settings.
  - khi `false`, API mutation/create/update makeup trả lỗi module disabled (không xóa dữ liệu cũ).
- RBAC:
  - thêm role `makeup_artist`.
  - `makeup_artist` chỉ được xem lịch cá nhân.
  - `staff/manager/admin/owner_admin` được thao tác theo phạm vi branch (policy chi tiết sẽ làm ở task booking).
- Kiến trúc bắt buộc:
  - `Component -> Hook -> Query -> Service -> API/Supabase`.

## In-scope
- SQL migration cho makeup core:
  - role support cho `profiles.role` (thêm `makeup_artist`),
  - bảng `makeup_events` (core columns),
  - field toggle module trong `system_settings`.
- API/list contract nền tảng cho makeup events (read/list + create skeleton).
- Cập nhật settings UI để bật/tắt module.
- Cập nhật route guard + nav visibility theo toggle/role.

## Out-of-scope
- Full UI booking workflow của customer/staff.
- Conflict warning/override chi tiết khi trùng lịch.
- Calendar color warning.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tạo foundation cho module Makeup gồm toggle admin + RBAC + schema core.

Yêu cầu:
1) Thêm role `makeup_artist` vào RBAC contract.
2) Thêm flag `is_makeup_module_enabled` trong settings và wiring UI/API.
3) Tạo migration SQL core cho `makeup_events` + ràng buộc branch/user.
4) Tạo API/service/data-access nền cho makeup module theo kiến trúc chuẩn.
5) Khi module disabled, mutation makeup bị chặn có mã lỗi rõ ràng.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có migration SQL core cho makeup module + update SQL runbook.
- Admin bật/tắt module makeup được từ settings.
- API mutation makeup bị chặn khi module off.
- Role `makeup_artist` được nhận diện ở auth/RBAC và route guard.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Toggle module:
  - bật -> API makeup mutation hoạt động,
  - tắt -> API makeup mutation trả lỗi module disabled.
- Verify role matrix:
  - makeup_artist không thấy màn admin makeup board,
  - staff/admin thấy theo branch.
- Verify không có regression ở settings/users role hiện có.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 066 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 065 /a - [ ] 066 | Makeup module foundation: admin toggle + RBAC role + core schema/API contracts | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 066 |- [x] 066 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 066
  - Task file: docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
