# Task 008 - Homepage 3D: hỗ trợ nhiều icon store cho một branch trên homepage chung

## Mục tiêu
- Mở rộng dữ liệu map để một branch có thể có nhiều icon store (nhiều vị trí) trên homepage chung.
- Tương thích visual editor: super admin có thể thêm/xóa/sắp xếp nhiều marker cho cùng branch.

## Phụ thuộc
- `docs/tasks/modules/homepage-3d/006_homepage_3d_super_admin_global_homepage_editor_access_and_scope.md`
- `docs/tasks/modules/homepage-3d/007_homepage_3d_global_homepage_visual_editor_drag_drop_store_icons.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/homepage-3d/005_homepage_3d_branch_map_data_contract_and_api_alignment.md`

## Hiện trạng cần lưu ý
- Contract map hiện theo mức branch (1 branch ~ 1 marker chính).
- Chưa có entity/contract rõ ràng cho multi-marker per branch.

## Config cần chuẩn bị trước khi chạy task
- Chốt schema marker:
  - `markerId`, `branchId`, `label`, `xPct`, `yPct`, `isActive`, `displayOrder`.
- Chốt rule navigation:
  - nhiều marker cùng branch đều điều hướng cùng `/{locale}/{branch-domain}`.
- Chốt giới hạn marker/branch (nếu cần, ví dụ tối đa 20).

## Architecture Impact
- `apps/server`: data-access + service + DTO cho marker collection.
- `apps/web`: service/query và renderer hỗ trợ mảng marker theo branch.
- `apps/web`: settings visual editor thao tác CRUD marker.

## Current State vs Target State
- Current: branch map data không đảm bảo multi-icon/branch.
- Target: mỗi branch có thể có nhiều marker với vị trí độc lập, render và điều hướng đúng.

## Boundary Rules
- Must keep: source-of-truth nằm backend; web chỉ consume contract.
- Must keep: branch-domain resolve thống nhất qua util hiện có.
- Forbidden: duplicate business rule điều hướng marker ở nhiều nơi.
- Forbidden: dùng hardcode marker list trong homepage runtime.

## Compatibility & Migration Strategy
- Backward compatible với dữ liệu cũ (1 marker/branch) bằng migration adaptor.
- Có fallback marker tự sinh nếu branch chưa có marker custom.

## In-scope
- Thiết kế/triển khai contract multi-marker.
- API read/write marker collection cho global homepage.
- Rendering homepage theo marker collection.
- Editor thao tác thêm/xóa marker cho cùng branch.

## Out-of-scope
- Thay đổi UI template branch homepage.
- Bổ sung analytics click heatmap.

## Deliverables mong muốn
- API trả danh sách marker (không còn ràng buộc 1 marker duy nhất/branch).
- Homepage chung render đủ marker, click marker điều hướng đúng branch.
- Editor global quản lý được nhiều marker cho cùng branch.

## Done criteria (coding)
- DTO + service + data-access hỗ trợ multi-marker.
- Query/service web parse và hydrate marker collection.
- Renderer map hiển thị ổn định với dataset lớn hơn 1 marker/branch.

## Done Criteria (Architecture)
- [ ] Không vi phạm layering backend/frontend.
- [ ] Không có Supabase query ngoài server data-access layer.
- [ ] Không thêm endpoint business vào `apps/web/src/app/api/**`.
- [ ] `cd apps/server && npm run build` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Branch không có marker custom vẫn hiển thị được.
- [ ] Marker trùng branch không gây crash hoặc điều hướng sai.
- [ ] Không làm chậm đáng kể homepage chung khi marker tăng.

## Nhắc test nhanh
- Seed 1 branch với >=3 marker, verify render + click navigation.
- Thêm/xóa marker trong editor rồi publish, reload kiểm tra persistence.
- Kiểm tra branch khác không bị ảnh hưởng.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật checklist + log tại:
  - `progress/modules/homepage-3d/tasks.md`
