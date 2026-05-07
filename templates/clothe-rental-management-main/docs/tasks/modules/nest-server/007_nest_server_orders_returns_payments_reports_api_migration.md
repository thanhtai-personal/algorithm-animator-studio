# Task 098 - Migrate Orders/Returns/Payments/Reports APIs sang `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`, `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Orders/returns/payments/reports là core financial flow đang nằm ở web API.
- Rủi ro cao nếu đổi contract hoặc business semantics.

## Mục tiêu
- Chuyển API 4 domain financial sang Nest.
- Giữ parity tuyệt đối cho formulas và lifecycle constraints.

## Architecture Impact
- Layers affected:
  - server modules: orders/returns/payments/reports
  - callers web/mini-app liên quan financial data
- Domains affected:
  - debt lifecycle, settlement, reports
- `apps/server` module layers touched:
  - `presentation`, `application`, `domain`, `infrastructure`

## Current State vs Target State
- Current:
  - core financial APIs source-of-truth ở web.
- Target (Architecture V2):
  - core financial APIs source-of-truth ở server.

## Boundary Rules
- Must keep:
  - debt lifecycle constraints parity.
  - financial formulas parity.
  - idempotency cho mutation nhạy cảm tiền.
  - chỉ `apps/server` được phép truy cập Supabase DB cho domain financial.
- Forbidden:
  - đổi semantics tài chính trong migration transport.
  - query DB ngoài infrastructure/data-access.

## Compatibility & Migration Strategy
- Compatibility window:
  - giữ route cũ ở chế độ forwarding khi caller chưa cutover hết.
- Rollback condition:
  - phát hiện lệch số liệu/settlement -> rollback theo endpoint group và mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/006_nest_server_products_inventory_customers_api_migration.md`
- `docs/tasks/048_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/050_return_order_modal_source_filter_and_sync.md`
- `docs/tasks/054_financial_formulas_revenue_profit_standardization.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- Nguồn:
  - `apps/web/src/app/api/orders/**`
  - `apps/web/src/app/api/return-orders/**`
  - `apps/web/src/app/api/payments/**`
  - `apps/web/src/app/api/reports/**`
  - `apps/web/src/server/services/**` (orders/payments/reports)
- Đích:
  - `apps/server/src/modules/orders/**`
  - `apps/server/src/modules/returns/**`
  - `apps/server/src/modules/payments/**`
  - `apps/server/src/modules/reports/**`

## Quy tắc kỹ thuật bắt buộc
- Không đổi rules DEBT và settlement.
- Không đổi formulas doanh thu/lợi nhuận đã chuẩn hóa.
- Bắt buộc idempotency cho callback/settlement/payment mutation.

## In-scope
- Migrate endpoint + orchestration + repository mapping cho 4 domain.
- Regression tests cho flow tài chính trọng yếu.
- Chuẩn hóa error/status semantics.

## Out-of-scope
- Refactor lớn domain model ngoài phạm vi parity.
- Đổi UX wizard tạo đơn/trả hàng.

## Done Criteria (Architecture)
- [x] Source-of-truth 4 domain financial ở `apps/server`.
- [x] Không có query DB ngoài infrastructure/data-access.
- [x] Compatibility routes financial còn lại chỉ là forwarding.

## Done Criteria (Coding)
- [x] Core APIs orders/returns/payments/reports chạy parity.
- [ ] Regression tests flow tài chính pass.
- [x] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] tạo đơn RENTAL/SALE.
- [ ] trả hàng + settle debt + hoàn cọc.
- [ ] so sánh số liệu report cũ/mới cùng dataset.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/007 |- [x] Modules/Nest-Server/007 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/007
  - Task file: docs/tasks/modules/nest-server/007_nest_server_orders_returns_payments_reports_api_migration.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
