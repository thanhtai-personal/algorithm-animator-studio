# Task 064 - Trả hàng: cho phép thu thêm tiền khi phát sinh hoặc chưa thu đủ

## Input ban đầu
- Trong luồng trả hàng đơn thuê, hiện thao tác thu tiền bổ sung chưa rõ ràng/đầy đủ.
- Nghiệp vụ thực tế cần hỗ trợ:
  - thu thêm khi có phát sinh (trễ hạn, hư hỏng, phí khác),
  - thu phần còn thiếu nếu trước đó chưa thu đủ.

## Mục tiêu
- Ở bước trả hàng/settlement, nhân viên có thể ghi nhận thêm khoản thu ngay tại thời điểm trả.
- Cho phép xử lý cả 2 tình huống:
  - phát sinh thêm tiền phải thu,
  - công nợ cũ chưa thu đủ.
- Đồng bộ money summary, payment records và trạng thái đơn sau khi trả hàng.

## Phụ thuộc
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/051_settlement_no_partial_and_debt_lifecycle.md`
- `docs/tasks/054_financial_formulas_revenue_profit_standardization.md`

## Mapping màn hình/source
- Return flow UI:
  - `apps/web/src/features/orders/components/OrderDetailPage.tsx`
  - `apps/web/src/features/orders/components/ReturnOrderModal.tsx`
  - `apps/web/src/features/orders/hooks/useOrderDetailPage.ts`
  - `apps/web/src/features/orders/hooks/useReturnOrderModal.ts`
- Orders/Payments query-service:
  - `apps/web/src/features/orders/queries/useOrdersDomainQueries.ts`
  - `apps/web/src/features/orders/services/ordersClientService.ts`
- Backend:
  - `apps/web/src/server/services/ordersService.ts`
  - `apps/web/src/server/data-access/orders.ts`

## Quy tắc nghiệp vụ bắt buộc
- Khi xác nhận trả hàng, hệ thống phải cho phép nhập `additional collected amount` (thu thêm).
- Khoản thu thêm phải map vào payment record hợp lệ:
  - type/method/status theo contract hiện hành,
  - amount > 0,
  - có source/reason phù hợp ngữ cảnh return settlement.
- Nếu có phát sinh hoặc còn thiếu tiền:
  - cho phép nhân viên thu ngay một phần/đủ phần tại màn hình trả hàng.
- Nếu sau thao tác trả hàng vẫn còn thiếu:
  - đơn chuyển/trụ ở trạng thái công nợ (`DEBT`) theo rule đã chốt.
- Nếu đã thu đủ toàn bộ nghĩa vụ tài chính:
  - đơn có thể hoàn tất (`COMPLETED`) theo lifecycle hiện có.
- Không làm sai công thức tổng tiền, đã thu, còn thiếu đã chuẩn hóa.

## In-scope
- Bổ sung input/section thu thêm tiền trong luồng return settlement.
- Ghi nhận payment bổ sung tại thời điểm trả hàng.
- Cập nhật summary + status transition đúng sau khi thu thêm.
- Hiển thị rõ cho nhân viên phần:
  - phát sinh phải thu,
  - đã thu thêm,
  - còn thiếu sau trả hàng.

## Out-of-scope
- Tích hợp thanh toán online/gateway.
- Refactor toàn bộ payments module ngoài phạm vi return settlement.
- Thay đổi công thức tài chính cốt lõi đã chốt ở task formula.

## Prompt gợi ý cho Codex
```text
Mục tiêu: cho phép thu thêm tiền ngay tại bước trả hàng đơn thuê.

Yêu cầu:
1) Return flow có input ghi nhận khoản thu thêm (do phát sinh hoặc còn thiếu).
2) Tạo payment record hợp lệ khi xác nhận thu thêm.
3) Cập nhật summary tài chính sau return: total/paid/outstanding.
4) Status lifecycle đúng:
   - còn thiếu -> DEBT
   - thu đủ -> COMPLETED (theo rule hiện hành)
5) Không regression return flow hiện tại.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Return flow cho phép nhập và xác nhận thu thêm tiền.
- Payment bổ sung được ghi nhận đúng method/amount/status/source.
- Outstanding sau return được tính đúng sau khi thu thêm.
- Đơn về `DEBT` hoặc `COMPLETED` đúng theo số còn thiếu.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Case 1: đơn còn thiếu trước khi trả -> thu thêm một phần:
  - verify payment record tạo đúng,
  - verify order về `DEBT` nếu vẫn thiếu.
- Case 2: đơn có phát sinh lúc trả (late fee/custom fee) -> thu đủ ngay:
  - verify payment record + totals,
  - verify order có thể `COMPLETED`.
- Case 3: không thu thêm:
  - verify return flow vẫn chạy đúng theo policy hiện tại.
- Verify hiển thị rõ ràng các chỉ số đã thu/còn thiếu sau action.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 064 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 063 /a - [ ] 064 | Return flow additional collection: allow collecting extra/outstanding amount at rental return settlement | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 064 |- [x] 064 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 064
  - Task file: docs/tasks/064_return_order_additional_collection_on_return.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
