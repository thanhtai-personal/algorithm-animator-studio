# Task 093 - Real-time dashboard web/Zalo và thông báo đẩy khi có giao dịch mới

## Mục tiêu
- Xây dựng dashboard real-time cho web và Zalo Mini App để số liệu vận hành/tài chính cập nhật gần như ngay khi phát sinh giao dịch mới.
- Gửi thông báo đẩy khi có payment/giao dịch mới được thực hiện, có lọc theo chi nhánh và quyền người nhận.
- Chuẩn hóa một luồng event payment dùng chung cho web dashboard, Zalo Mini App revenue/order dashboard và notification center.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/013_dashboard_overview_module.md`
- `docs/tasks/015_reports_module.md`
- `docs/tasks/032_notifications_module_supabase_realtime.md`
- `docs/tasks/090_pos_surcharge_expense_and_admin_passkey_lock.md`
- `docs/tasks/092_payment_initial_capital_flag_pos_toggle_and_dashboard_capital_procurement_stats.md`
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/004_zalo_mini_app_checkout_payment_and_reconciliation.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `docs/tasks/000_task_token_efficiency_standard.md`

## Hiện trạng cần lưu ý
- Dashboard web và Zalo Mini App hiện chủ yếu lấy dữ liệu bằng query/refetch thủ công hoặc theo vòng đời màn hình.
- Payment đã có nhiều nguồn phát sinh:
  - tạo đơn thuê/bán,
  - phụ thu/phụ chi POS,
  - đơn nhập hàng,
  - giao dịch vốn ban đầu.
- Các chỉ số tài chính gần đây đã tách rõ:
  - tổng thu/chi thực tế tính cả giao dịch vốn,
  - doanh thu/lợi nhuận vận hành loại trừ giao dịch vốn.
- Kiến trúc V2 yêu cầu client không truy cập Supabase trực tiếp; realtime/push phải đi qua `apps/server` hoặc API hợp lệ do `apps/server` quản lý.

## Config cần chuẩn bị trước khi chạy task
- Xác nhận realtime transport ưu tiên:
  - Web: Server-Sent Events hoặc WebSocket từ `apps/server`.
  - Zalo Mini App: ưu tiên cùng transport nếu runtime hỗ trợ; fallback polling có debounce/backoff nếu Zalo WebView hạn chế kết nối nền.
- Xác nhận push channel:
  - Web push: VAPID/public key + service worker subscription nếu bật PWA/web push.
  - Zalo push: OA/template/message API hoặc channel hiện hành của Zalo; bắt buộc kiểm tra tài liệu Zalo mới nhất trước khi implement.
- Xác nhận notification recipients:
  - owner/admin/manager của chi nhánh,
  - staff đang được phân quyền xem payment/dashboard,
  - không gửi cross-branch.
- Xác nhận event name chuẩn:
  - `payment.created`
  - `payment.posted`
  - `payment.updated`
  - task này ưu tiên push khi payment mới ở trạng thái `POSTED` hoặc payment create đã được coi là giao dịch thực hiện theo contract payment hiện có.
- Xác nhận nội dung thông báo:
  - loại giao dịch thu/chi,
  - số tiền,
  - phương thức,
  - chi nhánh,
  - người tạo,
  - lý do/ghi chú ngắn nếu có.

## Architecture Impact
- Layers affected:
  - Server presentation: realtime stream endpoint/gateway, push subscription endpoint, notification preference endpoint nếu chưa có.
  - Server application: payment event orchestration, notification fan-out, branch/RBAC recipient resolution.
  - Server infrastructure/data-access: payment read model, notification records, push subscription persistence, optional outbox/event log.
  - Web client: dashboard hooks/queries/services/stores, notification subscription UI, service worker/web push registration nếu dùng.
  - Zalo Mini Apps: rental revenue/order dashboard hooks/queries/services/stores, in-app realtime/polling adapter, push permission/registration flow.
  - DB: notification/event outbox và push subscription tables nếu chưa đủ schema hiện có.
- Domain affected:
  - Payments.
  - Dashboard/reports finance metrics.
  - Notifications.
  - Zalo Mini App channel.
  - Auth/RBAC/branch isolation.
- App(s) affected:
  - `apps/server`
  - `apps/web`
  - `apps/zalo-mini-apps/kata-rental-revenue`
  - `apps/zalo-mini-apps/kata-rental-order` nếu có dashboard/transaction widgets liên quan.

## Current State vs Target State
- Current:
  - Dashboard cập nhật theo query lifecycle, chưa có realtime event chuẩn cho payment mới.
  - Web/Zalo có thể hiển thị số liệu lệch trong vài phút hoặc cho tới khi user refresh/refetch.
  - Notification khi phát sinh payment mới chưa được chuẩn hóa theo branch/RBAC và push channel.
- Target (Architecture V2):
  - `apps/server` là source-of-truth cho payment events, realtime stream và push fan-out.
  - Khi payment mới được thực hiện, server ghi event/notification và phát realtime signal cho client cùng chi nhánh.
  - Web dashboard và Zalo Mini App nhận signal, invalidate/refetch dashboard metrics qua API thay vì tự cộng số liệu ở UI.
  - Push notification chỉ gửi tới user/subscription hợp lệ, đúng branch, đúng permission.
  - Realtime là tín hiệu gần thời gian thực; React Query/API refetch vẫn là reconciliation authority.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Server flow: `Controller/Gateway -> Application Service -> Data-access/Repository -> Supabase`.
  - Chỉ `apps/server` được truy cập Supabase DB trực tiếp.
  - Dashboard metrics sau signal phải refetch từ API source-of-truth, không tự tính KPI trong component từ payload event.
  - Realtime payload chỉ chứa dữ liệu tối thiểu, không lộ PII hoặc dữ liệu cross-branch.
  - Push recipient resolution phải qua backend RBAC/branch guard.
  - Zalo Mini App service layer phải gọi API qua base URL env, không gọi thẳng web legacy API nếu Nest endpoint đã có.
- Forbidden:
  - Không subscribe Supabase Realtime trực tiếp từ `apps/web` hoặc `apps/zalo-mini-apps/*`.
  - Không thêm business endpoint mới chỉ trong `apps/web/src/app/api/**`.
  - Không để component gọi thẳng WebSocket/SSE client nếu feature đã có hook/query/service/store pattern.
  - Không gửi push notification từ client bằng credential/OA secret.
  - Không duplicate công thức dashboard/reports ở web và Zalo client.
  - Không gửi notification cho user không có quyền xem payment của branch đó.

## Compatibility & Migration Strategy
- Compatibility window:
  - Dashboard hiện tại vẫn hoạt động bằng query/refetch nếu realtime stream/push chưa bật.
  - Realtime có feature flag, ví dụ `realtime_dashboard_enabled`.
  - Push notification có feature flag riêng, ví dụ `payment_push_notifications_enabled`.
  - Nếu transport realtime không khả dụng trên Zalo WebView, fallback polling dùng interval có backoff và visibility-aware pause.
- Deprecation/removal plan:
  - Sau khi realtime ổn định, giảm manual polling interval hiện có nếu có.
  - Legacy notification logic cũ chỉ giữ compatibility cho tới khi callers web/Zalo đều dùng event contract mới.
- Rollback condition:
  - Có thể tắt realtime dashboard flag mà không ảnh hưởng create/update payment.
  - Có thể tắt push flag nếu provider lỗi/rate-limit, dashboard vẫn refetch bình thường.
  - Event/outbox đã ghi không được xóa hàng loạt khi rollback; chỉ dừng fan-out.

## In-scope
- Server event contract:
  - Chuẩn hóa DTO cho payment realtime event.
  - Emit event sau khi payment được tạo/posted thành công qua payment application service.
  - Không emit event nếu transaction/payment bị rollback hoặc create thất bại.
- Realtime stream:
  - Tạo stream endpoint/gateway ở `apps/server` có auth, branch scope, reconnect support.
  - Hỗ trợ heartbeat và client reconnect cursor/timestamp nếu cần.
  - Payload gồm event id, type, branch id, payment id, amount, direction/type, method, created time và safe display fields.
- Dashboard refresh:
  - Web dashboard nhận event rồi invalidate/refetch dashboard overview/reports/payment list liên quan.
  - Zalo rental revenue/order app nhận event rồi refetch dashboard/recent activity/payment widgets liên quan.
  - Tránh request storm bằng debounce/batch invalidate 300-500ms.
- Push notification:
  - Lưu subscription/token theo user/device/channel/branch.
  - API đăng ký/hủy đăng ký push subscription.
  - Backend gửi push khi có payment mới theo preference/permission.
  - Ghi log trạng thái gửi push để debug retry/failure.
- Notification center:
  - Nếu notification center đã có, tạo item mới khi payment event phát sinh.
  - Nếu chưa đủ contract, bổ sung read/unread minimal cho payment notification.
- Security/RBAC:
  - Branch isolation cho stream, notification record và push recipient.
  - Không gửi amount/payment detail cho user không có quyền xem payment.
- Observability:
  - Log event emit count, push success/failure, stream connection error.
  - Có guard chống duplicate push cho cùng event id.

## Out-of-scope
- Chat realtime giữa user.
- Ledger/accounting engine mới.
- Push notification cho mọi entity khác ngoài payment/giao dịch.
- Offline queue cho push notification delivery đảm bảo tuyệt đối.
- Mobile Expo native push nếu task này chỉ triển khai web và Zalo Mini App.

## Deliverables mong muốn
- Server realtime/payment-event contract và endpoint/gateway.
- Server push subscription + notification fan-out cho payment mới.
- Web dashboard realtime hook/service/store integration.
- Web push registration UI/permission flow nếu bật web push.
- Zalo Mini App realtime/fallback polling adapter và dashboard refresh integration.
- Zalo push registration/fan-out integration theo provider đã xác nhận.
- Regression notes cho payment create, dashboard refresh, push permission, branch isolation.

## Prompt gợi ý cho Codex
```text
Triển khai Task 093: real-time dashboard web/Zalo khi có payment mới và push notification.
Giữ source-of-truth ở apps/server: payment event emit sau create/posted thành công, stream endpoint/gateway có auth + branch scope, push fan-out backend.
Client chỉ nhận signal rồi invalidate/refetch dashboard/payment queries qua Hook -> Query -> Service -> API; không tự tính KPI từ payload event.
Zalo Mini App dùng cùng contract, fallback polling nếu realtime transport không ổn trong WebView.
Validation: server build + targeted lint; web typecheck + targeted lint; Zalo mini app typecheck/lint/build cho app bị sửa.
```

## Done criteria (coding)
- Payment create/posted thành công phát sinh đúng một event `payment.*` có event id ổn định.
- Realtime stream/gateway chỉ trả event đúng branch và user đã auth/authorized.
- Web dashboard tự refresh KPI/recent activity/payment widgets khi có event payment mới, không cần hard refresh.
- Zalo Mini App dashboard tự refresh số liệu khi có event payment mới hoặc fallback polling hoạt động nếu realtime unsupported.
- Push notification gửi tới đúng user/device/channel được phép, không gửi cross-branch.
- Push failure được log, không làm fail luồng tạo payment chính.
- Có cơ chế chống duplicate push cho cùng payment event.
- Notification payload không chứa dữ liệu nhạy cảm ngoài quyền người nhận.
- Feature flag có thể tắt realtime hoặc push độc lập.
- `cd apps/server && npm run build` pass.
- `cd apps/server && npx eslint [files changed]` pass.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.
- `cd apps/zalo-mini-apps/kata-rental-revenue && npm run typecheck` pass nếu sửa app này.
- `cd apps/zalo-mini-apps/kata-rental-revenue && npm run build` pass nếu sửa app này.
- `cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck` pass nếu sửa app này.
- `cd apps/zalo-mini-apps/kata-rental-order && npm run build` pass nếu sửa app này.

## Done Criteria (Architecture)
- [ ] Không thêm business endpoint mới vào `apps/web/app/api` nếu domain đã ở Nest.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Không subscribe Supabase Realtime trực tiếp từ web/Zalo clients.
- [ ] Client giữ flow `Component -> Hook -> Query -> Service -> API`.
- [ ] Server giữ flow `Controller/Gateway -> Service -> Data-access -> Supabase`.
- [ ] Realtime chỉ là signal; query/API refetch vẫn là reconciliation authority.
- [ ] Có contract parity/caller cutover list cho web và Zalo Mini App.
- [ ] Push credentials/OA secrets chỉ nằm ở server environment.
- [ ] Branch/RBAC isolation được kiểm tra cho stream và push recipients.
- [ ] Có rollback/feature flag cho realtime và push.
- [ ] Progress log có `Token usage`.

## Regression Scope
- [ ] Tạo payment phụ thu POS -> web dashboard cập nhật thu/lợi nhuận/recent activity.
- [ ] Tạo payment phụ chi POS -> web dashboard cập nhật chi/lợi nhuận/recent activity.
- [ ] Tạo payment nhập hàng `isImportOrder=true` -> KPI nhập hàng/dashboard đúng policy hiện tại.
- [ ] Tạo payment vốn ban đầu `isInitialCapital=true` -> tổng thu/chi thực tế cập nhật, KPI vận hành không bị tính nhầm.
- [ ] Zalo rental revenue dashboard cập nhật khi payment mới phát sinh cùng branch.
- [ ] Zalo rental order app không nhận event branch khác.
- [ ] User không có quyền xem payment không nhận stream/push detail.
- [ ] Mất kết nối realtime rồi reconnect không tạo duplicate notification.
- [ ] Push disabled bằng feature flag thì không gửi push nhưng dashboard vẫn refetch theo query bình thường.
- [ ] Push provider lỗi/rate-limit không làm fail API tạo payment.
- [ ] Browser deny notification permission không làm lỗi dashboard.
- [ ] Multi-tab web không tạo request storm hoặc duplicate subscription quá mức.

## Nhắc test nhanh
- Mở dashboard web và tạo phụ thu/phụ chi từ POS ở tab khác, kiểm tra dashboard tự cập nhật trong vài giây.
- Mở Zalo Mini App revenue dashboard, tạo payment từ web/POS cùng branch, kiểm tra số liệu tự refresh hoặc fallback polling refresh.
- Test user branch A và branch B cùng lúc, tạo payment ở A, xác nhận B không nhận event/push.
- Bật/tắt feature flag realtime và push để xác nhận rollback mềm.
- Tắt network/reconnect stream, tạo payment mới, xác nhận reconnect không nhân đôi notification.
- Kiểm tra log server cho event id, push success/failure và recipient count.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 093 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 092 /a - [ ] 093 | Real-time dashboard web/Zalo + payment push notifications | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 093 |- [x] 093 |" progress/tasks.md
  ~~~
- Append completion log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 093
  - Task file: docs/tasks/093_realtime_dashboard_web_zalo_payment_push_notifications.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  - Token usage: input=<n>, output=<n>, total=<n>
  PROGRESS_LOG
  ~~~
