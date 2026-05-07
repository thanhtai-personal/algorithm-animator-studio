# Task 003 - KATA Modern Step 3: Theme render dùng config từ Step 4 (backend data thật)

## Mục tiêu
- Dùng dữ liệu config đã chuẩn hóa ở Step 4 (`theme` + `themeConfig`) để render đúng template Modern.
- Đảm bảo public template Modern hiển thị dữ liệu backend theo branch/locale, không còn phụ thuộc mock runtime chính.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-modern/002_refactor_mock.md`
- `docs/tasks/modules/clone-UI-templates/kata-modern/004_theme_config_schema.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: hook/query/service ở `apps/web`, API contract read-path ở `apps/server`.
- Domain affected: template Modern public routes.
- App(s) affected: `apps/web`, có thể `apps/server`.

## Current State vs Target State
- Current: Step 4 đã có config theo theme nhưng renderer Modern chưa consume đầy đủ để hiển thị theo config mới.
- Target: renderer Modern đọc `themeConfig` từ backend và map đúng dữ liệu theo section của Modern.

## Boundary Rules
- Must keep: `Component -> Hook -> Query -> Service -> API`.
- Forbidden:
  - Không DB access ngoài `apps/server`.
  - Không hardcode mock data làm nguồn chính sau khi đã có config backend.

## Integration Guard (Mandatory)
- Binding backend phải được xác nhận trên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Header/nav/search/cart/auth/locale/settings của theme không được chỉ render đúng data mà vẫn là local-only placeholder; bắt buộc nối vào shell/routing/state thật.
- Theme appearance của theme clone phải đồng bộ với source-of-truth theme hiện hành của app; backend bind không hợp lệ nếu chỉ homepage đổi palette/theme còn showroom/detail/shortlist hoặc default shell không phản ánh cùng state.
- Không được chấp nhận trường hợp product landing consume `themeConfig` nhưng showroom/detail/shortlist vẫn dùng shell lệch theme hoặc action mismatch.

## Compatibility & Migration Strategy
- Compatibility window: fallback an toàn khi thiếu field trong `themeConfig`.
- Rollback condition: data regress thì rollback mapping renderer/version trước.

## In-scope
- Bind dữ liệu backend từ `themeConfig` vào renderer Modern theo branch/locale.
- Chuẩn hóa null-safe/fallback để không vỡ layout và flow chính.

## Out-of-scope
- Thiết kế schema config riêng theo theme (đã xử lý ở Step 4).
- Dynamic admin fields theo theme (đã xử lý ở Step 4).
- Refactor sâu layout animation ngoài phạm vi bind data.

## Done criteria (coding)
- [x] Renderer Modern dùng dữ liệu `themeConfig` thay cho mock runtime chính.
- [x] Data thật hiển thị đúng branch/locale và đúng field set của Modern.
- [x] Không vỡ route product landing liên quan template Modern.
- [x] Header/action của theme Modern hoạt động đúng trên toàn bộ route matrix công khai sau khi bind backend.

## Done Criteria (Architecture)
- [x] Không phá layering/import boundary.
- [x] Có migration note nếu mở rộng API read contract.

## Regression Scope
- [x] Branch A/B render đúng data khác nhau.
- [x] Trường hợp thiếu một phần `themeConfig` không crash renderer Modern.
- [x] Search/locale/auth/cart/navigation không bị local-only hoặc mất tác động ở showroom/detail/shortlist.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- Nếu chạm server: `cd apps/server && npm run lint && npm run build`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 003 | Modern step3 renderer consume step4 theme config | 2026-04-12: product landing Modern consume themeConfig backend (migrate legacy + normalize + runtime copy builder), featured products/toggles dùng dữ liệu branch+locale thay mock runtime chính.`
