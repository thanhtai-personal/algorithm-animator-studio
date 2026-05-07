# Task 012 - Payments Module & Reconciliation

## Mục tiêu
- Implement `Payments List` và chuẩn hóa payment records phục vụ đối soát/report.
- Tách rõ các loại giao dịch (rent/deposit/fee/refund) theo PRD.
- Xác định rõ **payment xử lý thủ công phase 1** và **Admin cập nhật trạng thái payment thủ công**.

## Phụ thuộc
- `docs/tasks/009_orders_domain_and_availability_core.md`
- `docs/tasks/010_orders_list_and_create_flow.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.6)
- `docs/001_wireframe.md` (Section 8)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Payments module MVP + integration với Orders, phục vụ đối soát và báo cáo doanh thu.

Yêu cầu:
1) Route /[locale]/payments
   - filters date range/type/method/branch
   - table columns theo wireframe
   - totals theo method và type
   - export CSV (MVP)
2) Chuẩn hóa payment domain:
   - types: RENT / DEPOSIT / FEE / REFUND
   - methods: CASH / BANK / MOMO (manual phase 1)
   - statuses MVP: `POSTED`, `VOIDED` (manual workflow, không auto gateway callback)
   - reason/source tối thiểu cho `REFUND` (refund deposit / refund rent-cancel / manual adjustment) nếu không thêm subtype
   - thống nhất sign convention + posting rules
3) Tích hợp với Orders:
   - add payment trong create/order detail ghi đúng records (manual entry)
   - refund records âm/dương theo convention rõ ràng (document)
   - hỗ trợ cả 2 nhóm refund nghiệp vụ:
     - hoàn cọc sau return/settlement
     - hoàn tiền thuê/cọc khi cancel order (theo policy)
   - bảo đảm balances tách riêng: rent/deposit/fee/refund nhất quán với order summary
4) RBAC:
   - Staff xem branch của mình
   - Manager+ export
   - Admin cập nhật/chuyển trạng thái payment thủ công (`POSTED` / `VOIDED`)
5) Reconciliation rules:
   - daily cashbook summary theo branch/method
   - totals/reports chỉ tính payment hợp lệ (`status=POSTED`), loại trừ `VOIDED`
   - partial payment/refund
   - overpayment handling (nếu cho phép) hoặc explicit block
6) Payment mutation governance:
   - policy edit/delete/void payment (khuyến nghị Admin/Manager+ theo policy, audit bắt buộc)
   - nếu không cho edit/delete thì document `void + new record` strategy
   - payment status transitions là thao tác thủ công của Admin, không có webhook tự đổi trạng thái
7) Voice input for admin payment forms (optional MVP):
   - hỗ trợ dictation cho `reason`, `note`, `void_reason`
   - không auto-commit field số `amount` từ voice parse trong MVP
8) Bám kiến trúc layering + store-first hydration nếu có feature store.
```

## Config cần chuẩn bị trước khi chạy task
- Convention amount/refund:
  - `amount` luôn dương + type=REFUND (khuyến nghị)
  - hoặc refund amount âm (phải nhất quán)
- Payment status workflow (bắt buộc chốt):
  - manual only (không online gateway callback)
  - status list MVP (`POSTED`, `VOIDED`)
  - ai được đổi status (Admin)
  - có cho revert `VOIDED -> POSTED` hay chỉ `void + new record`
- Refund reason/source model:
  - cột riêng `reason`
  - hoặc metadata jsonb
- CSV export columns + timezone/date format
- Branch filter mặc định lấy current branch hay all allowed branches
- Payment allocation model:
  - 1 record = 1 type (đơn giản)
  - hay allocation split table (phức tạp hơn)
- Overpayment policy:
  - block
  - allow + dư chuyển balance/credit
- Payment correction policy:
  - edit/delete
  - void + recreate (khuyến nghị cho audit)
- Voice input scope:
  - text reason/note fields only
  - amount/method/type/status vẫn chọn/nhập tay theo controls chuẩn

## In-scope
- Payments list + filters + totals + CSV export
- Orders payment integration checks
- Posting/reconciliation rules cho partial/refund/cancel-refund
- Admin manual payment status update flow + audit
- Payment correction policy (ít nhất document + guard UI/API)

## Out-of-scope
- Online payment gateway
- Webhook/callback auto cập nhật payment status
- Accounting journal đầy đủ
- Kế toán chuẩn mực double-entry

## Deliverables mong muốn
- Payments module usable cho đối soát ngày
- CSV export MVP
- Ledger/payment convention doc đủ để Orders/Reports dùng nhất quán
- Manual payment status workflow doc + UI/API guard rõ ràng (Admin cập nhật status)

## Done criteria (coding)
- Payment/refund từ Orders xuất hiện đúng ở Payments list
- Totals theo method/type chính xác
- Totals/reports exclude `VOIDED` và chỉ tính `POSTED`
- RBAC export đúng vai trò
- Admin đổi status payment thủ công được; non-admin bị chặn theo policy
- Refund do cancel và refund cọc sau return được phân biệt/trace được
- Order balances (rent/deposit/fees) khớp payment postings theo convention
- Payment correction policy (edit/delete/void) được enforce hoặc documented rõ trong UI/API
- Voice input (nếu bật) không bypass validation/RBAC cho payment void/update status

## Nhắc test nhanh
- Manual add payment/refund -> check payments list
- Manual Admin change payment status (`POSTED`/`VOIDED`) -> check list/totals/report impact
- Manual cancel-order refund -> check payments list + order balances
- Manual partial payment/refund case
- Manual voice input cho reason/note/void_reason (nếu feature bật)
- CSV export sample
- Lint/typecheck payments module


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 012 |- [x] 012 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 012
  - Task file: docs/tasks/012_payments_module_reconciliation.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
