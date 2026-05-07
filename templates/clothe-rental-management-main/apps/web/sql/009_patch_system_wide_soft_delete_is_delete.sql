-- Bug 012: system-wide soft-delete baseline for business tables.
-- Scope in this patch covers all public business tables currently queried by apps/server modules.

alter table if exists public.audit_events
  add column if not exists is_delete boolean not null default false;
alter table if exists public.branch_opening_hours
  add column if not exists is_delete boolean not null default false;
alter table if exists public.branch_settings
  add column if not exists is_delete boolean not null default false;
alter table if exists public.branches
  add column if not exists is_delete boolean not null default false;
alter table if exists public.categories
  add column if not exists is_delete boolean not null default false;
alter table if exists public.category_deposit_defaults
  add column if not exists is_delete boolean not null default false;
alter table if exists public.customer_tag_assignments
  add column if not exists is_delete boolean not null default false;
alter table if exists public.customer_tags
  add column if not exists is_delete boolean not null default false;
alter table if exists public.customers
  add column if not exists is_delete boolean not null default false;
alter table if exists public.incidents
  add column if not exists is_delete boolean not null default false;
alter table if exists public.item_status_logs
  add column if not exists is_delete boolean not null default false;
alter table if exists public.items
  add column if not exists is_delete boolean not null default false;
alter table if exists public.maintenance_tasks
  add column if not exists is_delete boolean not null default false;
alter table if exists public.makeup_events
  add column if not exists is_delete boolean not null default false;
alter table if exists public.makeup_inventory_items
  add column if not exists is_delete boolean not null default false;
alter table if exists public.makeup_packages
  add column if not exists is_delete boolean not null default false;
alter table if exists public.makeup_purchase_invoice_items
  add column if not exists is_delete boolean not null default false;
alter table if exists public.makeup_purchase_invoices
  add column if not exists is_delete boolean not null default false;
alter table if exists public.media_assets
  add column if not exists is_delete boolean not null default false;
alter table if exists public.media_upload_sessions
  add column if not exists is_delete boolean not null default false;
alter table if exists public.payments
  add column if not exists is_delete boolean not null default false;
alter table if exists public.procurement_receipt_items
  add column if not exists is_delete boolean not null default false;
alter table if exists public.procurement_receipts
  add column if not exists is_delete boolean not null default false;
alter table if exists public.product_categories
  add column if not exists is_delete boolean not null default false;
alter table if exists public.product_tag_assignments
  add column if not exists is_delete boolean not null default false;
alter table if exists public.product_tags
  add column if not exists is_delete boolean not null default false;
alter table if exists public.products
  add column if not exists is_delete boolean not null default false;
alter table if exists public.profile_branch_access
  add column if not exists is_delete boolean not null default false;
alter table if exists public.profiles
  add column if not exists is_delete boolean not null default false;
alter table if exists public.rental_order_items
  add column if not exists is_delete boolean not null default false;
alter table if exists public.rental_orders
  add column if not exists is_delete boolean not null default false;
alter table if exists public.reservation_windows
  add column if not exists is_delete boolean not null default false;
alter table if exists public.return_orders
  add column if not exists is_delete boolean not null default false;
alter table if exists public.showroom_page_configs
  add column if not exists is_delete boolean not null default false;
alter table if exists public.showroom_page_templates
  add column if not exists is_delete boolean not null default false;
alter table if exists public.showrooms
  add column if not exists is_delete boolean not null default false;
alter table if exists public.system_settings
  add column if not exists is_delete boolean not null default false;
alter table if exists public.transactions
  add column if not exists is_delete boolean not null default false;
alter table if exists public.zalo_mini_app_identities
  add column if not exists is_delete boolean not null default false;
alter table if exists public.zalo_mini_app_order_drafts
  add column if not exists is_delete boolean not null default false;
alter table if exists public.zalo_mini_app_payment_transactions
  add column if not exists is_delete boolean not null default false;
alter table if exists public.zalo_mini_app_sessions
  add column if not exists is_delete boolean not null default false;
alter table if exists public.zalo_mini_app_webhook_events
  add column if not exists is_delete boolean not null default false;

create index if not exists idx_audit_events_is_delete
  on public.audit_events (is_delete);
create index if not exists idx_branch_opening_hours_is_delete
  on public.branch_opening_hours (is_delete);
create index if not exists idx_branch_settings_is_delete
  on public.branch_settings (is_delete);
create index if not exists idx_branches_is_delete
  on public.branches (is_delete);
create index if not exists idx_categories_is_delete
  on public.categories (is_delete);
create index if not exists idx_category_deposit_defaults_is_delete
  on public.category_deposit_defaults (is_delete);
create index if not exists idx_customer_tag_assignments_is_delete
  on public.customer_tag_assignments (is_delete);
create index if not exists idx_customer_tags_is_delete
  on public.customer_tags (is_delete);
create index if not exists idx_customers_is_delete
  on public.customers (is_delete);
create index if not exists idx_incidents_is_delete
  on public.incidents (is_delete);
create index if not exists idx_item_status_logs_is_delete
  on public.item_status_logs (is_delete);
create index if not exists idx_items_is_delete
  on public.items (is_delete);
create index if not exists idx_maintenance_tasks_is_delete
  on public.maintenance_tasks (is_delete);
create index if not exists idx_makeup_events_is_delete
  on public.makeup_events (is_delete);
create index if not exists idx_makeup_inventory_items_is_delete
  on public.makeup_inventory_items (is_delete);
create index if not exists idx_makeup_packages_is_delete
  on public.makeup_packages (is_delete);
create index if not exists idx_makeup_purchase_invoice_items_is_delete
  on public.makeup_purchase_invoice_items (is_delete);
create index if not exists idx_makeup_purchase_invoices_is_delete
  on public.makeup_purchase_invoices (is_delete);
create index if not exists idx_media_assets_is_delete
  on public.media_assets (is_delete);
create index if not exists idx_media_upload_sessions_is_delete
  on public.media_upload_sessions (is_delete);
create index if not exists idx_payments_is_delete
  on public.payments (is_delete);
create index if not exists idx_procurement_receipt_items_is_delete
  on public.procurement_receipt_items (is_delete);
create index if not exists idx_procurement_receipts_is_delete
  on public.procurement_receipts (is_delete);
create index if not exists idx_product_categories_is_delete
  on public.product_categories (is_delete);
create index if not exists idx_product_tag_assignments_is_delete
  on public.product_tag_assignments (is_delete);
create index if not exists idx_product_tags_is_delete
  on public.product_tags (is_delete);
create index if not exists idx_products_is_delete
  on public.products (is_delete);
create index if not exists idx_profile_branch_access_is_delete
  on public.profile_branch_access (is_delete);
create index if not exists idx_profiles_is_delete
  on public.profiles (is_delete);
create index if not exists idx_rental_order_items_is_delete
  on public.rental_order_items (is_delete);
create index if not exists idx_rental_orders_is_delete
  on public.rental_orders (is_delete);
create index if not exists idx_reservation_windows_is_delete
  on public.reservation_windows (is_delete);
create index if not exists idx_return_orders_is_delete
  on public.return_orders (is_delete);
create index if not exists idx_showroom_page_configs_is_delete
  on public.showroom_page_configs (is_delete);
create index if not exists idx_showroom_page_templates_is_delete
  on public.showroom_page_templates (is_delete);
create index if not exists idx_showrooms_is_delete
  on public.showrooms (is_delete);
create index if not exists idx_system_settings_is_delete
  on public.system_settings (is_delete);
create index if not exists idx_transactions_is_delete
  on public.transactions (is_delete);
create index if not exists idx_zalo_mini_app_identities_is_delete
  on public.zalo_mini_app_identities (is_delete);
create index if not exists idx_zalo_mini_app_order_drafts_is_delete
  on public.zalo_mini_app_order_drafts (is_delete);
create index if not exists idx_zalo_mini_app_payment_transactions_is_delete
  on public.zalo_mini_app_payment_transactions (is_delete);
create index if not exists idx_zalo_mini_app_sessions_is_delete
  on public.zalo_mini_app_sessions (is_delete);
create index if not exists idx_zalo_mini_app_webhook_events_is_delete
  on public.zalo_mini_app_webhook_events (is_delete);

-- Rebuild uniqueness to apply only on active (not deleted) rows.
drop index if exists profile_branch_access_profile_branch_unique;
create unique index if not exists profile_branch_access_profile_branch_unique
  on public.profile_branch_access (profile_id, branch_id)
  where is_delete = false;

drop index if exists profile_branch_access_single_default_unique;
create unique index if not exists profile_branch_access_single_default_unique
  on public.profile_branch_access (profile_id)
  where is_default = true and is_delete = false;

drop index if exists customer_tag_assignments_unique;
create unique index if not exists customer_tag_assignments_unique
  on public.customer_tag_assignments (customer_id, tag_id)
  where is_delete = false;

drop index if exists product_categories_global_code_unique;
create unique index if not exists product_categories_global_code_unique
  on public.product_categories (lower(code))
  where branch_id is null and is_delete = false;

drop index if exists product_categories_branch_code_unique;
create unique index if not exists product_categories_branch_code_unique
  on public.product_categories (branch_id, lower(code))
  where branch_id is not null and is_delete = false;

drop index if exists product_tag_assignments_unique;
create unique index if not exists product_tag_assignments_unique
  on public.product_tag_assignments (product_id, tag_id)
  where is_delete = false;

drop index if exists items_branch_item_code_unique;
create unique index if not exists items_branch_item_code_unique
  on public.items (branch_id, lower(item_code))
  where is_delete = false;

drop index if exists items_qr_code_unique;
create unique index if not exists items_qr_code_unique
  on public.items (lower(qr_code))
  where qr_code is not null and is_delete = false;

drop index if exists rental_orders_branch_order_code_unique;
create unique index if not exists rental_orders_branch_order_code_unique
  on public.rental_orders (branch_id, lower(order_code))
  where is_delete = false;

drop index if exists rental_order_items_order_item_unique;
create unique index if not exists rental_order_items_order_item_unique
  on public.rental_order_items (order_id, item_id)
  where is_delete = false;

drop index if exists showrooms_slug_unique_ci;
create unique index if not exists showrooms_slug_unique_ci
  on public.showrooms (lower(slug))
  where is_delete = false;

drop index if exists showrooms_single_default_unique;
create unique index if not exists showrooms_single_default_unique
  on public.showrooms ((is_default))
  where is_default and is_delete = false;

-- Keep makeup invoice totals consistent after item soft-delete.
create or replace function public.sync_makeup_purchase_invoice_total_amount()
returns trigger
language plpgsql
as $$
declare
  target_invoice_id uuid;
begin
  target_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  update public.makeup_purchase_invoices
  set total_amount = coalesce((
      select sum(line_total_amount)
      from public.makeup_purchase_invoice_items
      where invoice_id = target_invoice_id
        and coalesce(is_delete, false) = false
    ), 0),
    updated_at = now()
  where id = target_invoice_id;

  return null;
end;
$$;
