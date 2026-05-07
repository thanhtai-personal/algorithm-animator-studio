# Task 010 - Orders List + Create Order Wizard (MVP)

## Mục tiêu
- Implement `Orders List` và `Create Order` multi-step wizard theo wireframe.
- Dùng lại domain core/availability từ task 009.

## Phụ thuộc
- `docs/tasks/009_orders_domain_and_availability_core.md`
- `docs/tasks/005_shared_ui_and_domain_primitives.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.4)
- `docs/001_wireframe.md` (Sections 4.1, 4.2)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Orders List + Create Order wizard (5 bước) theo wireframe, bám kiến trúc layering và dùng data từ task 009.

Yêu cầu:
1) Orders List route /[locale]/orders
   - filter bar: status/date range/customer/staff/payment status (optional fields có thể placeholder)
   - table + pagination + quick actions (confirm/pickup/return/cancel)
   - cancel action có confirm dialog + reason/note tối thiểu (nếu domain hỗ trợ)
2) Create Order route /[locale]/orders/new
   - Step 1 Customer (typeahead + create inline customer)
   - nếu khách có tag `blacklist` -> hiển thị cảnh báo (soft warning, không hard block phase 1)
   - (optional entry) hỗ trợ prefill từ showroom pre-selection list/link nếu `Task 018` đã có output dùng lại được
   - Step 2 Rental period (validation date range)
   - Step 3 Item selection (availability-aware, revalidate khi đổi date)
   - Step 4 Pricing & Payment (rent plan, discount, deposit, add payments manual)
   - Step 5 Review + submit DRAFT/RESERVED/CONFIRMED
   - right sticky summary panel
   - hiển thị tách riêng balance rent/deposit nếu policy đã chốt
   - hỗ trợ voice input cho text/note fields (customer note inline create, order note/internal note, payment note) nếu shared primitive Task 005 đã có
3) Edit order (pre-pickup):
   - hỗ trợ edit DRAFT/RESERVED bằng wizard mode hoặc page riêng
   - đổi date/items phải revalidate availability và hiển thị conflict rõ ràng
4) RBAC:
   - edit price/deposit override Manager+ theo wireframe
   - staff chỉ edit DRAFT/RESERVED; cancel theo policy role/status
5) UX guards:
   - confirm requires >=1 item
   - discount <= subtotal
   - payment > 0
   - reserve/confirm theo payment gate policy (require deposit hay warning)
   - không giả định payment gateway callback/auto-update status trong MVP (payments xử lý thủ công)
6) Data flow:
   - queries fetch/mutate
   - merge store if module store tồn tại
   - UI render from store

Không làm pick-up/return wizard trong task này (sẽ làm task 011), nhưng phải chuẩn bị entry points/actions từ list/detail.
```

## Config cần chuẩn bị trước khi chạy task
- Danh sách filter fields nào làm MVP thật, field nào placeholder
- Chính sách `Balance` hiển thị:
  - tách deposit/rent paid riêng (khuyến nghị)
- VN phone validation regex mức nào
- Stepper persistence:
  - local state trong route
  - hay store tạm của feature orders
- Edit route strategy:
  - `/orders/[id]/edit`
  - hoặc reuse `/orders/new` với mode `edit`
- Blacklist warning UX:
  - banner inline / modal confirm / toast
  - text cảnh báo chuẩn (không block cứng)
- Reserve-without-deposit policy:
  - allow + warning
  - block until deposit > 0
- Pre-selection integration từ showroom page (nếu làm MVP):
  - không tạo lock chỉ vì khách đã shortlist
  - mapping từ product shortlist -> chọn item thực tế vẫn phải qua availability check ở bước tạo order
- Payment mode MVP:
  - manual entry only (không online gateway/callback)
  - status payment mặc định khi tạo record (khuyến nghị `POSTED`)
  - status transitions xử lý ở task 012 (Admin)
- Voice input scope trong Order forms:
  - text/note fields only (khuyến nghị MVP)
  - date/amount/deposit/discount không auto-commit từ voice parse

## In-scope
- Orders list + create wizard 5 bước
- Inline customer create/typeahead reuse
- Pricing summary + validations
- Edit DRAFT/RESERVED flow (UI + integration với domain task 009)
- Cancel quick action cơ bản từ list (nếu domain endpoint đã có)
- Optional prefill from showroom pre-selection (nếu `Task 018` hoàn thành trước)

## Out-of-scope
- Pick up / Return wizard
- Print/export
- Attachment photo incidents
- Refund-on-cancel chi tiết/settlement UI sâu (xử lý chính ở task 011/012, nhưng action/entry point phải rõ)

## Deliverables mong muốn
- Orders list usable
- Create order wizard end-to-end tạo được DRAFT/RESERVED/CONFIRMED
- Edit DRAFT/RESERVED và cancel entry point usable theo quyền

## Done criteria (coding)
- Đổi date range -> item selected được revalidate
- Item unavailable không submit được
- Submit thành công redirect Order Detail (placeholder/detail page)
- Quick actions cơ bản hoạt động theo status
- Khách `blacklist` hiển thị warning nhưng không bị hard block (phase 1)
- Edit DRAFT/RESERVED revalidate availability đúng
- Voice input (nếu bật) không bypass validation date/amount/payment và không auto-submit

## Nhắc test nhanh
- Manual flows: create draft/reserved/confirmed
- Manual flows: edit DRAFT/RESERVED, cancel từ list (nếu bật)
- Manual invalid cases (date, item, discount, payment)
- Manual check: create payment records không phụ thuộc auto callback/status sync
- Manual blacklist customer warning path
- Manual (nếu có) import/prefill từ showroom shortlist không bypass availability validation
- Manual voice input cho note fields + fallback unsupported/permission denied (nếu feature bật)
- Lint/typecheck module orders UI


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 010 |- [x] 010 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 010
  - Task file: docs/tasks/010_orders_list_and_create_flow.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
