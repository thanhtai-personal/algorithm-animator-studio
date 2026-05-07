# Task 085 - `/settings/showroom-pages`: chuyển từ form input sang visual in-place editor + right drawer

## Mục tiêu
- Thay trải nghiệm edit dạng form dài hiện tại ở `/vi/settings/showroom-pages` bằng visual editor theo đúng UI homepage/theme.
- Trong vùng nội dung preview, hiển thị icon bút chì tại từng vị trí editable (text/image/featured products...).
- Click icon mở right drawer chứa control tương ứng (input/upload/select/searchbox...) để chỉnh đúng vị trí.

## Token Context Guard
- Chỉ nạp task `085` + các file settings/showroom-pages đang sửa.
- Không nạp toàn bộ các task nền trừ khi có blocker trực tiếp.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/080_home_product_landing_performance_optimization.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`
- `docs/tasks/077_branch_manager_settings_scope_and_product_page_settings.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/app/[locale]/(dashboard)/settings/showroom-pages/page.tsx`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomPagesPage.tsx`
- `apps/web/src/features/settings/hooks/useSettingsShowroomPagesPage.ts`
- `apps/web/src/features/product-landing/components/ProductLandingTemplateRenderer.tsx`
- `apps/web/src/features/product-landing/config/productLandingTheme3D.ts`
- `apps/web/src/features/product-landing/config/productLandingThemeCharm.ts`
- `apps/web/src/features/product-landing/config/productLandingThemeModern.ts`

## Architecture Impact
- Layers affected:
  - `settings/showroom-pages` UI composition (Component/View).
  - Hook state orchestration cho editor mode + selected editable node.
  - Query/mutation save cấu hình (`useSettingsShowroomPagesQuery`, `useUpdateSettingsShowroomPagesMutation`).
- Domain affected:
  - `settings showroom pages`
  - `product-landing theme config schema`
- App(s) affected: `apps/web` (primary), `apps/server` chỉ khi thực sự cần mở rộng payload/schema.

## Current State vs Target State
- Current:
  - Trang settings showroom-pages đang chỉnh qua form fields truyền thống (text inputs, checkbox, featured selectors).
  - User phải map bằng tay giữa field và vị trí hiển thị trên homepage.
- Target (Architecture V2):
  - Vùng content của settings hiển thị preview homepage đúng template/theme đã chọn (3D/Charm/Modern).
  - Mỗi vùng editable có affordance rõ (icon bút chì/hover outline).
  - Click vùng editable mở right drawer theo context:
    - Text: input/textarea + voice field (nếu cần giữ).
    - Image: upload/picker (MediaPicker).
    - Featured products: selection + searchbox + reorder (nếu có).
  - Save vẫn đi qua hook -> mutation -> API như hiện tại.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - Không gọi `settingsClientService` trực tiếp từ component preview node.
  - Reuse payload hiện có (`SettingsShowroomPagesUpdatePayload`) tối đa; ưu tiên lưu vào `themeConfigJson/sectionsConfigJson/heroConfigJson`.
  - Giữ ràng buộc branch/locale/template hiện tại.
- Forbidden:
  - Nhúng business transform nặng trong component render preview.
  - Tạo duplicate source-of-truth giữa state drawer và state config chính.
  - Bẻ contract role permission ở settings (`owner_admin/manager`).

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window:
  - Giữ song song chế độ `legacy form` phía sau feature flag hoặc fallback UI cho tới khi visual editor ổn định.
- Deprecation/removal plan:
  - Khi visual editor pass regression, thu gọn form cũ thành advanced panel hoặc xóa ở phase 2.
- Rollback condition:
  - Nếu visual editor gây sai dữ liệu publish hoặc không edit được template nào, fallback ngay về form cũ.

## In-scope
- Thiết kế editor architecture:
  - `preview canvas` (render homepage theo template hiện tại),
  - `editable overlay` (node metadata + icon bút chì),
  - `right drawer` (contextual controls).
- Mapping editable slots theo template schema:
  - không hard-code toàn bộ label/field trong view chính.
- Tích hợp media picker cho image slots.
- Tích hợp product search/select UI cho featured products slots.
- Đồng bộ state:
  - click node -> open drawer -> edit -> preview cập nhật realtime -> save/publish mutation.
- UX chi tiết:
  - mobile/desktop drawer behavior,
  - dirty state + confirm before discard.

## Out-of-scope
- Redesign homepage public runtime.
- Đổi dữ liệu nghiệp vụ products/showroom ngoài phạm vi editor.
- Viết lại hệ template config toàn bộ từ đầu.

## Danh sách task triển khai đề xuất
1. Trích xuất `editable node registry` theo template (text/image/product-collection/toggle) từ theme config schema.
2. Tạo `ShowroomPagesVisualPreview` dùng chung renderer của homepage.
3. Tạo `ShowroomPagesEditableOverlay` hiển thị pencil icon + hit-area.
4. Tạo `ShowroomPagesEditorDrawer` với panel động theo `node.type`.
5. Kết nối state và mutation save/publish, thêm dirty-check.
6. Bổ sung fallback switch `visual editor <-> legacy form` trong thời gian rollout.

## Done criteria (coding)
- `/settings/showroom-pages` có visual preview theo template hiện hành.
- Có in-place edit affordance (pencil + highlight) cho text/image/featured products.
- Right drawer mở theo context và chỉnh được dữ liệu đúng vị trí.
- Preview cập nhật ngay khi chỉnh, save/publish thành công và reload lại đúng.
- Có cơ chế fallback về legacy form (ít nhất trong phase rollout đầu).

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] Quyền truy cập settings showroom-pages theo role vẫn đúng.
- [ ] Branch/locale/template switch vẫn tải đúng config.
- [ ] Save draft / Save & publish vẫn đúng payload và không mất dữ liệu cũ.
- [ ] Public homepage (`/[locale]/product` và biến thể branch/shopDomain) hiển thị đúng sau khi publish.
- [ ] Upload ảnh + chọn sản phẩm featured hoạt động ổn định sau refresh.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
