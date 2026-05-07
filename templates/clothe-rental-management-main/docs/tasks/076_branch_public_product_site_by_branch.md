# Task 076 - Branch Public Product Site: lấy branch context và tạo product/showroom pages riêng theo branch

## Mục tiêu
- Mỗi branch có bộ trang public riêng cho khách:
  - Product page theo branch.
  - Showroom page theo branch.
- Web source phải resolve đúng branch context trước khi gọi API dữ liệu public.
- Không rò rỉ dữ liệu chéo branch trên route public.

## Phụ thuộc
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/038_showroom_management_slug_default_routing.md`
- `docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md`
- `docs/tasks/075_branch_isolation_readiness_before_new_showroom.md`

## Tài liệu tham chiếu
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `.mcp.full.md`
- `docs/000_Business_requests.md`
- `templates/my-money-cloud-main/docs/000_authen-and-data-flow.md`
- `templates/my-money-cloud-main/docs/test-case/auth-cases.md`

## Architecture Impact
- Layers affected:
  - Client: `Component -> Hook -> Query -> Service -> API`.
  - Server: `Controller -> Service -> Data-access` (resolve branch context + public catalog reads).
  - Routing: public route strategy cho branch-scoped pages.
- Domain affected:
  - public showroom/catalog, branch isolation, SEO/indexable public pages.
- App(s) affected:
  - `apps/web`, `apps/server`.

## Current State vs Target State
- Current:
  - Public showroom đã có route chung + theo showroom slug.
  - Branch context cho public page chưa được chuẩn hóa thành 1 contract bắt buộc ở đầu flow.
  - Product site/public browsing chưa được chuẩn route riêng theo branch một cách rõ ràng.
- Target (Architecture V2):
  - Branch context được resolve tập trung ở server bằng `branchSlug` hoặc `shopDomain`, trả về 1 DTO chuẩn.
  - Public pages theo branch được tách rõ, ví dụ:
    - `/{locale}/b/{branchSlug}/products`
    - `/{locale}/b/{branchSlug}/showroom`
  - Có compatibility cho route cũ trong cửa sổ migration, không phá link đang dùng.
  - Tất cả API public đều enforce branch scope tại `apps/server`.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` truy cập Supabase DB.
  - Web public pages không tự suy luận branch bằng hardcode map trong client.
  - Search/filter text trên public products phải debounce (`350ms` mặc định) trước khi gọi query/service.
- Forbidden:
  - Query Supabase trực tiếp trong `apps/web` route/component cho dữ liệu business.
  - Chỉ filter branch ở client mà không guard ở API server.
  - Reuse response không có `resolvedBranchId`/`resolvedShowroomId` khi render page chi tiết.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window:
  - Giữ route public cũ (`/{locale}/showroom`, `/{locale}/showroom/{showroomSlug}`) trong giai đoạn cutover.
  - Route cũ redirect mềm hoặc forward sang resolver mới theo branch context.
- Deprecation/removal plan:
  - Sau khi toàn bộ link nội bộ/SEO sitemap chuyển qua branch route mới, đánh dấu deprecated route cũ.
  - Xóa route cũ khi pass regression + log access cho thấy không còn consumer quan trọng.
- Rollback condition:
  - Nếu branch resolution sai (cross-branch hoặc tỉ lệ 404 tăng bất thường), rollback về route cũ và tắt resolver mới qua feature flag/env.

## Danh sách task triển khai đề xuất

1. **Task 076.1 - Branch public context resolver (server source-of-truth)**
   - Thêm API public resolver (Nest) để nhận `branchSlug` hoặc `shopDomain`, trả về context chuẩn:
     - `resolvedBranchId`, `resolvedShowroomId`, `branchName`, `shopDomain`, `status`.
   - Enforce branch active/public visibility tại server trước khi trả context.

2. **Task 076.2 - Branch-scoped public routing trên web**
   - Tạo route public theo branch cho products/showroom.
   - Quy ước 404 rõ ràng khi branch slug/domain không hợp lệ.
   - Bổ sung route search public theo branch (ví dụ `/{locale}/b/{branchSlug}/search` hoặc mapping tương đương `/shop-domain/search`).

3. **Task 076.3 - Product page riêng theo branch**
   - Product list/detail public luôn đi qua resolver context.
   - Query key phải chứa branch identity để tránh cache lẫn branch.
   - Không hiển thị field nội bộ/cost/audit ở payload public.

4. **Task 076.4 - Showroom page riêng theo branch**
   - Showroom list/detail/shortlist public nhận branch context thống nhất.
   - Template/config chỉ đọc bản `published` trong phạm vi branch resolve.
   - Guard stale response: branch context đổi thì không reuse dữ liệu branch trước.

5. **Task 076.5 - SEO, sitemap và canonical theo branch page**
   - Sinh metadata/canonical theo route branch-scoped.
   - Cập nhật sitemap/public links tránh duplicate content giữa route cũ và route mới.

6. **Task 076.6 - Hardening và regression branch isolation**
   - Test matrix tối thiểu 2 branch có dữ liệu khác biệt rõ.
   - Soát log/metrics cho mismatch `requestedBranch` vs `resolvedBranch`.
   - Chặn mọi fallback mơ hồ sang branch mặc định nếu input branch không hợp lệ.

## In-scope
- Branch resolver contract cho web public pages.
- Route + page product/showroom riêng theo branch.
- Query/cache/invalidation theo branch identity.
- Migration path từ route public cũ sang route mới.

## Out-of-scope
- Checkout/payment online trên trang public.
- Redesign toàn bộ CMS/template engine showroom.
- Multi-tenant domain provisioning tự động ngoài scope app hiện tại.

## Prompt gợi ý cho Codex
```text
Mục tiêu: mỗi branch có product page và showroom page public riêng, web phải resolve branch context chuẩn trước khi load dữ liệu.

Yêu cầu:
1) Thêm branch public resolver API ở apps/server (source-of-truth) nhận branchSlug/shopDomain.
2) Tạo route branch-scoped cho products và showroom trên apps/web.
3) Mọi query public phải truyền resolvedBranchId nhất quán, query key có branch identity.
4) Không expose dữ liệu nội bộ trong payload public.
5) Giữ compatibility route cũ trong giai đoạn chuyển đổi, có redirect/forward rõ ràng.
6) Search/filter text phải debounce 350ms, không request-per-keystroke.
7) Validate regression cross-branch: không rò rỉ dữ liệu branch khác khi đổi branch slug/domain.

Kiến trúc bắt buộc:
- Component -> Hook -> Query -> Service -> API
- Chỉ apps/server truy cập Supabase DB
- Không duplicate business logic giữa web legacy và server mới
```

## Done criteria (coding)
- Có contract resolver public branch context và caller web sử dụng thống nhất.
- Mỗi branch truy cập được product page và showroom page riêng theo route mới.
- API public trả đúng dữ liệu theo branch đã resolve, không lẫn chéo branch.
- Route branch không hợp lệ trả lỗi/404 rõ ràng, không fallback mơ hồ.
- Search/filter public có debounce và không bắn request mỗi ký tự.
- Pass lint/typecheck/build cho app bị chạm.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không thêm business endpoint mới ở `apps/web/app/api` nếu domain đã có ở Nest.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition cho migration/cutover route.

## Regression Scope
- [ ] Branch A/B có catalog khác nhau: truy cập route từng branch trả đúng dữ liệu branch đó.
- [ ] Đổi branch slug/domain liên tục: không bị reuse stale list/detail từ branch trước.
- [ ] Route detail product từ showroom branch luôn giữ đúng branch context.
- [ ] Route branch không tồn tại trả 404 chuẩn, không rơi về branch mặc định.
- [ ] SEO/canonical/sitemap không duplicate URL cùng nội dung giữa route cũ và route mới.
- [ ] Guest/anon flow không làm vỡ navigation public pages theo branch.

## Nhắc test nhanh
- Seed tối thiểu 2 branch (`A`, `B`) có tên sản phẩm khác nhau rõ rệt.
- Kiểm tra:
  - `/{locale}/b/{branchA}/products` và `/{locale}/b/{branchB}/products`
  - `/{locale}/b/{branchA}/showroom` và `/{locale}/b/{branchB}/showroom`
  - Route search theo branch (`.../search`).
- Kiểm tra hard refresh + back/forward browser để phát hiện stale cache theo branch.
- Validation commands:
  - `cd apps/server && npm run lint && npm run build`
  - `cd apps/web && npm run lint && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- Nếu checklist chưa có dòng `076` thì thêm mới:
  ```bash
  sed -i '/^- \[.\] 075 /a - [ ] 076 | Branch public product/showroom pages by branch: resolve branch context + branch-scoped routes/pages | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ```
- Đánh dấu checklist khi hoàn thành:
  ```bash
  sed -i "s|^- \[ \] 076 |- [x] 076 |" progress/tasks.md
  ```
- Append log:
  ```bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 076
  - Task file: docs/tasks/076_branch_public_product_site_by_branch.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ```
