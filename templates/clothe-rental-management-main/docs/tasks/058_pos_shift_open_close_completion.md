# Task 058 - Hoàn thiện mở ca/kết ca POS (shift lifecycle + cash reconciliation)

## Input ban đầu
- POS đã có open/close shift bản cơ bản nhưng chưa đủ chặt cho vận hành thực tế.
- Cần hoàn thiện:
  - rule mở ca/kết ca,
  - trạng thái UX khi ca chưa mở,
  - đối soát tiền cuối ca rõ ràng.

## Mục tiêu
- Hoàn thiện lifecycle ca bán hàng theo branch + staff.
- Kết ca có đối soát `expected cash` vs `actual closing cash` và hiển thị chênh lệch.
- Giảm lỗi thao tác (mở trùng ca, kết ca sai ca, thao tác POS khi chưa mở ca).

## Phụ thuộc
- `docs/tasks/034_staff_sales_pos_unified_module.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/053_dashboard_pos_order_creation_parity_inline_customer.md`

## Mapping màn hình/source
- POS layout + UX:
  - `apps/web/src/features/sales/components/SalesLayout.tsx`
  - `apps/web/src/features/sales/hooks/useSalesLayout.ts`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
- Shift domain:
  - `apps/web/src/types/salesDesk.ts`
  - `apps/web/src/server/data-access/salesDesk.ts`
  - `apps/web/src/server/services/salesDeskService.ts`
  - `apps/web/src/app/api/sales/shift/{current,open,close}/route.ts`
- SQL (nếu cần mở rộng schema):
  - `apps/web/sql/**`

## Quy tắc nghiệp vụ bắt buộc
- 1 staff + 1 branch chỉ có tối đa 1 shift `OPEN` tại cùng thời điểm.
- Không cho mở ca mới khi còn ca `OPEN`.
- Không cho kết ca khi không có ca `OPEN`.
- `openingCash` / `closingCash` phải là số hợp lệ `>= 0`.
- Khi kết ca:
  - tính `expected cash` từ payment hợp lệ trong khoảng ca theo time-basis hiện hành;
  - hiển thị `variance = closingCash - expectedCash`;
  - nếu variance khác 0, bắt buộc xác nhận (và note theo policy).
- Ghi audit event đầy đủ cho open/close + các số liệu đối soát chính.

## In-scope
- Hoàn thiện UI/UX open-close shift (thay prompt rời rạc bằng flow rõ ràng nếu cần).
- Bổ sung summary đối soát tiền cuối ca.
- Bổ sung guard tại POS action quan trọng khi chưa mở ca (theo policy đã chốt).
- Chuẩn hóa error code/message vi/en.

## Out-of-scope
- Tích hợp phần cứng ngăn kéo tiền/in hóa đơn.
- Chấm công/payroll.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện shift open/close cho POS với đối soát tiền cuối ca.

Yêu cầu:
1) Cứng hóa rule lifecycle open/close shift.
2) Tính expected cash theo payment hợp lệ trong khung thời gian ca.
3) Hiển thị variance khi kết ca và yêu cầu xác nhận/note theo policy.
4) Guard action POS khi chưa mở ca (nếu policy yêu cầu).
5) Đồng bộ error handling + i18n vi/en.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Open/close shift chạy ổn định với rule lifecycle rõ ràng.
- Kết ca có expected cash + variance và hiển thị được trên UI.
- POS không cho thao tác trái policy khi chưa mở ca.
- Audit event open/close có đủ metadata đối soát chính.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Mở ca -> thao tác POS -> kết ca với:
  - variance = 0
  - variance != 0
- Thử mở ca khi đã có ca mở.
- Thử kết ca khi không có ca mở.
- Đổi branch và verify ca theo đúng branch scope.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 058 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 057 /a - [ ] 058 | POS shift open/close completion with cash reconciliation and lifecycle guards | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 058 |- [x] 058 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 058
  - Task file: docs/tasks/058_pos_shift_open_close_completion.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
