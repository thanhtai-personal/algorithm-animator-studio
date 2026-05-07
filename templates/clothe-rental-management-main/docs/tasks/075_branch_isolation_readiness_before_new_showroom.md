# Task 075 - Branch Isolation Readiness trước khi tạo thêm showroom mới

## Mục tiêu
- Chốt hướng vận hành **độc lập theo branch** trước khi tạo thêm showroom mới.
- Rà soát và hoàn thiện các luồng dữ liệu để tránh rò rỉ/cross-branch.
- Đảm bảo toàn bộ dữ liệu thống kê (dashboard/reports/makeup/procurement/payments...) đã filter đúng theo `branchId`.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/013_dashboard_overview_module.md`
- `docs/tasks/015_reports_module.md`
- `docs/tasks/052_revenue_debt_unified_calculation_dashboard_reports.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`
- `docs/tasks/058_pos_shift_open_close_completion.md`
- `docs/tasks/060_shift_open_close_ui_standardization_and_admin_shift_management.md`

## Tài liệu tham chiếu
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `.mcp.full.md`
- `docs/000_Business_requests.md`

## Architecture Impact
- Layers affected:
  - Client: Component -> Hook -> Query -> Service
  - Server: Controller -> Service -> Data-access
  - Data: Supabase query filters + index + RLS verification theo branch
- Domain affected:
  - auth/rbac, dashboard, reports, payments, sales shift, makeup, procurement, showroom public
- App(s) affected:
  - `apps/web`, `apps/server`

## Current State vs Target State
- Current:
  - Kiến trúc hiện tại đã dùng `branch_id` làm scope chính cho dữ liệu nghiệp vụ.
  - Vẫn cần một đợt hardening tổng thể trước khi mở thêm showroom mới để tránh điểm lọt filter, nhất là các màn thống kê/tổng hợp.
- Target (Architecture V2):
  - Tất cả API/list/report/export/chart phải enforce branch scope nhất quán.
  - Query key, cache invalidation, CSV export, KPI tổng hợp phải bám cùng `branchId`.
  - Không có luồng nào hiển thị/ghi dữ liệu ngoài branch đang active của actor.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` truy cập Supabase DB.
  - Branch scope đi xuyên suốt từ auth context -> API query -> data-access -> response.
- Forbidden:
  - Filter branch ở UI nhưng không enforce ở server/data-access.
  - Dùng fallback branch mơ hồ làm lệch thống kê.
  - Trộn dữ liệu đa branch trong cùng một response thống kê khi role không đủ quyền.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window:
  - Giữ nguyên contract response hiện tại; chỉ tăng cường filter/guard.
- Deprecation/removal plan:
  - Nếu phát hiện endpoint legacy không branch-safe, chuyển caller sang endpoint đã harden và loại bỏ nhánh cũ sau khi pass regression.
- Rollback condition:
  - Có thể rollback theo endpoint/module nếu hardening làm sai số liệu KPI hoặc phá flow branch switch.

## Danh sách task triển khai đề xuất (trước khi tạo showroom mới)

1. **Task 075.1 - Branch context chuẩn hóa end-to-end**
   - Chuẩn hóa rule chọn `currentBranchId` (auth store + branch selector + fallback).
   - Chặn request khi thiếu branch context ở các domain bắt buộc branch.
   - Done khi không còn endpoint nghiệp vụ nào chạy với branch mơ hồ.

2. **Task 075.2 - Audit & harden dashboard KPI theo branch**
   - Rà `dashboard/overview`, due/overdue, recent activities, quick actions.
   - Đảm bảo mọi số tổng hợp đều tính trên branch active.
   - So khớp số liệu dashboard với report revenue cùng kỳ/cùng branch.

3. **Task 075.3 - Audit & harden reports theo branch (đặc biệt thống kê)**
   - Revenue / Utilization / Incidents / Top rentals / CSV export.
   - Kiểm tra cả API, query key, FE filter state, chart dataset.
   - Done khi đổi branch thì toàn bộ bảng, chart, export đổi đúng theo branch.

4. **Task 075.4 - Audit các thống kê ngoài reports chính**
   - Makeup admin overview, procurement metrics, payments reconciliation summary, shift summary.
   - Xác nhận mọi aggregate query đều `.eq('branch_id', ...)` hoặc tương đương guard branch.
   - Bổ sung regression test cho mỗi module thống kê có rủi ro cao.

5. **Task 075.5 - Branch-safe pagination/filter/search**
   - Kiểm tra các list API lớn (customers/inventory/products/orders/payments/returns/procurement).
   - Đảm bảo pushdown filter branch trước khi sort/paginate.
   - Không còn tình trạng `fetch all` rồi lọc chéo branch ở app layer.

6. **Task 075.6 - RBAC + branch guard parity**
   - Soát role matrix khi switch branch (`owner_admin/manager/staff/...`).
   - Đảm bảo role thấp không đọc/ghi branch không thuộc `profile_branch_access`.
   - Bổ sung test case âm (forbidden branch scope).

7. **Task 075.7 - Data quality & observability guard**
   - Bổ sung logging tag `branch_id` nhất quán cho API lỗi/kpi mismatch.
   - Bổ sung cảnh báo khi query thống kê trả về branch khác context request.
   - Định nghĩa checklist đối soát số liệu theo branch trước release.

8. **Task 075.8 - Release gate trước khi tạo showroom mới**
   - Chỉ cho phép tạo showroom mới khi pass toàn bộ regression branch isolation.
   - Có checklist sign-off: backend, frontend, QA, dữ liệu thống kê.
   - Tài liệu hóa runbook vận hành khi thêm branch mới + showroom tương ứng.

## In-scope
- Rà soát và harden branch isolation cho API/UI hiện có.
- Đồng bộ cách truyền `branchId` ở query/service/export/chart.
- Bổ sung checklist kiểm thử thống kê theo branch.

## Out-of-scope
- Chuyển mô hình sang showroom-level isolation.
- Thiết kế lại schema lõi theo `showroom_id`.
- Custom domain (`shop_domain`) cho nhiều showroom.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện branch isolation toàn hệ thống trước khi tạo thêm showroom mới.

Yêu cầu:
1) Lập danh sách endpoint/màn hình có aggregate dữ liệu (dashboard/reports/makeup/procurement/payments/shifts).
2) Audit từng endpoint xem đã filter branch ở data-access chưa.
3) Fix các điểm thiếu filter hoặc fallback branch không an toàn.
4) Verify FE query key + filter state + export đều truyền branchId nhất quán.
5) Bổ sung regression checklist tập trung vào số liệu thống kê theo branch.
6) Không đổi contract response nếu chưa có migration note.

Validation commands:
- cd apps/server && npm run lint && npm run build
- cd apps/web && npm run lint && npm run typecheck
```

## Done criteria (coding)
- Có danh sách đầy đủ endpoint/màn hình thống kê đã được audit branch filter.
- Không còn mismatch số liệu khi đổi branch giữa dashboard và reports cùng kỳ.
- Export CSV theo reports/payments đúng branch context.
- API trả lỗi rõ ràng khi request branch không thuộc quyền.
- Pass lint/typecheck cho app bị chạm.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] Đổi branch ở dashboard: KPI, due/overdue, activity đổi đúng.
- [ ] Đổi branch ở reports: revenue/utilization/incidents/charts/export đổi đúng.
- [ ] Đổi branch ở makeup/procurement/payments/shifts summary: số liệu đổi đúng.
- [ ] Role không đủ quyền không truy cập được dữ liệu branch khác.
- [ ] Public showroom route không làm lộ dữ liệu ngoài branch được resolve.

## Nhắc test nhanh
- Seed tối thiểu 2 branch có dữ liệu lệch rõ ràng (A/B) để dễ đối chiếu.
- Kiểm thử tất cả endpoint thống kê bằng cùng date range trên cả 2 branch.
- So sánh số dashboard với report revenue cùng branch/cùng kỳ.
- Kiểm tra CSV export và chart dataset khi switch branch liên tục.

## Cập nhật tiến độ (bắt buộc)
- Nếu checklist chưa có dòng 075 thì thêm mới:
  ```bash
  sed -i '/^- \[.\] 074 /a - [ ] 075 | Branch isolation readiness before creating new showroom: harden branch filters across dashboard/reports/aggregates + release gate | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ```
- Đánh dấu checklist khi hoàn thành:
  ```bash
  sed -i "s|^- \[ \] 075 |- [x] 075 |" progress/tasks.md
  ```
- Append log:
  ```bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 075
  - Task file: docs/tasks/075_branch_isolation_readiness_before_new_showroom.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ```
