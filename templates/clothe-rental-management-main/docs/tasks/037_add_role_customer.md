# Task 037 - Add Role `customer` (Signup Default + RBAC/Redirect)

## Input ban đầu
- Thiếu role khách hàng.
- User tự đăng nhập phải có role khách hàng mặc định.
- Admin có thể đổi role cho user khách hàng.
- User khách hàng không vào được dashboard page / POS page, chỉ vào được showroom.
- Role `staff` vào được showroom + POS, mặc định đẩy vào POS.
- Role `owner_admin` / `admin` / `manager` vào được các page vận hành, mặc định đẩy vào dashboard.
- Chỉ `owner_admin` + `admin` thấy màn hình settings; `manager` không thấy.

## Mục tiêu
- Bổ sung role nghiệp vụ `customer` xuyên suốt type, DB, API, auth routing và settings users.
- Chuẩn hóa landing + route guard theo role matrix mới, tránh lệch giữa login/callback/guard.
- Đảm bảo user signup/self-register có profile role `customer` ổn định, không rơi vào trạng thái "có auth user nhưng thiếu profile role".

## Phụ thuộc
- `docs/tasks/002_supabase_schema_showroom_core.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/019_auth_role_based_redirect_and_flow_completion.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`

## Tài liệu tham chiếu
- `AGENTS.md`
- `.mcp.full.md`
- `docs/000_authen-and-data-flow.md`
- `docs/test-case/auth-cases.md`

## Mapping màn hình/source
- Role/type/permission:
  - `apps/web/src/types/showroomAuth.ts`
  - `apps/web/src/features/auth/utils/permissions.ts`
- Redirect + route access:
  - `apps/web/src/features/auth/utils/authRedirect.ts`
  - `apps/web/src/features/auth/utils/routeAccess.ts`
  - `apps/web/src/features/auth/hooks/routing/useAuthRouting.ts`
  - `apps/web/src/server/services/localeService.ts`
- Signup/profile bootstrap:
  - `apps/web/src/server/services/authService.ts`
  - `apps/web/src/server/data-access/auth.ts`
  - `apps/web/src/features/auth/services/authBrowserService.ts`
  - `apps/web/src/features/auth/hooks/login/useAuthActions.ts`
- Settings users (đổi role):
  - `apps/web/src/server/services/settingsService.ts`
  - `apps/web/src/server/data-access/settings.ts`
  - `apps/web/src/features/settings/hooks/useSettingsUsersPage.ts`
  - `apps/web/src/features/settings/components/SettingsUsersPage.tsx`
- DB migration:
  - `apps/web/sql/009_add_customer_role.sql` (mới)
  - `apps/web/sql/README.md`

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm role `customer` theo chuẩn kiến trúc hiện tại và đồng bộ auth routing + settings.

Yêu cầu:
1) Data contract + role enum:
   - thêm `customer` vào role union/type dùng chung
   - cập nhật normalize role + permission mapping (customer không có quyền vận hành)

2) Signup default role:
   - user self-signup phải có profile role `customer`
   - xử lý cả case đã có auth.users nhưng thiếu profiles row (bootstrap/repair an toàn)
   - không làm mất invariants anon/offline hiện có

3) Role-based landing:
   - customer -> `/{locale}/showroom`
   - staff -> `/{locale}/sales/pos`
   - owner_admin/admin/manager -> `/{locale}/dashboard`

4) Route guard:
   - customer bị chặn dashboard + sales routes
   - staff được vào sales + showroom, bị chặn dashboard modules
   - manager vào dashboard/sales/showroom nhưng không có quyền settings/users.manage
   - owner_admin/admin có quyền settings/users.manage

5) Settings users:
   - admin đổi role sang/from `customer` được
   - validation branch assignment: customer có thể không cần branch; staff/manager/accountant vẫn áp dụng rule branch bắt buộc

6) DB migration:
   - nới `profiles.role` check constraint để nhận `customer`
   - đổi default role cho profile mới thành `customer` (nếu policy yêu cầu)
   - migration idempotent + có backfill an toàn cho dữ liệu thiếu profile/role

7) Kiến trúc bắt buộc:
   - Component -> Hook -> Query -> Service -> API/Supabase
   - không gọi service trực tiếp trong component
   - query fetch/mutation merge về store, UI đọc từ store
```

## Config cần chuẩn bị trước khi chạy task
- Chốt naming canonical role:
  - dùng `customer` (không dùng alias `guest` cho cloud user).
- Chốt policy branch cho customer:
  - khuyến nghị: `customer` không bắt buộc `default_branch_id` và `profile_branch_access`.
- Chốt strategy bootstrap profile khi signup:
  - khuyến nghị: server-side repair an toàn khi load auth context nếu thiếu profile.
- Chốt migration thứ tự:
  - chạy sau `008_products_media_fields.sql`.

## Role matrix (mục tiêu cuối)
- `customer`:
  - landing: `/showroom`
  - access: showroom
  - deny: dashboard modules, sales modules
  - permissions: tất cả `false`
- `staff`:
  - landing: `/sales/pos`
  - access: showroom + sales
  - deny: dashboard modules
- `manager`:
  - landing: `/dashboard`
  - access: dashboard + sales + showroom
  - deny: settings/users.manage
- `owner_admin` + `admin`:
  - landing: `/dashboard`
  - access: full modules
  - allow: settings/users.manage

## In-scope
- Bổ sung role `customer` trong type/permissions/route guard/redirect.
- Đồng bộ signup/profile bootstrap để user self-register có role `customer`.
- Cập nhật settings users cho phép quản trị role `customer`.
- SQL migration cho `profiles.role` constraint/default liên quan role mới.

## Out-of-scope
- Thiết kế lại UX auth screen.
- Bổ sung module đặt hàng online cho customer.
- Thay đổi quyền nghiệp vụ sâu ngoài matrix nêu trên.

## Done criteria (coding)
- `customer` xuất hiện trong role contract và không gây lỗi type/runtime.
- Self-signup tạo được user vào showroom và có profile role `customer` (không bị null-role lâu dài).
- Customer truy cập trực tiếp `/{locale}/dashboard` hoặc `/{locale}/sales/*` bị redirect về `/{locale}/showroom`.
- Staff login vào `/{locale}/sales/pos`.
- Admin/manager login vào `/{locale}/dashboard`.
- Settings users cho phép admin đổi role user sang `customer` và ngược lại theo validation đã chốt.
- Manager không thấy/không truy cập được settings pages; owner_admin/admin truy cập được.

## Nhắc test nhanh
- Manual auth matrix:
  - signup user mới -> landing showroom
  - login customer -> showroom
  - login staff -> sales/pos
  - login manager -> dashboard
  - login owner_admin/admin -> dashboard
- Manual direct-route guard:
  - customer vào `/dashboard`, `/sales/pos` -> redirect showroom
  - staff vào `/dashboard` -> redirect sales/pos hoặc home role path
  - manager vào `/settings/*` -> bị chặn theo policy
- Manual settings:
  - admin đổi role user: customer <-> staff/manager/accountant
  - kiểm tra rule branch assignment theo role
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 037 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 036 /a - [ ] 037 | Add role customer (signup default + redirect + RBAC) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 037 |- [x] 037 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 037
  - Task file: docs/tasks/037_add_role_customer.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
