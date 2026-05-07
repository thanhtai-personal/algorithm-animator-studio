# Task 094 - Rental reserved-first pickup flow + staged deposit/rent/refund payments

## Mục tiêu
- Chuẩn hóa flow thuê đồ theo vận hành thực tế:
  - Sau khi tạo đơn thuê, trạng thái đầu tiên là `RESERVED` = `Hẹn ngày thuê`, không auto `PICKED_UP`.
  - Một item/sản phẩm đã có lịch hẹn thuê vẫn được cho thuê ở đơn khác nếu khoảng thuê mới không trùng `start_date -> end_date` với các lịch hẹn/đơn thuê active.
  - Nhân viên POS chủ động bấm chuyển `RESERVED/CONFIRMED -> PICKED_UP` khi khách lấy đồ.
  - Payment theo giai đoạn: tạo đơn thu cọc, lấy đồ thu tiền thuê, trả đồ hoàn cọc.
- Bổ sung dashboard thống kê nhóm đơn đã tạo/hẹn ngày thuê để theo dõi các đơn chưa pickup.

## Phụ thuộc
- `docs/tasks/009_orders_domain_and_availability_core.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/050_return_order_modal_source_filter_and_sync.md`
- `docs/tasks/056_fix_invalid_payment_on_rental_order_create.md`
- `docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md`
- `docs/tasks/064_return_order_additional_collection_on_return.md`
- `docs/tasks/modules/shipping/001_shipping_module_toggle_and_rental_auto_pickup.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`

## Hiện trạng cần lưu ý
- Domain đã có status `RESERVED`, `CONFIRMED`, `PICKED_UP`, `RETURNED`, `DEBT`, `COMPLETED`, `CANCELLED`.
- Task shipping cũ từng yêu cầu shipping off thì auto `PICKED_UP`; task này thay đổi semantics đó:
  - shipping off không còn đồng nghĩa auto lấy đồ,
  - `PICKED_UP` chỉ xảy ra khi nhân viên xác nhận khách đã lấy đồ.
- Return-order source filter vẫn chỉ lấy đơn `PICKED_UP`, vì chỉ đơn đã lấy đồ mới được trả đồ.

## Config cần chuẩn bị trước khi chạy task
- Chốt copy trạng thái:
  - VI: `RESERVED = Hẹn ngày thuê`, `PICKED_UP = Đã lấy đồ`.
  - EN: `RESERVED = Scheduled`, `PICKED_UP = Picked up`.
- Chốt payment reason/source nếu hệ thống đang dùng enum:
  - cọc khi tạo đơn,
  - tiền thuê khi pickup,
  - hoàn cọc khi return.

## Architecture Impact
- Layers affected:
  - Web orders/POS UI components.
  - Web orders/POS hooks.
  - Web/Nest orders queries/services/API contracts.
  - Orders/returns/payments server application + infrastructure.
  - Calendar/availability consumers nếu đang đọc status hoặc reservation windows.
- Domain affected:
  - Orders, sales POS, payments, return-orders, inventory availability, calendar.
- App(s) affected:
  - `apps/web`
  - `apps/server`

## Current State vs Target State
- Current:
  - Rental create/confirm flow có thể đẩy đơn lên `PICKED_UP` quá sớm.
  - Payment lúc tạo đơn có thể trộn cọc và tiền thuê.
  - POS active order list chưa có action rõ để nhân viên xác nhận `Đã lấy đồ` đúng thời điểm vận hành.
- Target (Architecture V2):
  - Create rental order tạo reservation window và giữ trạng thái `RESERVED`.
  - Availability dựa trên reservation windows active, cho phép book cùng item/sản phẩm nếu khoảng ngày không overlap.
  - POS active list hiển thị đơn `Hẹn ngày thuê` và có button chuyển sang `Đã lấy đồ`.
  - Pickup action thu/ghi nhận tiền thuê và chuyển item sang trạng thái đang thuê theo flow hiện có.
  - Return flow hoàn cọc khi trả đồ và giữ source filter `PICKED_UP`.
  - Dashboard overview có KPI/section riêng cho đơn `RESERVED`/hẹn ngày thuê, không trộn vào nhóm đang thuê/đã lấy.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Backend flow: `Controller -> Application Service -> Data-access/Repository -> Supabase`.
  - Availability/anti-overlap phải được enforce ở backend; UI chỉ hiển thị cảnh báo/disabled state.
  - Reservation windows là nguồn chặn trùng lịch, không dùng item status đơn thuần để quyết định availability tương lai.
  - Payment mutation phải đi qua query/service/API, không gọi trực tiếp từ component.
- Forbidden:
  - Không auto chuyển rental order mới tạo sang `PICKED_UP`.
  - Không chỉ fix UI mà bỏ qua server status/payment contract.
  - Không cho return-order lấy source `RESERVED/CONFIRMED`.
  - Không phá flow SALE.
  - Không thêm Supabase query trực tiếp trong client/web UI.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giữ enum/status hiện có nếu có thể; ưu tiên dùng `RESERVED` thay vì thêm status mới.
  - Nếu dữ liệu cũ đang auto `PICKED_UP`, không retroactively đổi lịch sử; chỉ áp dụng cho đơn mới sau task.
  - Nếu setting shipping toggle còn tồn tại, cập nhật rule để không auto-pickup khi shipping off.
- Deprecation/removal plan:
  - Deprecate behavior `shipping off => auto PICKED_UP` trong docs/task shipping.
  - Nếu có helper/tên hàm auto-pickup cũ, đổi tên hoặc giới hạn để tránh tái sử dụng sai.
- Rollback condition:
  - Nếu pickup/payment staged flow gây sai công nợ hoặc không thể hoàn cọc đúng, rollback riêng các thay đổi payment/status transition, giữ anti-overlap backend hiện hành.

## In-scope
- Rental create flow:
  - Default status sau submit là `RESERVED`.
  - Create payment chỉ thu/ghi nhận cọc.
  - Tạo/giữ reservation windows active cho khoảng thuê dự kiến.
- Availability:
  - Cho phép chọn item/sản phẩm đã có lịch hẹn nếu khoảng ngày thuê mới không overlap với các active reservation windows.
  - Chặn overlap với các đơn `RESERVED/CONFIRMED/PICKED_UP` hoặc status active tương đương.
  - Release window khi cancel/complete theo rule hiện có.
- POS active order list:
  - Hiển thị đơn `RESERVED`/`CONFIRMED` cần pickup.
  - Thêm button/action chuyển sang `PICKED_UP`.
  - Action pickup có confirmation và payment receipt cho tiền thuê.
- Payment:
  - Tạo đơn: thu cọc.
  - Pickup: thu tiền thuê còn phải thu cho rental amount.
  - Return: hoàn cọc, đồng thời vẫn hỗ trợ phụ thu/thu thêm nếu task 064 đang có.
- Return-order:
  - Source filter tiếp tục chỉ lấy `PICKED_UP`.
  - Khi trả đồ, hoàn cọc theo contract payment/refund.
- Dashboard:
  - Bổ sung metrics/card hoặc section cho đơn đã tạo/hẹn ngày thuê (`RESERVED`).
  - Tối thiểu hiển thị số đơn hẹn thuê chưa pickup.
  - Nếu có đủ dữ liệu ngày nhận, hiển thị số đơn hẹn pickup hôm nay và quá hạn pickup.
  - Nếu payment summary có dữ liệu, hiển thị tổng tiền cọc đã thu cho nhóm hẹn thuê.
  - Không cộng `RESERVED` vào KPI đang thuê/đã lấy đồ.
- Labels/status localization:
  - Đổi label phù hợp ở Orders, POS, Calendar, Dashboard nếu đang hiển thị status.

## Out-of-scope
- Xây dựng module vận chuyển đầy đủ.
- Đổi toàn bộ lịch sử payment/order cũ.
- Online payment gateway.
- Chính sách phạt/hủy nâng cao ngoài rule đã có.
- Refactor lớn toàn bộ orders/returns module.

## Deliverables mong muốn
- Task implementation cập nhật đúng status machine rental:
  - `DRAFT? -> RESERVED -> PICKED_UP -> RETURNED -> COMPLETED|DEBT`
  - nhánh `RESERVED|CONFIRMED -> CANCELLED`.
- Server API cho pickup action có thể nhận/ghi nhận rental payment receipt.
- POS active list có action pickup rõ ràng.
- Payment summaries tách rõ:
  - `deposit_due/paid`,
  - `rental_due/paid`,
  - `deposit_refunded/refund_status`,
  - `outstanding_amount`.
- Dashboard metrics/summaries hiển thị backlog hẹn thuê chưa pickup, không trộn với đơn `PICKED_UP`.
- Test cases cho overlap/non-overlap availability.

## Prompt gợi ý cho Codex
```text
Implement rental reserved-first flow.
Use existing RESERVED status as "Hẹn ngày thuê"; do not auto PICKED_UP after create.
Allow booking an item if the requested rental period does not overlap active reservation windows.
On create collect deposit only. Add POS active-list action to transition to PICKED_UP and collect rental amount.
On return refund deposit and keep return source filter PICKED_UP only.
Preserve Component -> Hook -> Query -> Service -> API and backend Controller -> Service -> Data-access.
Run targeted lint/typecheck/build for touched apps.
```

## Done criteria (coding)
- Rental create flow creates order with status `RESERVED` and does not auto `PICKED_UP`.
- Availability backend allows non-overlapping future reservations for the same item/product.
- Availability backend blocks overlapping windows for active rental statuses.
- POS active order list shows `RESERVED` orders and has a `Chuyển sang đã lấy` / pickup action.
- Pickup action transitions order to `PICKED_UP`, updates item lifecycle, and records/requests rental payment.
- Create-order payment records deposit only.
- Return flow refunds deposit and keeps additional collection behavior intact.
- Return-order source filter still only returns `PICKED_UP` rental orders.
- Status labels/localization updated for `Hẹn ngày thuê` / `Scheduled`.
- Dashboard/calendar/order list do not treat `RESERVED` as already picked up.
- Dashboard overview has KPI/section for `RESERVED` rental orders and does not count them as picked-up/on-rent orders.
- Dashboard can surface pickup-today/overdue-pickup counts when pickup date data is available.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.
- `cd apps/server && npm run build` pass if server touched.
- `cd apps/server && npx eslint [files changed]` pass if server touched.

## Done Criteria (Architecture)
- [ ] Không phá client layering `Component -> Hook -> Query -> Service -> API`.
- [ ] Không phá backend layering `Controller -> Application Service -> Data-access/Repository -> Supabase`.
- [ ] Không duplicate business rule availability/payment giữa web và server.
- [ ] Status/payment contract được cập nhật ở types + API + consumers liên quan.
- [ ] Caller cutover list được kiểm tra: dashboard create, POS create, order detail/list, return-order modal, calendar.
- [ ] Rule shipping auto-pickup cũ được deprecate hoặc thay thế rõ.
- [ ] Không thêm Supabase access ngoài `apps/server` cho source-of-truth mới.

## Regression Scope
- [ ] Tạo đơn thuê từ dashboard: status là `RESERVED`, chỉ thu cọc.
- [ ] Tạo đơn thuê từ POS: status là `RESERVED`, chỉ thu cọc.
- [ ] Cùng item, đặt lịch A ngày 01-03 và lịch B ngày 04-06: cho phép.
- [ ] Cùng item, đặt lịch A ngày 01-03 và lịch B ngày 03-05 hoặc 02-04 theo policy overlap đã chốt: bị chặn nếu overlap.
- [ ] POS active list hiển thị đơn hẹn thuê và pickup action.
- [ ] Pickup action thu tiền thuê, chuyển order `PICKED_UP`, item sang đang thuê.
- [ ] Return-order modal chỉ thấy đơn `PICKED_UP`, không thấy `RESERVED`.
- [ ] Return flow hoàn cọc và xử lý phụ thu/thu thêm không regression.
- [ ] Cancel `RESERVED` release reservation window.
- [ ] SALE order flow không đổi.
- [ ] Calendar hiển thị pickup/return đúng theo `RESERVED/PICKED_UP`.
- [ ] Dashboard hiển thị đúng số đơn hẹn thuê chưa pickup.
- [ ] Dashboard hiển thị đúng đơn hẹn pickup hôm nay/quá hạn pickup nếu có dữ liệu phù hợp.
- [ ] Dashboard không cộng đơn `RESERVED` vào KPI đang thuê/đã lấy đồ.

## Nhắc test nhanh
- Test tạo 2 đơn cùng item với 2 khoảng ngày không trùng.
- Test tạo đơn trùng khoảng ngày và xác nhận backend trả lỗi conflict.
- Test POS: tạo đơn -> thấy `Hẹn ngày thuê` -> bấm `Đã lấy đồ` -> thu tiền thuê -> status `PICKED_UP`.
- Test trả đồ: tạo return-order từ đơn đã pickup -> hoàn cọc -> complete/debt đúng.
- Test dashboard/order detail không tự coi đơn mới là đã lấy.
- Test dashboard sau khi tạo đơn thuê mới: KPI/section hẹn thuê tăng, KPI đang thuê không tăng cho tới khi pickup.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật checklist + completion log tại:
  - `progress/tasks.md`
- Checklist item:
  - `094 | Rental reserved-first pickup flow + staged deposit/rent/refund payments`
- Completion log bắt buộc có:
  - `Task file`
  - `Status`
  - `Commit`
  - `Test reminder result`
  - `Main files changed`
  - `Known gaps`
  - `Token usage: input=<n>, output=<n>, total=<n>` hoặc `total=n/a`
