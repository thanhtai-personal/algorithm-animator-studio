# Task 007 - Inventory Module (Items + Status Flow)

## Mục tiêu
- Implement inventory items list/detail và status transitions theo PRD/wireframe.
- Làm rõ rule trạng thái item và log chuyển trạng thái.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.3)
- `docs/001_wireframe.md` (Section 5)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Inventory module MVP gồm Items list, Item detail, status transitions + status logs.

Yêu cầu:
1) Routes:
   - /[locale]/inventory
   - /[locale]/inventory/[itemId]
   - /[locale]/inventory/scan (placeholder/input code nếu camera chưa làm)
2) Inventory List:
   - filters status/category/size/branch/search by code
   - table columns theo wireframe
   - actions: view, change status, retire
3) Item Detail:
   - product info, current state, status timeline, rental history placeholder
4) Status transitions:
   - enforce allowed transitions (READY -> RESERVED -> ON_RENT -> LAUNDRY -> READY ...)
   - manager+ mới được mark LOST/DAMAGED nếu policy yêu cầu
   - write item_status_logs đầy đủ who/when/from/to
   - nếu form đổi trạng thái có `reason_note`/`retire_reason`, hỗ trợ voice input cho text note fields (optional MVP)
5) Guard:
   - block READY nếu item còn active reservation window overlap
6) Architecture:
   - component UI only
   - hooks orchestrate
   - queries own request lifecycle
   - service/API/Supabase riêng
```

## Config cần chuẩn bị trước khi chạy task
- Transition matrix chính thức cho MVP (đặc biệt `DAMAGED` vs `MAINTENANCE`)
- Policy laundry tracking:
  - always on
  - configurable (sẽ sync task settings)
- Quick scan MVP:
  - input code only
  - hay web camera (optional)
- Status labels i18n keys map
- Voice input scope cho inventory forms:
  - note/reason text fields only
  - không dùng voice để auto-confirm status transition destructive action

## In-scope
- Inventory list/detail/status change/logs
- Quick scan placeholder route

## Out-of-scope
- QR print phase 2
- Maintenance notes/history sâu phase 2

## Deliverables mong muốn
- Inventory pages usable cho vận hành nội bộ
- Status logs ghi đủ metadata

## Done criteria (coding)
- Invalid transitions bị chặn
- Status change ghi log
- Item ON_RENT hiển thị current order link
- READY blocked khi còn reservation overlap
- Voice input (nếu bật) chỉ cập nhật note/reason field, không auto-submit status change

## Nhắc test nhanh
- Manual status transition matrix test
- Manual inventory filter/search
- Manual voice input cho reason/note field (nếu feature bật)
- Lint/typecheck module inventory


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 007 |- [x] 007 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 007
  - Task file: docs/tasks/007_inventory_items_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
