# Task 092 - Payment `isInitialCapital` + POS toggle + Dashboard thống kê vốn ban đầu và tổng tiền nhập hàng

## Mục tiêu
- Bổ sung cờ `isInitialCapital` cho payment để phân loại các khoản thu/chi thuộc vốn khởi tạo ban đầu.
- Trong POS phụ thu/phụ chi, cho phép user chủ động check chọn payment có thuộc vốn ban đầu hay không.
- Bổ sung Dashboard thống kê liên quan đến vốn ban đầu và tổng số tiền nhập hàng.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/013_dashboard_overview_module.md`
- `docs/tasks/015_reports_module.md`
- `docs/tasks/090_pos_surcharge_expense_and_admin_passkey_lock.md`
- `docs/tasks/091_procurement_import_order_decoupled_products_and_import_payment_flag.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `docs/tasks/000_task_token_efficiency_standard.md`

## Hiện trạng cần lưu ý
- Payment hiện đã có cờ `isImportOrder` để phân loại chi phí nhập hàng, nhưng chưa có cờ riêng cho vốn khởi tạo ban đầu.
- POS phụ thu/phụ chi đã có flow tạo payment nhưng chưa cho user chọn rõ payment thuộc vốn ban đầu.
- Dashboard chưa tách rõ chỉ số vốn ban đầu và tổng tiền nhập hàng theo policy mới.

## Config cần chuẩn bị trước khi chạy task
- Xác nhận naming contract:
  - DB/API: `is_initial_capital`
  - TypeScript DTO/client: `isInitialCapital`
- Xác nhận quyền:
  - user nào được gắn/bỏ cờ vốn ban đầu khi tạo payment từ POS.
- Xác nhận quy ước thống kê:
  - vốn ban đầu tính theo payment nào (thu/chi) và công thức tổng hợp.
  - tổng tiền nhập hàng lấy theo payment `isImportOrder=true` hay theo tổng đơn nhập.

## Architecture Impact
- Layers affected:
  - Client: `sales` (POS phụ thu/phụ chi), `dashboard` (KPI/cards/charts nếu có), `reports` (nếu share datasource).
  - Client state/query/service: payments/sales/dashboard queries + services + stores liên quan.
  - Server/API: `payments` module, `dashboard/reports` aggregation endpoints.
  - DB: bảng `payments` (thêm cột `is_initial_capital` + backfill mặc định).
- Domain affected:
  - Payments classification.
  - POS surcharge/expense flow.
  - Dashboard finance metrics.
- App(s) affected:
  - `apps/server`
  - `apps/web`

## Current State vs Target State
- Current:
  - Payment chưa có nhãn vốn ban đầu.
  - POS phụ thu/phụ chi chưa có toggle vốn ban đầu.
  - Dashboard chưa có thống kê riêng cho vốn ban đầu và tổng tiền nhập hàng theo yêu cầu.
- Target (Architecture V2):
  - Payment có `isInitialCapital` nhất quán từ DB -> API -> client.
  - POS phụ thu/phụ chi cho phép user chọn `isInitialCapital`.
  - Dashboard hiển thị được:
    - tổng vốn ban đầu (và tách thu/chi nếu policy yêu cầu),
    - tổng số tiền nhập hàng.
  - Logic phân loại nằm ở backend source-of-truth; frontend chỉ gửi/hiển thị theo contract.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Server flow: `Controller -> Application Service -> Data-access/Repository -> Supabase`.
  - Chỉ `apps/server` truy cập Supabase DB.
  - Field `isInitialCapital` được validate/chuẩn hóa ở backend.
- Forbidden:
  - Không thêm business endpoint mới chỉ ở `apps/web/src/app/api/**` nếu đã có domain trên Nest.
  - Không duplicate finance classification rule ở cả client và server.
  - Không suy diễn dashboard metric ở component bằng cách tự cộng thủ công từ nhiều nguồn khác contract API.

## Compatibility & Migration Strategy
- Compatibility window:
  - Cột `is_initial_capital` thêm theo migration idempotent, mặc định `false` cho data cũ nếu chưa xác định.
  - API response cũ vẫn đọc được khi caller chưa gửi field mới (backend fallback `false`).
- Deprecation/removal plan:
  - Sau cutover, mọi flow tạo payment liên quan POS phụ thu/phụ chi dùng field mới.
- Rollback condition:
  - Có thể tạm ẩn toggle `isInitialCapital` trên POS nếu phát sinh sai phân loại, nhưng không rollback mất dữ liệu payment đã ghi.

## In-scope
- DB + contract:
  - Thêm cột `payments.is_initial_capital` (default false) và index cần thiết nếu có query/filter.
  - Expose `isInitialCapital` qua DTO/types server+web.
- Payments API:
  - Create/update manual payment chấp nhận `isInitialCapital`.
  - Giữ tương thích với payload cũ không có field này.
- POS phụ thu/phụ chi:
  - Thêm checkbox/toggle “Vốn ban đầu”.
  - Payload gửi đúng `isInitialCapital`.
- Dashboard:
  - Bổ sung metric vốn ban đầu theo policy đã chốt.
  - Bổ sung metric tổng số tiền nhập hàng.
  - Bảo toàn branch/time filtering hiện có.
- Reports (nếu dùng chung data source dashboard):
  - Đồng bộ mapping/labels cần thiết để không lệch số.

## Out-of-scope
- Thiết kế lại toàn bộ hệ thống kế toán 2 bút toán.
- Reconcile lịch sử cũ theo quy tắc phức tạp ngoài default/backfill.
- Thay đổi business meaning của `isImportOrder`.

## Deliverables mong muốn
- Migration SQL thêm `is_initial_capital` cho bảng `payments`.
- Backend payments/dashboard contracts có `isInitialCapital` nhất quán.
- POS phụ thu/phụ chi có toggle chọn vốn ban đầu.
- Dashboard có thống kê vốn ban đầu và tổng tiền nhập hàng.
- Regression notes cho payments/POS/dashboard.

## Done criteria (coding)
- Payment create/update từ POS lưu đúng `isInitialCapital`.
- DTO/server/web types đồng bộ `isInitialCapital` không vỡ typecheck.
- Dashboard trả về và hiển thị đúng:
  - số liệu vốn ban đầu,
  - tổng tiền nhập hàng.
- Không làm sai số các KPI cũ ngoài phạm vi phân loại mới.
- `cd apps/server && npm run build` pass.
- `cd apps/server && npx eslint [files changed]` pass.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Done Criteria (Architecture)
- [ ] Không thêm business endpoint mới vào `apps/web/app/api` khi domain đã ở Nest.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Không vi phạm layering/import boundaries client-server.
- [ ] `isInitialCapital` xử lý source-of-truth ở backend và expose nhất quán ra client.
- [ ] Có migration/backfill note rõ ràng cho dữ liệu cũ.
- [ ] Progress log có `Token usage`.

## Regression Scope
- [ ] POS phụ thu bật `isInitialCapital` tạo payment với cờ true.
- [ ] POS phụ thu tắt `isInitialCapital` tạo payment với cờ false.
- [ ] POS phụ chi bật/tắt `isInitialCapital` lưu đúng dữ liệu.
- [ ] Payment list/detail/filter không lỗi khi có field mới.
- [ ] Import-order payments (`isImportOrder`) không bị ảnh hưởng semantics.
- [ ] Dashboard metric vốn ban đầu và tổng nhập hàng đúng theo branch/time.
- [ ] RBAC không bị nới quyền khi tạo/sửa payment với cờ mới.

## Nhắc test nhanh
- Tạo 4 payment từ POS: phụ thu/phụ chi x bật/tắt vốn ban đầu, kiểm tra DB/API.
- Import đơn nhập hàng + payment nhập hàng, kiểm tra dashboard tổng nhập hàng.
- So sánh dashboard trước/sau tạo payment vốn ban đầu trong cùng khung thời gian.
- Chạy:
  - `cd apps/server && npm run build`
  - `cd apps/server && npx eslint [files changed]`
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npx eslint [files changed]`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 092 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 091 /a - [ ] 092 | Payment initial capital flag + POS toggle + Dashboard initial-capital/procurement-total metrics | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 092 |- [x] 092 |" progress/tasks.md
  ~~~
- Append completion log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 092
  - Task file: docs/tasks/092_payment_initial_capital_flag_pos_toggle_and_dashboard_capital_procurement_stats.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  - Token usage: input=<n>, output=<n>, total=<n>
  PROGRESS_LOG
  ~~~

