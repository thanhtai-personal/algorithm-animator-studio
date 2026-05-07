# Task Structure Standard (Theo mẫu Task 003)

## Mục tiêu
- Chuẩn hóa cấu trúc file task theo mẫu tại `docs/tasks/003_auth_profiles_rbac_branching.md`.
- Tránh task dạng "master task" khó theo dõi.
- Bắt buộc theo dõi trạng thái task qua index ở `progress/**`.

## Rule bắt buộc
1. Mọi task mới phải theo đúng thứ tự section:
- `## Mục tiêu`
- `## Phụ thuộc`
- `## Tài liệu tham chiếu`
- `## Hiện trạng cần lưu ý`
- `## Implementation Context (Token tối ưu)`
- `## Config cần chuẩn bị trước khi chạy task`
- `## Architecture Impact`
- `## Current State vs Target State`
- `## Boundary Rules`
- `## Compatibility & Migration Strategy` (nếu có cutover)
- `## In-scope`
- `## Out-of-scope`
- `## Deliverables mong muốn`
- `## Done criteria (coding)`
- `## Done Criteria (Architecture)`
- `## Regression Scope`
- `## Nhắc test nhanh`
- `## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)`
2. `## Prompt gợi ý cho Codex` là optional. Nếu dùng, giới hạn tối đa 12 dòng.
3. Không tạo `master task` để gom việc triển khai.
4. `## Implementation Context (Token tối ưu)` bắt buộc phải đủ ngắn và đủ cụ thể để agent chạy task không phải quét lại toàn repo:
- Route/screen chính cần mở.
- Entry component/hook chính.
- File nên đọc/sửa trước, tối đa 3-6 file.
- File/tài liệu chỉ đọc khi cần, tối đa 1-2 link.
- Boundary cần giữ nguyên trong lượt implement.
- Viewport/flow kiểm tra nhanh nếu là task UI/responsive.
5. Khi mở module task mới, bắt buộc tạo index theo dõi:
- `progress/modules/<module>/tasks.md`
6. Nếu module mới chưa có trong danh sách index, phải cập nhật:
- `progress/modules/tasks.md`
7. Mọi task phải có đường dẫn cập nhật tiến độ vào đúng file progress index tương ứng.

## Quy tắc đặt tên
- Task root: `docs/tasks/NNN_<slug>.md`
- Task module: `docs/tasks/modules/<module>/NNN_<slug>.md`
- Progress index module: `progress/modules/<module>/tasks.md`

## Tài liệu liên quan
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/000_task_template_architecture_v2.md`
- `docs/tasks/000_task_token_efficiency_standard.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
