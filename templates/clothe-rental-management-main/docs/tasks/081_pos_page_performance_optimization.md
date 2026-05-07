# Task 081 - Tối ưu performance POS page (`/[locale]/sales/pos`)

## Mục tiêu
- Giảm thời gian vào màn POS và tương tác đầu tiên.
- Giảm overfetch/compute nặng ở client khiến POS chậm khi dữ liệu lớn.

## Token Context Guard
- Chỉ nạp task `081` + task cha `079` + file code POS đang sửa.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md`
- `docs/technical/002_performance_diagnostics_2026-03-10.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/app/[locale]/sales/pos/page.tsx`
- `apps/web/src/features/sales/views/SalesPosPage/SalesPosPage.tsx`
- `apps/web/src/features/sales/hooks/useSalesPosPage.ts`

## Architecture Impact
- Layers affected: POS hook/query/service, inventory/products/customer query orchestration.
- Domain affected: `sales/POS`, `inventory availability`, `customer typeahead`.
- App(s) affected: `apps/web`, có thể `apps/server` nếu cần endpoint aggregation tối ưu.

## Current State vs Target State
- Current:
  - POS có khả năng tải nhiều dataset cùng lúc, chi phí render/derive cao.
  - Lịch sử audit đã ghi nhận nguy cơ overfetch inventory.
- Target (Architecture V2):
  - Query theo đúng nhu cầu POS, tránh tải dữ liệu không dùng.
  - Derive state availability nhẹ hơn, memo hóa đúng chỗ.
  - UI usable sớm cho thao tác chính (tìm sản phẩm/khách, thêm vào giỏ).

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Tính đúng tồn kho khả dụng cho POS.
  - Search/typeahead có debounce 350ms.
- Forbidden:
  - Bỏ check ca làm việc/branch scope để lấy tốc độ.
  - Dồn business pricing/payment validation vào component UI.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window: nếu thêm endpoint tối ưu mới, giữ endpoint cũ trong giai đoạn cutover.
- Deprecation/removal plan: chỉ xóa đường cũ khi caller cutover và có rollback note.
- Rollback condition: rollback nếu lệch số lượng tồn khả dụng hoặc tạo đơn sai payment payload.

## In-scope
- Profile rendering + query waterfall của POS.
- Tối ưu query size/fields và tránh overfetch.
- Tối ưu derived calculations cho cart/availability.
- Tối ưu loading segmentation: dữ liệu nào cần trước, dữ liệu nào lazy.

## Out-of-scope
- Thay đổi nghiệp vụ tạo đơn POS.
- Đổi UI flow lớn của POS.

## Done criteria (coding)
- Màn POS vào nhanh hơn, thao tác đầu tiên không bị chờ dài.
- Không còn truy vấn dữ liệu vượt nhu cầu màn POS.
- Không regression logic tạo đơn, ca làm việc, branch scope.
- Build/typecheck/lint pass hoặc ghi rõ lỗi baseline ngoài phạm vi.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] Staff mở ca -> vào POS -> tạo đơn thành công.
- [ ] Typeahead khách hàng và tạo nhanh khách hàng còn đúng behavior.
- [ ] Availability count không sai khi inventory lớn.
- [ ] Payment receipt confirmation flow không bị phá.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
