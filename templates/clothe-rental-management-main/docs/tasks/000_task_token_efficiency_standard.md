# Task Token Efficiency Standard

## Mục tiêu
- Giảm token context khi triển khai task.
- Tránh lặp block prompt/test/progress ở nhiều file task.
- Giữ đủ chuẩn kiến trúc theo `docs/architecture/011_task_architecture_compliance_standard.md`.

## Quy tắc bắt buộc
1. Mỗi lượt implement chỉ nạp:
- File task chính đang làm.
- Tối đa 1 file task phụ thuộc trực tiếp.
- Các file code đang sửa.
2. Không nạp toàn bộ `docs/tasks/**` hoặc `docs/architecture/**` trong cùng lượt.
3. Không copy template code/CSS dài vào prompt; chỉ trích block cần sửa.
4. Ngân sách context docs khuyến nghị: `<= 1,200 tokens/lượt`.
5. Nếu vượt budget: tách task thành sub-task nhỏ hơn.
6. Không dùng `master task`; theo dõi tiến độ qua index:
- `progress/tasks.md` hoặc `progress/modules/<module>/tasks.md`.
7. Mọi task mới phải có section `## Implementation Context (Token tối ưu)` theo `docs/tasks/000_task_structure_standard.md`.
8. Khi implement task, ưu tiên đọc context trong task trước; chỉ mở thêm file ngoài danh sách nếu bị blocker hoặc cần xác minh dependency trực tiếp.

## Block dùng chung (tham chiếu thay vì copy)
- Prompt triển khai chuẩn:
  - Dùng theo `AGENTS.md` + ràng buộc trong task hiện tại.
- Validation nhanh mặc định:
  - Web: `cd apps/web && npm run lint && npm run typecheck`
  - Server: `cd apps/server && npm run lint && npm run build`
  - Zalo app: `cd apps/zalo-mini-apps/<app> && npm run lint`
- Cập nhật tiến độ:
  - Cập nhật checklist/completion log tại `progress/tasks.md` hoặc file progress module tương ứng.

## Checklist ngắn trước khi gửi task cho agent
- [ ] Task có đủ 6 section compliance bắt buộc.
- [ ] Task tuân thủ cấu trúc theo `docs/tasks/000_task_structure_standard.md`.
- [ ] Có `Implementation Context (Token tối ưu)` gồm route, entrypoint, file chính và QA nhanh.
- [ ] Không có block prompt dài > 20 dòng.
- [ ] Không có block test/progress lặp lại nếu đã có chuẩn dùng chung.
- [ ] Tài liệu tham chiếu chỉ giữ các link bắt buộc, bỏ danh sách dài không cần thiết.
