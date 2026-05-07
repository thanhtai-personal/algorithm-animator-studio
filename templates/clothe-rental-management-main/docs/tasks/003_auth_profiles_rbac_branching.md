# Task 003 - Auth + Profiles + RBAC + Branch Context

## Mục tiêu
- Nâng auth hiện có (đã clone từ template finance) thành auth nền cho showroom: profile, role, branch, guard theo quyền.
- Giữ invariants auth/anonymous/offline từ source base/template.

## Phụ thuộc
- `docs/tasks/002_supabase_schema_showroom_core.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 2, 4.1, 5.2, 11)
- `docs/001_wireframe.md` (Sections 0.4, 1, 2, 11.3)
- `templates/my-money-cloud-main/docs/000_authen-and-data-flow.md`
- `templates/my-money-cloud-main/docs/test-case/auth-cases.md`

## Hiện trạng cần lưu ý
- `apps/web` đã có `/auth`, `/auth/callback`, guest sign-in, basic auth bootstrap
- Chưa có `profiles`/RBAC/branch-aware guard cho showroom modules
- PRD yêu cầu data isolation theo branch + role
- Wireframe mục tiêu cần User menu, branch selector, role-based actions

## Prompt gợi ý cho Codex
```text
Mục tiêu: mở rộng auth foundation hiện tại để hỗ trợ profiles + RBAC + branch context cho app showroom, nhưng vẫn giữ guest/anon/offline invariants của source base.

Yêu cầu:
1) Thêm server/client contract cho profile hiện tại:
   - profile gồm id/auth_user_id, full_name, role, branch_id, locale, active
   - API/service/query để fetch profile sau login/refresh
2) Refactor auth bootstrap (nếu cần) theo kiến trúc Component -> Hook -> Query -> Service
   - merge profile/permissions vào store
   - không render UI trực tiếp từ query result
3) Bổ sung guard utilities:
   - route-level auth required
   - permission checks cho action-level (staff/manager/admin)
   - include permission cho `payments` manual status transition (Admin-only trong MVP)
4) Giữ và kiểm thử invariants:
   - anonymous mode vẫn vào được app (theo policy MVP nếu cho phép)
   - không silent data loss khi anon -> existing account
   - logout khi còn pending offline queue phải có cảnh báo
5) Chuẩn bị auth state cho locale + branch selector (dùng ở task app shell)
6) Ghi rõ quyết định MVP:
   - guest có được vào **admin modules** hay chỉ auth testing?
   - guest/public có được vào `/{locale}/showroom` (customer showroom page) không? (khuyến nghị: có, read-only)

Không thêm onboarding route; nếu cần profile/setup completion thì dùng flag/profile fields nhưng không tạo flow onboarding cũ.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt role enum map DB -> client labels:
  - `OWNER_ADMIN`, `MANAGER`, `STAFF`, `ACCOUNTANT` (nếu dùng)
- Chốt guest policy cho showroom:
  - `A) cấm guest vào dashboard/admin modules` (khuyến nghị cho admin app)
  - `B) cho guest demo read-only`
- Chốt public showroom page policy:
  - `A) public/guest xem được` (khuyến nghị)
  - `B) bắt buộc login khách` (không khuyến nghị MVP)
- Chốt branch default cho admin seed
- Chốt field `profiles.locale` (`vi`/`en`)
- Chốt strategy lưu permission:
  - derive từ role ở client
  - document rõ `payments.update_status_manual` = Admin-only (MVP)

## In-scope
- Profile fetch + store integration
- RBAC utilities + guards
- Branch context state
- Auth regression checks

## Out-of-scope
- Full users management UI (task 015)
- Locale routing migration (task 004)

## Deliverables mong muốn
- `profiles` load sau login/refresh
- Permission helpers dùng lại được nhiều module
- Guard behavior documented

## Done criteria (coding)
- User khác role thấy đúng quyền action (ít nhất ở guard/helper tests/manual checks)
- Permission helper cover được rule payment manual status transition (Admin-only)
- Branch context có sẵn trong store/state
- Auth callback/login/sign-out hiện có không regress
- Không bypass warning path anon/offline logout

## Nhắc test nhanh
- Login email/password, Google, sign-out
- Guest -> sign-in path (manual regression)
- `npx eslint` + `npx tsc --noEmit` phạm vi auth/store/server


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 003 |- [x] 003 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 003
  - Task file: docs/tasks/003_auth_profiles_rbac_branching.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
