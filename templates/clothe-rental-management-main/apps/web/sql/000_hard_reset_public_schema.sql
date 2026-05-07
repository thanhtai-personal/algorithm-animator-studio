-- =========================================================
-- hard_reset_public_schema.sql
-- DANGEROUS: hard reset schema `public` (drop all relations/objects).
--
-- This script will:
-- - DROP SCHEMA public CASCADE
-- - Recreate schema `public` with baseline grants
--
-- Use this when you want to fully reinstall DB objects from scratch.
--
-- Typical usage:
-- 1) Run this file
-- 2) Run `full_setup_schema.sql`
-- 3) Run `full_seed_data.sql` (includes admin auth seed)
-- =========================================================

begin;

drop schema if exists public cascade;
create schema public;

do $$
begin
  begin
    alter schema public owner to postgres;
  exception
    when insufficient_privilege then
      null;
  end;
end $$;

revoke all on schema public from public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

commit;
