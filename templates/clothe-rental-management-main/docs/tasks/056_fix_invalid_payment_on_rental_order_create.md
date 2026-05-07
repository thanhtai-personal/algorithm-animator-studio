# Task 056 - Fix bug `INVALID_PAYMENT` khi tạo đơn thuê (Dashboard + POS)

## Input ban đầu
- Khi tạo đơn thuê, một số flow trả lỗi `INVALID_PAYMENT_TYPE` / `INVALID_PAYMENT_METHOD` / `INVALID_PAYMENT_STATUS`.
- Lỗi xuất hiện không đúng ngữ cảnh tạo đơn (create order), gây fail tạo đơn dù input đơn thuê hợp lệ.

## Mục tiêu
- Tạo đơn thuê thành công ổn định cho cả dashboard wizard và POS quick-create.
- Tách rõ validation create-order và validation payment để không false-negative.
- Giữ nguyên guard nghiệp vụ payment ở các endpoint payment chuyên dụng.

## Phụ thuộc
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/051_settlement_no_partial_and_debt_lifecycle.md`
- `docs/tasks/053_dashboard_pos_order_creation_parity_inline_customer.md`
- `docs/tasks/012_payments_module_reconciliation.md`

## Mapping màn hình/source
- Create-order client:
  - `apps/web/src/features/orders/hooks/useOrderWizardPage.ts`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
  - `apps/web/src/utils/orders/createOrderContract.ts`
- API/service:
  - `apps/web/src/app/api/orders/route.ts`
  - `apps/web/src/server/services/ordersService.ts`
- Data-access:
  - `apps/web/src/server/data-access/orders.ts`
- Type contracts:
  - `apps/web/src/types/ordersDomain.ts`

## Quy tắc nghiệp vụ bắt buộc
- Create-order phải chỉ validate theo contract tạo đơn (branch/customer/date/status/items/pricing), không fail vì rule payment không liên quan.
- Nếu flow create có dữ liệu payment khởi tạo:
  - phải normalize đúng allow-list type/method/status;
  - nếu sai phải trả lỗi rõ ràng, không mơ hồ và không làm hỏng các flow create không có payment.
- Không làm yếu đi validation payment tại endpoint payment riêng (`add payment`, `update payment status`).
- Không làm đổi semantics doanh thu/cọc đã chốt ở task 052-055.

## In-scope
- Reproduce bug `INVALID_PAYMENT` trên flow tạo đơn thuê hiện tại.
- Sửa root-cause ở contract mapping/normalization/create flow.
- Chuẩn hóa error mapping frontend để thông báo đúng ngữ cảnh.
- Bổ sung regression test/validation checklist cho dashboard + POS create-order.

## Out-of-scope
- Refactor toàn bộ payments module.
- Thay đổi policy nghiệp vụ về payment types/methods ngoài phạm vi bug.

## Prompt gợi ý cho Codex
```text
Mục tiêu: fix bug INVALID_PAYMENT khi tạo đơn thuê.

Yêu cầu:
1) Reproduce được bug ở ít nhất 1 flow thực tế (dashboard hoặc POS).
2) Sửa root-cause để create rental order không fail sai ngữ cảnh payment.
3) Giữ nguyên guard payment ở endpoint payment chuyên dụng.
4) Cập nhật error mapping UI để thông điệp rõ ràng.
5) Không regression create-order SALE/RENTAL hiện có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không còn lỗi `INVALID_PAYMENT*` khi tạo đơn thuê với input hợp lệ.
- Dashboard wizard + POS quick-create đều tạo đơn thuê thành công.
- Các API payment riêng vẫn reject input payment invalid như trước.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Dashboard tạo đơn thuê `DRAFT`, `RESERVED`, `CONFIRMED`.
- POS quick-create đơn thuê với/không có deposit override.
- Verify không ảnh hưởng flow add payment thủ công sau khi tạo đơn.
- Verify thông báo lỗi payment (nếu có) đúng và actionable.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 056 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 055 /a - [ ] 056 | Fix INVALID_PAYMENT bug on rental-order creation flow (dashboard + POS) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 056 |- [x] 056 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 056
  - Task file: docs/tasks/056_fix_invalid_payment_on_rental_order_create.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
