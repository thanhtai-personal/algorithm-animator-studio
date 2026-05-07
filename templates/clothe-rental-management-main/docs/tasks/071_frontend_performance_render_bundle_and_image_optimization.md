# Task 071 - Performance frontend: render, bundle và image optimization

## Input ban đầu
- Sau audit 2026-03-10, frontend còn các điểm nghẽn:
  - Một số loop render tạo copy array không cần thiết (chi phí O(n^2) tiềm ẩn).
  - Public/admin vẫn dùng `<img>` trực tiếp thay vì chiến lược tối ưu ảnh của Next.
  - QueryClient chưa có default tuning cho cache/refetch/retry.
  - Một số module chart/table có thể tách chunk/lazy tốt hơn.

## Mục tiêu
- Giảm chi phí render không cần thiết ở các màn list/stock/POS.
- Giảm LCP/bytes tải ảnh ở landing/showroom/admin shell.
- Thiết lập mặc định query/cache hợp lý để giảm request churn.
- Giảm JS load ban đầu ở route nặng bằng code-splitting chủ đích.

## Phụ thuộc
- `docs/technical/002_performance_diagnostics_2026-03-10.md`
- `docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`

## Mapping màn hình/source
- Frontend hotspots:
  - `apps/web/src/features/sales/hooks/useSalesStockPage.ts`
  - `apps/web/src/features/product-landing/components/ProductLandingPage.tsx`
  - `apps/web/src/components/layout/PublicSiteHeader.tsx`
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx`
  - `apps/web/src/app/providers.tsx`
  - Các route dashboard/reports dùng chart nặng (`recharts`).

## Quy tắc bắt buộc
- Giữ kiến trúc module hiện tại, patch tối thiểu theo hotspot.
- Không thay đổi business flow.
- Tối ưu nhưng không hy sinh i18n/accessibility.
- Nếu thay đổi loading strategy, phải tránh hydration mismatch.

## In-scope
- Tối ưu loop/grouping/derive state để giảm re-render cost.
- Chuyển các ảnh quan trọng sang `next/image` (hoặc chiến lược tương đương có đo đạc rõ).
- Thiết lập `QueryClient` default options hợp lý cho web admin flows.
- Lazy-load các khối chart/feature nặng theo route/section nếu phù hợp.
- Loại bỏ dependency nặng không dùng ở client bundle (nếu xác nhận an toàn).

## Out-of-scope
- Redesign toàn bộ UI.
- Viết lại state management từ MobX sang mô hình khác.
- Tối ưu native app trong task này.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tối ưu performance frontend (render + bundle + image + query defaults) theo hotspot đã audit.

Yêu cầu:
1) Tối ưu loop/render hotspots, bỏ pattern tạo array copy trong mỗi vòng lặp.
2) Chuyển các ảnh chính sang chiến lược tối ưu của Next.
3) Thêm QueryClient default options để giảm refetch/retry churn không cần thiết.
4) Tách lazy chunk cho sections/chart nặng nếu phù hợp.
5) Không đổi business logic và giữ i18n hiện có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npm run lint
- cd apps/web && npm run build
```

## Done criteria (coding)
- Render hotspot được tối ưu, không còn pattern O(n^2) do array copy trong loop chính.
- Ảnh quan trọng được tối ưu tải/kích thước cho web.
- Query defaults được cấu hình rõ ràng và không gây regression data freshness.
- `npm run build` pass, không phát sinh lỗi hydration.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass.

## Nhắc test nhanh
- So sánh FPS/tương tác khi mở màn POS stock/list lớn.
- So sánh LCP trang product/showroom trước-sau bằng Lighthouse.
- Kiểm tra ảnh logo/cover ở network tab (bytes, caching, layout shift).
- Regression các màn dùng query cache khi chuyển tab/route.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 071 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 070 /a - [ ] 071 | Performance frontend: render/bundle/image optimization + query client default tuning | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 071 |- [x] 071 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 071
  - Task file: docs/tasks/071_frontend_performance_render_bundle_and_image_optimization.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
