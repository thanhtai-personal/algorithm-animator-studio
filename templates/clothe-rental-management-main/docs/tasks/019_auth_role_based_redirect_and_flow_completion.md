# Task 019 - Auth Role-based Redirect & Flow Completion

## Mục tiêu
- Hoàn thiện auth flow theo role sau đăng nhập:
  - user có role admin -> vào dashboard page
  - user không phải admin -> vào showroom page
- Bịt các lỗ hổng redirect/routing còn lại để flow login/logout/callback nhất quán.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`

## Tài liệu tham chiếu
- `AGENTS.md` (auth + anon + offline invariants)
- `.mcp.full.md` (Component -> Hook -> Query -> Service -> API/Supabase)
- `docs/000_Business_requests.md` (sections liên quan auth và customer showroom)

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện auth flow role-based redirect.

Yêu cầu:
1) Sau login/callback:
   - nếu role admin -> redirect `/{locale}/dashboard`
   - nếu không admin -> redirect `/{locale}/showroom`
2) Đồng bộ logic redirect ở tất cả entry points:
   - auth callback page
   - login action success handler
   - auth routing guard khi refresh/hydrate session
3) Route protection:
   - non-admin không vào được dashboard modules (redirect showroom)
   - guest/anonymous vẫn truy cập showroom bình thường
4) Locale behavior:
   - giữ locale hiện tại nếu hợp lệ
   - fallback locale mặc định nếu thiếu/invalid
5) Stability:
   - không loop redirect
   - không flicker màn khi auth bootstrap
6) Kiến trúc:
   - Component -> Hook -> Query -> Service -> API/Supabase
   - không gọi Supabase trực tiếp trong component

Lưu ý:
- Không phá flow anon/offline warning hiện có.
- Không mở rộng sang checkout/payment online.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt định nghĩa admin role cho redirect:
  - khuyến nghị: `profile.role = owner_admin`
- Chốt landing page admin:
  - khuyến nghị: `/{locale}/dashboard`
- Chốt landing page non-admin:
  - `/{locale}/showroom`

## In-scope
- Role-based redirect sau login/callback/rehydrate session
- Guard dashboard route cho non-admin
- Đồng bộ locale-aware redirect cho auth flow
- Hardening tránh redirect loop/flicker

## Out-of-scope
- RBAC redesign tổng thể
- Thay đổi schema role lớn
- Checkout/payment/order từ customer showroom

## Deliverables mong muốn
- Auth flow chạy ổn định theo role admin vs non-admin
- Dashboard route không còn mở cho non-admin
- Showroom vẫn public cho guest/anon và non-admin cloud user
- Redirect logic thống nhất (không mâu thuẫn giữa callback/login/guard)

## Done criteria (coding)
- Login bằng admin role vào `/{locale}/dashboard`
- Login bằng non-admin vào `/{locale}/showroom`
- Non-admin truy cập trực tiếp `/{locale}/dashboard` bị redirect về `/{locale}/showroom`
- Không có redirect loop ở các route `/{locale}/showroom`, `/{locale}/dashboard`, `/auth`
- Không regress flow anon/offline warnings hiện có

## Nhắc test nhanh
- Manual test matrix:
  - no session -> mở dashboard -> bị chặn theo policy hiện tại
  - guest/anon -> vào showroom ok, vào dashboard bị redirect
  - cloud admin -> login/callback -> dashboard
  - cloud non-admin -> login/callback -> showroom
- Manual test locale:
  - `vi`/`en` đều giữ đúng sau login/callback
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 019 |- [x] 019 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 019
  - Task file: docs/tasks/019_auth_role_based_redirect_and_flow_completion.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
