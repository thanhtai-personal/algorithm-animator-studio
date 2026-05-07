# Task 061 - Modal xác nhận đã nhận tiền khi tạo đơn thuê/bán (POS + Admin)

## Input ban đầu
- Hiện tại flow tạo đơn thuê/bán ở POS và Admin chưa có bước xác nhận thu tiền rõ ràng.
- Hệ thống chưa có cơ chế thanh toán online realtime, nên không thể coi payment là "đã nhận" nếu chưa có xác nhận thủ công từ nhân viên.
- Rủi ro hiện tại: nhân viên submit đơn nhưng trạng thái thu tiền không được xác nhận minh bạch theo phương thức nhận tiền thực tế.

## Mục tiêu
- Bổ sung modal confirm bắt buộc khi tạo đơn có phát sinh thu tiền:
  - xác nhận nhân viên đã nhận tiền,
  - chọn phương thức nhận tiền (`tiền mặt` hoặc `chuyển khoản`),
  - xác nhận trước khi submit đơn.
- Áp dụng thống nhất cho:
  - Admin create-order wizard (dashboard),
  - POS quick-create order.
- Giữ đồng bộ contract create-order giữa dashboard và POS.

## Phụ thuộc
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/053_dashboard_pos_order_creation_parity_inline_customer.md`
- `docs/tasks/056_fix_invalid_payment_on_rental_order_create.md`
- `docs/tasks/012_payments_module_reconciliation.md`

## Mapping màn hình/source
- Admin create-order:
  - `apps/web/src/features/orders/components/OrderWizardPage.tsx`
  - `apps/web/src/features/orders/hooks/useOrderWizardPage.ts`
- POS create-order:
  - `apps/web/src/features/sales/components/SalesPosPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
- Contract/query/service:
  - `apps/web/src/utils/orders/createOrderContract.ts`
  - `apps/web/src/features/orders/services/ordersClientService.ts`
  - `apps/web/src/features/orders/queries/useOrdersDomainQueries.ts`
  - `apps/web/src/types/ordersDomain.ts`
- API/parser/backend:
  - `apps/web/src/server/services/ordersService.ts`
  - `apps/web/src/server/data-access/orders.ts`

## Quy tắc nghiệp vụ bắt buộc
- Nếu tại thời điểm tạo đơn, số tiền cần ghi nhận là đã thu `> 0`:
  - bắt buộc mở modal xác nhận thu tiền trước submit.
- Modal phải yêu cầu tối thiểu:
  - số tiền đã nhận,
  - phương thức nhận tiền (`CASH` hoặc `BANK` theo mapping hiện hành),
  - xác nhận hành động "đã nhận tiền".
- Không có online payment:
  - không auto-mark "đã nhận" nếu nhân viên chưa confirm trong modal.
- Nếu số tiền thu = 0:
  - không bắt buộc modal xác nhận thu tiền (theo policy task này).
- Payment record tạo cùng order (nếu có) phải phản ánh đúng:
  - `method` đã chọn trong modal,
  - `status` hợp lệ theo contract hiện hành,
  - amount khớp số tiền đã xác nhận.
- Không regression rule tài chính/debt/settlement đã chốt.

## In-scope
- Bổ sung modal confirm nhận tiền trong flow create-order (dashboard + POS).
- Bổ sung state/hook validation để chặn submit khi chưa xác nhận nhận tiền.
- Đồng bộ payload create-order/payment mapping sau confirm.
- Chuẩn hóa text/error i18n vi/en cho modal và validation.

## Out-of-scope
- Tích hợp cổng thanh toán online/QR/auto webhooks.
- Refactor toàn bộ payments module ngoài phạm vi create-order confirm.
- Thay đổi công thức doanh thu/công nợ toàn hệ thống.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm modal xác nhận đã nhận tiền khi tạo đơn thuê/bán ở dashboard và POS.

Yêu cầu:
1) Nếu amount thu > 0, bắt buộc qua modal confirm nhận tiền trước submit.
2) Modal có method: tiền mặt/chuyển khoản và xác nhận đã nhận tiền.
3) Không có online payment thì không auto-post nhận tiền nếu chưa confirm.
4) Đồng bộ contract create-order giữa POS và dashboard.
5) Không regression các flow create-order hiện có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Admin/POS đều hiển thị modal confirm nhận tiền khi tạo đơn có amount > 0.
- Không thể submit đơn khi chưa xác nhận đã nhận tiền.
- Payment method và amount được ghi nhận đúng theo xác nhận modal.
- Không ảnh hưởng flow tạo đơn với amount = 0.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- RENTAL (dashboard + POS):
  - tạo đơn với có cọc/thu tiền -> modal confirm xuất hiện.
  - thử đóng modal không confirm -> submit bị chặn.
  - confirm tiền mặt/chuyển khoản -> submit thành công.
- SALE (dashboard + POS):
  - tạo đơn có thu tiền -> bắt buộc confirm tương tự.
- Case amount = 0:
  - verify không ép modal confirm và tạo đơn thành công.
- Verify record payment/status/method sau create-order khớp lựa chọn modal.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 061 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 060 /a - [ ] 061 | Create-order payment receipt confirmation modal (cash/bank) for POS + Admin flows | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 061 |- [x] 061 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 061
  - Task file: docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
