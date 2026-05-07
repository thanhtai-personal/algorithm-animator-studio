# Task 080 - Zalo Mini App checkout: payment flow + callback + reconciliation

## Input ban đầu
- Mini app cần nhận thanh toán in-app để chốt đơn.
- Zalo payment flow yêu cầu phối hợp chặt giữa client SDK và server:
  - server tạo đơn thanh toán,
  - client mở payment sheet,
  - server nhận callback và đối soát.

## Mục tiêu
- Tích hợp end-to-end payment flow cho mini app:
  - `createOrder` (server),
  - `openPayment` (client),
  - callback + `checkTransaction` (server/client verify).
- Đồng bộ trạng thái thanh toán về module orders/payments hiện có.

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/003_zalo_mini_app_catalog_order_draft_and_oa_support.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md`

## Mapping màn hình/source
- Mini app checkout:
  - `apps/zalo-mini-app/src/features/checkout/**` (new)
  - `apps/zalo-mini-app/src/features/checkout/services/zaloPaymentClientService.ts` (new)
- Backend payment API:
  - `apps/web/src/app/api/zalo-mini-app/payment/create-order/route.ts` (new)
  - `apps/web/src/app/api/zalo-mini-app/payment/callback/route.ts` (new)
  - `apps/web/src/app/api/zalo-mini-app/payment/check-transaction/route.ts` (new)
  - `apps/web/src/server/services/zaloMiniAppPaymentService.ts` (new)
  - `apps/web/src/server/data-access/zaloMiniAppPayment.ts` (new)
- Domain integration:
  - `apps/web/src/server/services/ordersService.ts`
  - `apps/web/src/server/services/paymentsService.ts`

## Quy tắc nghiệp vụ bắt buộc
- Security:
  - `appSecret` chỉ dùng ở server để tính/verify checksum.
  - callback phải verify chữ ký trước khi update trạng thái.
- Idempotency:
  - callback/process payment phải chống xử lý trùng.
- Reconciliation:
  - sau openPayment client phải re-check transaction nếu trạng thái chưa chắc chắn.
- Accounting integrity:
  - mapping đúng vào ledger/payments hiện có, không tạo số liệu chênh.

## In-scope
- Build full payment flow theo SDK + backend callback.
- Mapping payment status với order status.
- Log/audit cho create/callback/recheck transaction.

## Out-of-scope
- Split payment đa cổng.
- Tích hợp hoàn tiền tự động nâng cao.
- Settlement tài chính liên ngân hàng ngoài hệ thống hiện tại.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tích hợp thanh toán Zalo Mini App end-to-end cho checkout.

Yêu cầu:
1) Server có endpoint createOrder, callback, checkTransaction theo flow chính thức.
2) Client gọi openPayment và xử lý kết quả/fallback hợp lệ.
3) Verify checksum/signature đầy đủ, appSecret không lộ client.
4) Cập nhật order/payment state nhất quán với services hiện có.
5) Chống xử lý callback trùng và có audit log.

Validation commands:
- cd apps/zalo-mini-app && npm run lint
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Checkout mini app thanh toán được từ flow chuẩn.
- Callback + recheck transaction cập nhật đúng trạng thái đơn/thanh toán.
- Không lộ secret ở client; signature/checksum được verify ở server.
- `cd apps/zalo-mini-app && npm run lint` pass.
- `cd apps/web && npm run typecheck` pass.

## Nhắc test nhanh
- Happy path: createOrder -> openPayment success -> order paid.
- Pending path: openPayment chưa rõ trạng thái -> checkTransaction resolve.
- Callback duplicate: không double-book payment.
- Signature sai: callback bị từ chối, không cập nhật trạng thái.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/004` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/004 |- [x] Modules/Zalo-Mini-App/004 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/004
  - Task file: docs/tasks/modules/zalo-mini-app/004_zalo_mini_app_checkout_payment_and_reconciliation.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
