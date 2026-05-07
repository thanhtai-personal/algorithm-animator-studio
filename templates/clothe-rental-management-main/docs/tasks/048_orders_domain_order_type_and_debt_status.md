# Task 049 - Chuẩn hóa domain đơn: `orderType` + trạng thái `DEBT`

## Input ban đầu
- Cần tách rõ loại đơn: `thuê` và `bán`.
- Cần thêm trạng thái `đơn nợ` để quản lý trường hợp chưa thu đủ tiền.
- State machine hiện tại chưa có `orderType` và chưa có `DEBT`.

## Mục tiêu
- Bổ sung `orderType` vào contract tạo/đọc/cập nhật đơn (`RENTAL | SALE`).
- Bổ sung `DEBT` vào order status enum + label + transition.
- Chốt boundary domain:
  - task này chỉ chuẩn hóa `rental order` và `sale order`;
  - `return order` là entity riêng liên kết bằng `sourceRentalOrderId` (triển khai ở task 051), không thêm `RETURN` vào `orderType` của bảng orders chính.
- Chốt state machine tối thiểu:
  - Rental: `DRAFT -> RESERVED -> CONFIRMED -> PICKED_UP -> RETURNED -> COMPLETED` hoặc `DRAFT -> RESERVED -> CONFIRMED -> PICKED_UP -> RETURNED -> DEBT -> COMPLETED`, có nhánh `CANCELLED` theo policy hiện hành.
  - Sale: `DRAFT -> CONFIRMED -> COMPLETED` hoặc `DRAFT -> CONFIRMED -> DEBT -> COMPLETED`, có nhánh `CANCELLED` theo policy hiện hành.
  - `DEBT` là trạng thái pending công nợ (không terminal).
  - Debt closure: `DEBT -> COMPLETED` (thực hiện qua luồng quản lý đơn nợ ở task 052).
- Chốt mapping label nghiệp vụ tối thiểu để không lệch với flow mới:
  - Rental: `DRAFT=Nháp`, `RESERVED=Đã tạo đơn`, `CONFIRMED=Đã xác nhận cọc`.

## Phụ thuộc
- `docs/tasks/009_orders_domain_and_availability_core.md`
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`

## Mapping màn hình/source
- Domain constants/types:
  - `apps/web/src/types/domainPrimitives.ts`
  - `apps/web/src/constants/domainPrimitives.ts`
  - `apps/web/src/types/ordersDomain.ts`
- Server data-access/service:
  - `apps/web/src/server/data-access/orders.ts`
  - `apps/web/src/server/services/ordersService.ts`
- DB/schema/migration:
  - `apps/web/sql/**` (thêm migration phù hợp)
- Localization:
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`

## Quy tắc nghiệp vụ bắt buộc
- Mọi order phải có `orderType`.
- `orderType` hợp lệ trong orders domain của task này chỉ gồm `RENTAL | SALE`.
- Default cho dữ liệu cũ (nếu không có): backfill thành `RENTAL`.
- `DEBT` là trạng thái công nợ đang mở (không phải trạng thái hoàn tất), chỉ ra công nợ > 0.
- `COMPLETED` bắt buộc công nợ = 0.
- Đơn ở `DEBT` được xem là pending chờ thu nợ, không được coi là kết thúc vòng đời nghiệp vụ.
- `CANCELLED` phải được giữ trong state machine theo policy nghiệp vụ đã có, không làm mất luồng hủy đơn hiện tại.
- Guard pickup phải rõ ràng:
  - khi đơn ở trạng thái hợp lệ để pickup và đáp ứng điều kiện cọc, transition `CONFIRMED -> PICKED_UP` phải thành công;
  - nếu không hợp lệ, trả domain error có reason rõ (không chỉ trả mã chung gây khó debug).
- Guard returned phải rõ ràng:
  - transition `PICKED_UP -> RETURNED` của rental order chỉ được trigger bởi return-order flow hợp lệ ở task 051 (bước xác nhận trả hàng).
  - không cho cập nhật tắt sang `COMPLETED/DEBT` nếu chưa qua `RETURNED`.
- Không dùng một state machine mơ hồ cho cả RENTAL/SALE nếu rule khác nhau.
- API validate phải trả domain error rõ khi transition sai.

## In-scope
- Cập nhật type/enum/constants/transitions.
- Cập nhật parser/validator API và data-access transition guards.
- Migration schema + backfill cho `orderType` (nếu cần).
- Localize label status mới `DEBT`.

## Out-of-scope
- UI modal chi tiết cho create/return (task 050/051).
- Rule settlement no-partial (task 052).
- KPI/report aggregation (task 053).

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm orderType (RENTAL|SALE) và trạng thái DEBT ở domain orders.

Yêu cầu:
1) Cập nhật types/constants/transitions.
2) Cập nhật API parser/validator + data-access guards cho orderType và DEBT.
3) Nếu cần, thêm migration/backfill order_type cho dữ liệu cũ.
4) Cập nhật localization label cho status DEBT.
5) Giữ boundary: orderType task này chỉ gồm RENTAL|SALE, không thêm RETURN.
6) Không đổi UI lớn trong task này.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- `orderType` xuất hiện đầy đủ ở contract frontend/backend.
- Không phát sinh `orderType=RETURN` trong orders domain của task này.
- `DEBT` có trong enum + label + transition map.
- `DEBT` được định nghĩa rõ là pending state, không phải terminal state.
- `CANCELLED` được giữ đúng trong transition map cho RENTAL/SALE theo policy.
- Pickup transition hợp lệ không còn bị chặn sai bằng lỗi `PICKUP_NOT_ALLOWED`.
- Returned transition đi đúng `PICKED_UP -> RETURNED` trước khi qua trạng thái cuối.
- Transition invalid trả lỗi đúng.
- Dữ liệu cũ không vỡ (có migration/backfill strategy rõ ràng).
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Tạo đơn mới với `orderType=RENTAL` và `orderType=SALE`.
- Verify parser/validator từ chối `orderType=RETURN` ở create/update orders API.
- Test transition `DEBT -> COMPLETED`.
- Verify đơn ở `DEBT` được xem là pending/open debt trong domain model.
- Test chặn transition sai theo loại đơn.
- Test case pickup hợp lệ (`CONFIRMED -> PICKED_UP`) không báo `PICKUP_NOT_ALLOWED`.
- Test không thể set `COMPLETED/DEBT` trực tiếp từ `PICKED_UP` nếu chưa qua `RETURNED`.
- Verify label `DEBT` hiển thị đúng ở vi/en.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 049 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 048 /a - [ ] 049 | Orders domain: add orderType (RENTAL|SALE) + DEBT status and transitions | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 049 |- [x] 049 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 049
  - Task file: docs/tasks/049_orders_domain_order_type_and_debt_status.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
