# Task 078 - Branch public domain-path routing: chuyển `/{locale}/b/{branchSlug}/...` sang `/{locale}/{shopDomain}/...`

## Mục tiêu
- Chuẩn hóa route public theo branch từ dạng:
  - `/{locale}/b/{branchSlug}/products`
  - `/{locale}/b/{branchSlug}/showroom`
- Sang dạng canonical mới:
  - `/{locale}/{shopDomain}/products`
  - `/{locale}/{shopDomain}/showroom`
- `shopDomain` là giá trị do branch admin cấu hình trong branch settings, unique toàn hệ thống, được lưu ở source-of-truth dữ liệu hiện có để Next server resolve route đúng branch.
- Không tạo thêm field cạnh tranh nếu `branches.shop_domain` đã đáp ứng đủ yêu cầu.

## Phụ thuộc
- `docs/tasks/038_showroom_management_slug_default_routing.md`
- `docs/tasks/075_branch_isolation_readiness_before_new_showroom.md`
- `docs/tasks/076_branch_public_product_site_by_branch.md`
- `docs/tasks/077_branch_manager_settings_scope_and_product_page_settings.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/003_web_app_architecture.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/000_Business_requests.md`
- `apps/web/sql/001_full_setup_schema.sql`
- `apps/web/sql/004_patch_add_branch_shop_domain.sql`

## Architecture Impact
- Layers affected:
  - Client: `Component -> Hook -> Query -> Service -> API`.
  - Web routing: App Router route tree + compatibility redirect strategy.
  - Server: `Controller -> Application Service -> Data-access` cho branch public resolver theo `shopDomain`.
  - Data contract: branch settings/source-of-truth cho `shopDomain`.
- Domain affected:
  - branch public catalog/showroom routing, SEO canonical, branch isolation, settings validation.
- App(s) affected:
  - `apps/web`, `apps/server`.
- Data/storage impacted:
  - Ưu tiên reuse `public.branches.shop_domain` làm canonical field.
  - Chỉ tạo migration mới nếu phát hiện schema hiện tại không đủ cho unique/validation/resolution, và phải ghi rõ lý do không thể reuse field hiện có.

## Current State vs Target State
- Current:
  - Public branch pages hiện chủ yếu đi theo route `/{locale}/b/{branchSlug}/...`.
  - Repo đã có `branches.shop_domain`, đã có unique index case-insensitive + slug validation, và branch settings đã có field `shopDomain`.
  - Một phần tài liệu cũ còn mô tả route kiểu `/{shopDomain}` hoặc `/{shopDomain}/search`, chưa khớp với route public branch hiện hành.
  - Quy ước canonical route giữa `branchSlug`, `shopDomain`, host-based route, và default product page chưa được chốt thành 1 chiến lược thống nhất.
- Target (Architecture V2):
  - Canonical branch public route dùng `shopDomain` dạng path segment sau locale:
    - `/{locale}/{shopDomain}/products`
    - `/{locale}/{shopDomain}/showroom`
    - `/{locale}/{shopDomain}/showroom/p/{productId}`
    - `/{locale}/{shopDomain}/showroom/shortlist`
    - `/{locale}/{shopDomain}/search` nếu search/list page cần tồn tại độc lập.
  - `apps/server` là source-of-truth duy nhất để resolve `shopDomain -> branch context`.
  - `/{locale}/b/{branchSlug}/...` trở thành compatibility route trong giai đoạn cutover và redirect/forward sang canonical route mới.
  - `branches.shop_domain` là field cấu hình chính thức do branch admin quản lý trong branch settings, unique toàn hệ thống, có guard reserved-route.
  - Next route surface và internal link generation dùng cùng 1 canonical helper/contract theo `shopDomain`, không còn hardcode `b/[branchSlug]`.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` truy cập Supabase DB và resolve branch context business.
  - Branch route resolution phải dựa trên `shopDomain` do server xác thực, không dựa vào client-side map.
  - Validation uniqueness + reserved-domain phải được enforce ở server; UI chỉ là lớp hỗ trợ nhập liệu.
  - Search/filter text ở public pages tiếp tục debounce (`350ms` mặc định) trước khi gọi query/service.
- Forbidden:
  - Tạo thêm business endpoint mới chỉ trong `apps/web/src/app/api/**` cho domain này nếu đã có hoặc sẽ có Nest endpoint tương ứng.
  - Tạo field mới song song với `branches.shop_domain` mà không có migration note chứng minh field cũ không đủ dùng.
  - Để `shopDomain` trùng route hệ thống/reserved segment rồi xử lý bằng fallback mơ hồ ở runtime.
  - Resolve branch bằng `branchSlug` trong client rồi chỉ dùng `shopDomain` cho mục đích hiển thị.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window:
  - Giữ route cũ `/{locale}/b/{branchSlug}/...` trong giai đoạn migration.
  - Route cũ phải redirect `301/308` hoặc forward rõ ràng sang canonical `/{locale}/{shopDomain}/...` sau khi resolve branch thành công.
  - Nếu branch chưa có `shopDomain`, phải có rule tạm thời rõ ràng:
    - hoặc chưa cho bật canonical route mới cho branch đó,
    - hoặc auto-generate theo policy đã chốt và hiển thị rõ trong settings.
- Deprecation/removal plan:
  - Sau khi internal links, sitemap, metadata canonical, và caller web đều chuyển sang `shopDomain` route, đánh dấu deprecated route `b/[branchSlug]`.
  - Chỉ xóa route cũ khi observability xác nhận không còn consumer quan trọng và regression cross-branch pass.
- Rollback condition:
  - Nếu route mới làm tăng 404, resolve nhầm branch, hoặc đụng reserved route gây shadowing page hệ thống, rollback canonical route mới qua feature flag hoặc tạm quay lại redirect ngược về `b/[branchSlug]`.

## Danh sách task triển khai đề xuất

1. **Task 078.1 - Chuẩn hóa ownership của `shopDomain` trong branch settings**
   - Xác nhận `branches.shop_domain` là source-of-truth chính thức cho branch public path routing.
   - Rà soát API/settings DTO hiện có để branch admin cập nhật được `shopDomain` với unique validation, slug normalization, và error message rõ ràng.
   - Thêm policy reserved-domain ở server cho các segment xung đột với route hệ thống.

2. **Task 078.2 - Public branch resolver theo `shopDomain` tại `apps/server`**
   - Bổ sung hoặc harden resolver public branch context nhận `shopDomain`.
   - Trả DTO chuẩn tối thiểu:
     - `resolvedBranchId`
     - `branchName`
     - `shopDomain`
     - `status`
     - `resolvedBy`
   - Guard branch inactive/unpublished/out-of-scope ngay ở server.

3. **Task 078.3 - Next App Router canonical routes theo `/{locale}/{shopDomain}/...`**
   - Tạo route tree công khai cho products/showroom dựa trên `shopDomain`.
   - Tách bạch với các route hệ thống hiện có như `auth`, `booking`, `product`, `showroom`, `b`, dashboard modules và các route reserved khác.
   - Chốt route canonical cho:
     - products home/list
     - showroom home
     - showroom detail
     - shortlist
     - search nếu cần.

4. **Task 078.4 - Cutover caller/link generation sang canonical route mới**
   - Cập nhật helper sinh link, navigation, metadata canonical, breadcrumb, sitemap, share links.
   - Query key/caller state phải chứa `shopDomain` làm branch identity chính để tránh stale cache giữa branch.
   - Không để page public nào còn hardcode `b/[branchSlug]` sau cutover.

5. **Task 078.5 - Compatibility redirect từ `b/[branchSlug]` sang `shopDomain`**
   - Resolve branch từ slug cũ, sau đó redirect sang canonical route mới.
   - Bảo toàn locale, query string, deep-link detail/shortlist/search.
   - Nếu branch không có `shopDomain`, trả lỗi có chủ đích hoặc fallback theo rule migration đã chốt; cấm fallback ngầm sang branch mặc định.

6. **Task 078.6 - Reserved-domain hardening, docs alignment, regression**
   - Tạo danh sách reserved segment authoritative cho branch `shopDomain`.
   - Đồng bộ tài liệu route surface đang mâu thuẫn (`/{shopDomain}` vs `/{locale}/b/{branchSlug}/...` vs `/{locale}/{shopDomain}/...`).
   - Soát regression auth/anon/public navigation, SEO, hard refresh, back/forward, và cross-branch cache isolation.

## In-scope
- Canonical route strategy cho branch public pages theo `shopDomain`.
- Reuse và chuẩn hóa `branches.shop_domain` cho branch admin config + route resolution.
- Redirect/canonical/sitemap/internal-link migration từ `b/[branchSlug]` sang `shopDomain`.
- Reserved-domain validation và branch isolation cho public route mới.

## Out-of-scope
- DNS/host-based custom domain provisioning thực tế ngoài app path routing hiện tại.
- Redesign UI của product/showroom pages.
- Thay đổi policy SEO ngoài phạm vi route canonical và duplicate-content prevention.
- Đổi ownership từ branch sang showroom nếu không có quyết định kiến trúc riêng.

## Quyết định cần khóa trong quá trình thực hiện
- `shopDomain` trong task này là path segment logic của branch public site, không đồng nghĩa với việc cấp phát hostname thực.
- `/{locale}/{shopDomain}/products` là canonical entrypoint mới cho branch product page.
- Nếu vẫn cần alias `/{locale}/{shopDomain}` hoặc host-based resolution, phải ghi rõ là compatibility alias và canonical vẫn trỏ về route chuẩn mới.
- Reserved-domain list phải được định nghĩa từ route surface thực tế của `apps/web`, không chỉ từ suy đoán tay.

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuyển public branch routes từ /{locale}/b/{branchSlug}/... sang /{locale}/{shopDomain}/..., trong đó shopDomain do branch admin cấu hình và là source-of-truth để resolve branch.

Yêu cầu:
1) Reuse branches.shop_domain làm field canonical; không tạo field cạnh tranh nếu không bắt buộc.
2) apps/server phải là source-of-truth resolve branch context theo shopDomain.
3) Tạo canonical routes:
   - /{locale}/{shopDomain}/products
   - /{locale}/{shopDomain}/showroom
   - /{locale}/{shopDomain}/showroom/p/{productId}
   - /{locale}/{shopDomain}/showroom/shortlist
4) Giữ compatibility route /{locale}/b/{branchSlug}/... và redirect sang canonical route mới.
5) Thêm reserved-domain validation để shopDomain không đụng route hệ thống như auth/booking/product/showroom/b/... .
6) Cập nhật link generation, metadata canonical, sitemap, cache identity theo shopDomain.
7) Không phá boundary:
   - Component -> Hook -> Query -> Service -> API
   - Chỉ apps/server truy cập Supabase DB
   - Không duplicate business logic giữa apps/web và apps/server
```

## Done criteria (coding)
- Branch admin cấu hình được `shopDomain` hợp lệ, unique, với lỗi rõ ràng cho duplicate/reserved/invalid format.
- Public branch pages truy cập được bằng canonical route `/{locale}/{shopDomain}/...`.
- Route cũ `/{locale}/b/{branchSlug}/...` redirect/forward đúng sang route mới, giữ deep links và query string.
- API/server resolver trả đúng branch context theo `shopDomain`, không lẫn chéo branch.
- Internal links, canonical metadata, sitemap, share links không còn phát sinh URL branch public theo `b/[branchSlug]` làm primary path.
- Pass lint/typecheck/build cho app bị chạm.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không thêm business endpoint mới ở `apps/web/app/api` nếu domain đã có ở Nest.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Route resolution contract theo `shopDomain` có source-of-truth ở server.
- [ ] Caller cutover list được cập nhật cho mọi nơi đang sinh link `b/[branchSlug]`.
- [ ] Có migration note rõ cho route docs đang mâu thuẫn và policy canonical cuối cùng.
- [ ] Có rollback condition cho cutover route.

## Regression Scope
- [ ] Branch A/B có `shopDomain` khác nhau: route từng branch trả đúng dữ liệu branch đó.
- [ ] Duplicate `shopDomain` bị chặn chắc chắn ở API + data layer.
- [ ] `shopDomain` trùng reserved segment bị chặn với lỗi rõ ràng.
- [ ] Deep link `showroom/p/{productId}` và `showroom/shortlist` vẫn hoạt động sau redirect từ route cũ.
- [ ] Hard refresh, browser back/forward, và chuyển branch liên tục không reuse stale cache branch trước.
- [ ] Route không tồn tại trả 404 chuẩn, không fallback về branch mặc định.
- [ ] Guest/anon/public flows không bị phá; booking/auth/dashboard routes không bị shadow bởi dynamic `shopDomain` segment.
- [ ] SEO/canonical/sitemap không duplicate nội dung giữa route cũ và route mới.

## Nhắc test nhanh
- Seed tối thiểu 2 branch (`A`, `B`) với `shop_domain` khác nhau và catalog khác nhau rõ rệt.
- Kiểm tra:
  - `/{locale}/{shopDomainA}/products`
  - `/{locale}/{shopDomainB}/products`
  - `/{locale}/{shopDomainA}/showroom`
  - `/{locale}/{shopDomainA}/showroom/p/{productId}`
  - `/{locale}/b/{branchSlugA}/products` redirect sang canonical route mới.
- Kiểm tra reserved values như:
  - `auth`
  - `booking`
  - `product`
  - `showroom`
  - `b`
- Validation commands:
  - `cd apps/server && npm run lint && npm run build`
  - `cd apps/web && npm run lint && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- Nếu checklist chưa có dòng `078` thì thêm mới:
  ```bash
  sed -i '/^- \[.\] 077 /a - [ ] 078 | Branch public domain-path routing: canonical /{locale}/{shopDomain}/... with redirect from /b/{branchSlug} | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ```
- Đánh dấu checklist khi hoàn thành:
  ```bash
  sed -i "s|^- \[ \] 078 |- [x] 078 |" progress/tasks.md
  ```
- Append log:
  ```bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 078
  - Task file: docs/tasks/078_branch_public_domain_path_routing_and_shop_domain_cutover.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ```
