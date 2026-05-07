# Task 090 - POS phụ thu/phụ chi + khóa tab POS bằng passkey do admin quản lý

## Mục tiêu
- Thêm màn hình POS để nhập `phụ thu` và `phụ chi` phục vụ vận hành tại quầy.
- Trừ màn hình `POS` và luồng `tạo đơn trả`, các màn hình còn lại trong khu vực POS phải bị khóa bằng passkey do admin cấu hình trong Settings.
- Admin có thể reset/thay passkey bất kỳ lúc nào mà không cần nhập passkey cũ.

## Token Context Guard
- Chỉ nạp task `090` + các task phụ thuộc trực tiếp + file sales/settings/payments đang sửa.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`.

## Phụ thuộc
- `docs/tasks/034_staff_sales_pos_unified_module.md`
- `docs/tasks/060_shift_open_close_ui_standardization_and_admin_shift_management.md`
- `docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/052_revenue_debt_unified_calculation_dashboard_reports.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `apps/web/src/features/sales/hooks/useSalesLayout.ts`
- `apps/web/src/features/sales/views/SalesLayout/SalesLayout.tsx`
- `apps/web/src/features/settings/hooks/useSettingsGeneralPage.ts`
- `apps/web/src/features/settings/views/SettingsGeneralPage/SettingsGeneralPage.tsx`
- `apps/web/src/features/dashboard/**`
- `apps/web/src/features/reports/views/RevenueReportPage/**`
- `apps/web/src/server/data-access/orderFinance.ts`
- `apps/server/src/modules/settings/**`
- `apps/server/src/modules/payments/**`

## Hiện trạng cần lưu ý
- Khu vực POS hiện có các tab chính: POS, Trả hàng, Tồn kho, Hóa đơn, Nhập SP; chưa có tab/màn hình phụ thu-phụ chi.
- Chưa có cơ chế passkey riêng cho truy cập các tab POS theo policy vận hành.
- Có primitive app lock ở web (`apps/web/src/lib/appLock.ts`) nhưng là lock ứng dụng mức user/device, không phải passkey vận hành POS do admin settings quản trị.
- Payment domain đã có các type liên quan (`FEE`, `EXPENSE`), có thể tái sử dụng để ghi nhận phụ thu/phụ chi với source/reason rõ ràng.

## Config cần chuẩn bị trước khi chạy task
- Web:
  - `cd apps/web && npm run lint`
  - `cd apps/web && npm run typecheck`
- Server:
  - `cd apps/server && npm run lint`
  - `cd apps/server && npm run build`
- SQL migration:
  - chuẩn bị migration idempotent cho cấu hình passkey POS trong settings.

## Architecture Impact
- Layers affected:
  - `Component`: POS tabs/layout, POS surcharge-expense screen, Settings General UI, dashboard/revenue chart screens.
  - `Hook`: sales layout guard hook, surcharge/expense form hook, settings general hook, dashboard/report aggregation hooks.
  - `Query/Service`: sales + settings + payments + dashboard/reports queries/services.
  - `API`: ưu tiên `apps/server` (settings/payments/sales access guard endpoints), web route chỉ giữ compatibility forwarding nếu cần.
- Domain affected:
  - `sales/POS navigation`
  - `payments (manual inflow/outflow at POS)`
  - `settings/system security policy for POS`
  - `dashboard/reports financial charts`
- App(s) affected: `apps/web`, `apps/server`

## Current State vs Target State
- Current:
  - Không có màn hình chuyên biệt để ghi nhận phụ thu/phụ chi trong POS.
  - Không có passkey guard cho các màn hình POS ngoài POS chính.
- Target (Architecture V2):
  - Có màn hình POS phụ thu/phụ chi, tạo record chuẩn vào domain payments.
  - Có POS tab access guard bằng passkey cấu hình từ admin settings.
  - Các màn hình được miễn khóa: `POS` và luồng `tạo đơn trả`; các màn hình POS còn lại yêu cầu passkey.
  - Admin reset/thay passkey không cần passkey cũ và invalidate các phiên đã mở khóa trước đó.
  - Dashboard/reports revenue chart phản ánh đúng phụ thu/phụ chi theo công thức tài chính chuẩn hiện hành.

## Boundary Rules
- Must keep:
  - Tuân thủ flow `Component -> Hook -> Query -> Service -> API`.
  - Passkey chỉ lưu dạng hash ở backend/settings source-of-truth; không lưu plaintext passkey.
  - Guard áp dụng cả điều hướng tab và truy cập trực tiếp URL.
  - Chính sách miễn khóa chỉ giới hạn đúng: POS + luồng tạo đơn trả.
  - Giữ nhất quán công thức tài chính giữa POS payments và dashboard/report charts.
- Forbidden:
  - Không thêm business endpoint mới chỉ ở `apps/web/src/app/api/**` khi domain tương ứng đã có/đang chuyển sang `apps/server`.
  - Không validate passkey hoàn toàn ở client-side.
  - Không duplicate logic guard giữa nhiều màn hình POS một cách rời rạc.

## Compatibility & Migration Strategy
- Compatibility window:
  - Nếu caller web còn dùng route compatibility, route web chỉ forward sang `apps/server`.
  - Khi chưa cấu hình passkey (`enabled=false` hoặc chưa có hash), hành vi POS giữ như hiện tại (không khóa).
- Deprecation/removal plan:
  - Gỡ logic guard tạm ở web route cũ sau khi caller cutover hoàn tất sang endpoint/server module chuẩn.
- Rollback condition:
  - Rollback nếu chặn nhầm flow miễn khóa (POS hoặc tạo đơn trả), hoặc làm staff không thể vận hành các tab bắt buộc khi passkey hợp lệ.

## In-scope
- POS phụ thu/phụ chi:
  - Thêm tab/màn hình mới trong khu vực Sales/POS để nhập giao dịch phụ thu/phụ chi.
  - Form tối thiểu: loại giao dịch (phụ thu/phụ chi), số tiền, phương thức, lý do, ghi chú, branch context.
  - Mapping payment:
    - phụ thu -> payment type phù hợp (ưu tiên `FEE`, source/reason chuẩn hóa).
    - phụ chi -> payment type `EXPENSE`.
- POS passkey guard:
  - Khóa các màn hình POS ngoài danh sách miễn khóa.
  - Hiển thị modal/passkey prompt khi user truy cập màn hình bị khóa.
  - Hỗ trợ phiên mở khóa tạm thời theo user + branch + lock version (để reset từ admin có hiệu lực ngay).
- Admin Settings:
  - Thêm cấu hình passkey POS trong Settings General (owner_admin/admin).
  - Hỗ trợ set mới, bật/tắt lock, reset/thay passkey không yêu cầu passkey cũ.
  - Reset passkey phải invalidate các phiên đã mở khóa trước đó.
- API/DB:
  - Bổ sung field settings cho POS lock (enabled/hash/version/timestamp) bằng migration idempotent.
  - Thêm endpoint đọc/cập nhật/verify passkey theo contract rõ ràng.
- Dashboard/reports:
  - Cập nhật aggregation/reconciliation để phụ thu/phụ chi từ POS được thể hiện đúng trên KPI + chart doanh thu/lợi nhuận.
  - Đảm bảo filter theo branch/time của dashboard và báo cáo revenue vẫn đúng khi có dữ liệu phụ thu/phụ chi.

## Out-of-scope
- Thay thế toàn bộ cơ chế app lock toàn hệ thống hiện có.
- Tích hợp biometric/native passkey của OS.
- Redesign toàn bộ navigation POS ngoài phần tab liên quan task này.
- Thay đổi công thức revenue/profit tổng quát ngoài việc ghi nhận payment hợp lệ.

## Deliverables mong muốn
- Màn hình POS phụ thu/phụ chi usable trong vận hành thật.
- Cơ chế passkey lock cho các tab POS theo policy yêu cầu, có miễn khóa đúng scope.
- Admin settings có thể reset passkey bất kỳ lúc nào không cần passkey cũ.
- Dashboard/revenue chart hiển thị đúng dữ liệu sau khi phát sinh phụ thu/phụ chi tại POS.
- Contract/API/schema docs được cập nhật đủ để vận hành và rollback.

## Done criteria (coding)
- Có route/tab POS cho phụ thu/phụ chi và tạo transaction thành công.
- Màn hình POS và luồng tạo đơn trả truy cập bình thường không cần passkey.
- Các tab POS còn lại bị yêu cầu passkey trước khi truy cập.
- Reset passkey từ admin khiến phiên mở khóa cũ mất hiệu lực ngay.
- Dashboard + Revenue report chart phản ánh đúng dữ liệu phụ thu/phụ chi theo branch/time.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass (hoặc ghi rõ baseline ngoài phạm vi).
- `cd apps/server && npm run build` pass.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary ở web/server.
- [ ] Không duplicate business logic verify lock giữa client và server (server là source-of-truth).
- [ ] Endpoint business mới thuộc `apps/server`; web API chỉ compatibility nếu bắt buộc.
- [ ] Không thêm truy cập Supabase DB từ runtime ngoài `apps/server`.
- [ ] Có migration/cutover note rõ cho settings/passkey fields và caller.

## Regression Scope
- [ ] POS quick-create order flow không regression.
- [ ] Return-order create flow vẫn truy cập được khi chưa unlock các tab khác.
- [ ] Stock/Invoices/Product Entry bị khóa đúng policy khi lock enabled.
- [ ] Direct URL vào tab bị khóa vẫn yêu cầu passkey.
- [ ] Sai passkey hiển thị lỗi đúng, passkey đúng mở khóa đúng màn hình.
- [ ] Reset passkey từ admin làm phiên unlock cũ hết hiệu lực.
- [ ] Payment records phụ thu/phụ chi hiển thị đúng trong payments/report liên quan.
- [ ] Dashboard KPI và chart doanh thu/lợi nhuận cập nhật đúng sau khi tạo phụ thu/phụ chi.

## Nhắc test nhanh
- Manual:
  - Bật lock + set passkey ở settings -> kiểm tra điều hướng POS.
  - Thử truy cập trực tiếp URL tab bị khóa trước và sau unlock.
  - Tạo phụ thu/phụ chi và đối chiếu payment list.
  - Kiểm tra dashboard/revenue report chart trước-sau khi tạo phụ thu/phụ chi (cùng branch, cùng khoảng thời gian).
  - Reset passkey từ admin trong khi staff đang mở phiên -> verify bị yêu cầu unlock lại.
- Commands:
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npm run lint`
  - `cd apps/server && npm run build`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `090` thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 089 /a - [ ] 090 | POS surcharge-expense screen + admin-managed passkey lock for non-POS/non-return-create tabs (reset without old passkey) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 090 |- [x] 090 |" progress/tasks.md
  ~~~
- Append completion log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 090
  - Task file: docs/tasks/090_pos_surcharge_expense_and_admin_passkey_lock.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
