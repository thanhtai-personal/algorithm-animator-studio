# Task 000 - KATA Charm: Reset clone hiện tại trước khi chạy lại

## Mục tiêu
- Xóa/reset phần clone template Charm hiện tại khi kết quả clone chưa đạt và cần chạy lại.
- Trả codebase về trạng thái sạch cho nhánh Charm trước khi chạy Task 001.

## Phụ thuộc
- Không bắt buộc. Đây là task tiền xử lý cho trường hợp rerun.

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/clone-UI-templates/kata-charm/001_clone_parity_mock.md`

## Architecture Impact
- Layers affected: template component layer trong `apps/web` (cleanup/reset).
- Domain affected: product landing template Charm.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current: code clone Charm cũ có thể lệch chuẩn hoặc chứa thay đổi dở dang.
- Target (Architecture V2): có baseline sạch để thực thi lại chuỗi 001 -> 002 -> 004 -> 003.

## Boundary Rules
- Must keep:
  - Giữ cấu trúc import/renderer compile-safe sau reset.
  - Chỉ reset phạm vi template Charm.
- Forbidden:
  - Không reset/xóa file của theme khác (3D/Modern/Default).
  - Không đụng business flow ngoài phạm vi clone Charm.

## Compatibility & Migration Strategy
- Compatibility window: task này chỉ dùng khi rerun, không bắt buộc ở lần triển khai đầu.
- Rollback condition: nếu reset quá tay gây lỗi compile, khôi phục file từ commit gần nhất trước reset.

## In-scope
- Reset file template Charm: `apps/web/src/features/product-landing/components/templates/ProductLandingTemplateCharm.tsx`.
- Đảm bảo renderer mapping vẫn giữ đường dẫn component hợp lệ sau reset.

## Out-of-scope
- Clone UI mới cho Charm (Task 001).
- Refactor (Task 002), cấu hình data schema (Task 004), bind data runtime (Task 003).

## Done criteria (coding)
- [ ] Template Charm cũ đã được reset/xóa theo phạm vi cho phép.
- [ ] Không còn artifact clone cũ gây nhiễu khi chạy lại Task 001.
- [ ] Build/lint không vỡ vì thiếu import path template Charm.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Chỉ tác động phạm vi template Charm.

## Regression Scope
- [ ] Renderer vẫn chạy fallback an toàn, không crash do missing component.
- [ ] Không ảnh hưởng output của template 3D/Modern/Default.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- `- [ ] 000 | Charm rerun reset clone state | ...`
