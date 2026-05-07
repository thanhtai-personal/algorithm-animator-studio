# Task 047 - Bảo vệ role owner_admin (seed-only + immutable)

## Input ban đầu
- Không cho phép set role `owner_admin` từ UI/API vận hành.
- Role `owner_admin` chỉ được tạo qua seeding script.
- User đang có role `owner_admin` không thể bị đổi role.

## Bối cảnh hiện tại
- Hệ thống có RBAC theo `profiles.role` và có các luồng quản lý user/role trong dashboard settings.
- Nếu không khóa chặt `owner_admin`, có rủi ro:
  - tự nâng quyền qua API/update profile;
  - hạ cấp nhầm tài khoản chủ hệ thống;
  - tạo nhiều `owner_admin` ngoài quy trình seed.

## Mục tiêu
- Đảm bảo `owner_admin` là role đặc biệt, chỉ xuất hiện qua script seed/migration có kiểm soát.
- Chặn tuyệt đối việc gán/chuyển role `owner_admin` trong runtime API/UI.
- Chặn việc đổi role của chính tài khoản đang là `owner_admin`.

## Phụ thuộc
- `docs/tasks/002_supabase_schema_showroom_core.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`

## Mapping màn hình/source
- Settings users/roles UI + hooks/queries/services:
  - `apps/web/src/features/settings/**`
- Auth + role permission resolution:
  - `apps/web/src/features/auth/**`
  - `apps/web/src/server/services/authService.ts`
  - `apps/web/src/server/data-access/auth.ts`
- User/role update API:
  - `apps/web/src/app/api/**` (routes liên quan users/profiles/roles)
  - `apps/web/src/server/services/**`
  - `apps/web/src/server/data-access/**`
- Seed scripts:
  - `apps/web/sql/001_seed_admin_account.sql`
  - `apps/web/sql/003_seed_showroom_bootstrap.sql`
  - các script seed liên quan profiles/roles khác.

## Quy tắc nghiệp vụ bắt buộc
- Runtime API/UI:
  - Không cho set `toRole = owner_admin` trong mọi API update role.
  - Không cho update role của user hiện có `role = owner_admin`.
  - Trả lỗi domain rõ ràng (ví dụ: `OWNER_ADMIN_ROLE_IS_SEED_ONLY`, `OWNER_ADMIN_ROLE_IMMUTABLE`).
- UI settings users:
  - Ẩn `owner_admin` khỏi dropdown role.
  - Với user có role `owner_admin`, disable/ẩn action đổi role.
  - Hiển thị thông điệp localize rõ ràng nếu API trả lỗi chặn.
- DB/RLS (nếu cần):
  - Bổ sung guard ở tầng SQL function/trigger/policy để không phụ thuộc UI.
  - Guard phải cho phép seed/migration context (service role/seed path) theo thiết kế đã chọn.
- Seed:
  - Giữ khả năng tạo `owner_admin` qua script seed.
  - Không tạo thêm `owner_admin` mới từ flow onboarding/CRUD runtime.

## In-scope
- Bổ sung guard ở API/service/data-access cho update role.
- Bổ sung guard ở UI settings users/roles.
- Chuẩn hóa error code + localize message cho lỗi role `owner_admin`.
- Cập nhật test/QA checklist cho các path thăng quyền/hạ quyền liên quan.

## Out-of-scope
- Thiết kế lại toàn bộ RBAC model.
- Thay đổi cấu trúc role ngoài phạm vi `owner_admin`.
- Tự động migrate dữ liệu role lịch sử nếu không có yêu cầu business riêng.

## Prompt gợi ý cho Codex
```text
Mục tiêu: khóa role owner_admin thành seed-only và immutable trong runtime.

Yêu cầu:
1) API/service/data-access:
   - chặn mọi request set role owner_admin từ runtime.
   - chặn đổi role của user đang là owner_admin.
   - trả error code domain rõ ràng + status phù hợp.

2) UI settings users:
   - ẩn owner_admin khỏi role selector.
   - user role owner_admin không có action đổi role.
   - localize message khi backend từ chối.

3) DB guard (nếu cần):
   - thêm guard trigger/function/policy để tránh bypass API.
   - vẫn cho phép seed script tạo owner_admin.

4) Validation:
   - test API update role: staff->owner_admin bị chặn.
   - test API update role: owner_admin->admin/staff bị chặn.
   - test seed path vẫn tạo được owner_admin.

5) Validation commands:
   - cd apps/web && npm run typecheck
   - cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không còn đường runtime nào set role `owner_admin`.
- Không thể đổi role của tài khoản `owner_admin`.
- UI settings users phản ánh đúng rule (ẩn/disable).
- Error code + localize text đầy đủ.
- Seed script vẫn tạo được `owner_admin`.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- API role update:
  - `admin/manager/staff -> owner_admin` => bị chặn.
  - `owner_admin -> admin/manager/staff` => bị chặn.
- UI settings users:
  - không thấy option `owner_admin` trong selector.
  - row user `owner_admin` không bấm đổi role được.
- Seed:
  - chạy seed trên môi trường sạch vẫn có đúng user `owner_admin` khởi tạo.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 047 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 046 /a - [ ] 047 | Protect owner_admin role: seed-only assignment + immutable role updates | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 047 |- [x] 047 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 047
  - Task file: docs/tasks/047_owner_admin_role_protection_seed_only.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
