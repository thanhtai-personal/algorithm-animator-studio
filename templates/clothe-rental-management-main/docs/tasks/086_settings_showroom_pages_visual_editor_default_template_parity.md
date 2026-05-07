# Task 086 - `/settings/showroom-pages`: mở rộng visual in-place editor cho mẫu mặc định (default template)

## Mục tiêu
- Áp dụng trải nghiệm visual editor + right drawer (đã có cho Charm/3D/Modern) cho **mẫu mặc định**.
- Không còn fallback bắt buộc sang form dài khi template đang chọn là default.
- Cho phép chỉnh trực tiếp text/image/featured products trên preview default template bằng icon bút chì.

## Token Context Guard
- Chỉ nạp task `086` + task nền trực tiếp `085` + file default template/editor liên quan.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/085_settings_showroom_pages_visual_editor_in_place_drawer.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`
- `docs/tasks/077_branch_manager_settings_scope_and_product_page_settings.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomPagesPage.tsx`
- `apps/web/src/features/settings/hooks/useSettingsShowroomPagesPage.ts`
- `apps/web/src/features/settings/hooks/useSettingsShowroomVisualEditor.ts`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomVisualEditor.tsx`
- `apps/web/src/features/product-landing/components/templates/default/ProductLandingTemplateDefault.tsx`
- `apps/web/src/features/product-landing/hooks/useProductLandingPage.ts`

## Architecture Impact
- Layers affected:
  - `settings/showroom-pages` visual editor node registry + drawer controls cho default template.
  - Hook orchestration để map default fields (`heroConfigJson/sectionsConfigJson/displayConfigJson`) vào preview/edit slots.
  - Save flow giữ nguyên qua `useUpdateSettingsShowroomPagesMutation`.
- Domain affected:
  - `settings showroom pages`
  - `product landing default template`
- App(s) affected: `apps/web` (primary), `apps/server` chỉ khi cần mở rộng contract payload.

## Current State vs Target State
- Current:
  - Visual editor mới hỗ trợ template có `themeConfig` (Charm/3D/Modern).
  - Template default vẫn edit chủ yếu bằng legacy form fields.
- Target:
  - Template default có cùng UX:
    - preview in-place,
    - pencil affordance theo slot,
    - right drawer theo loại field.
  - Có thể chỉnh ít nhất các nhóm:
    - hero badge/heading/subheading/search placeholder,
    - page logo/hero image,
    - featured title/show-more/featured products.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - Không gọi service trực tiếp trong component editor/drawer.
  - Reuse payload hiện tại (`SettingsShowroomPagesUpdatePayload`), ưu tiên ghi vào `heroConfigJson/sectionsConfigJson/displayConfigJson`.
  - Giữ role + branch scope như hiện tại.
- Forbidden:
  - Tạo source-of-truth mới ngoài state draft của hook.
  - Hard-code business logic save trong component preview.
  - Làm regress behavior của các template đã hỗ trợ ở task 085.

## In-scope
1. Mở rộng `editable node registry` để có nhánh cho default template.
2. Thêm mapping `getNodeValue/setNodeValue` cho default fields (legacy payload shape).
3. Hiển thị overlay pencil + drawer controls cho default template.
4. Đồng bộ featured product selection/search cho default template trong drawer.
5. Đảm bảo preview cập nhật realtime và save/publish giữ parity dữ liệu.

## Out-of-scope
- Redesign giao diện public default template.
- Viết lại toàn bộ schema default sang một chuẩn theme config mới.
- Thay đổi permission matrix settings.

## Danh sách task triển khai đề xuất
1. Tách “default template editable contract” (field path + loại control).
2. Bổ sung node registry + anchor positions cho default preview.
3. Bổ sung read/write adapter từ drawer -> legacy fields trong hook.
4. Mở rộng preview model để phản ánh đúng default draft.
5. Chạy regression cho 4 template (default + Charm + 3D + Modern).

## Done criteria (coding)
- Khi chọn default template, vẫn dùng visual editor đầy đủ (không buộc về legacy form).
- Có thể chỉnh được các slot chính (hero/image/featured/products) qua drawer.
- Save draft và publish thành công, reload lại đúng.
- Không vỡ behavior visual editor của Charm/3D/Modern.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate logic save giữa default và các theme khác.
- [ ] Payload save default giữ contract hiện có.
- [ ] Có fallback/rollback rõ nếu default visual mapping lỗi.

## Regression Scope
- [ ] Role owner_admin/admin/manager vẫn đúng quyền settings showroom-pages.
- [ ] Branch + locale + template switch vẫn tải và giữ đúng draft state.
- [ ] Save draft/publish default không mất dữ liệu cũ.
- [ ] Public `/[locale]/product` render đúng sau publish default.
- [ ] Overlay/drawer hoạt động ổn trên desktop và mobile.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
