# Task 007 - Homepage 3D: Visual edit mode kéo thả icon store trên homepage chung

## Mục tiêu
- Bổ sung visual edit mode cho homepage chung để super admin kéo thả icon store trực tiếp trên bản đồ.
- Cho phép đổi vị trí icon bằng thao tác drag-drop, preview tức thời trước khi lưu/publish.

## Phụ thuộc
- `docs/tasks/modules/homepage-3d/006_homepage_3d_super_admin_global_homepage_editor_access_and_scope.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/tasks/000_task_structure_standard.md`

## Hiện trạng cần lưu ý
- Homepage chung đã có map + marker nhưng thiên về dữ liệu contract, chưa có visual drag-drop editor cho marker.
- Settings visual editor hiện đang phục vụ chủ yếu cho text/image/section config.

## Config cần chuẩn bị trước khi chạy task
- Chốt hệ tọa độ lưu vị trí icon:
  - Option A: `%` theo container map (`xPct`, `yPct`) (khuyến nghị).
  - Option B: lat/lng + projection nội bộ.
- Chốt hành vi snapping/grid (có hoặc không).
- Chốt giới hạn vùng kéo thả hợp lệ (không cho kéo ra ngoài khung map).

## Architecture Impact
- `apps/web`: settings showroom visual editor (component drag layer, hook state, query mutation save).
- `apps/web`: homepage map renderer dùng cùng dữ liệu vị trí đã lưu.
- `apps/server`: validate payload marker positions.

## Current State vs Target State
- Current: chỉnh marker position chưa có visual mode thao tác trực tiếp.
- Target: super admin kéo thả marker trong editor, lưu position và publish ra homepage chung.

## Boundary Rules
- Must keep: logic tương tác nằm trong hook/store, component chỉ render + event binding.
- Must keep: save qua mutation/service, không ghi trực tiếp DB từ web.
- Forbidden: hardcode vị trí icon trong component runtime cho global homepage.
- Forbidden: business validation nằm trong component UI.

## Compatibility & Migration Strategy
- Marker position cũ (nếu thiếu) fallback theo preset/default.
- Payload mới phải tương thích với consumer cũ trong thời gian chuyển đổi.

## In-scope
- UI visual edit mode cho marker layer.
- Drag start/move/end + clamp boundary map.
- Preview marker theo locale/theme hiện hành trong editor.
- Save draft + publish position.

## Out-of-scope
- Phân quyền editor (Task 006).
- Data model nhiều icon cho 1 branch (Task 008).

## Deliverables mong muốn
- Editor có chế độ map marker drag-drop hoạt động mượt.
- Lưu/publish vị trí marker thành công.
- Homepage chung phản ánh đúng vị trí sau publish.

## Done criteria (coding)
- Thêm marker editor state (selected marker, dragging marker, dirty state).
- Mutation save marker positions qua settings service.
- Render consumer homepage dùng dữ liệu vị trí mới sau publish.

## Done Criteria (Architecture)
- [ ] Không vi phạm layering frontend/backend.
- [ ] Không thêm endpoint business trong `apps/web/src/app/api/**`.
- [ ] Không thêm Supabase query trong web client.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Không làm hỏng editor section khác (hero, title, footer...).
- [ ] Không gây overflow/scroll ngang trong panel editor.
- [ ] Marker click navigation trên homepage production vẫn đúng.

## Nhắc test nhanh
- Mở editor global -> kéo marker qua nhiều vị trí -> save draft -> publish.
- Reload editor và homepage chung để xác nhận persistence.
- Kiểm tra desktop + mobile viewport.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật checklist + log tại:
  - `progress/modules/homepage-3d/tasks.md`
