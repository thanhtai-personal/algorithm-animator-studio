# Task 003 - KATA 3D Step 3: Theme render dùng config từ Step 4 (backend data thật)

## Mục tiêu
- Dùng dữ liệu config đã chuẩn hóa ở Step 4 (`theme` + `themeConfig`) để render đúng template 3D.
- Đảm bảo public template 3D đọc đúng dữ liệu backend theo branch/locale, không còn phụ thuộc mock runtime chính.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-3d/002_refactor_mock.md`
- `docs/tasks/modules/clone-UI-templates/kata-3d/004_theme_config_schema.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: hook/query/service ở `apps/web`, API contract read-path ở `apps/server`.
- Domain affected: public product/showroom template 3D theo branch/locale.
- App(s) affected: `apps/web`, có thể `apps/server`.

## Current State vs Target State
- Current: Step 4 đã có cấu trúc config theo theme nhưng renderer 3D chưa dùng đầy đủ để hiển thị dữ liệu phù hợp.
- Target (Architecture V2): renderer 3D lấy dữ liệu từ `themeConfig` đã lưu ở backend, map đúng section 3D và có fallback an toàn.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` truy cập Supabase DB trực tiếp.
- Forbidden:
  - Không thêm business endpoint mới trong `apps/web/app/api` nếu đã có đường Nest.
  - Không hardcode lại mock data như nguồn dữ liệu chính sau khi đã có config backend.

## Integration Guard (Mandatory)
- Binding backend phải được xác nhận trên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Header/nav/search/cart/auth/locale/settings của theme không được chỉ render đúng data mà vẫn là local-only placeholder; bắt buộc nối vào shell/routing/state thật.
- Theme appearance của theme clone phải đồng bộ với source-of-truth theme hiện hành của app; backend bind không hợp lệ nếu chỉ homepage đổi palette/theme còn showroom/detail/shortlist hoặc default shell không phản ánh cùng state.
- Không được chấp nhận trường hợp product landing consume `themeConfig` nhưng showroom/detail/shortlist vẫn dùng shell lệch theme hoặc action mismatch.

## Compatibility & Migration Strategy
- Compatibility window: fallback an toàn khi `themeConfig` thiếu field hoặc chưa migrate hết.
- Rollback condition: nếu render sai dữ liệu production, rollback mapping renderer về phiên bản trước và giữ read-path cũ tạm thời.

## In-scope
- Map dữ liệu từ `themeConfig` sang UI sections của template 3D (hero, CTA, featured, gallery/testimonial...).
- Đồng bộ logic chọn dữ liệu theo branch/locale từ backend.
- Chuẩn hóa fallback/null-safe để không vỡ route product/showroom/booking.

## Out-of-scope
- Thiết kế schema config riêng theo theme (đã xử lý ở Step 4).
- Dynamic admin fields theo theme (đã xử lý ở Step 4).
- Thay đổi lớn về visual/parity ngoài mục tiêu bind data.

## Done criteria (coding)
- [ ] Renderer template 3D đọc dữ liệu từ config backend (`themeConfig`) thay vì mock runtime chính.
- [ ] Data hiển thị đúng theo branch/locale và đúng nhóm field của theme 3D.
- [ ] Không vỡ route product/showroom/booking liên quan template 3D.
- [ ] Header/action của theme 3D hoạt động đúng trên toàn bộ route matrix công khai sau khi bind backend.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Có migration note nếu cần mở rộng read contract.

## Regression Scope
- [ ] Branch A/B hiển thị data khác nhau đúng cấu hình.
- [ ] Mobile/desktop vẫn ổn định.
- [ ] Trường hợp thiếu một phần `themeConfig` không làm crash page.
- [ ] Search/locale/auth/cart/navigation không bị local-only hoặc mất tác động ở showroom/detail/shortlist.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- Nếu chạm server: `cd apps/server && npm run lint && npm run build`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 003 | 3D step3 renderer consume step4 theme config | Product landing + showroom read-path now prefer normalized 3D themeConfigJson, 3D template renders backend-driven content/products, and legacy hero/sections/display fields remain as fallback compatibility.`
