# Task 002 - Supabase Schema Showroom Core (DB First)

## Mục tiêu
- Thiết kế và tạo schema Supabase/Postgres cho showroom rental theo PRD.
- Tách rõ schema mới khỏi schema legacy finance hiện có.

## Phụ thuộc
- Hoàn thành `docs/tasks/001_foundation_source_base_alignment.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 2, 4, 7, 10, 11)
- `docs/001_wireframe.md` (Sections 4-11)

## Hiện trạng cần lưu ý
- Thuật ngữ trong task này: `showroom core` = schema nghiệp vụ thuê đồ cho toàn hệ thống (admin + customer showroom page), không chỉ nghĩa “chi nhánh/showroom vật lý”.
- `apps/web/sql/000_create_relations.sql` hiện là schema finance (user_settings/categories/transactions)
- `apps/web/sql/001_seed_admin_account.sql` chỉ seed auth + user_settings/security settings
- PRD yêu cầu schema showroom riêng: `profiles`, `branches`, `customers`, `products`, `product_variants`, `items`, `rental_orders`, `rental_order_items`, `payments`, `item_status_logs`, `incidents`

## Prompt gợi ý cho Codex
```text
Mục tiêu: tạo bộ SQL migration/schema bootstrap cho hệ thống thuê đồ (admin + showroom page khách) trên Supabase theo PRD, không ghi đè mơ hồ schema finance legacy.

Yêu cầu:
1) Đề xuất strategy migration rõ ràng:
   - tạo file SQL mới theo thứ tự (ví dụ `apps/web/sql/002_...`, `apps/web/sql/003_...`)
   - hoặc chuẩn supabase/migrations nếu repo chuyển sang supabase CLI
2) Tạo schema showroom core:
   - bảng chính theo PRD (profiles, branches, customers, products, product_variants, items, rental_orders, rental_order_items, payments, item_status_logs, incidents)
   - thêm bảng config/template cho customer showroom product home page (DB-ready for future multi-template)
   - enum/check constraints cho item/order/payment statuses/types/methods
   - timestamps + updated_at trigger
3) Chuẩn bị anti-overlap nền tảng:
   - reservation window table + daterange + EXCLUDE constraint (btree_gist)
   - document rõ end_date inclusive/exclusive semantics
4) Thêm RLS baseline theo branch + role (ít nhất cho read/write ownership rules)
5) Seed dữ liệu tối thiểu:
   - branch mặc định
   - profiles cho admin seed (nếu auth user đã có)
   - `showroom_page_templates` seed tối thiểu (`PRODUCT_HOME_V1`)
   - `showroom_page_configs` published config mặc định cho `PRODUCT_HOME` theo branch/locale (ít nhất `vi`, khuyến nghị `vi` + `en`)
6) Không xóa ngay schema finance legacy nếu chưa có quyết định migration cutover; chỉ cô lập và ghi chú migration path.

Bắt buộc:
- SQL idempotent ở mức hợp lý hoặc migration strategy rõ ràng
- Comment SQL ngắn gọn cho phần constraint khó
- Bám danh sách `relations + columns (MVP canonical)` bên dưới; nếu đổi tên cột phải ghi decision + mapping note
- Báo cáo các quyết định schema còn cần PO/BA chốt
```

## Config cần chuẩn bị trước khi chạy task
- Quyết định nơi đặt SQL mới:
  - `apps/web/sql/` (đề xuất hiện tại, đang dùng)
  - hoặc `apps/web/supabase/migrations/`
- Chốt semantics date range:
  - `daterange [start, end)` (khuyến nghị để tránh overlap off-by-one)
- Chốt role enum MVP:
  - `owner_admin`, `manager`, `staff`, `accountant` (optional)
- Chốt branch strategy:
  - single-branch MVP nhưng schema support multi-branch
- Chốt policy product visibility cho customer showroom page (MVP):
  - tái sử dụng `products.is_active` + `is_archived` (khuyến nghị)
  - hoặc bổ sung field riêng qua migration khác
- Chốt strategy config cho showroom product home page:
  - bảng template registry + bảng page config (khuyến nghị)
  - hay nhúng vào `system_settings`/`branch_settings` (không khuyến nghị vì khó mở rộng multi-template)
- Chốt page key MVP:
  - `PRODUCT_HOME` (khuyến nghị)
- Chốt payment method/type enum list theo PRD
- Chốt naming convention snake_case toàn DB

## Danh sách relations + columns (MVP canonical)
> Mục tiêu của section này: chốt **tên cột** trước khi viết migration để tránh drift giữa `schema ↔ service ↔ report ↔ UI`.
> Nếu implement khác danh sách dưới đây, bắt buộc ghi vào `progress/decisions.md` + mapping note trong output task.

### 1) `public.branches`
> Danh mục chi nhánh/showroom vận hành; là scope chính cho phân quyền và cô lập dữ liệu.
- `id`
- `code`
- `name`
- `address`
- `phone`
- `timezone`
- `currency_code`
- `is_active`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 2) `public.profiles`
> Map 1-1 với `auth.users`
> Hồ sơ người dùng ứng dụng (thông tin hiển thị + role + branch mặc định) dùng cho RBAC và context vận hành.
- `id` (khuyến nghị dùng cùng id với `auth.users.id`)
- `full_name`
- `email`
- `phone`
- `role`
- `default_branch_id`
- `locale`
- `is_active`
- `invited_by`
- `disabled_at`
- `disabled_by`
- `created_at`
- `updated_at`

### 3) `public.profile_branch_access` (support multi-branch)
> Bảng mapping quyền truy cập nhiều-chi nhánh của từng `profile`.
- `id`
- `profile_id`
- `branch_id`
- `is_default`
- `created_at`

### 4) `public.customers`
> Dữ liệu khách hàng theo chi nhánh (CRM lite) phục vụ tạo đơn, tra cứu lịch sử và gắn tags.
- `id`
- `branch_id`
- `customer_code`
- `full_name`
- `phone`
- `phone_normalized`
- `social_link`
- `address`
- `note`
- `is_active`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 5) `public.customer_tags`
> Dùng cho `vip`, `blacklist`, và custom tags (phase mở rộng)
> Định nghĩa tag khách hàng theo chi nhánh, kèm rule cảnh báo/block khi tạo đơn.
- `id`
- `branch_id`
- `code`
- `name`
- `color`
- `is_system`
- `warn_on_order_create`
- `block_order_create`
- `is_active`
- `created_at`
- `updated_at`

### 6) `public.customer_tag_assignments`
> Quan hệ gán tag cho khách hàng (many-to-many giữa `customers` và `customer_tags`).
- `id`
- `customer_id`
- `tag_id`
- `created_by`
- `created_at`

### 7) `public.product_categories`
> Danh mục loại sản phẩm (global hoặc theo chi nhánh) dùng cho phân loại catalog và báo cáo.
- `id`
- `branch_id` (nullable nếu chọn global catalog)
- `code`
- `name`
- `slug`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### 8) `public.product_tags`
> Tag sản phẩm (global hoặc theo chi nhánh) dùng cho filter/nhóm sản phẩm trong catalog.
- `id`
- `branch_id` (nullable nếu chọn global tags)
- `code`
- `name`
- `color`
- `is_active`
- `created_at`
- `updated_at`

### 9) `public.products`
> Product master/catalog (mẫu trang phục) ở mức sản phẩm, chưa phải item vật lý; là nguồn dữ liệu cho admin catalog và trang showroom khách.
- `id`
- `branch_id` (nullable nếu chọn global catalog)
- `product_code`
- `name`
- `category_id`
- `gender`
- `material`
- `size_chart_json`
- `description`
- `cover_image_path`
- `is_active`
- `is_archived`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 10) `public.product_tag_assignments`
> Quan hệ gán tag cho sản phẩm (many-to-many giữa `products` và `product_tags`).
- `id`
- `product_id`
- `tag_id`
- `created_at`

### 11) `public.product_variants`
> Biến thể/SKU của sản phẩm (size/màu/thuộc tính) và giá/cọc mặc định để tạo item và tính giá thuê.
- `id`
- `product_id`
- `variant_code`
- `sku_code`
- `name`
- `size`
- `color`
- `attributes_json`
- `default_deposit_amount`
- `price_1d`
- `price_3d`
- `price_7d`
- `price_per_day`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### 12) `public.items`
> Item vật lý cho thuê thực tế (đơn vị tồn kho có mã/QR) với trạng thái vận hành hiện tại.
- `id`
- `branch_id`
- `variant_id`
- `item_code`
- `qr_code`
- `status`
- `condition_note`
- `retired_at`
- `retired_reason`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 13) `public.rental_orders`
> Header của đơn thuê: thông tin khách, thời gian thuê, trạng thái vòng đời và tổng tiền/cọc/phí.
- `id`
- `branch_id`
- `order_code`
- `customer_id`
- `status`
- `start_date`
- `end_date`
- `pickup_time`
- `return_time`
- `confirmed_at`
- `picked_up_at`
- `returned_at`
- `completed_at`
- `cancelled_at`
- `cancel_reason`
- `discount_type`
- `discount_value`
- `discount_amount`
- `rent_amount`
- `fees_amount`
- `total_amount`
- `deposit_amount`
- `deposit_applied_amount`
- `deposit_refunded_amount`
- `currency_code`
- `note`
- `internal_note`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 14) `public.rental_order_items`
> Dòng hàng của đơn thuê (item cụ thể) với snapshot tên/mã và giá/cọc tại thời điểm tạo đơn.
- `id`
- `order_id`
- `item_id`
- `product_id`
- `variant_id`
- `item_code_snapshot`
- `product_name_snapshot`
- `variant_name_snapshot`
- `rent_plan_type`
- `rent_plan_days`
- `rent_price`
- `deposit_override_amount`
- `deposit_effective_amount`
- `condition_out_note`
- `condition_in_note`
- `created_at`
- `updated_at`

### 15) `public.reservation_windows` (anti-overlap source of truth)
> Khuyến nghị dùng bảng này làm source of truth cho date-range lock; `items.status = RESERVED` chỉ là derived UI state nếu cần
> Bảng khóa lịch thuê theo item + khoảng ngày để chống double-booking ở mức DB.
- `id`
- `branch_id`
- `order_id`
- `item_id`
- `source_order_status`
- `start_date`
- `end_date`
- `window_range`
- `is_active`
- `released_at`
- `release_reason`
- `created_at`
- `updated_at`

### 16) `public.payments`
> Bản ghi thu/chi liên quan đơn thuê (rent/deposit/fee/refund), bao gồm method, status và thông tin audit/correction.
- `id`
- `branch_id`
- `order_id`
- `customer_id`
- `type`
- `method`
- `amount`
- `currency_code`
- `reason`
- `source`
- `status`
- `note`
- `reference_code`
- `void_reason`
- `voided_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 17) `public.item_status_logs`
> Nhật ký chuyển trạng thái item theo thời gian (ai thao tác, từ trạng thái nào sang trạng thái nào, lý do).
- `id`
- `branch_id`
- `item_id`
- `order_id`
- `from_status`
- `to_status`
- `reason_code`
- `reason_note`
- `actor_profile_id`
- `happened_at`
- `created_at`

### 18) `public.incidents`
> Sự cố/phụ phí phát sinh (trễ, hỏng, mất, cleaning) gắn với order/item/customer để tính phí và đối soát.
- `id`
- `branch_id`
- `order_id`
- `order_item_id`
- `item_id`
- `customer_id`
- `type`
- `status`
- `amount`
- `apply_to_deposit`
- `description`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 19) `public.audit_events` (bắt buộc để cover PRD auditability)
> Audit log tổng quát cho các hành động nghiệp vụ quan trọng (sửa giá, hủy đơn, refund, đổi trạng thái...).
- `id`
- `branch_id`
- `actor_profile_id`
- `entity_type`
- `entity_id`
- `action`
- `reason`
- `before_data`
- `after_data`
- `meta`
- `created_at`

### 20) `public.maintenance_tasks` (MVP minimal, phục vụ flow giặt/sửa)
> Work queue tối thiểu cho giặt/sửa/bảo trì item sau trả hàng hoặc khi có incident.
- `id`
- `branch_id`
- `item_id`
- `order_id`
- `incident_id`
- `status`
- `priority`
- `issue_type`
- `title`
- `description`
- `assigned_to_profile_id`
- `opened_at`
- `due_at`
- `resolved_at`
- `closed_at`
- `resolution_note`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### 21) `public.system_settings` (global settings)
> Cấu hình hệ thống mức global (defaults) áp dụng toàn bộ app nếu chi nhánh không override.
- `id`
- `default_locale`
- `default_currency_code`
- `late_fee_mode`
- `late_fee_value`
- `laundry_tracking_enabled`
- `created_at`
- `updated_at`
- `updated_by`

### 22) `public.branch_settings` (override theo chi nhánh)
> Cấu hình override theo từng chi nhánh (locale, currency, late fee, reminder thresholds...).
- `id`
- `branch_id`
- `locale`
- `currency_code`
- `late_fee_mode`
- `late_fee_value`
- `laundry_tracking_enabled`
- `overdue_reminder_threshold_hours`
- `laundry_stuck_threshold_days`
- `created_at`
- `updated_at`
- `updated_by`

### 23) `public.branch_opening_hours`
> Lịch giờ mở cửa/đóng cửa theo ngày trong tuần của từng chi nhánh.
- `id`
- `branch_id`
- `day_of_week`
- `is_open`
- `open_time`
- `close_time`
- `break_start_time`
- `break_end_time`
- `created_at`
- `updated_at`

### 24) (Tùy chọn nếu muốn tách config cọc theo loại) `public.category_deposit_defaults`
> Nếu không tạo bảng riêng, phải document nơi lưu equivalent config (`product_categories` hoặc `branch_settings`)
> Cấu hình mức cọc mặc định theo loại sản phẩm và chi nhánh (nếu không nhúng trực tiếp vào category/settings).
- `id`
- `branch_id`
- `category_id`
- `default_deposit_amount`
- `currency_code`
- `is_active`
- `created_at`
- `updated_at`

### 25) `public.showroom_page_templates` (template registry cho customer showroom page)
> Danh sách template có thể dùng cho trang showroom khách (product home page); MVP chỉ seed 1 template nhưng schema hỗ trợ nhiều template.
- `id`
- `code`
- `page_key`
- `name`
- `description`
- `preview_image_path`
- `template_version`
- `config_schema_json`
- `is_active`
- `is_default`
- `created_at`
- `updated_at`

### 26) `public.showroom_page_configs` (config hiển thị + chọn template)
> Config nội dung hiển thị cho customer showroom product home page theo `branch` + `locale`, bao gồm template đang chọn và JSON config cho sections/display.
- `id`
- `branch_id`
- `locale`
- `page_key`
- `template_id`
- `title`
- `subtitle`
- `hero_image_path`
- `hero_config_json`
- `sections_config_json`
- `filters_config_json`
- `seo_config_json`
- `display_config_json`
- `is_active`
- `is_published`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

## In-scope
- Schema showroom core + constraints + RLS baseline
- Seed branch/profile admin mapping cơ bản
- Seed template/config mặc định cho customer showroom product home page (MVP 1 template)
- SQL docs comments
- Bám danh sách cột canonical cho relations (hoặc ghi decision + mapping nếu khác)
- Hỗ trợ source dữ liệu cho showroom page khách từ `products/categories/tags` (không bao gồm checkout/online booking)
- DB-ready cho showroom product home page config + template selection (MVP seed 1 template)

## Out-of-scope
- Full business RPCs cho mọi flow
- Realtime triggers/notifications
- PDF/export tables
- Customer showroom page UI (task riêng)

## Deliverables mong muốn
- Bộ SQL file tạo schema showroom core
- Hướng dẫn thứ tự chạy migration + seed
- Mapping note giữa schema legacy và showroom (nếu cùng project DB)
- Mapping note giữa danh sách cột canonical trong task và cột triển khai thực tế (nếu có khác biệt)

## Done criteria (coding)
- Tạo được tất cả bảng PRD mục 7.1
- Có các bảng support business-critical: `reservation_windows`, `audit_events`, `maintenance_tasks` (hoặc equivalent đã document)
- Có bảng/structure cho showroom page config + template selection (`showroom_page_templates`, `showroom_page_configs`) hoặc equivalent đã document
- Có anti-overlap constraint DB (không chỉ app-level check)
- Có RLS baseline theo branch/role cho các bảng nghiệp vụ chính
- Có seed tối thiểu để admin login và thấy branch/profile hợp lệ
- Có seed `PRODUCT_HOME_V1` + showroom page config mặc định (published) để Task 016/018 dùng ngay
- Tên cột triển khai khớp danh sách canonical hoặc có decision + mapping note rõ ràng

## Nhắc test nhanh
- Chạy SQL trên Supabase SQL Editor theo thứ tự
- Thử insert overlap reservation windows -> bị chặn
- Thử query bằng role user khác branch -> bị chặn theo RLS (ít nhất 1-2 case)


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 002 |- [x] 002 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 002
  - Task file: docs/tasks/002_supabase_schema_showroom_core.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
