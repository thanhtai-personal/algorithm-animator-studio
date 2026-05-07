# Task 087 - Cải thiện responsive cho toàn bộ product landing themes (default/charm/3d/modern)

## Mục tiêu
- Chuẩn hóa trải nghiệm responsive cho các theme product landing trên mobile/tablet/desktop.
- Loại bỏ lỗi vỡ layout, overflow ngang, chồng chéo header/toolbar, và mất khả năng tương tác CTA ở màn hình nhỏ.
- Đảm bảo các section ít nội dung vẫn hiển thị hợp lý, không tạo khoảng trắng lớn bất thường.

## Token Context Guard
- Chỉ nạp task `087` + task nền trực tiếp (`085`, `086`) + file template đang sửa.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/080_home_product_landing_performance_optimization.md`
- `docs/tasks/085_settings_showroom_pages_visual_editor_in_place_drawer.md`
- `docs/tasks/086_settings_showroom_pages_visual_editor_default_template_parity.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/features/product-landing/components/templates/default/**`
- `apps/web/src/features/product-landing/components/templates/charm/**`
- `apps/web/src/features/product-landing/components/templates/three-d/**`
- `apps/web/src/features/product-landing/components/templates/modern/**`
- `apps/web/src/features/product-landing/views/ProductLandingPage/ProductLandingPage.tsx`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomVisualEditor.tsx`

## Architecture Impact
- Layers affected:
  - `Component`: responsive layout classes, breakpoints, spacing, typography, overflow handling.
  - `Hook`: chỉ khi cần bổ sung state nhỏ cho responsive behavior (vd: sticky/compact mode), không thêm business logic.
- Domain affected:
  - `product-landing themes`
  - `settings showroom-pages visual preview`
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current:
  - Một số breakpoint nhỏ (320-375px) bị vỡ layout/header, khoảng trắng không hợp lý, CTA khó bấm.
  - Giữa các theme chưa đồng nhất responsive behavior.
- Target (Architecture V2):
  - Tất cả theme render ổn định trên mobile/tablet/desktop, không overflow ngang.
  - CTA chính/phụ luôn nhìn thấy và bấm được.
  - Hero, featured grid, footer links, social/contact và stats giữ hierarchy rõ ràng ở mọi breakpoint.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - Chỉ chỉnh presentation/layout; không đổi business contract API/settings.
  - Không thêm endpoint mới ở `apps/web/src/app/api/**`.
- Forbidden:
  - Đưa business transform vào component template.
  - Hard-code dữ liệu giả để che lỗi responsive.
  - Tạo logic responsive phụ thuộc trực tiếp vào server module.

## Compatibility & Migration Strategy
- Compatibility window:
  - Rollout theo từng theme, ưu tiên sửa lỗi mobile-critical trước.
  - Giữ nguyên schema config/theme hiện tại để tránh migration dữ liệu.
- Rollback condition:
  - Nếu sửa responsive gây regress UX desktop hoặc mất edit slot trong visual editor, revert theo theme/file.

## In-scope
1. Rà soát và fix breakpoints cho 4 theme: default/charm/3d/modern.
2. Chuẩn hóa container width, paddings, typography scale, spacing giữa section.
3. Fix overflow ngang ở header/search/topbar và card grids.
4. Điều chỉnh footer/link/social/contact block để không lệch cột trên mobile.
5. Fix responsive cho preview trong `/settings/showroom-pages` để icon edit không che nội dung chính.

## Out-of-scope
- Đổi visual direction/theme identity.
- Thêm tính năng business mới cho landing page.
- Thay đổi contract dữ liệu product/settings.

## Danh sách task triển khai đề xuất
1. Lập ma trận breakpoint + route/theme cần kiểm thử (320/360/375/390/414/768/1024/1280).
2. Chuẩn hóa responsive tokens dùng chung cho template sections.
3. Fix từng theme theo checklist section (header, hero, featured, CTA, footer).
4. QA visual editor preview responsive và tránh lệch anchor edit.
5. Regression pass cho `/[locale]/product` theo từng theme + locale.

## Done criteria (coding)
- 4 theme hiển thị ổn trên breakpoint mobile/tablet/desktop.
- Không còn lỗi overflow ngang và chồng chéo header/toolbar.
- Footer links/social/contact đọc được và bấm được trên mobile.
- Visual editor preview vẫn usable khi viewport nhỏ.

## Done Criteria (Architecture)
- [ ] Không thêm business endpoint mới ở `apps/web/app/api`.
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa client/server.
- [ ] Không thêm truy cập Supabase DB ngoài `apps/server`.

## Regression Scope
- [ ] `/[locale]/product` với từng theme (default/charm/3d/modern) trên mobile.
- [ ] Route branch/domain variants (`/[locale]/b/[branchSlug]/...`, `/{shopDomain}/...` nếu có).
- [ ] Visual editor `/[locale]/settings/showroom-pages` ở viewport nhỏ.
- [ ] Locale `vi/en` không vỡ line-break quan trọng.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
