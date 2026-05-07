# Task 084 - Tối ưu loading trang giỏ hàng/shortlist (`/[locale]/showroom/shortlist`) [P0]

## Mục tiêu
- Giảm mạnh thời gian chờ ở trang giỏ hàng (shortlist/cart).
- Vì dữ liệu cart chủ yếu local, phải hiển thị nhanh, không bị loading lâu.

## Token Context Guard
- Chỉ nạp task `084` + task cha `079` + file shortlist/cart đang sửa.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/083_showroom_page_performance_optimization.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/app/[locale]/showroom/shortlist/page.tsx`
- `apps/web/src/app/[locale]/b/[branchSlug]/showroom/shortlist/page.tsx`
- `apps/web/src/app/[locale]/[shopDomain]/showroom/shortlist/page.tsx`
- `apps/web/src/features/showroom/hooks/useShowroomShortlistPage.ts`
- `apps/web/src/features/showroom/views/ShowroomShortlistPage/ShowroomShortlistPage.tsx`

## Architecture Impact
- Layers affected: shortlist page hook/store hydration, showroom config query coupling.
- Domain affected: `showroom shortlist/cart`.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current:
  - Cart page có thể phụ thuộc config query dù dữ liệu shortlist nằm local store.
  - Dẫn tới cảm giác loading chậm dù nội dung ít.
- Target (Architecture V2):
  - Hydrate shortlist local và render list/cart shell ngay.
  - Query config chỉ enrich link/theme, không block core cart content.
  - Trạng thái empty/cart content xuất hiện nhanh và ổn định.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Dữ liệu giỏ hàng vẫn do `showroomStore` quản lý local persistence.
  - Không mất chức năng note/share/remove/clear.
- Forbidden:
  - Chuyển shortlist persistence sang component local state.
  - Khóa UI cart vì fetch dữ liệu không critical.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window: không có API contract change bắt buộc.
- Deprecation/removal plan: nếu bỏ loading cũ thì giữ fallback nhỏ cho lỗi thực sự.
- Rollback condition: rollback nếu shortlist data không hydrate đúng hoặc mất note/share.

## In-scope
- Tách render ưu tiên:
  - ưu tiên hydrate local shortlist trước,
  - config query chạy song song/enrich sau.
- Rà soát mount/remount tránh reset state không cần thiết.
- Tối ưu skeleton/empty-state để tránh full-page spinner.
- Đảm bảo đường dẫn share/detail vẫn đúng theo context branch/shopDomain.

## Out-of-scope
- Đổi nghiệp vụ shortlist thành order cart backend.
- Tính tiền/checkout online.

## Done criteria (coding)
- Trang cart/shortlist hiển thị danh sách hoặc empty-state nhanh và ổn định.
- Không còn full-page loading kéo dài khi chỉ chờ dữ liệu phụ.
- Share/remove/clear/note hoạt động đúng như hiện tại.
- Build/typecheck/lint pass hoặc ghi rõ lỗi baseline ngoài phạm vi.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] Vào `/showroom/shortlist` thấy dữ liệu shortlist ngay sau hydrate local.
- [ ] Empty-state đúng khi chưa có sản phẩm.
- [ ] Cập nhật note, xóa 1 item, xóa tất cả hoạt động đúng.
- [ ] Share link hoạt động đúng, route detail từ cart mở đúng sản phẩm.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
