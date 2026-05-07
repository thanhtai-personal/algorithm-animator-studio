# Task 038 - Showroom Management (Admin CRUD + Slug Routing + Default Showroom Guard)

## Input ban đầu
- Cần tính năng cho phép admin quản lý showroom: thêm / xóa / sửa showroom.
- Showroom page `/(locale)/showroom` phải gắn với `showroomId` cụ thể; không truyền slug thì dùng showroom mặc định.
- Showroom mặc định **không được phép sửa/xóa**.
- URL showroom theo slug không dấu:
  - `/{locale}/showroom/ten-showroom-viet-thuong-khong-dau`
  - nếu không có slug (`/{locale}/showroom`) thì hiển thị showroom mặc định.

## Mục tiêu
- Bổ sung thực thể `showroom` riêng để quản trị nhiều showroom trong Settings.
- Chuẩn hóa route showroom public theo slug locale-aware, có fallback showroom mặc định.
- Giữ an toàn dữ liệu bằng rule bất biến cho showroom mặc định (read-only, non-deletable).
- Không phá kiến trúc hiện có: `Component -> Hook -> Query -> Service -> API/Supabase`.

## Phụ thuộc
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/037_add_role_customer.md`

## Mapping màn hình/source
- Admin Settings (showroom management):
  - `apps/web/src/app/[locale]/(dashboard)/settings/showrooms/page.tsx` (mới)
  - `apps/web/src/features/settings/components/SettingsShowroomsPage.tsx` (mới)
  - `apps/web/src/features/settings/hooks/useSettingsShowroomsPage.ts` (mới)
  - `apps/web/src/features/settings/queries/useSettingsQueries.ts` (mở rộng)
  - `apps/web/src/features/settings/services/settingsClientService.ts` (mở rộng)
  - `apps/web/src/features/settings/stores/settingsStore.ts` (mở rộng)
- API/server settings:
  - `apps/web/src/app/api/settings/showrooms/route.ts` (mới)
  - `apps/web/src/app/api/settings/showrooms/[showroomId]/route.ts` (mới)
  - `apps/web/src/server/services/settingsService.ts` (mở rộng)
  - `apps/web/src/server/data-access/settings.ts` (mở rộng)
  - `apps/web/src/types/settingsModule.ts` (mở rộng contract)
- Public showroom routing:
  - `apps/web/src/app/[locale]/showroom/page.tsx` (fallback default showroom)
  - `apps/web/src/app/[locale]/showroom/[showroomSlug]/page.tsx` (mới)
  - `apps/web/src/features/showroom/hooks/useShowroomListPage.ts` (nhận showroom context)
  - `apps/web/src/features/showroom/queries/useShowroomQueries.ts` (query theo showroom)
  - `apps/web/src/features/showroom/services/showroomClientService.ts`
  - `apps/web/src/app/api/showroom/config/route.ts`
  - `apps/web/src/app/api/showroom/products/route.ts`
  - `apps/web/src/server/services/{settingsService,productsService}.ts`
  - `apps/web/src/server/data-access/{settings,products}.ts`

## Quy ước route cần đạt
- Danh sách showroom mặc định:
  - `/{locale}/showroom` -> dùng showroom mặc định.
- Danh sách showroom theo slug:
  - `/{locale}/showroom/{showroomSlug}` -> resolve showroom theo slug.
- Nếu `showroomSlug` không tồn tại:
  - khuyến nghị trả `404` (không silent fallback sai nội dung).
- Lưu ý xung đột route chi tiết sản phẩm:
  - route hiện tại `/{locale}/showroom/[productId]` có thể xung đột với `showroomSlug`.
  - task này phải chốt và migrate về route không xung đột (ví dụ: `/{locale}/showroom/p/[productId]` hoặc `/{locale}/showroom/{showroomSlug}/p/[productId]`).

## Data contract đề xuất (MVP)
- Bảng mới `showrooms`:
  - `id uuid pk`
  - `code text unique` (optional)
  - `name text not null`
  - `slug text unique not null`
  - `branch_id uuid not null references branches(id)`
  - `is_default boolean not null default false`
  - `is_active boolean not null default true`
  - `created_at/updated_at timestamptz`
  - `created_by/updated_by uuid`
- Rule slug:
  - lowercase, không dấu, chỉ `[a-z0-9-]`, không space kép, không `--`.
  - ví dụ: `Showroom Hà Nội` -> `showroom-ha-noi`.
- Bảng `showroom_page_configs`:
  - bổ sung `showroom_id` (thay vì chỉ `branch_id`) hoặc mapping qua showroom trước khi resolve branch.
  - unique key theo scope mới: `(showroom_id, locale, page_key)`.

## Quy tắc nghiệp vụ bắt buộc
- Chỉ `owner_admin` / `admin` được quản lý showroom.
- Showroom mặc định:
  - không cho sửa metadata (`name`, `slug`, `branch_id`, `is_active`).
  - không cho xóa.
  - chỉ đọc/hiển thị.
- Không cho tạo 2 showroom cùng `slug`.
- Không cho đổi slug thành slug đang tồn tại.
- Nếu showroom đang được dùng bởi config đã publish, xóa showroom phải bị chặn hoặc yêu cầu migrate dữ liệu rõ ràng (khuyến nghị: chặn trong MVP).

## API contract đề xuất
- Admin:
  - `GET /api/settings/showrooms`
  - `POST /api/settings/showrooms`
  - `PATCH /api/settings/showrooms/{showroomId}`
  - `DELETE /api/settings/showrooms/{showroomId}`
- Public:
  - `GET /api/showroom/config?locale=vi&showroomSlug=abc` (slug optional)
  - `GET /api/showroom/products?showroomSlug=abc&page=1&pageSize=12` (slug optional)
- Khi không có `showroomSlug`, service tự resolve showroom mặc định.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm quản lý showroom trong Settings và áp dụng routing showroom theo slug.

Yêu cầu:
1) Admin CRUD showroom:
   - tạo/sửa/xóa showroom trong Settings
   - enforce RBAC owner_admin/admin
   - showroom mặc định không cho sửa/xóa

2) Routing showroom public:
   - hỗ trợ `/{locale}/showroom/{showroomSlug}`
   - `/{locale}/showroom` dùng showroom mặc định
   - resolve showroom context trước khi load config/products

3) Data/API:
   - thêm bảng showroom + slug unique
   - mở rộng API settings/showroom để CRUD
   - mở rộng API public showroom config/products nhận showroom slug (optional)

4) Route conflict:
   - xử lý xung đột giữa showroom slug và product detail route hiện có
   - migrate sang route detail không xung đột, cập nhật link toàn bộ showroom module

5) Guardrails:
   - validate slug chuẩn không dấu + lowercase + hyphen
   - reject sửa/xóa showroom mặc định
   - reject duplicate slug

6) Kiến trúc:
   - Component -> Hook -> Query -> Service -> API/Supabase
   - UI không gọi service trực tiếp
   - Query hydrate về store, UI đọc store
```

## In-scope
- Showroom CRUD trong Settings (admin-facing).
- Slug routing cho showroom public.
- Fallback default showroom khi thiếu slug.
- Rule bảo vệ showroom mặc định.
- Migration schema + cập nhật contract/query/service/api liên quan.

## Out-of-scope
- Multi-domain/public custom domain theo showroom.
- CMS nâng cao cho từng showroom ngoài config hiện có.
- Geo search/nearby showroom.

## Done criteria (coding)
- Có trang settings showroom cho admin CRUD.
- Tạo showroom mới sinh slug hợp lệ và truy cập được qua `/{locale}/showroom/{slug}`.
- `/{locale}/showroom` luôn render showroom mặc định.
- Showroom mặc định bị chặn ở API khi sửa/xóa.
- Không còn xung đột route slug showroom và route chi tiết sản phẩm.
- Showroom config/products load đúng theo showroom được resolve.

## Nhắc test nhanh
- RBAC:
  - staff/customer vào settings showrooms -> bị chặn.
  - owner_admin/admin -> truy cập và thao tác được.
- CRUD showroom:
  - tạo showroom slug mới.
  - sửa showroom thường.
  - xóa showroom thường.
  - thử sửa/xóa showroom mặc định -> bị chặn đúng lỗi.
- Routing:
  - `/{locale}/showroom` -> default showroom.
  - `/{locale}/showroom/{slug-hop-le}` -> showroom tương ứng.
  - slug không tồn tại -> 404 (hoặc hành vi đã chốt trong task).
- Regression:
  - link tới product detail từ showroom list vẫn hoạt động sau khi đổi route.
- Lệnh:
  - `cd apps/web && npm run lint:mvp`
  - `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 038 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 037 /a - [ ] 038 | Showroom management + slug routing + default showroom guard | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 038 |- [x] 038 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 038
  - Task file: docs/tasks/038_showroom_management_slug_default_routing.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
