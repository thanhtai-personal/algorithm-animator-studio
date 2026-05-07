# Task 079 - Performance program cho critical web pages (home, POS, booking makeup, showroom, cart)

## Input ban đầu
- Người dùng phản ánh các trang sau load chậm:
  - Home page
  - POS page
  - Đặt lịch makeup
  - Showroom page
  - Giỏ hàng
- Đặc biệt: trang giỏ hàng và form đặt lịch có nội dung ít nhưng trạng thái loading hiển thị lâu.

## Mục tiêu
- Giảm thời gian hiển thị nội dung hữu ích đầu tiên cho 5 trang trọng yếu.
- Giảm loading spinner "blocking" không cần thiết ở các trang dữ liệu ít.
- Chuẩn hóa checklist đo trước/sau để tránh tối ưu theo cảm giác.

## Token Context Guard
- Chỉ nạp task `079` + đúng 1 task con đang implement (`080`-`084`) + file code liên quan.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md`
- `docs/tasks/071_frontend_performance_render_bundle_and_image_optimization.md`
- `docs/tasks/072_performance_observability_and_regression_budget.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/technical/002_performance_diagnostics_2026-03-10.md`

## Architecture Impact
- Layers affected: Client route/page, feature hook/query/service, web compatibility API (nếu cần), Nest API (nếu xác nhận bottleneck ở backend).
- Domain affected: `product-landing`, `sales/POS`, `makeup booking`, `showroom`, `shortlist/cart`.
- App(s) affected: `apps/web` (primary), `apps/server` (chỉ khi cần tối ưu API latency).

## Current State vs Target State
- Current:
  - Một số trang chờ dữ liệu/config rồi mới render phần lớn UI.
  - Có khả năng request waterfall giữa SSR -> client query -> store hydrate.
  - Loading state ở trang nhẹ (booking/cart) chưa phân tầng theo critical vs non-critical data.
- Target (Architecture V2):
  - Render shell + nội dung tối thiểu ngay, giảm full-page blocking spinner.
  - Query chạy song song, có `enabled` hợp lý, tránh refetch trùng.
  - Dữ liệu không critical (analytics, enrichments) tải lazy sau khi nội dung chính đã hiện.

## Boundary Rules
- Must keep:
  - Flow client: `Component -> Hook -> Query -> Service -> API`.
  - Không gọi trực tiếp API trong component.
  - MobX vẫn là UI-visible state; không tạo duplicate source-of-truth với React Query cache.
  - Search/filter gọi API phải debounce `350ms` mặc định.
- Forbidden:
  - Nhúng business logic vào page/component để "né loading".
  - Bỏ qua auth/branch scope checks.
  - Tạo endpoint business mới trong `apps/web/src/app/api/**` nếu đã có path ở Nest.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window: không có cutover bắt buộc ở task tổng; áp dụng theo task con nếu có API change.
- Deprecation/removal plan: mọi temporary fallback loading/skeleton phải có TODO cleanup rõ trong task con.
- Rollback condition:
  - Nếu tối ưu làm sai dữ liệu hiển thị hoặc phá role/branch scope, rollback patch theo page tương ứng.

## Danh sách task triển khai đề xuất
1. `Task 084`: Cart/shortlist loading latency (ưu tiên P0).
2. `Task 082`: Booking makeup form loading latency (ưu tiên P0).
3. `Task 081`: POS page loading + overfetch reduction.
4. `Task 080`: Home/product landing page loading optimization.
5. `Task 083`: Showroom listing/search/filter performance.

## In-scope
- Route-level performance tuning theo từng page.
- Query orchestration, request parallelization, skeleton strategy, cache strategy.
- Tối ưu render/hydration cho các component nặng ở từng trang.
- Định nghĩa tiêu chí đo trước/sau cho từng task con.

## Out-of-scope
- Redesign UI toàn bộ.
- Viết lại state management framework.
- Chuyển toàn bộ web compatibility API sang Nest trong cùng đợt này.

## Done criteria (coding)
- Hoàn thành task con 080-084 với kết quả đo trước/sau rõ ràng.
- Cart + booking không còn cảm giác chờ lâu dù dữ liệu ít.
- Không có regression business flow ở POS/showroom/booking.
- `apps/web` build thành công sau mỗi task con.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] `/[locale]/product` render đúng theo locale + branch context.
- [ ] `/[locale]/sales/pos` tạo đơn tại quầy không sai logic tồn kho/khách hàng.
- [ ] `/[locale]/booking` parse và submit booking không mất dữ liệu.
- [ ] `/[locale]/showroom` search/filter/load-more không sai kết quả.
- [ ] `/[locale]/showroom/shortlist` thêm/xóa/cập nhật note/chia sẻ hoạt động đúng.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
