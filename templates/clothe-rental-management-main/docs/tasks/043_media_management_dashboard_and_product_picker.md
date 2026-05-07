# Task 043 - Media Management (Dashboard Menu + Quota 9GB + Product Media Picker Modal)

## Input ban đầu
- Cần thêm màn hình quản lý media trong dashboard menu.
- Cần cho phép upload/delete media (ảnh + video).
- Tổng dung lượng media tối đa là `9GB`; khi đầy phải cảnh báo và chặn upload vượt giới hạn.
- Trong form product, trường video cần có button upload/chọn media:
  - click mở modal media library;
  - search/chọn ảnh/video đã tải để chèn vào form;
  - có thể upload mới ngay trong modal;
  - media upload mới phải được đưa vào media storage để quản lý tập trung.
- Ở product chỉ lưu URL/path media, không tạo quan hệ FK bắt buộc với media record.

## Bối cảnh hiện tại
- Dashboard đã có các module chính (`products`, `categories`, `orders`, ...), chưa có module `media`.
- Product overview hiện đang nhập media theo text URL (`coverImageUrl`, `galleryImageUrlsText`, `videoUrlsText`).
- Đã có upload trực tiếp cho ảnh cover qua Supabase Storage trong client service, nhưng chưa có media library tập trung và chưa có quota control 9GB.

## Mục tiêu
- Bổ sung module `Media` trên dashboard để quản lý tập trung ảnh/video theo branch context.
- Enforce quota cứng `9GB` cho media storage scope (theo branch) và chặn upload vượt quota ở server.
- Thêm media picker modal trong Product form để chọn media đã có hoặc upload mới mà không rời trang.
- Product vẫn chỉ persist URL/path media (`cover_image_path`, `gallery_image_paths[]`, `video_urls[]`) như contract hiện tại.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/040_category_management_settings_rbac_products_sync.md`
- `docs/tasks/042_remove_product_variant_creation_simplification.md`

## Mapping màn hình/source
- Dashboard menu + route:
  - `apps/web/src/features/app-shell/constants.ts` (thêm nav key `media`)
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts` (label/href)
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx` (icon + render nav)
  - `apps/web/src/lib/languages/vi.ts`, `apps/web/src/lib/languages/en.ts` (i18n nav copy)
  - `apps/web/src/app/[locale]/(dashboard)/media/page.tsx` (mới)
- Media module (theo kiến trúc chuẩn):
  - `apps/web/src/features/media/components/MediaLibraryPage.tsx` (mới)
  - `apps/web/src/features/media/components/MediaPickerModal.tsx` (mới)
  - `apps/web/src/features/media/hooks/useMediaLibraryPage.ts` (mới)
  - `apps/web/src/features/media/hooks/useMediaPickerModal.ts` (mới)
  - `apps/web/src/features/media/queries/useMediaQueries.ts` (mới)
  - `apps/web/src/features/media/services/mediaClientService.ts` (mới)
  - `apps/web/src/features/media/stores/mediaStore.ts` (mới, nếu cần store-first hydration)
  - `apps/web/src/types/mediaLibrary.ts` (mới)
- API/server:
  - `apps/web/src/app/api/media/route.ts` (GET list + POST prepare)
  - `apps/web/src/app/api/media/[mediaId]/route.ts` (DELETE)
  - `apps/web/src/app/api/media/upload-complete/route.ts` (POST finalize upload)
  - `apps/web/src/server/services/mediaService.ts` (mới)
  - `apps/web/src/server/data-access/media.ts` (mới)
- Product form integration:
  - `apps/web/src/features/products/components/ProductOverviewForm.tsx`
  - `apps/web/src/features/products/hooks/useProductsListPage.ts`
  - `apps/web/src/features/products/hooks/useProductDetailPage.ts`
  - `apps/web/src/features/products/types/productOverviewForm.ts`

## Data contract đề xuất
- SQL migration mới, ví dụ:
  - `apps/web/sql/015_media_library_core.sql`
- Bảng `media_assets`:
  - `id uuid pk`
  - `branch_id uuid not null`
  - `bucket text not null`
  - `storage_path text not null` (unique per bucket)
  - `public_url text not null`
  - `media_type text not null` (`image` | `video`)
  - `mime_type text not null`
  - `size_bytes bigint not null check (size_bytes > 0)`
  - `original_file_name text null`
  - `search_text text generated/normalized` (phục vụ search)
  - `uploaded_by_profile_id uuid null`
  - `created_at timestamptz not null default now()`
  - `deleted_at timestamptz null` (soft delete)
- Bảng `media_upload_sessions` (khuyến nghị để chống race quota):
  - `id uuid pk`
  - `branch_id uuid not null`
  - `bucket text not null`
  - `storage_path text not null`
  - `file_name text not null`
  - `mime_type text not null`
  - `size_bytes bigint not null`
  - `status text not null` (`PENDING` | `COMPLETED` | `EXPIRED` | `CANCELED`)
  - `expires_at timestamptz not null`
  - `created_by_profile_id uuid null`
  - `created_at timestamptz not null default now()`
- Hằng số quota:
  - `MEDIA_STORAGE_LIMIT_BYTES = 9663676416` (`9 * 1024 * 1024 * 1024`)

## Quy tắc nghiệp vụ bắt buộc
- Quota 9GB áp dụng theo `branch_id` trong dashboard context.
- Upload phải đi qua server `prepare` để check quota trước khi nhận signed upload URL/token.
- Nếu `used_bytes + reserved_bytes + file_size > limit_bytes`:
  - trả lỗi `409` với code `MEDIA_STORAGE_LIMIT_EXCEEDED`;
  - client hiển thị cảnh báo hết dung lượng;
  - không cho tiếp tục upload.
- UI media page phải hiển thị:
  - tổng dung lượng đã dùng;
  - quota tối đa;
  - phần trăm sử dụng;
  - cảnh báo khi đạt ngưỡng (khuyến nghị cảnh báo sớm từ `>= 90%`).
- Delete media phải:
  - dùng modal confirm component (`useAppModal().confirm`), không dùng `window.confirm`;
  - xóa object trong storage + soft delete record metadata;
  - cập nhật usage ngay sau thao tác.
- Product form:
  - bắt buộc thêm button upload/chọn media tại trường video;
  - mở modal media picker để search + chọn + chèn URL/path vào field;
  - hỗ trợ upload mới ngay trong modal, upload xong có thể chọn ngay;
  - chỉ lưu URL/path vào product payload, không tạo FK product -> media_assets bắt buộc.

## API contract đề xuất
- `GET /api/media?branchId=...&search=...&mediaType=image|video&page=...&pageSize=...`
  - response: `items[]`, `total`, `usage` (`usedBytes`, `limitBytes`, `reservedBytes`).
- `POST /api/media`
  - action `prepareUpload`:
  - payload: `branchId`, `fileName`, `mimeType`, `sizeBytes`, `mediaType`.
  - response: `uploadSessionId`, `bucket`, `storagePath`, `signedUploadToken/url`, `usage`.
- `POST /api/media/upload-complete`
  - payload: `uploadSessionId`
  - response: metadata media đã hoàn tất (`id`, `publicUrl`, `storagePath`, `mediaType`, `sizeBytes`).
- `DELETE /api/media/{mediaId}`
  - soft delete metadata + remove file storage.
- Error codes:
  - `MEDIA_STORAGE_LIMIT_EXCEEDED`
  - `MEDIA_UPLOAD_SESSION_EXPIRED`
  - `MEDIA_NOT_FOUND`
  - `MEDIA_DELETE_FAILED`

## In-scope
- Thêm menu `Media` trong dashboard + route + page quản lý media.
- Upload/delete media với quota control 9GB ở server.
- Thêm media picker modal trong Product form (ít nhất cho trường videos).
- Search/chọn media đã có + upload media mới trong modal.
- Persist product overview giữ mô hình lưu URL/path media như hiện tại.
- Bổ sung migration SQL cho metadata + upload session + index cần thiết.

## Out-of-scope
- Video transcoding/compression tự động.
- Crop/editor nâng cao cho ảnh.
- Versioning media nhiều phiên bản cho cùng asset.
- CDN optimization nâng cao ngoài Supabase public URL hiện có.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm module Media trong dashboard để quản lý ảnh/video và tích hợp media picker modal vào Product form, có quota cứng 9GB theo branch.

Yêu cầu:
1) Dashboard:
   - thêm menu `Media` và route `/{locale}/media`
   - trang Media dạng table/grid có search/filter (image/video), upload, delete
   - hiển thị usage/quota và cảnh báo khi gần đầy/đầy

2) Quota 9GB:
   - enforce server-side (không chỉ validate client)
   - nếu upload vượt quota => reject với error code rõ ràng
   - chặn upload UI khi full quota

3) Product form:
   - field videos có button `Upload/Choose media`
   - mở modal media picker:
     - tab media đã có + search
     - chọn ảnh/video để chèn URL/path vào form
     - upload mới ngay trong modal, xong có thể chọn ngay
   - product payload chỉ lưu URL/path media (không FK bắt buộc)

4) Kiến trúc:
   - Component -> Hook -> Query -> Service -> API -> DB
   - không gọi service trực tiếp trong component
   - giữ store-first hydration nếu module có MobX store

5) Validation:
   - `cd apps/web && npm run lint:mvp`
   - `cd apps/web && npm run typecheck:mvp`
```

## Done criteria (coding)
- Sidebar dashboard có menu `Media`, truy cập được route `/{locale}/media`.
- Upload media thành công khi còn quota; bị chặn đúng khi vượt `9GB`.
- Màn Media hiển thị usage/quota và cảnh báo đầy bộ nhớ.
- Delete media dùng modal confirm component và cập nhật usage/list đúng.
- Product form có button mở media picker ở field videos, chọn/upload media và chèn URL/path vào form.
- Product create/update vẫn persist media dưới dạng URL/path trong product overview payload.
- `cd apps/web && npm run lint:mvp` và `cd apps/web && npm run typecheck:mvp` pass.

## Nhắc test nhanh
- Media page:
  - upload ảnh/video nhỏ -> list xuất hiện + usage tăng đúng.
  - giả lập gần ngưỡng 9GB -> hiển thị warning.
  - upload file vượt phần dung lượng còn lại -> bị chặn, hiện thông báo `MEDIA_STORAGE_LIMIT_EXCEEDED`.
  - delete media -> confirm modal hoạt động, file biến mất, usage giảm.
- Product form:
  - mở modal media picker từ field videos.
  - search media theo tên/type.
  - chọn media có sẵn -> URL/path được chèn vào field.
  - upload mới trong modal -> chọn được ngay sau upload.
- Lệnh:
  - `cd apps/web && npm run lint:mvp`
  - `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 043 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 042 /a - [ ] 043 | Media management module (dashboard menu + upload/delete + 9GB quota + product media picker modal) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 043 |- [x] 043 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 043
  - Task file: docs/tasks/043_media_management_dashboard_and_product_picker.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
