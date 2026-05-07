alter table if exists public.products
  add column if not exists quick_rent_price numeric(14,2);

alter table if exists public.products
  drop constraint if exists products_quick_rent_price_check;

alter table if exists public.products
  add constraint products_quick_rent_price_check
  check (quick_rent_price is null or quick_rent_price >= 0);

alter table if exists public.rental_orders
  add column if not exists pricing_mode text;

alter table if exists public.rental_orders
  drop constraint if exists rental_orders_pricing_mode_check;

alter table if exists public.rental_orders
  add constraint rental_orders_pricing_mode_check
  check (pricing_mode is null or pricing_mode in ('STANDARD', 'QUICK'));
