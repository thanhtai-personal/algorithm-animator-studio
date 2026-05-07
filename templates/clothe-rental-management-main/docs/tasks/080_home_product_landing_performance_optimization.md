# Task 080 - Tối ưu performance Home/Product Landing page

## Mục tiêu
- Giảm thời gian hiển thị nội dung chính ở home/product landing.
- Giảm waterfall SSR -> client query -> hydrate gây chậm lần tải đầu.

## Token Context Guard
- Chỉ nạp task `080` + task cha `079` + file code liên quan home landing.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/071_frontend_performance_render_bundle_and_image_optimization.md`
- `docs/tasks/072_performance_observability_and_regression_budget.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/app/[locale]/product/page.tsx`
- `apps/web/src/app/[locale]/b/[branchSlug]/products/page.tsx`
- `apps/web/src/features/product-landing/views/ProductLandingPage/ProductLandingPage.tsx`
- `apps/web/src/features/product-landing/hooks/useProductLandingPage.ts`

## Architecture Impact
- Layers affected: route/page, feature hook/query/store, service call orchestration.
- Domain affected: `product-landing` + `showroom shell header`.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current:
  - Home route có redirect/branch resolution và nhiều dữ liệu trang công khai nạp trong cùng phase render.
  - Client có khả năng phải chờ config + featured products trước khi nội dung hữu ích ổn định.
- Target (Architecture V2):
  - Tách critical data và non-critical data.
  - Render hero/header usable sớm, data enrichments load sau.
  - Tránh refetch trùng config giữa page level và các hook liên quan.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Không để component tự gọi fetch trực tiếp.
  - Giữ logic branch/shopDomain canonical redirect hiện tại.
- Forbidden:
  - Đổi business semantics của config publish/fallback.
  - Tạo duplicate state ngoài `productLandingStore` + React Query.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window: không đổi contract API trong task này.
- Deprecation/removal plan: nếu thêm preload/prefetch tạm, phải ghi rõ cleanup.
- Rollback condition: rollback khi route alias theo branch/shopDomain redirect sai hoặc SEO metadata regress.

## In-scope
- Profile lại route `/[locale]/product` và biến thể theo branch.
- Giảm blocking render do dữ liệu non-critical.
- Rà soát query key/refetch policy để tránh request trùng.
- Tối ưu ảnh/logo/hero ở landing theo chiến lược đã có từ Task 071.

## Out-of-scope
- Đổi layout/visual concept của trang.
- Thay đổi nghiệp vụ chọn branch/showroom.

## Done criteria (coding)
- Thời gian hiển thị nội dung hữu ích đầu tiên giảm rõ rệt so với baseline.
- Không còn full-screen loading khi chỉ chờ dữ liệu phụ.
- Không tăng số request trùng khi mở route home.
- Build/typecheck/lint pass hoặc ghi rõ lỗi baseline ngoài phạm vi.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] Locale redirect từ `/[locale]` sang landing đúng role.
- [ ] Branch/shopDomain canonical redirect hoạt động đúng.
- [ ] Header search/locale switch/cart badge vẫn hoạt động.
- [ ] Featured products hiển thị đúng locale/config publish state.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
