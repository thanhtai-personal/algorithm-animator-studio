# Task 006 - Products Module (Catalog)

## Mục tiêu
- Implement module `Products` theo wireframe: list + detail tabs (overview, variants, items, pricing, activity placeholder).
- Tạo nền dữ liệu product/variant để các task inventory/orders dùng lại và làm nguồn read-side cho trang showroom khách (`Task 018`).

## Phụ thuộc
- `docs/tasks/002_supabase_schema_showroom_core.md`
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/005_shared_ui_and_domain_primitives.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.2)
- `docs/001_wireframe.md` (Section 6)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Products module MVP theo wireframe, bám kiến trúc Component -> Hook -> Query -> Service -> API/Supabase.

Phạm vi:
1) Routes:
   - /[locale]/products
   - /[locale]/products/[productId]
2) Products List:
   - filter category/tag/availability
   - table hoặc grid với cover, name, category, price policy, total/ready items
   - CTA create product
3) Product Detail:
   - tabs: Overview, Variants, Items, Pricing (Activity có thể placeholder)
   - CRUD cơ bản cho overview + variants + pricing
   - list items của product (read-only hoặc create item shortcut nếu đã sẵn sàng)
   - hỗ trợ voice input cho text fields (name/material/description/variant name/SKU) nếu shared primitive từ Task 005 đã có
4) Storage upload:
   - chuẩn bị upload image vào Supabase Storage (MVP có thể chỉ upload 1 ảnh cover)
5) RBAC:
   - pricing edit chỉ Manager+/Admin theo wireframe
6) Store/query:
   - fetch qua React Query, merge vào MobX store nếu feature store được tạo
   - UI render từ store (nếu áp dụng store-first cho module)
7) Chuẩn bị read-side contract cho customer showroom page (Task 018):
   - public DTO an toàn (không lộ field nội bộ)
   - filter/search contract dùng lại được cho route `/{locale}/showroom`
   - policy hiển thị product public/showroom (MVP có thể dựa trên `is_active && !is_archived`)
   - output fields tương thích renderer/template config của showroom product home page (ví dụ cover/title/tags/price labels)

Tập trung đúng MVP, không overbuild phase 2 (archive/activity đầy đủ).
```

## Config cần chuẩn bị trước khi chạy task
- Supabase Storage bucket name cho ảnh sản phẩm (ví dụ `product-images`)
- Category taxonomy MVP (enum/text table/tagging strategy)
- Unique policy:
  - product name unique theo branch (soft warning hay DB unique)
- Price plan shape:
  - fields `price_1d`, `price_3d`, `price_7d`, `price_per_day`
- Branch scoping cho products (global hay per-branch trong MVP)
- Showroom visibility policy (customer-facing page):
  - dùng `is_active && !is_archived` (khuyến nghị MVP, không đổi schema)
  - hoặc thêm field riêng `is_showroom_visible` (nếu chấp nhận migration bổ sung)
- Voice input scope trong Product forms (MVP):
  - text fields only (name/material/description/variant name/SKU)
  - numeric pricing/deposit fields nhập tay hoặc confirm parse riêng (không auto-commit)

## In-scope
- Products list/detail + variants/pricing CRUD MVP
- Image upload cơ bản
- RBAC cho pricing edit
- Public read contract/DTO cho customer showroom page (không nhất thiết build UI customer ở task này)

## Out-of-scope
- Archive phase 2
- Activity tab đầy đủ audit UI
- Bulk import

## Deliverables mong muốn
- Routes products hoạt động
- API/query/service cho product + variants
- Public-safe product read contract cho `Task 018`
- UI CRUD cơ bản usable

## Done criteria (coding)
- Tạo/sửa product thành công
- Thêm variant và giá mặc định thành công
- List filter/search cơ bản hoạt động
- Role Staff không sửa pricing được
- Có contract rõ cho customer showroom page chỉ đọc và không lộ field nội bộ
- Voice input (nếu bật) không làm sai giá trị numeric/pricing và không tự submit form

## Nhắc test nhanh
- Manual CRUD product/variant/pricing
- Upload ảnh test
- Manual voice input cho text fields (nếu feature bật) + fallback khi unsupported
- Lint/typecheck module products


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 006 |- [x] 006 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 006
  - Task file: docs/tasks/006_products_catalog_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
