# Task 011 - Order Detail + Pick Up + Return + Incidents

## Mục tiêu
- Hoàn thiện `Order Detail` và các flow vận hành quan trọng: Pick up, Return, incident/fee, refund/settlement.
- Đồng bộ trạng thái order + item + payments + incidents + audit logs.

## Phụ thuộc
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/012_payments_module_reconciliation.md` (không bắt buộc trước; có thể làm song song, nhưng cần thống nhất payment primitives/refund conventions)

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 3, 4.4, 4.6, 10, 11)
- `docs/001_wireframe.md` (Sections 4.3, 4.4, 4.5)

## Prompt gợi ý cho Codex
```text
Mục tiêu: implement Order Detail (tabs) + Pick up modal + Return wizard với incidents/fees/refund theo wireframe.

Yêu cầu:
1) Order Detail /[locale]/orders/[orderId]
   - tabs: Summary, Items, Payments, Incidents, Activity
   - quick actions theo status/quyền
   - hỗ trợ edit/cancel entry points theo role + status policy
   - hiển thị rõ payment/deposit balances (rent/deposit/fees/refund) theo convention đã chốt
   - payment/refund records là thao tác manual phase 1; payment status transitions (ví dụ void) do Admin xử lý thủ công theo task 012
   - hỗ trợ voice input cho các note/reason fields trong modal/drawer (optional MVP, dùng shared primitive nếu đã có)
2) Pick Up flow:
   - checklist items
   - check deposit/payment gate theo config
   - on success: order -> PICKED_UP, items -> ON_RENT, ghi activity/logs
3) Return flow (wizard):
   - item condition checklist (OK/NEED_CLEAN/DAMAGE/LOST)
   - auto late fee + add custom fees
   - deposit settlement/refund
   - on confirm: order -> RETURNED, items -> LAUNDRY/MAINTENANCE/LOST
   - complete order sau settlement -> COMPLETED
   - nếu condition = DAMAGE và policy chọn MAINTENANCE -> tạo maintenance task/work item tối thiểu (hoặc record pending maintenance theo quyết định MVP)
4) Incident management:
   - create incidents (LATE/DAMAGE/LOST/CLEANING)
   - apply to deposit flag
5) Cancel flow (business-critical):
   - allowed statuses theo policy (ít nhất DRAFT/RESERVED/CONFIRMED; chốt rõ PICKED_UP)
   - release reservation windows/locks khi cancel
   - xử lý payment effects:
     - refund deposit (nếu có)
     - refund rent (nếu policy cho phép / theo lý do hủy)
     - payment/refund record status không auto-sync từ gateway; follow manual payment workflow
   - ghi audit log + cancel reason
6) Audit log/activity:
   - status changes, item changes, payment changes, who/when
   - bắt buộc cover actions PRD: sửa giá, huỷ đơn, hoàn cọc, đánh dấu mất/hỏng
7) Guard race conflicts và validation:
   - refund <= deposit paid
   - lost item requires incident
   - cancel không để sót reservation lock hoặc trạng thái item sai

Ưu tiên đúng flow nghiệp vụ hơn UI polish.
```

## Config cần chuẩn bị trước khi chạy task
- Mapping condition -> item status:
  - `OK -> LAUNDRY` (default)
  - `NEED_CLEAN -> LAUNDRY`
  - `DAMAGE -> MAINTENANCE` hoặc `DAMAGED`
- Late fee formula (fixed/day hay percent/day)
- Refund methods hỗ trợ MVP: `CASH`, `BANK`, `MOMO`
- Payment status workflow MVP:
  - manual only (no gateway callback)
  - status transitions `POSTED` / `VOIDED` do Admin
- Có cần action `Complete` tách rời hay auto-complete sau return settlement
- Cancel policy matrix:
  - status nào được cancel
  - role nào được cancel
  - bắt buộc nhập reason hay không
- Cancel refund policy:
  - refund rent/deposit toàn phần/một phần theo status
  - payment type/reason mapping cho refund records
- Reservation release timing:
  - release lock ngay khi cancel transaction commit
- Maintenance task MVP:
  - table riêng `maintenance_tasks`
  - hoặc dùng incident + `needs_maintenance=true` (phải document rõ)
- Voice input scope cho flow vận hành:
  - incident description, cancel reason, return notes, resolution note
  - không auto-confirm action pickup/return/cancel chỉ từ voice input

## In-scope
- Order detail tabs
- Pick up / Return flows
- Incident + fee + deposit settlement
- Activity/audit log UI basic
- Cancel flow từ order detail (release locks + refund integration + audit)
- Maintenance work-item minimal handling cho nhánh `MAINTENANCE` (nếu chọn trong config)

## Out-of-scope
- Customer signature phase 2
- Photo attachments phase 2
- PDF print phase 2

## Deliverables mong muốn
- Flow vận hành end-to-end từ confirm -> pickup -> return -> complete
- Order detail là trung tâm thao tác chính
- Cancel flow không làm lệch locks/payments/audit

## Done criteria (coding)
- Pick up chuyển item ON_RENT đúng
- Return tạo incident/fee/refund đúng công thức
- Refund không vượt deposit paid
- Activity log ghi đủ thao tác quan trọng
- Cancel order release reservation windows đúng và ghi audit/cancel reason
- Cancel/refund (rent/deposit) tuân theo policy đã chốt
- Path `DAMAGE -> MAINTENANCE` có record theo dõi (maintenance task hoặc equivalent documented)
- Voice input (nếu bật) chỉ ghi vào note/reason fields và vẫn đi qua validation/confirm dialogs

## Nhắc test nhanh
- Manual happy path + incident/lost path
- Manual cancel path: DRAFT/RESERVED/CONFIRMED (theo policy)
- Manual verify payment/refund records follow manual status workflow (không có auto callback assumption)
- Manual verify locks released after cancel
- Manual voice input cho incident/cancel/return notes (nếu feature bật)
- Lint/typecheck order detail + flow services
- Verify item statuses reflected ở Inventory module

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 011 |- [x] 011 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 011
  - Task file: docs/tasks/011_order_detail_pickup_return_flow.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
