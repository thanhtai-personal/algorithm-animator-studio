-- Task 091: decouple procurement import orders from products and mark import-order payments.

begin;

alter table if exists public.payments
  add column if not exists is_import_order boolean;

update public.payments
set is_import_order = true
where is_import_order is null
  and (
    procurement_receipt_id is not null
    or source = 'PROCUREMENT_INTAKE'
    or reason = 'PROCUREMENT_INTAKE_EXPENSE'
  );

update public.payments
set is_import_order = false
where is_import_order is null;

alter table if exists public.payments
  alter column is_import_order set default false,
  alter column is_import_order set not null;

alter table if exists public.procurement_receipt_items
  alter column product_id drop not null,
  add column if not exists rent_price_per_day numeric(14,2),
  add column if not exists quick_rent_price numeric(14,2),
  add column if not exists purchase_price numeric(14,2),
  add column if not exists sale_price numeric(14,2),
  add column if not exists category_code_snapshot text,
  add column if not exists is_rentable boolean,
  add column if not exists is_saleable boolean,
  add column if not exists material text,
  add column if not exists gender text,
  add column if not exists description text,
  add column if not exists cover_image_url text;

alter table if exists public.procurement_receipt_items
  drop constraint if exists procurement_receipt_items_product_id_fkey;

alter table if exists public.procurement_receipt_items
  add constraint procurement_receipt_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

alter table if exists public.payments
  drop constraint if exists payments_target_ref_check;

alter table if exists public.payments
  add constraint payments_target_ref_check
  check (
    order_id is not null
    or procurement_receipt_id is not null
    or source in ('POS_SURCHARGE', 'POS_EXPENSE')
    or is_import_order = true
  );

create index if not exists idx_payments_is_import_order
  on public.payments (is_import_order);

commit;
