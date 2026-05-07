-- Migration: 10_add_anon_key_support.sql
-- Purpose:
--   - Introduce anon_key for anonymous-mode data ownership.
--   - Allow anonymous Supabase sessions to read/write data via anon_key instead of user_id.
--   - Provide a claim function to migrate anon_key data to a real user_id when the user signs in.

-- 0) Tighten previous anon-read policies (remove blanket anon access)
drop policy if exists anon_read_categories on public.categories;
drop policy if exists anon_read_transactions on public.transactions;
drop policy if exists anon_read_user_settings on public.user_settings;
revoke select on public.categories from anon;
revoke select on public.transactions from anon;
revoke select on public.user_settings from anon;

-- 1) Add anon_key columns and supporting indexes
alter table public.user_settings add column if not exists anon_key uuid;
create unique index if not exists idx_user_settings_anon_key
  on public.user_settings (anon_key) where anon_key is not null;

alter table public.categories add column if not exists anon_key uuid;
create index if not exists idx_categories_anon_key
  on public.categories (anon_key) where anon_key is not null;

alter table public.transactions add column if not exists anon_key uuid;
alter table public.transactions alter column user_id drop not null;
create index if not exists idx_transactions_anon_key
  on public.transactions (anon_key) where anon_key is not null;
alter table public.transactions drop constraint if exists transactions_owner_check;
alter table public.transactions
  add constraint transactions_owner_check
  check (user_id is not null or anon_key is not null);

-- 2) Helper: current user's anon_key (from user_settings)
create or replace function public.current_user_anon_key()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select anon_key from public.user_settings where user_id = auth.uid();
$$;

grant execute on function public.current_user_anon_key() to authenticated;

-- 3) RLS policies for categories (default categories remain readable; anon_key rows are scoped)
drop policy if exists "Users can view their categories" on public.categories;
create policy "Users can view their categories"
  on public.categories for select
  using (
    (user_id is null and anon_key is null) -- shared defaults
    or (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

drop policy if exists "Users can insert their categories" on public.categories;
create policy "Users can insert their categories"
  on public.categories for insert
  with check (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

drop policy if exists "Users can update their categories" on public.categories;
create policy "Users can update their categories"
  on public.categories for update
  using (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  )
  with check (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

drop policy if exists "Users can delete their categories" on public.categories;
create policy "Users can delete their categories"
  on public.categories for delete
  using (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

-- 4) RLS policies for transactions (anonymous rows use anon_key)
drop policy if exists "Users can view their transactions" on public.transactions;
create policy "Users can view their transactions"
  on public.transactions for select
  using (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

drop policy if exists "Users can insert their transactions" on public.transactions;
create policy "Users can insert their transactions"
  on public.transactions for insert
  with check (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

drop policy if exists "Users can update their transactions" on public.transactions;
create policy "Users can update their transactions"
  on public.transactions for update
  using (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  )
  with check (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

drop policy if exists "Users can delete their transactions" on public.transactions;
create policy "Users can delete their transactions"
  on public.transactions for delete
  using (
    (user_id = auth.uid())
    or (user_id is null and anon_key is not null and anon_key = public.current_user_anon_key())
  );

-- 5) Update sync_guest_data RPC to support anon_key ownership
create or replace function public.sync_guest_data(user_uuid uuid, payload jsonb, anon_key uuid default null)
returns table(result jsonb) language plpgsql security definer as $$
declare
  cats jsonb;
  trans jsonb;
  target_user_id uuid;
  target_anon_key uuid;
begin
  if payload is null then
    raise exception 'payload is null';
  end if;
  cats := coalesce(payload->'categories', '[]'::jsonb);
  trans := coalesce(payload->'transactions', '[]'::jsonb);
  target_user_id := user_uuid;
  target_anon_key := anon_key;
  if target_anon_key is not null then
    target_user_id := null;
  end if;
  if target_user_id is null and target_anon_key is null then
    raise exception 'missing_owner';
  end if;

  perform pg_advisory_xact_lock(42); -- simple advisory lock to avoid concurrent RPC conflicts

  if jsonb_array_length(cats) > 0 then
    insert into public.categories (id, user_id, anon_key, name, icon, color, created_at)
    select
      (elem->>'id')::uuid,
      target_user_id,
      target_anon_key,
      elem->>'name',
      (elem->>'icon')::text,
      (elem->>'color')::text,
      (case when (elem->>'createdAt') is not null then (elem->>'createdAt')::timestamptz else now() end)
    from jsonb_array_elements(cats) as elems(elem)
    on conflict (id) do update set
      user_id = excluded.user_id,
      anon_key = excluded.anon_key,
      name = excluded.name,
      icon = excluded.icon,
      color = excluded.color
    ;
  end if;

  if jsonb_array_length(trans) > 0 then
    insert into public.transactions (id, user_id, anon_key, amount, description, category_id, type, date, created_at)
    select
      (elem->>'id')::uuid,
      target_user_id,
      target_anon_key,
      (elem->>'amount')::numeric,
      nullif(elem->>'description',''),
      (elem->>'categoryId')::uuid,
      (elem->>'type')::text,
      (case when (elem->>'date') is not null then (elem->>'date')::timestamptz else now() end),
      (case when (elem->>'createdAt') is not null then (elem->>'createdAt')::timestamptz else now() end)
    from jsonb_array_elements(trans) as elems(elem)
    on conflict (id) do update set
      user_id = excluded.user_id,
      anon_key = excluded.anon_key,
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

grant execute on function public.sync_guest_data(uuid, jsonb, uuid) to authenticated;

-- 6) RPC: claim anonymous data (move anon_key rows onto a real user_id)
create or replace function public.claim_anonymous_data(claim_user_id uuid, claim_anon_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_categories integer := 0;
  updated_transactions integer := 0;
  settings_migrated boolean := false;
  target_has_settings boolean := false;
begin
  if auth.uid() is null then
    raise exception 'missing_auth';
  end if;

  if auth.uid() <> claim_user_id then
    raise exception 'user_mismatch';
  end if;

  if claim_anon_key is null then
    raise exception 'anon_key_required';
  end if;

  update public.categories
    set user_id = claim_user_id,
        anon_key = null
    where anon_key = claim_anon_key;
  get diagnostics updated_categories = row_count;

  update public.transactions
    set user_id = claim_user_id,
        anon_key = null
    where anon_key = claim_anon_key;
  get diagnostics updated_transactions = row_count;

  select exists(select 1 from public.user_settings where user_id = claim_user_id)
    into target_has_settings;

  if not target_has_settings then
    update public.user_settings
      set user_id = claim_user_id,
          anon_key = null
      where anon_key = claim_anon_key;
    get diagnostics updated_categories = row_count;
    settings_migrated := updated_categories > 0;
  else
    update public.user_settings
      set anon_key = null
      where user_id = claim_user_id
        and anon_key is not null;
  end if;

  -- Ensure no dangling anon_key rows remain for this key
  update public.user_settings
    set anon_key = null
    where anon_key = claim_anon_key;

  return jsonb_build_object(
    'categories', updated_categories,
    'transactions', updated_transactions,
    'settings_migrated', settings_migrated
  );
end;
$$;

grant execute on function public.claim_anonymous_data(uuid, uuid) to authenticated;

-- End of migration
