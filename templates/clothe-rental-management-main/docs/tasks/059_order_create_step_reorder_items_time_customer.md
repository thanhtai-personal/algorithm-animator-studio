# Task 059 - Đổi thứ tự wizard tạo đơn: chọn Items -> Thời gian -> Khách hàng

## Input ban đầu
- Wizard tạo đơn hiện tại đang đi theo thứ tự `Khách hàng -> Thời gian thuê -> Items -> Giá & thanh toán -> Xác nhận`.
- Flow vận hành thực tế của staff/POS thường là:
  - chọn đồ trước,
  - chọn khung thời gian thuê,
  - sau đó mới gán khách hàng.
- Thứ tự hiện tại làm tăng thao tác đổi qua lại giữa các bước và khó chốt danh sách đồ trước khi kiểm tra lịch.

## Mục tiêu
- Đổi thứ tự step wizard để tối ưu thao tác:
  - RENTAL: `Items -> Thời gian thuê -> Khách hàng -> Giá & thanh toán -> Xác nhận`.
  - SALE: `Items -> Khách hàng -> Giá & thanh toán -> Xác nhận` (không có bước thời gian thuê).
- Giữ nguyên contract payload tạo đơn và không regression rule nghiệp vụ đã chốt.
- Đảm bảo state các bước trước không bị mất khi quay lại/chuyển bước.

## Phụ thuộc
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/053_dashboard_pos_order_creation_parity_inline_customer.md`
- `docs/tasks/056_fix_invalid_payment_on_rental_order_create.md`

## Mapping màn hình/source
- Orders wizard (dashboard):
  - `apps/web/src/features/orders/components/OrderWizardPage.tsx`
  - `apps/web/src/features/orders/hooks/useOrderWizardPage.ts`
- POS create-order (nếu đang dùng chung flow/contract):
  - `apps/web/src/features/sales/components/SalesPosPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
- Create-order contract/types:
  - `apps/web/src/utils/orders/createOrderContract.ts`
  - `apps/web/src/types/ordersDomain.ts`
  - `apps/web/src/features/orders/services/ordersClientService.ts`

## Quy tắc nghiệp vụ bắt buộc
- Không cho sang bước `Thời gian` (RENTAL) hoặc `Khách hàng` khi chưa chọn ít nhất 1 item.
- Availability check cuối phải chạy khi đã có đủ `items + rental period` (không chốt giữ chỗ sai thời điểm).
- Không submit nếu thiếu dữ liệu bắt buộc theo từng `orderType`.
- Khi đổi lại items hoặc thời gian:
  - phải re-validate availability trước submit;
  - warning/error phải rõ ràng, không silently pass.
- Không phá luồng inline tạo customer hiện có (dashboard/POS).
- Giữ kiến trúc `Component -> Hook -> Query -> Service -> API`.

## In-scope
- Đổi thứ tự stepper UI + điều hướng next/back theo thứ tự mới.
- Cập nhật validation theo step order mới.
- Đồng bộ labels/text i18n vi/en liên quan step title/instruction nếu có.
- Đồng bộ behavior dashboard/POS nếu đang chia sẻ create-order contract.

## Out-of-scope
- Thay đổi công thức giá/đặt cọc/thanh toán.
- Thay đổi policy blacklist/duplicate customer ngoài phạm vi wizard ordering.
- Refactor lớn module orders/POS không liên quan thứ tự step.

## Prompt gợi ý cho Codex
```text
Mục tiêu: đổi thứ tự wizard tạo đơn để chọn item trước, sau đó chọn thời gian (RENTAL), rồi mới chọn khách hàng.

Yêu cầu:
1) Đổi step order của wizard theo spec mới.
2) Giữ nguyên contract create-order hiện tại (không đổi schema payload).
3) Re-validate availability khi đã có items + time; không submit nếu conflict.
4) Không regression flow inline create customer và flow POS/dashboard parity.
5) Cập nhật text/step labels tương ứng (vi/en).

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Stepper hiển thị và điều hướng theo thứ tự mới.
- RENTAL bắt buộc đi qua `Items -> Thời gian -> Khách hàng` trước khi pricing/confirm.
- SALE bỏ bước thời gian thuê và không phát sinh validation sai.
- Create-order dashboard/POS không regression sau đổi step order.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- RENTAL:
  - chọn items -> chọn thời gian -> chọn khách -> submit thành công.
  - đổi items sau khi đã chọn thời gian, verify re-check availability.
  - đổi thời gian sau khi đã chọn items, verify conflict handling đúng.
- SALE:
  - chọn items -> chọn khách -> submit thành công.
- POS:
  - verify inline create customer vẫn hoạt động khi customer step đứng sau items/time.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 059 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 058 /a - [ ] 059 | Create-order wizard step reorder: Items -> Rental time -> Customer (dashboard + POS parity) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 059 |- [x] 059 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 059
  - Task file: docs/tasks/059_order_create_step_reorder_items_time_customer.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
