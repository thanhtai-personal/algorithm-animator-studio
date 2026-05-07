-- =========================================================
-- reset_data.sql
-- DANGEROUS: reset all business data in schema `public`.
--
-- Keeps:
-- - table/function/policy definitions (schema stays intact)
-- - extensions and auth/storage schemas
--
-- Removes:
-- - all rows from every table in `public` (TRUNCATE ... CASCADE)
--
-- Typical usage:
-- 1) Run this file
-- 2) Run `full_seed_data.sql` to restore baseline seed data
--
-- Need to drop all relations/objects too?
-- - Use `hard_reset_public_schema.sql` instead.
-- =========================================================

begin;

do $$
declare
  v_tables text;
begin
  select string_agg(format('%I.%I', schemaname, tablename), ', ' order by tablename)
    into v_tables
  from pg_tables
  where schemaname = 'public'
    and tablename <> 'spatial_ref_sys';

  if v_tables is not null then
    execute 'truncate table ' || v_tables || ' restart identity cascade';
  end if;
end $$;

commit;
