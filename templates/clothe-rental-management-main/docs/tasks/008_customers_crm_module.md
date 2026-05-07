# Task 008 - Customers Module (CRM Lite)

## Mục tiêu
- Implement khách hàng (list + detail) phục vụ tạo đơn và tra cứu lịch sử.
- Đảm bảo uniqueness/suggest theo số điện thoại.

## Phụ thuộc
- `docs/tasks/002_supabase_schema_showroom_core.md`
- `docs/tasks/005_shared_ui_and_domain_primitives.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.5)
- `docs/001_wireframe.md` (Section 7)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Customers module MVP để phục vụ Orders flow.

Yêu cầu:
1) Routes:
   - /[locale]/customers
   - /[locale]/customers/[customerId]
2) Customers List:
   - search name/phone
   - filter tags (VIP/blacklist)
   - columns theo wireframe: total orders/spent/last order/tags
3) Customer Detail:
   - contact info
   - tags + notes
   - orders history table
   - incidents summary (MVP có thể aggregate đơn giản)
   - hỗ trợ voice input cho text fields (full name/address/note) nếu shared primitive Task 005 đã có
4) Form validation:
   - phone required
   - phone uniqueness (hard hoặc soft theo config)
   - phone format VN-friendly
5) Tạo API/query/service hỗ trợ typeahead by phone/name (để task Orders dùng lại)
6) Bám kiến trúc layering; tránh logic query trong component.
```

## Config cần chuẩn bị trước khi chạy task
- Unique phone policy:
  - hard unique per branch
  - hard unique toàn hệ thống
  - soft warn (PRD khuyến nghị strong)
- Customer tags MVP list: `vip`, `blacklist`
- PII policy cơ bản (mask phone ở role nào nếu cần)
- Voice input policy cho phone:
  - cho phép dictation + review/normalize trước khi save
  - hoặc disable voice cho `phone` field trong MVP

## In-scope
- Customers CRUD MVP + list/detail
- Typeahead/search API cho Orders

## Out-of-scope
- CRM automation, Zalo/email reminders
- Advanced segmentation

## Deliverables mong muốn
- Module Customers usable
- Shared customer typeahead query hook/service

## Done criteria (coding)
- Tạo/sửa khách thành công
- Search phone/name nhanh, debounced
- Duplicate phone handling đúng policy
- Customer detail hiển thị lịch sử đơn cơ bản
- Voice input (nếu bật) không bypass phone validation/uniqueness checks

## Nhắc test nhanh
- Manual CRUD/search
- Manual voice input cho full name/note (và phone nếu bật) + validation review path
- Lint/typecheck module customers


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 008 |- [x] 008 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 008
  - Task file: docs/tasks/008_customers_crm_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
