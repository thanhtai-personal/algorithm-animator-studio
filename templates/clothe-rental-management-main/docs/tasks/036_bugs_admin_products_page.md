# Task 036 - Bugs Admin Products Page (Create Product Modal + Media + Voice Input)

## Input ban đầu
- Modal tạo mới sản phẩm:
  1. Cột mã sản phẩm cho phép generate mã sản phẩm là một chuỗi ký tự hoa 8 ký tự; khi mở modal tự động generate 1 mã, có thể cho user generate lại hoặc nhập thủ công.
  2. Bổ sung cột cho phép upload hoặc nhập URL ảnh cho thumbnail image và other images cho sản phẩm.
  3. Bổ sung cột cho phép upload hoặc nhập URL video cho sản phẩm.

## Mục tiêu
- Hoàn thiện form tạo sản phẩm ở trang Admin Products để dùng ổn định trong vận hành thực tế.
- Fix lỗi UI modal bị header dashboard đè lên trên.
- Chuẩn hóa voice input trong form theo mẫu template: mic button nằm bên trong input/textarea, thao tác ghi âm hoạt động ổn định.
- Mở rộng dữ liệu media sản phẩm (cover/gallery/video) theo flow nhập liệu nhanh.

## Phụ thuộc
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`

## Nguồn tham chiếu template
- `templates/stylestream-showcase-main/src/pages/admin/Products.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/ProductDetail.tsx`
- `templates/my-money-cloud-main/Next-cli/src/features/voice-transaction/components/VoiceButton.tsx`

## Mapping màn hình/source
- UI Admin Products:
  - `apps/web/src/features/products/components/ProductsListPage.tsx`
  - `apps/web/src/features/products/hooks/useProductsListPage.ts`
  - `apps/web/src/components/layout/DrawerFormShell.tsx`
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx`
- Shared voice primitives:
  - `apps/web/src/components/voice/VoiceDictationField.tsx`
  - `apps/web/src/components/voice/VoiceInputButton.tsx`
  - `apps/web/src/components/voice/hooks/useVoiceDictationPrimitive.ts`
- Product contract + API:
  - `apps/web/src/types/productsCatalog.ts`
  - `apps/web/src/features/products/services/productsClientService.ts`
  - `apps/web/src/features/products/queries/useProductsQueries.ts`
  - `apps/web/src/app/api/products/route.ts`
  - `apps/web/src/app/api/products/[productId]/route.ts`
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/server/data-access/products.ts`
- SQL migration (nếu cần bổ sung cột media):
  - `apps/web/sql/008_products_media_fields.sql` (mới)
  - `apps/web/sql/README.md`

## Prompt gợi ý cho Codex
```text
Mục tiêu: fix các bug ở Admin Products create modal (UI overlay + media fields + voice input),
không phá kiến trúc hiện tại.

Yêu cầu:
1) Fix lỗi modal bị header đè:
   - modal/drawer create product luôn nằm trên dashboard header/topbar
   - backdrop che full viewport, không bị offset theo layout container
   - body scroll lock khi mở modal, close bằng click backdrop + ESC

2) Product code auto-generate:
   - khi mở create modal: auto sinh `productCode` dạng 8 ký tự in hoa (A-Z, 0-9)
   - cho phép "tạo lại mã" và cho phép user nhập tay
   - validate bắt buộc + unique theo branch (UI báo lỗi rõ, API vẫn là nguồn xác thực cuối)

3) Bổ sung media fields:
   - cover image: upload file hoặc nhập URL
   - gallery images: nhiều ảnh (upload hoặc URL)
   - video: 1..n URL hoặc upload (MVP có thể ưu tiên URL trước)
   - lưu dữ liệu vào contract product overview/detail và trả về list/detail APIs

4) Voice input hoạt động đúng và đúng vị trí:
   - icon mic đặt bên trong input/textarea (right-inside), không đẩy layout
   - start/stop/processing/error state hiển thị đúng
   - xử lý tốt permission-denied và browser unsupported
   - tham chiếu style/hành vi từ template my-money-cloud-main

5) Kiến trúc bắt buộc:
   - Component -> Hook -> Query -> Service -> API/Supabase
   - UI không gọi service trực tiếp
   - query/mutation merge về store, UI đọc từ store (không dual ownership)

6) RBAC không regress:
   - giữ guard quyền hiện có cho products/pricing
   - không mở thêm quyền nhạy cảm ngoài scope bugfix
```

## Config cần chuẩn bị trước khi chạy task
- Chốt chuẩn dữ liệu media:
  - Option A: thêm cột `gallery_image_paths` + `video_urls` trong `products`.
  - Option B: lưu tạm trong JSON field hiện có (nếu muốn tránh migration DB ở MVP).
- Chốt quy tắc generate `productCode`:
  - ký tự dùng (`A-Z0-9`), độ dài 8, có/không prefix theo branch.
- Chốt phạm vi upload:
  - bucket dùng chung với `cover_image_path` hay tách bucket media riêng.

## In-scope
- Fix overlay/modal stacking bug tại trang Admin Products.
- Bổ sung product code generator + regenerate + manual override.
- Bổ sung fields media image/video trên form tạo sản phẩm.
- Fix voice input để hoạt động ổn định và icon nằm trong input.
- Cập nhật contract type/query/service/API tương ứng nếu payload thay đổi.

## Out-of-scope
- Thiết kế lại toàn bộ Product Detail page.
- Video processing/transcoding.
- Bulk media import hoặc CDN optimization nâng cao.

## Done criteria (coding)
- Mở modal tạo sản phẩm không còn bị header dashboard đè.
- Form tạo sản phẩm tự sinh mã 8 ký tự in hoa khi mở; có nút tạo lại mã; nhập tay vẫn hợp lệ.
- Có trường cover/gallery/video và submit thành công qua API.
- Voice input chạy được trên các field text chính; mic button nằm trong input/textarea.
- Không regression create/update product hiện có và không phá RBAC pricing.

## Nhắc test nhanh
- Manual UI:
  - mở create modal tại `/[locale]/products`, confirm overlay che full màn hình.
  - test đóng modal bằng backdrop + ESC.
- Manual form:
  - auto-generate mã khi mở modal.
  - regenerate mã.
  - nhập tay mã.
  - submit với cover/gallery/video.
- Manual voice:
  - bấm mic trên input và textarea.
  - test case permission denied / unsupported browser.
- Manual regression:
  - mở product detail, update overview/pricing/variant bình thường.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 036 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 035 /a - [ ] 036 | Bugs Admin Products Page (modal/media/voice input) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 036 |- [x] 036 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 036
  - Task file: docs/tasks/036_bugs_admin_products_page.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
