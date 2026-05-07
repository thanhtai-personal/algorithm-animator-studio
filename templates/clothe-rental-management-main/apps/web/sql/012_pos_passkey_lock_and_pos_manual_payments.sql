-- Task 090: POS passkey lock + POS manual surcharge/expense payments

begin;

alter table if exists public.system_settings
  add column if not exists pos_admin_passkey_lock_enabled boolean,
  add column if not exists pos_admin_passkey_hash text,
  add column if not exists pos_admin_passkey_version integer,
  add column if not exists pos_admin_passkey_updated_at timestamptz;

update public.system_settings
set
  pos_admin_passkey_lock_enabled = coalesce(pos_admin_passkey_lock_enabled, false),
  pos_admin_passkey_version = coalesce(pos_admin_passkey_version, 0)
where
  pos_admin_passkey_lock_enabled is null
  or pos_admin_passkey_version is null;

alter table if exists public.system_settings
  alter column pos_admin_passkey_lock_enabled set default false,
  alter column pos_admin_passkey_lock_enabled set not null,
  alter column pos_admin_passkey_version set default 0,
  alter column pos_admin_passkey_version set not null;

alter table if exists public.payments
  drop constraint if exists payments_target_ref_check;

alter table if exists public.payments
  add constraint payments_target_ref_check
  check (
    order_id is not null
    or procurement_receipt_id is not null
    or source in ('POS_SURCHARGE', 'POS_EXPENSE')
  );

commit;
