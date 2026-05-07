# Task 052 - Settlement không partial + vòng đời đơn nợ (`DEBT`)

## Input ban đầu
- Không cho phép hoàn thành đơn bằng thanh toán một phần.
- Nếu còn thiếu tiền thì quản lý bằng trạng thái `DEBT`.
- Khi thu đủ nợ thì chuyển `DEBT -> COMPLETED`.

## Mục tiêu
- Enforce rule tài chính ở backend và UI actions:
  - complete chỉ khi thu đủ.
  - còn thiếu thì sang `DEBT`.
- Chuẩn hóa luồng thu nợ để đóng đơn nợ an toàn.
- Chốt `DEBT` là trạng thái pending công nợ (không kết thúc đơn).
- Bổ sung màn hình quản lý đơn nợ để nhân viên theo dõi và cập nhật hoàn tất nợ.
- Chuẩn hóa default số tiền trong form thanh toán theo số còn phải thu.
- Sửa nhánh xác nhận nhận đồ để không còn lỗi `PICKUP_NOT_ALLOWED` sai điều kiện.

## Phụ thuộc
- `docs/tasks/049_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/051_return_order_modal_source_filter_and_sync.md`
- `docs/tasks/012_payments_module_reconciliation.md`

## Mapping màn hình/source
- UI:
  - `apps/web/src/features/orders/components/OrderDetailPage.tsx`
  - `apps/web/src/features/orders/hooks/useOrderDetailPage.ts`
  - `apps/web/src/features/orders/components/OrdersListPage.tsx`
  - `apps/web/src/features/orders/components/DebtOrdersPage.tsx` (màn hình quản lý đơn nợ)
  - `apps/web/src/features/orders/hooks/useDebtOrdersPage.ts`
- Query/service:
  - `apps/web/src/features/orders/queries/useOrdersDomainQueries.ts`
  - `apps/web/src/features/orders/services/ordersClientService.ts`
- Backend:
  - `apps/web/src/server/services/ordersService.ts`
  - `apps/web/src/server/data-access/orders.ts`

## Quy tắc nghiệp vụ bắt buộc
- Action complete/settlement:
  - chặn nếu `outstandingAmount > 0`.
  - với action hoàn tất đơn, payment phải đủ phần còn thiếu tại thời điểm thực hiện (không hỗ trợ complete bằng partial payment).
- Form thanh toán:
  - mặc định `amount = outstandingAmount` tại thời điểm mở form;
  - với đơn chưa có payment thì amount mặc định bằng tổng số tiền cần thu của đơn;
  - khi có nợ và mở form thu nợ, amount mặc định bằng phần nợ còn lại.
- Nếu chốt trả hàng nhưng còn thiếu:
  - chuyển trạng thái đơn về `DEBT`.
- Thu nợ:
  - chỉ chấp nhận payment hợp lệ theo rule hiện tại.
  - các payment thiếu trước đó không được dùng để complete trực tiếp; đơn phải ở `DEBT` để theo dõi.
  - luồng chuẩn phase này không xử lý partial payment cho action thu nợ: khi xác nhận thu nợ, `amount` phải bằng `outstanding` tại thời điểm thao tác.
  - dữ liệu partial lịch sử (nếu có) vẫn phải được cộng/trừ đúng vào outstanding để theo dõi nợ.
  - khi outstanding về 0, đơn vẫn ở `DEBT` pending cho tới khi nhân viên xác nhận hoàn tất nợ từ màn hình quản lý đơn nợ.
  - chỉ cho phép `DEBT -> COMPLETED` thông qua action xác nhận hoàn tất nợ ở màn hình quản lý đơn nợ.
- Chặn overpay ở các action thu nợ liên quan.
- Pickup confirm:
  - khi đơn đang ở trạng thái cho phép pickup và đủ điều kiện nghiệp vụ thì phải cho xác nhận nhận đồ thành công;
  - khi không đủ điều kiện thì trả lỗi có message rõ nguyên nhân (không để lỗi mơ hồ).
- Boundary trạng thái:
  - rule `DEBT -> COMPLETED` trong task này áp dụng cho rental/sale order;
  - vòng đời return-order theo state machine riêng ở task 051.
- Màn hình quản lý đơn nợ:
  - hiển thị danh sách đơn `DEBT` với các thông tin tối thiểu: mã đơn, khách hàng, số nợ còn lại, ngày cập nhật gần nhất.
  - cho phép nhân viên mở chi tiết và xác nhận `Hoàn tất nợ` khi outstanding = 0.
  - chặn action hoàn tất nợ nếu outstanding > 0.
  - có entry point rõ trên UI (menu/tab/route) để nhân viên truy cập được danh sách đơn nợ.

## In-scope
- Enforce rule no-partial-completion ở backend.
- Update UI messaging/CTA theo trạng thái `DEBT`.
- Implement debt-closure path (`DEBT -> COMPLETED`).
- Implement màn hình quản lý đơn nợ cho nhân viên.
- Chuẩn hóa default amount trong payment form.
- Fix pickup confirm false negative (`PICKUP_NOT_ALLOWED`).

## Out-of-scope
- Công thức KPI/report doanh thu tổng hợp (task 053).
- POS parity flow (task 054).

## Prompt gợi ý cho Codex
```text
Mục tiêu: enforce settlement không partial và hoàn thiện vòng đời DEBT.

Yêu cầu:
1) Backend chặn complete khi outstanding > 0.
2) Nếu còn thiếu sau return/settlement thì chuyển DEBT.
3) DEBT là pending state; không auto complete khi outstanding về 0.
4) Thêm màn hình quản lý đơn nợ để nhân viên xác nhận DEBT -> COMPLETED sau khi đã thu đủ.
5) Payment form mặc định amount = outstanding hiện tại.
6) Payment thiếu không được bypass DEBT để complete trực tiếp.
7) UI cập nhật CTA/message theo DEBT.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không thể complete khi còn outstanding.
- Không thể complete bằng partial-settlement.
- Có trạng thái DEBT và luồng đóng nợ rõ.
- Payment thiếu không thể bypass flow DEBT để complete trực tiếp.
- Action thu nợ yêu cầu `amount = outstanding` (không xử lý partial payment trong flow chuẩn phase này).
- DEBT được giữ pending cho tới action xác nhận hoàn tất nợ của nhân viên.
- Có màn hình quản lý đơn nợ liệt kê và xử lý đơn DEBT.
- Chỉ cho phép `DEBT -> COMPLETED` khi outstanding = 0 và nhân viên xác nhận hoàn tất nợ.
- Payment form mở ra có số tiền mặc định đúng bằng outstanding hiện tại.
- Pickup confirm pass khi đủ điều kiện, không còn false `PICKUP_NOT_ALLOWED`.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Test case outstanding > 0:
  - bấm complete bị chặn.
  - trạng thái đi DEBT đúng rule.
- Thu nợ đủ:
  - đơn ở trạng thái `DEBT` pending cho tới khi nhân viên bấm `Hoàn tất nợ`.
- Mở payment form ở các tình huống:
  - đơn mới chưa thu tiền,
  - đơn đang DEBT,
  - verify amount mặc định luôn đúng outstanding.
- Test overpay/underpay:
  - bị chặn đúng.
- Verify payment thiếu từ trước vẫn buộc đơn đi luồng `DEBT` trước khi có thể `COMPLETED`.
- Verify màn hình quản lý đơn nợ:
  - chỉ hiển thị đơn trạng thái `DEBT`,
  - chặn `Hoàn tất nợ` nếu outstanding > 0,
  - cho phép `Hoàn tất nợ` khi outstanding = 0.
- Verify action thu nợ:
  - nếu nhập amount khác outstanding thì bị chặn theo rule no-partial của phase này.
- Test pickup confirm với đơn đủ điều kiện:
  - không còn lỗi `PICKUP_NOT_ALLOWED`.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 052 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 051 /a - [ ] 052 | Settlement rules: no-partial completion + DEBT lifecycle | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 052 |- [x] 052 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 052
  - Task file: docs/tasks/052_settlement_no_partial_and_debt_lifecycle.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
