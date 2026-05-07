-- =========================================================
-- 0001_clean_rental_operations_data.sql
-- DANGEROUS: clean rental-operations data only (all branches).
--
-- Keeps:
-- - schema objects (tables/functions/policies)
-- - auth/profiles/branches/settings/master configs
-- - product categories/tags and customer tags dictionaries
--
-- Removes:
-- - products + variants + items
-- - rental orders + order items + reservations + incidents + maintenance tasks
-- - return orders
-- - procurement receipts/items used for intake
-- - payments
-- - customers + customer tag assignments
-- - sales shifts
-- - audit events
--
-- Typical usage:
-- 1) Run this file
-- 2) Recreate business data from app flows or seed scripts as needed
-- =========================================================

begin;

do $$
declare
  v_tables text;
begin
  select string_agg(format('public.%I', table_name), ', ' order by table_name)
    into v_tables
  from (
    values
      ('incidents'),
      ('maintenance_tasks'),
      ('reservation_windows'),
      ('rental_order_items'),
      ('payments'),
      ('rental_orders'),
      ('return_orders'),
      ('item_status_logs'),
      ('items'),
      ('procurement_receipt_items'),
      ('procurement_receipts'),
      ('product_tag_assignments'),
      ('product_variants'),
      ('products'),
      ('customer_tag_assignments'),
      ('customers'),
      ('sales_shifts'),
      ('audit_events')
  ) as target(table_name)
  where exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = target.table_name
  );

  if v_tables is not null then
    execute 'truncate table ' || v_tables || ' restart identity cascade';
  end if;
end $$;

-- Guard: fail fast if any critical rental-op table still has rows.
do $$
declare
  v_table text;
  v_count bigint;
begin
  foreach v_table in array array[
    'products',
    'items',
    'rental_orders',
    'return_orders',
    'payments',
    'procurement_receipts'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables t
      where t.table_schema = 'public'
        and t.table_name = v_table
    ) then
      execute format('select count(*) from public.%I', v_table) into v_count;
      if v_count > 0 then
        raise exception 'Clean script failed: table %.% still has % rows',
          'public',
          v_table,
          v_count;
      end if;
    end if;
  end loop;
end $$;

commit;
