# Task 041 - Product Landing Home Clone (Stylestream) + Admin Config + Global Logo + Featured Products

## Input ban đầu
- Clone home page từ `templates/stylestream-showcase-main` sang source web hiện tại.
- Tích hợp với multi-palette + dark/light theme đang có trong source.
- Trong admin cho phép cấu hình:
  - text hiển thị trên home page;
  - logo toàn site;
  - danh sách featured products hiển thị ở home page.
- Tại home page:
  - click vào khung tìm kiếm chuyển sang showroom page hiện tại;
  - click `show more` ở featured product cũng chuyển sang showroom page hiện tại.
- Đổi button `go to showroom page` trong admin site thành `go to product` để trỏ sang landing product page mới.

## Mục tiêu
- Bổ sung public landing page mới cho sản phẩm tại route riêng, tách khỏi dashboard routes.
- Clone bố cục/visual chính từ template Home nhưng giữ kiến trúc dữ liệu hiện tại (`Component -> Hook -> Query -> Service -> API`).
- Đồng bộ theme token hiện có (dark/light + palette) để landing page không bị lệch giao diện.
- Mở rộng Settings để admin cấu hình nội dung landing + featured products + logo toàn site.
- Chuẩn hóa điều hướng từ landing sang showroom hiện có theo showroom slug/default showroom.

## Phụ thuộc
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/029_stylestream_ui_clone_multitheme_dark_light_palette.md`
- `docs/tasks/038_showroom_management_slug_default_routing.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/pages/Home.tsx`
- `templates/stylestream-showcase-main/src/components/ProductCard.tsx`
- `templates/stylestream-showcase-main/src/components/ui/button.tsx`

## Mapping màn hình/source
- Public landing route mới:
  - `apps/web/src/app/[locale]/product/page.tsx` (mới)
  - `apps/web/src/app/[locale]/page.tsx` (xem xét redirect role-aware để route customer/public có thể vào landing mới)
  - `apps/web/src/server/services/localeService.ts` (cập nhật chiến lược `resolvePreferredLandingPath` nếu cần)
- Landing feature (tuân thủ kiến trúc):
  - `apps/web/src/features/landing/components/ProductLandingPage.tsx` (mới)
  - `apps/web/src/features/landing/hooks/useProductLandingPage.ts` (mới)
  - `apps/web/src/features/landing/queries/useProductLandingQueries.ts` (mới)
  - `apps/web/src/features/landing/services/productLandingClientService.ts` (mới)
  - `apps/web/src/features/landing/stores/productLandingStore.ts` (mới, nếu cần store-first hydration)
- Admin settings config:
  - `apps/web/src/features/settings/components/SettingsShowroomPagesPage.tsx` (mở rộng form config landing)
  - `apps/web/src/features/settings/hooks/useSettingsShowroomPagesPage.ts` (mở rộng state/payload cho landing fields)
  - `apps/web/src/features/settings/queries/useSettingsQueries.ts` (mở rộng query/mutation keys nếu thêm pageKey/config type mới)
  - `apps/web/src/features/settings/services/settingsClientService.ts` (mở rộng API payload)
  - `apps/web/src/features/settings/stores/settingsStore.ts` (mở rộng data contract)
  - `apps/web/src/server/services/settingsService.ts` (mở rộng validate + normalize payload)
  - `apps/web/src/server/data-access/settings.ts` (mở rộng read/write config)
  - `apps/web/src/types/settingsModule.ts` (mở rộng DTO/contracts cho landing config và logo global)
- Public config/products API:
  - `apps/web/src/app/api/showroom/config/route.ts` (mở rộng để trả config landing theo page key hoặc endpoint tách mới)
  - `apps/web/src/app/api/showroom/products/route.ts` (dùng để resolve featured products)
- App-shell button rename + redirect:
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx` (đổi href sang `/{locale}/product`)
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts` (đổi copy key logic)
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`

## Data contract đề xuất
- Mở rộng cấu hình page hiện có (`showroom_page_configs`) để hỗ trợ thêm `pageKey` cho landing product home:
  - đề xuất thêm key: `PRODUCT_LANDING_HOME` (song song với `PRODUCT_HOME` hiện tại).
- Landing config JSON gợi ý:
  - `heroConfigJson`:
    - `badge`
    - `heading`
    - `subheading`
    - `searchPlaceholder`
    - `searchRedirectMode` (`showroom_default` | `showroom_slug`)
  - `sectionsConfigJson`:
    - `stats[]`
    - `perks[]`
    - `testimonials[]`
    - `cta` (`label`, `target`)
    - `featured` (`title`, `showMoreLabel`, `showMoreTarget`)
  - `displayConfigJson`:
    - `showStats`
    - `showPerks`
    - `showTestimonials`
    - `featuredProductIds: string[]`
- Cấu hình logo toàn site:
  - ưu tiên mở rộng `systemDefaults` hoặc bảng settings global hiện có để lưu:
    - `siteLogoLightPath`
    - `siteLogoDarkPath` (nếu có)
  - logo phải được dùng thống nhất ở dashboard shell + showroom shell + landing.

## Quy tắc nghiệp vụ bắt buộc
- Admin-only (`owner_admin`/`admin`) được chỉnh landing config và logo site.
- Landing page là public/customer-facing, không yêu cầu auth.
- `featuredProductIds` chỉ nhận sản phẩm còn active/được phép hiển thị public.
- Nếu featured product không còn hợp lệ:
  - tự loại khỏi danh sách render, không làm vỡ page.
- Click vào ô search hoặc `show more`:
  - chuyển tới showroom route hiện hành (`/{locale}/showroom` hoặc `/{locale}/showroom/{slug}` theo context).
- Button shell `Open showroom` đổi thành `Go to product` và trỏ tới `/{locale}/product`.

## API contract đề xuất
- Admin settings (mở rộng endpoint hiện có):
  - `GET /api/settings/showroom-pages?branchId=...&locale=...&pageKey=PRODUCT_LANDING_HOME`
  - `POST /api/settings/showroom-pages` payload có `pageKey=PRODUCT_LANDING_HOME` + landing JSON fields
- Public config:
  - `GET /api/showroom/config?locale=...&showroomSlug=...&pageKey=PRODUCT_LANDING_HOME`
- Featured products:
  - tái sử dụng `GET /api/showroom/products` với filter theo `featuredProductIds`,
  - hoặc thêm endpoint read-only chuyên biệt nếu cần tối ưu payload.

## In-scope
- Tạo landing route mới `/{locale}/product` clone visual từ template Home.
- Dùng theme tokens hiện có (dark/light + palette), không hardcode style lệch hệ thống.
- Thêm admin config cho landing text/content và featured product selection.
- Thêm config logo toàn site và hiển thị nhất quán.
- Cập nhật button từ `go to showroom` -> `go to product` trong admin shell.
- Hành vi điều hướng từ landing -> showroom theo yêu cầu.

## Out-of-scope
- Thay đổi nghiệp vụ đặt thuê/đặt cọc trong showroom.
- CMS media library đầy đủ (crop/compress/versioning).
- SEO nâng cao đa domain hoặc A/B testing landing.

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone landing home từ templates/stylestream-showcase-main vào web app hiện tại, tích hợp theme đa palette/dark-light, và cho phép admin cấu hình nội dung landing + logo + featured products.

Yêu cầu:
1) Tạo route public mới `/{locale}/product`:
   - UI clone theo `templates/stylestream-showcase-main/src/pages/Home.tsx`
   - dùng token/theme hiện có, không copy CSS rời rạc phá hệ thống

2) Kiến trúc:
   - Component -> Hook -> Query -> Service -> API
   - nếu cần state lưu hiển thị thì hydrate vào store trước, UI đọc từ store

3) Admin config:
   - mở rộng settings để sửa text landing (hero/section labels/cta...)
   - cho phép chọn featured products
   - cho phép đổi logo toàn site
   - enforce RBAC owner_admin/admin

4) Data/API:
   - mở rộng contract settings/public config cho page key landing mới (`PRODUCT_LANDING_HOME`)
   - featured products chỉ lấy từ product hợp lệ public

5) Điều hướng:
   - click search box trên landing -> showroom page hiện tại
   - click show more ở featured -> showroom page hiện tại
   - đổi button `Open showroom` ở dashboard shell thành `Go to product`, link tới `/{locale}/product`

6) Regression constraints:
   - không phá route showroom hiện tại
   - không phá auth/offline/anon invariants
   - không tạo duplicate state ownership giữa query result và MobX store
```

## Done criteria (coding)
- Truy cập `/{locale}/product` render landing page mới (responsive desktop/mobile).
- Landing page áp dụng đúng dark/light + palette tokens hiện có.
- Admin chỉnh text landing và featured products, publish xong landing phản ánh đúng dữ liệu.
- Logo toàn site đổi từ admin và hiển thị nhất quán ở shell liên quan.
- Click search box và `show more` trên landing điều hướng đúng sang showroom page hiện tại.
- Button ở admin shell đổi thành `Go to product` và link đúng `/{locale}/product`.
- `cd apps/web && npm run lint:mvp` và `cd apps/web && npm run typecheck:mvp` pass.

## Nhắc test nhanh
- Public route:
  - mở `/{locale}/product` ở mobile + desktop.
  - chuyển dark/light + palette, verify UI landing đồng bộ token.
- Admin config:
  - đổi text hero/section -> save -> kiểm tra landing cập nhật.
  - chọn featured products -> landing hiển thị đúng thứ tự/số lượng.
  - đổi logo -> dashboard/showroom/landing cập nhật đúng.
- Navigation:
  - click search box ở landing -> đến showroom đúng locale/showroom context.
  - click `show more` ở featured -> đến showroom đúng locale/showroom context.
  - từ dashboard shell click `Go to product` -> vào landing route mới.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 041 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 040 /a - [ ] 041 | Product landing home clone + admin config (text/logo/featured) + go-to-product nav | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 041 |- [x] 041 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 041
  - Task file: docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
