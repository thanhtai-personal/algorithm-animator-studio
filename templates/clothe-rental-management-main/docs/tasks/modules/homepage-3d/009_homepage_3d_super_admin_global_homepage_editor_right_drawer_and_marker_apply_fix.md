# Task 009 - Homepage 3D: đưa global map + field edit vào right drawer và sửa apply marker config ra preview/homepage

## Mục tiêu
- Sửa form visual edit của super admin tại `/vi/settings/showroom-pages` để toàn bộ phần chỉnh sửa `global homepage` tập trung trong right drawer.
- Đưa block `Bản đồ store toàn cục` và các input edit field vào right drawer thay vì layout rời hiện tại.
- Thêm icon bút chì trực tiếp trên vị trí field trong preview homepage chung; click icon sẽ mở right drawer đúng field tương ứng.
- Sửa lỗi marker đã config nhưng chưa được apply đúng khi render trên UI preview và UI homepage public.

## Phụ thuộc
- `docs/tasks/modules/homepage-3d/006_homepage_3d_super_admin_global_homepage_editor_access_and_scope.md`
- `docs/tasks/modules/homepage-3d/007_homepage_3d_global_homepage_visual_editor_drag_drop_store_icons.md`
- `docs/tasks/modules/homepage-3d/008_homepage_3d_multi_store_icons_per_branch_for_global_map.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomPagesPage.tsx`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomVisualEditor.tsx`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/GlobalHomepageMapMarkerEditor.tsx`
- `apps/web/src/features/settings/hooks/useSettingsShowroomVisualEditor.ts`
- `apps/web/src/features/product-landing/components/VietnamStoreMapHomepage.tsx`
- `apps/web/src/features/product-landing/utils/globalHomepageMapConfig.ts`
- `apps/server/src/modules/settings/infrastructure/settings.data-access.ts`

## Hiện trạng cần lưu ý
- Visual editor global homepage hiện có phần field/map tách layout, chưa gom về right drawer theo UX in-place editor.
- Preview homepage chung chưa có affordance rõ để click vào từng field và mở edit panel tương ứng.
- Marker configuration đã lưu trong config nhưng có hiện tượng không phản ánh đúng ở:
  - preview trong settings visual editor,
  - homepage public chung (`/{locale}/product`).
- Dễ xảy ra lệch giữa preview renderer và public renderer nếu parse/apply marker dùng logic khác nhau.

## Config cần chuẩn bị trước khi chạy task
- Chốt danh sách field có icon bút chì trên preview (hero badge, hero heading, hero subheading, seo description, map block...).
- Chốt hành vi mở drawer:
  - click icon mở drawer và focus đúng section/field,
  - giữ cơ chế close/save/discard hiện tại.
- Chốt thứ tự ưu tiên dữ liệu marker khi render:
  - ưu tiên `globalHomepage.markers` (collection mới),
  - fallback tương thích ngược từ `markerPositionsByBranchId` khi thiếu collection.

## Architecture Impact
- Layers affected:
  - `apps/web` Component: visual editor, preview homepage, right drawer UI.
  - `apps/web` Hook: orchestration trạng thái drawer, selected field, selected marker và mapping preview.
  - `apps/web` Query/Service: reuse settings API hiện có, không đổi endpoint.
  - `apps/server` Data-access/validation (nếu cần): chuẩn hóa normalize marker payload để giảm lệch dữ liệu read/write.
- Domain affected:
  - Settings showroom-pages (global scope).
  - Homepage 3D global marker rendering.
- App(s) affected: `apps/web`, `apps/server` (nếu cần normalize marker parse/write).

## Current State vs Target State
- Current:
  - Edit field/map chưa tập trung trong right drawer.
  - Preview chưa có click-point rõ bằng icon bút chì để mở drawer.
  - Marker config có thể đã lưu nhưng render chưa apply nhất quán giữa preview và homepage public.
- Target (Architecture V2):
  - Right drawer là nơi chỉnh sửa chính cho global homepage visual editor.
  - Preview homepage có icon bút chì tại các field cho phép edit; click mở drawer đúng context.
  - Marker được apply đồng nhất ở preview và homepage public từ cùng một nguồn dữ liệu/logic normalize.

## Boundary Rules
- Must keep:
  - Giữ flow `Component -> Hook -> Query -> Service -> API`.
  - Dùng shared util parse/build marker config, tránh mỗi renderer tự xử lý riêng.
  - Giữ RBAC scope hiện tại: chỉ `owner_admin` được write global homepage config.
- Forbidden:
  - Không thêm endpoint business mới vào `apps/web/src/app/api/**`.
  - Không gọi trực tiếp DB/Supabase từ web runtime.
  - Không hardcode marker trong component runtime.

## Compatibility & Migration Strategy
- Compatibility window:
  - Tiếp tục hỗ trợ đọc marker config cũ (`markerPositionsByBranchId`) trong giai đoạn chuyển tiếp.
- Deprecation/removal plan:
  - Duy trì contract `globalHomepage.markers` làm nguồn chính; legacy map chỉ fallback.
- Rollback condition:
  - Nếu phát sinh sai lệch marker sau publish (preview đúng nhưng public sai hoặc ngược lại), rollback về renderer trước đó và giữ dữ liệu config hiện hữu.

## In-scope
- Refactor visual editor global homepage:
  - Đưa block `Bản đồ store toàn cục` vào right drawer.
  - Đưa các input edit field global homepage vào right drawer.
- In-place editing affordance:
  - Thêm icon bút chì lên các field trong preview homepage chung.
  - Click icon mở drawer đúng section/field cần edit.
- Marker apply fix:
  - Đồng bộ logic chọn marker data source cho preview và homepage public.
  - Đảm bảo marker selected/active hiển thị đúng trên preview map và public map.
  - Fix các điểm mapping/normalize khiến marker đã config không render.
- Regression hardening:
  - Không làm hỏng các flow edit branch scope hiện có.

## Out-of-scope
- Thiết kế lại toàn bộ UI template homepage ngoài phạm vi right drawer + pencil affordance.
- Thêm tính năng analytics/heatmap cho marker click.
- Thay đổi permission matrix RBAC ngoài scope global homepage editor hiện tại.

## Deliverables mong muốn
- `/vi/settings/showroom-pages` (global visual edit) có right drawer chứa map + input field edit.
- Preview homepage chung có icon bút chì và mở drawer đúng field.
- Marker config được apply đúng và nhất quán ở:
  - preview trong settings,
  - homepage public chung.
- Có checklist test rõ cho cả luồng editor và public render.

## Done criteria (coding)
- Right drawer hiển thị và chỉnh sửa được đầy đủ field global homepage + global map marker.
- Click icon bút chì ở preview mở drawer đúng context edit.
- Marker đã chọn/config hiển thị đúng vị trí và đúng branch ở preview map.
- Marker đã publish hiển thị đúng trên homepage public map.
- Không regression flow edit/publish branch scope.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/server && npm run build` pass (nếu có sửa server normalize/validation).

## Done Criteria (Architecture)
- [ ] Không phá layering frontend/backend.
- [ ] Không thêm business endpoint trong `apps/web/src/app/api/**`.
- [ ] Không thêm Supabase query ngoài `apps/server` data-access.
- [ ] Không duplicate logic parse/apply marker giữa preview và public renderer.
- [ ] Contract config marker có backward compatibility rõ ràng.
- [ ] Danh sách caller impacted được cập nhật (settings preview + public homepage renderer).

## Regression Scope
- [ ] Super admin vào `/vi/settings/showroom-pages` mở visual editor global và chỉnh được qua right drawer.
- [ ] Icon bút chì trên preview mở đúng section edit trong drawer.
- [ ] Marker create/update/delete/reorder vẫn hoạt động sau khi chuyển vào drawer.
- [ ] Marker hiển thị giống nhau giữa preview và public homepage sau publish + reload.
- [ ] Branch không có marker custom vẫn fallback hợp lệ, không crash map.
- [ ] Flow branch homepage editor hiện có không bị ảnh hưởng.

## Nhắc test nhanh
- Test visual editor global:
  - mở right drawer, chỉnh các field hero/seo/map, save + publish.
  - click icon bút chì trên preview để mở drawer đúng field.
- Test marker:
  - chọn marker/đổi vị trí/lưu/publish.
  - reload settings preview và mở `/{locale}/product` để đối chiếu cùng vị trí marker.
- Test scope:
  - manager branch không có quyền write global.
- Lệnh:
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npm run lint`
  - `cd apps/server && npm run build` (nếu có sửa server)

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật checklist + completion log tại:
  - `progress/modules/homepage-3d/tasks.md`
