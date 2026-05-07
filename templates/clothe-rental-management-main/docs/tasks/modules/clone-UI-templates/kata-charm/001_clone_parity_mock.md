# Task 001 - KATA Charm Step 1: Clone UI Parity Tuyệt Đối (mock data)

## Mục tiêu
- Clone **giống hệt UI** từ `templates/kata-charm-shop-main` cho route template Charm ở `apps/web`.
- Dùng mock data từ template source, chưa bind backend.
- Đảm bảo parity cả layout + motion (timing/easing/stagger), không chỉ parity màu.

## Định nghĩa hoàn thành bắt buộc
### Sau Task 1
- UI clone phải giống hệt UI trong template được cung cấp (bao gồm layout, style, motion và interaction).
- Hệ thống CSS của theme phải tách biệt hoàn toàn (local scope/CSS module), không được ảnh hưởng giao diện hoặc hành vi của các theme khác.

## Luồng thực thi chuẩn
- `000 (nếu rerun) -> 001 -> 002 -> 004 -> 003`

## Phụ thuộc
- (Chỉ khi rerun) `docs/tasks/modules/clone-UI-templates/kata-charm/000_reset_clone_for_rerun.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`
- `docs/tasks/076_branch_public_product_site_by_branch.md`
- `docs/tasks/077_branch_manager_settings_scope_and_product_page_settings.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `templates/kata-charm-shop-main/src/**`

## Architecture Impact
- Layers affected: client component/template layer (UI render only).
- Domain affected: public product landing template Charm.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current: template Charm clone còn lệch về spacing/animation/interaction so với template source.
- Target (Architecture V2): bản clone parity cao theo source gốc, không thay đổi business flow và không thêm phụ thuộc global style.

## Boundary Rules
- Must keep:
  - Giữ flow `Component -> Hook -> Query -> Service -> API` (dù step này chưa bind API thật).
  - Không gọi DB/Supabase trực tiếp từ web.
  - Chỉ thay đổi ở `features/product-landing/components/templates/**` và style cục bộ của template.
  - Style custom phải nằm ở file CSS module/local của template.
- Forbidden:
  - Không sửa `apps/web/src/app/globals.css` để phục vụ clone template.
  - Không sửa global token/layout utilities (`:root`, theme vars, app-wide animation utilities) cho mục tiêu clone.
  - Không đưa business logic vào component template.

## Integration Guard (Mandatory)
- Public route matrix phải được review theo theme đang clone: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và các biến thể `/b/[branchSlug]/...`.
- Nếu template có header/nav/search/cart/auth/locale/settings riêng, mọi action phải nối vào routing/state thật của app; không chấp nhận local-only state hoặc placeholder click.
- Theme/palette/settings của template phải dùng cùng source-of-truth với hệ `ThemeToggle` / `PaletteSelect` hiện hành của app hoặc một abstraction shared tương đương; không được tạo state/localStorage riêng làm lệch trải nghiệm giữa template clone và default template.
- Không được mark done nếu homepage đã dùng shell của template nhưng showroom/detail/shortlist vẫn dùng shell lệch theme hoặc action mismatch.

## Compatibility & Migration Strategy
- Compatibility window: giữ renderer hiện hành để rollback nhanh.
- Rollback condition: nếu clone gây regress visual/UX rõ ràng thì rollback renderer ngay.

## In-scope
- Clone chính xác section order, spacing, typography, palette, card style, hover state.
- Clone chính xác animation/reveal/stagger/easing theo template Charm source.
- Mock data cố định lấy từ template source.

## Out-of-scope
- Bind backend/API thật.
- Refactor sâu kiến trúc template renderer ngoài phạm vi parity.

## Done criteria (coding)
- [ ] Render đủ các section chính theo đúng thứ tự và cấu trúc template source.
- [ ] Parity desktop/tablet/mobile đạt mức review “giống hệt” (không chấp nhận chỉ gần giống).
- [ ] Motion parity đạt yêu cầu: reveal timing, easing curve, hover response mượt tương đương source.
- [ ] Không có thay đổi trong `apps/web/src/app/globals.css`.
- [ ] Toàn bộ style custom phục vụ clone nằm ở CSS module/local scope của template.
- [ ] Header/nav/search/cart/auth/locale/settings của template hoạt động bằng flow thật trên route matrix công khai, không chỉ đúng ở homepage.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Không thêm business endpoint mới cho task clone UI.

## Regression Scope
- [ ] Route product dùng template Charm không vỡ layout ở mobile/desktop.
- [ ] Header/footer/navigation của template hoạt động đúng.
- [ ] Route showroom/detail/shortlist cùng theme không bị lệch shell hoặc mất tác động action.
- [ ] Không ảnh hưởng style các template khác (3D/Modern/Default).

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 001 | Charm step1 clone parity mock | 2026-04-09: clone full section/motion parity theo template source, dùng mock data + assets local /template-assets/kata-charm, không sửa globals.css.`
