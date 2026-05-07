# Task 001 - Foundation: Align Source Base & Tooling

## Mục tiêu
- Chuẩn hóa nền tảng `apps/web` để bắt đầu build hệ thống thuê đồ (admin app + nền tảng cho showroom page khách) từ source base auth hiện tại.
- Xử lý các lệch chuẩn kỹ thuật sớm (lint script, legacy type/schema contract, folder scaffolding).

## Phụ thuộc
- Đọc `docs/tasks/000_task_index.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 5, 8, 11, 12)
- `docs/001_wireframe.md` (Sections 0, 1, 2, 3)
- `.mcp.full.md`
- `AGENTS.md`

## Hiện trạng cần lưu ý
- `apps/web` mới có auth + temporary home (`/`)
- `npm run lint` dùng `next lint` (Next 16 có thể không còn phù hợp)
- `userSettings` type/store còn legacy field của finance app (`ai_*`, `use_ai`, ...)
- Chưa có cấu trúc feature showroom (`products`, `inventory`, `orders`, ...)

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa foundation của apps/web để bắt đầu phát triển hệ thống thuê đồ + showroom page khách theo PRD/wireframe.

Yêu cầu thực hiện:
1) Audit nhanh source base hiện tại và liệt kê mismatch kỹ thuật quan trọng (tooling, type/schema contract, route skeleton).
2) Sửa tối thiểu nhưng đủ dùng:
   - cập nhật script lint để chạy được với Next hiện tại (không dùng next lint nếu gây lỗi)
   - thêm README ngắn hoặc docs note trong apps/web về env vars cần có
   - tạo skeleton folder/features cho các module admin và showroom page khách (chỉ scaffold tối thiểu, không implement business)
   - dọn các legacy type/interface rõ ràng gây lệch schema hiện tại (ưu tiên user settings contract), nhưng không refactor lan rộng ngoài phạm vi
3) Bám kiến trúc Component -> Hook -> Query -> Service -> API/Supabase.
4) Không phá auth flow hiện có (/auth, /auth/callback, /).
5) Báo cáo rõ regression checks đã chạy.

Ưu tiên patch nhỏ, dễ review.
```

## Config cần chuẩn bị trước khi chạy task
- Xác nhận package manager dùng cho repo (`npm` hiện tại).
- Quyết định script lint chuẩn:
  - đề xuất `eslint .` hoặc `eslint src --ext .ts,.tsx`
- Quy ước vị trí module mới:
  - `apps/web/src/features/<module>/...`
  - `apps/web/src/app/[locale]/...` (sẽ dùng ở task sau)
- Quy ước đặt tên enum/domain constants cho showroom (UPPER_SNAKE cho DB status).

## In-scope
- Tooling/lint script
- Docs note env cơ bản cho web
- Scaffold cấu trúc module admin/showroom
- Cleanup contract mismatch nhỏ, rõ ràng

## Out-of-scope
- Implement UI/feature showroom
- Migrate sang locale routing đầy đủ
- Thay DB schema showroom

## Deliverables mong muốn
- `apps/web/package.json` script lint chạy được
- Thư mục scaffold cho modules chính
- Ghi chú config/env trong `apps/web` (hoặc docs task note)
- Danh sách mismatch còn lại (nếu có)

## Done criteria (coding)
- Lint command chạy được trên máy dev hiện tại
- Auth routes hiện có vẫn hoạt động
- Không thêm business logic vào component
- Không import `server/**` từ client code

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npx eslint src --ext .ts,.tsx`
- `cd apps/web && npx tsc --noEmit` (cho phép báo lỗi legacy ngoài phạm vi, nhưng phải ghi rõ)


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 001 |- [x] 001 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 001
  - Task file: docs/tasks/001_foundation_source_base_alignment.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
