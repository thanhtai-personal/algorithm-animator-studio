# Task 032 - Notifications Module (Supabase Realtime + In-App Center)

## Mục tiêu
- Xây hệ thống thông báo in-app cho admin/showroom dựa trên Supabase.
- Hỗ trợ realtime nhận thông báo mới, đọc/chưa đọc, đánh dấu đã đọc, và lịch sử thông báo cơ bản.
- Giữ nguyên business logic hiện có; notification chỉ là lớp bổ trợ hiển thị/tracking.
- Bổ sung hướng dẫn cài đặt Supabase notification stack nếu project chưa có.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/009_orders_domain_and_availability_core.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/014_calendar_module_reminders.md`
- `docs/tasks/016_settings_users_roles_general.md`

## Nguồn tham chiếu
- `AGENTS.md`
- `.mcp.full.md`
- `docs/000_authen-and-data-flow.md`
- Supabase docs (Realtime + RLS + Edge Functions nếu bật channel ngoài in-app)

## Mapping màn hình/source
- App shell/topbar notification entry:
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx`
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts`
- Notifications module:
  - `apps/web/src/features/notifications/components/NotificationsCenter.tsx`
  - `apps/web/src/features/notifications/hooks/useNotificationsCenter.ts`
  - `apps/web/src/features/notifications/queries/useNotificationsQueries.ts`
  - `apps/web/src/features/notifications/services/notificationsClientService.ts`
  - `apps/web/src/features/notifications/stores/notificationsStore.ts`
- API + server:
  - `apps/web/src/app/api/notifications/route.ts`
  - `apps/web/src/app/api/notifications/[notificationId]/read/route.ts`
  - `apps/web/src/app/api/notifications/read-all/route.ts`
  - `apps/web/src/server/services/notificationsService.ts`
  - `apps/web/src/server/data-access/notifications.ts`
- SQL/migrations:
  - `apps/web/sql/006_notifications_module.sql` (hoặc migration id mới nếu đã dùng)
  - `apps/web/sql/README.md` (cập nhật runbook)

## Prompt gợi ý cho Codex
```text
Mục tiêu: implement Notifications module với Supabase Realtime cho in-app center.

Yêu cầu:
1) Data model + RLS (Supabase):
   - notifications table (mỗi record gắn recipient_profile_id, branch_id, type, title, body, payload_json, severity, is_read, read_at, created_at)
   - indexes theo recipient_profile_id, is_read, created_at desc
   - RLS: user chỉ đọc/cập nhật notification của chính họ; service role có quyền create/fanout
2) API contract:
   - GET /api/notifications?cursor=&limit=&isRead=
   - PATCH /api/notifications/[id]/read
   - PATCH /api/notifications/read-all
   - response có unreadCount + pagination cursor
3) UI:
   - topbar bell badge (unread count)
   - notifications panel/dropdown (latest list, unread highlight, mark as read)
   - optional full page /[locale]/notifications nếu list dài
4) Realtime:
   - subscribe Supabase realtime theo recipient_profile_id
   - có fallback polling nếu realtime unavailable
5) Domain integration (không đổi nghiệp vụ):
   - bắn notification khi order status quan trọng đổi (RESERVED/CONFIRMED/PICKED_UP/RETURNED/CANCELLED)
   - bắn notification khi payment status bất thường/void/manual-review
   - bắn notification reminder từ overdue/laundry-stuck pipeline hiện có
6) Constraints:
   - giữ flow Component -> Hook -> Query -> Service -> API/Supabase
   - không đổi payload business API gốc, chỉ thêm notification side-effects an toàn
   - không break auth/anon/offline invariants
7) UX:
   - loading/empty/error states rõ ràng
   - mobile-friendly notification panel

Kết quả: app có trung tâm thông báo realtime, không ảnh hưởng workflow nghiệp vụ cũ.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt phạm vi channel:
  - MVP: in-app only
  - Phase sau: email/push (qua Edge Functions/3rd-party)
- Chốt fanout strategy:
  - create per-recipient row (khuyến nghị MVP)
  - hoặc event + receipt table (phức tạp hơn)
- Chốt retention policy:
  - ví dụ giữ 30/60/90 ngày rồi archive/delete
- Chốt loại event bắt buộc phát thông báo:
  - orders, payments, incidents, reminders

## Hướng dẫn cài đặt Supabase nếu chưa có notification stack
1. SQL schema + policy:
   - tạo table/index/RLS cho notifications trong `apps/web/sql/006_notifications_module.sql`
   - chạy SQL trên Supabase SQL Editor theo đúng thứ tự migration
2. Realtime publication:
   - thêm table `notifications` vào publication `supabase_realtime`
   - kiểm tra realtime đang bật cho project
3. Quyền truy cập:
   - xác nhận `authenticated` chỉ SELECT/UPDATE record của chính mình qua RLS
   - chỉ server/service role được INSERT fanout
4. Environment:
   - xác nhận web app có `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - server API có `SUPABASE_SERVICE_ROLE_KEY` để create notification an toàn ở backend
5. Optional (nếu cần email/push):
   - bật Edge Functions, set secrets, cấu hình webhook/provider
   - tách riêng khỏi MVP in-app nếu chưa sẵn hạ tầng

## In-scope
- Notification center in-app + unread badge.
- Supabase schema/RLS/realtime cho notifications.
- API list/read/read-all + query/store/hook/component đầy đủ.
- Tích hợp side-effect notification vào luồng orders/payments/reminders.

## Out-of-scope
- Thay đổi policy nghiệp vụ core của orders/payments/reports.
- Push mobile native và email marketing campaign phức tạp.
- Workflow automation nâng cao (rule builder UI).

## Deliverables mong muốn
- Người dùng đăng nhập nhận được notification realtime theo quyền truy cập.
- Có thể xem danh sách, đánh dấu đã đọc, và theo dõi unread count từ bell icon.
- Có runbook setup Supabase notification stack rõ ràng để triển khai môi trường mới.

## Done criteria (coding)
- Notification badge hiển thị đúng unread count, cập nhật realtime.
- API notifications pass với auth/RLS đúng scope user.
- Có side-effect bắn notification từ ít nhất: order status update + payment exception + overdue reminder.
- Không regression các flow chính (auth redirect, orders/payments actions).
- SQL + docs setup cho notification stack được commit.

## Nhắc test nhanh
- Manual: tạo event business -> thấy notification mới ở topbar.
- Manual: mark-one-read + mark-all-read, reload vẫn đúng trạng thái.
- Manual: test 2 user khác nhau không nhìn thấy notification của nhau.
- Manual: tắt realtime (giả lập) và xác nhận fallback polling còn hoạt động.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 032 |- [x] 032 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 032
  - Task file: docs/tasks/032_notifications_module_supabase_realtime.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
