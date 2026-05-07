# Task 070 - Performance backend: query pushdown + server-side pagination thật

## Input ban đầu
- Audit performance ngày `2026-03-10` cho thấy nhiều API list đang fetch toàn bộ dữ liệu rồi mới filter/paginate tại app layer.
- Hotspots chính:
  - `apps/web/src/server/data-access/customers.ts`
  - `apps/web/src/server/data-access/inventory.ts`
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/server/data-access/returnOrders.ts`
- Hệ quả: latency tăng theo data volume, memory pressure cao, dễ timeout khi scale.

## Mục tiêu
- Đưa filtering + pagination xuống DB/Supabase query layer tối đa có thể.
- Loại bỏ overfetch theo pattern `fetch all -> filter/map -> slice` cho các API list trọng yếu.
- Giữ nguyên contract response để không phá flow FE hiện tại.

## Phụ thuộc
- `docs/tasks/008_customers_crm_module.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/technical/002_performance_diagnostics_2026-03-10.md`
- `docs/bugs/007_return_order_sources_pagination_truncated_300.md`
- `docs/bugs/009_list_apis_overfetch_and_memory_pagination.md`

## Mapping màn hình/source
- Backend data-access/service:
  - `apps/web/src/server/data-access/customers.ts`
  - `apps/web/src/server/data-access/inventory.ts`
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/server/data-access/returnOrders.ts`
  - `apps/web/src/server/services/{customers,inventory,products,returnOrders}Service.ts`
- API routes tiêu thụ các service ở trên.

## Quy tắc nghiệp vụ bắt buộc
- Giữ kiến trúc: `Component -> Hook -> Query -> Service -> API/Supabase`.
- Không đổi contract DTO/response nếu chưa có migration contract rõ ràng.
- Không phá branch scoping/RBAC hiện có.
- Mọi thay đổi pagination phải bảo toàn `total/page/pageSize` đúng với dữ liệu thực.

## In-scope
- Refactor list queries để dùng `range`/`count`/`in` hợp lý ngay ở DB query.
- Loại bỏ in-memory pagination ở các flow list chính (customers/inventory/products/showroom/return sources).
- Với filter chưa pushdown được hoàn toàn, giới hạn scope rõ ràng và tối thiểu dữ liệu phải tải về.
- Bổ sung test case/notes cho scenario data lớn (>=10k rows giả lập).

## Out-of-scope
- Viết lại toàn bộ schema hoặc tách microservice.
- Thay đổi UX/module logic không liên quan performance query.
- Refactor lan rộng ngoài các endpoint list trọng yếu.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tối ưu backend list APIs bằng cách push filter/pagination xuống DB và bỏ pattern fetch-all rồi slice.

Yêu cầu:
1) Audit và refactor customers/inventory/products/showroom/return-sources list queries.
2) Dùng Supabase range/count hợp lý, giảm overfetch.
3) Giữ contract response hiện tại, không phá FE.
4) Kiểm tra lại RBAC/branch scope.
5) Bổ sung regression checks cho dataset lớn.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npm run lint
```

## Done criteria (coding)
- Các list API trọng yếu không còn phụ thuộc fetch-all + local slice.
- Thời gian response ổn định hơn khi tăng volume dữ liệu.
- Không regression phân trang/RBAC/branch scope.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass.

## Nhắc test nhanh
- Seed data lớn (products/items/customers/orders) và đo response list API theo page.
- So sánh page cuối và total trước/sau refactor để xác nhận không thiếu dữ liệu.
- Kiểm tra filter kết hợp (search + status + category/tag).
- Kiểm tra showroom list với multi-filters + page > 1.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 070 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 069 /a - [ ] 070 | Performance backend: query pushdown + server-side pagination thật cho customers/inventory/products/showroom/return-sources | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 070 |- [x] 070 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 070
  - Task file: docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
