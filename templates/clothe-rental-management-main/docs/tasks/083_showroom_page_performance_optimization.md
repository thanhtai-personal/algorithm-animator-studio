# Task 083 - Tối ưu performance trang showroom listing (`/[locale]/showroom`)

## Mục tiêu
- Giảm latency khi vào showroom listing và khi thao tác search/filter/load-more.
- Giữ trải nghiệm mượt khi danh mục/tags/sản phẩm tăng.

## Token Context Guard
- Chỉ nạp task `083` + task cha `079` + file showroom list đang sửa.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md`
- `docs/tasks/071_frontend_performance_render_bundle_and_image_optimization.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/app/[locale]/showroom/page.tsx`
- `apps/web/src/app/[locale]/b/[branchSlug]/showroom/page.tsx`
- `apps/web/src/app/[locale]/[shopDomain]/showroom/page.tsx`
- `apps/web/src/features/showroom/hooks/useShowroomListPage.ts`
- `apps/web/src/features/showroom/views/ShowroomListPage/ShowroomListPage.tsx`

## Architecture Impact
- Layers affected: showroom list hook/query/service/store, route-level params handling.
- Domain affected: `showroom listing`, `filters/search`, `shortlist badge`.
- App(s) affected: `apps/web`, có thể `apps/server` nếu cần tối ưu query endpoint.

## Current State vs Target State
- Current:
  - Showroom list chịu ảnh hưởng đồng thời từ config query + products query + shortlist hydrate.
  - Search/filter có thể gây request churn nếu orchestration chưa tối ưu.
- Target (Architecture V2):
  - Truy vấn config và data list song song, không chặn render danh sách cơ bản.
  - Debounce chuẩn cho input text (`350ms`) và giảm request dư.
  - Load-more/append ổn định, không rerender quá mức.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Query/search/filter theo branch/showroom context chính xác.
  - Debounce 350ms cho input search gây API call.
- Forbidden:
  - Gọi service trực tiếp từ view component.
  - Trộn state list giữa React Query cache và MobX mà không có hydrate contract rõ.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window: nếu có API tuning, giữ compatibility params hiện tại cho caller.
- Deprecation/removal plan: chỉ bỏ params cũ khi tất cả caller đã chuyển.
- Rollback condition: rollback khi search/filter cho kết quả sai hoặc branch scope sai.

## In-scope
- Tối ưu query orchestration và render path của showroom list.
- Tối ưu state append/load-more tránh copy lớn không cần thiết.
- Tối ưu shortlist badge refresh mà không kéo chậm list.
- Tối ưu perceived loading bằng skeleton theo block thay vì block toàn trang.

## Out-of-scope
- Redesign template showroom.
- Thay đổi nghiệp vụ shortlist/cart.

## Done criteria (coding)
- Vào showroom nhanh hơn và thao tác filter/search mượt hơn.
- Không tạo request-per-keystroke.
- Load-more không gây lag rõ khi danh sách dài.
- Build/typecheck/lint pass hoặc ghi rõ lỗi baseline ngoài phạm vi.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] Showroom list hiển thị đúng theo locale + branch/shopDomain context.
- [ ] Search/filter kết quả đúng, pagination/load-more đúng.
- [ ] Thêm/bỏ sản phẩm vào shortlist vẫn đồng bộ với badge/header.
- [ ] Route detail từ list (`/showroom/p/[productId]`) vẫn điều hướng đúng.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
