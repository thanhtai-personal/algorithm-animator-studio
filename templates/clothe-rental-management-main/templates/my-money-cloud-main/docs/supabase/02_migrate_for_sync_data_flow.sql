-- Migration: 02_migrate_for_sync_data_flow.sql
-- Purpose: Add RPC to perform atomic sync of guest data (categories + transactions)
-- and change user_backup to support versioned backups.

-- === 1) Create versioned user_backup table (keep old table if exists)
-- Note: If `public.user_backup` exists with a single-row per user design, consider
-- migrating existing data into the new table manually or via an ETL script.

create table if not exists public.user_backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  device text,
  data jsonb not null,
  created_at timestamptz default timezone('utc'::text, now())
);

-- Add index for lookup by user
create index if not exists idx_user_backups_user_id on public.user_backups (user_id);

-- Optional: keep old `user_backup` table name in place for compatibility by renaming
-- the previous table if it exists (manual step recommended).

-- === 2) Create RPC function `sync_guest_data`
-- This function accepts a payload with categories and transactions and performs
-- upserts for both tables inside a single transaction to ensure atomicity.

-- Function signature (SQL):
--   select public.sync_guest_data(user_uuid := '<user id>', payload := '{"categories": [...], "transactions": [...] }'::jsonb);

create or replace function public.sync_guest_data(user_uuid uuid, payload jsonb)
returns table(result jsonb) language plpgsql security definer as $$
declare
  cats jsonb;
  trans jsonb;
begin
  if payload is null then
    raise exception 'payload is null';
  end if;
  cats := coalesce(payload->'categories', '[]'::jsonb);
  trans := coalesce(payload->'transactions', '[]'::jsonb);

  perform pg_advisory_xact_lock(42); -- simple advisory lock to avoid concurrent RPC conflicts

  -- Upsert categories
  if jsonb_array_length(cats) > 0 then
    -- iterate categories and upsert
    insert into public.categories (id, user_id, name, type, icon, color, created_at)
    select
      (elem->>'id')::uuid,
      user_uuid,
      elem->>'name',
      (elem->>'type')::text,
      (elem->>'icon')::text,
      (elem->>'color')::text,
      (case when (elem->>'createdAt') is not null then (elem->>'createdAt')::timestamptz else now() end)
    from jsonb_array_elements(cats) as elems(elem)
    on conflict (id) do update set
      name = excluded.name,
      type = excluded.type,
      icon = excluded.icon,
      color = excluded.color
    ;
  end if;

  -- Upsert transactions
  if jsonb_array_length(trans) > 0 then
    insert into public.transactions (id, user_id, amount, description, category_id, type, date, created_at)
    select
      (elem->>'id')::uuid,
      user_uuid,
      (elem->>'amount')::numeric,
      nullif(elem->>'description',''),
      (elem->>'categoryId')::uuid,
      (elem->>'type')::text,
      (case when (elem->>'date') is not null then (elem->>'date')::timestamptz else now() end),
      (case when (elem->>'createdAt') is not null then (elem->>'createdAt')::timestamptz else now() end)
    from jsonb_array_elements(trans) as elems(elem)
    on conflict (id) do update set
      amount = excluded.amount,
      description = excluded.description,
      category_id = excluded.category_id,
      type = excluded.type,
      date = excluded.date
    ;
  end if;

  return query select jsonb_build_object('success', true, 'categories', jsonb_array_length(cats), 'transactions', jsonb_array_length(trans));
end;
$$;

-- Grant execute to authenticated role (supabase default)
grant execute on function public.sync_guest_data(uuid, jsonb) to authenticated;

-- End of migration
