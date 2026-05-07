# Task 009 - Orders Domain Core + Availability + Anti-Overlap

## Mục tiêu
- Hoàn thiện tầng domain/backend cho orders trước khi build UI flow đầy đủ.
- Đảm bảo kiểm tra availability và chống double booking đúng ở DB + app.

## Phụ thuộc
- `docs/tasks/002_supabase_schema_showroom_core.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/008_customers_crm_module.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 3, 4.4, 7.3, 10, 11)
- `docs/001_wireframe.md` (Sections 4.1, 4.2, 13)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây order domain core (server/data-access/service/query contracts) cho showroom, tập trung availability + pricing totals + anti-overlap trước UI nặng.

Yêu cầu:
1) Tạo các service/API/query contract cho:
   - check item availability theo date range
   - create draft/reserved/confirmed order
   - edit order (ít nhất cho DRAFT/RESERVED; nếu cho CONFIRMED thì theo quyền + audit)
   - cancel order + release reservation locks
   - add/remove order items (pre-pickup)
   - compute totals (rent/discount/deposit/fees placeholder)
   - compute balances cơ bản: deposit_paid, rent_paid, fee_paid, refundable_deposit (hoặc contract equivalent)
2) Đồng bộ logic với DB constraint:
   - app-level precheck availability
   - DB-level anti-overlap (reservation windows / exclude constraint)
   - xử lý race conflict trả lỗi domain-friendly
   - khi edit/cancel order phải cập nhật/release reservation windows nhất quán
3) Chuẩn hóa status machine cho order:
   - DRAFT, RESERVED, CONFIRMED, PICKED_UP, RETURNED, COMPLETED, CANCELLED
   - xác định allowed transitions + role constraints ở service layer
4) Chốt business semantics tránh mơ hồ:
   - phân biệt `item.status = RESERVED` và `reservation_window` (theo date range)
   - document rõ khi nào item giữ `READY` nhưng đã có lock date-range
   - document rule cancel/refund obligations theo từng status (DRAFT/RESERVED/CONFIRMED/PICKED_UP)
5) Tạo adapters/types rõ ràng giữa DB rows và UI DTO
6) Định nghĩa audit write-points contract (ít nhất level domain event) cho:
   - edit price/discount/deposit
   - cancel order
   - refund
   - mark lost/damaged (để task 011/012 dùng lại)
   - nếu `Task 002` chưa có audit log storage schema phù hợp, bổ sung migration supplement tối thiểu cho `audit_events`/equivalent trước khi implement writes
7) Viết tests (nếu project chưa có test infra thì tạo ít nhất test plan/manual script) cho:
   - overlap blocked
   - totals formula cơ bản
   - invalid date range
   - cancel releases locks
   - edit date range revalidates locks

Chưa cần full UI multi-step create order ở task này.
```

## Config cần chuẩn bị trước khi chạy task
- Quy tắc date range canonical (`[start, end)` khuyến nghị)
- Reservation semantics:
  - `A)` dùng `reservation_window` là source of truth; `item.status=RESERVED` chỉ là optional derived UI state
  - `B)` cập nhật `item.status=RESERVED` cho booking active (dễ conflict hơn, cần rule rõ)
- Pricing policy MVP:
  - gói 1/3/7 ngày + custom per day
  - cách chọn plan mặc định
- Deposit policy:
  - theo item/variant/product hay cả order
- Payment allocation/balance policy:
  - tách riêng `deposit_paid`, `rent_paid`, `fee_paid`
  - quy tắc overpayment / carry-over (nếu có)
- Pick-up payment gate policy:
  - require deposit > 0 hay chỉ warning
- Cancel/refund policy matrix theo order status:
  - `DRAFT`
  - `RESERVED`
  - `CONFIRMED`
  - `PICKED_UP` (có cho cancel không? hay bắt buộc return flow)
- Error code/messages cho conflict availability

## In-scope
- Orders domain server/query core
- Availability + anti-overlap integration
- Totals calculation core (không cần full UI)
- Edit/cancel domain rules + reservation release/update logic
- Domain-level audit event contracts (write-points) cho actions quan trọng
- Audit log storage supplement (nếu thiếu từ Task 002)

## Out-of-scope
- Full order detail UI
- Return/incidents UI (task 011)

## Deliverables mong muốn
- API/service/query contracts ổn định cho Orders UI tasks
- Conflict handling rõ ràng
- Pricing/totals helper dùng lại được

## Done criteria (coding)
- Tạo order với item unavailable bị block
- Race condition gây conflict trả lỗi rõ ràng
- Total = sum(item rent) - discount + fees (theo PRD)
- Status transitions invalid bị chặn ở service layer
- Edit/cancel order cập nhật/release reservation windows đúng
- Có tài liệu/contract rõ về `item.status RESERVED` vs `reservation_window`
- Có audit event/write-point contract cho edit/cancel/refund
- Nếu Task 002 chưa có audit storage, đã bổ sung migration supplement + write path hoạt động

## Nhắc test nhanh
- Manual/API tests cho overlap
- Manual/API tests cho edit date range + cancel release locks
- Lint/typecheck orders server/query/domain files
- Nếu có test runner: chạy test domain/orders


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 009 |- [x] 009 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 009
  - Task file: docs/tasks/009_orders_domain_and_availability_core.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
