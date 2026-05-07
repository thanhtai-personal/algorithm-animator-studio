# 004 - Data Platform: Supabase, SQL Setup, RLS

## 1) Vai trò Supabase trong hệ thống
- **Postgres**: nguồn dữ liệu nghiệp vụ chính.
- **Auth**: user/session identity.
- **RLS**: enforcement theo role + branch scope.
- **Storage**: media (images/videos/tài nguyên sản phẩm).
- **Realtime**: thông báo và sync trạng thái theo module.

## 1.1 Ownership truy cập dữ liệu (bắt buộc)
- Chỉ `apps/server` được phép truy cập Supabase database (Postgres/RLS tables).
- `apps/web`, `apps/mobile`, `apps/zalo-mini-apps/*` bắt buộc truy cập dữ liệu qua API của `apps/server`.
- Không được dùng Supabase client trong non-server runtime để query business tables.

## 2) SQL bundles hiện tại (`apps/web/sql`)
- `full_setup_schema.sql`
  - Dựng/upgrade toàn bộ schema và policy.
- `full_seed_data.sql`
  - Seed admin account + bootstrap dữ liệu nền.
- `reset_data.sql`
  - Xóa toàn bộ data business trong `public`, giữ schema.
- `hard_reset_public_schema.sql`
  - Drop/recreate `public` schema hoàn toàn.

## 3) Runbook cài mới (fresh install)
1. (Tuỳ nhu cầu) chạy `hard_reset_public_schema.sql` để reset sạch schema `public`.
2. Chạy `full_setup_schema.sql`.
3. Chạy `full_seed_data.sql`.

Ghi chú:
- `full_seed_data.sql` có seed tài khoản admin trong `auth.users`.
- Supabase có sẵn auth schema, nhưng không tự tạo admin business account cho dự án.

## 4) Safety levels
- `reset_data.sql`: nguy hiểm mức dữ liệu, an toàn hơn reset schema.
- `hard_reset_public_schema.sql`: nguy hiểm mức kiến trúc dữ liệu, dùng khi cần cài lại từ đầu.

## 5) RLS & access model (tổng quan)
- Branch-scoped access qua helper function trong schema:
  - `can_access_branch(...)`
  - `current_profile_role()`
  - `is_owner_admin()`
- Policy tách theo nhóm bảng:
  - Bảng branch-bound: kiểm tra branch access.
  - Bảng hệ thống: owner_admin/manager có quyền cao hơn.
  - Bảng mini app/nhạy cảm: policy chặt hơn.

## 6) Domain dữ liệu chính
- Core identity/settings:
  - `profiles`, `profile_branch_access`, `user_settings`, `user_security_settings`
- Operations:
  - `products`, `items`, `customers`
  - `rental_orders`, `rental_order_items`, `reservation_windows`
  - `return_orders`, `payments`, `incidents`, `maintenance_tasks`
- Sales/procurement:
  - `sales_shifts`, `procurement_receipts`, `procurement_receipt_items`
- Makeup:
  - `makeup_events`, `makeup_packages`, `makeup_inventory_items`, `makeup_purchase_invoices/*`
- Showroom/public:
  - `showrooms`, `showroom_page_templates`, `showroom_page_configs`
- Zalo mini app:
  - `zalo_mini_app_identities`, `zalo_mini_app_sessions`
  - `zalo_mini_app_order_drafts`, `zalo_mini_app_payment_transactions`, `zalo_mini_app_webhook_events`

## 7) Auth schema tương tác
- Business schema `public` tham chiếu `auth.users(id)`.
- Cần quyền đủ cao (service role/postgres context) khi seed auth user.
- Service-role/Supabase privileged credentials chỉ được dùng ở `apps/server`.

## 8) Storage conventions (high-level)
- Bucket mặc định cho sản phẩm được thiết lập trong migration storage.
- Metadata media riêng trong `public.media_assets` và `public.media_upload_sessions`.
- Policy storage/object và policy DB cần đồng bộ theo branch access.

## 9) Khuyến nghị vận hành dữ liệu
- Chạy setup/seed theo đúng thứ tự, không chạy seed trước schema.
- Trước release lớn, snapshot DB + kiểm tra policy truy cập bằng test account thực.
- Kiểm tra architecture gate: không còn truy cập DB từ runtime ngoài `apps/server`.
- Khi gặp lỗi “feature flag sai trạng thái”, kiểm tra:
  - row trong `public.system_settings`
  - quyền của `apps/server` service client đang query
  - policy RLS và grants.
