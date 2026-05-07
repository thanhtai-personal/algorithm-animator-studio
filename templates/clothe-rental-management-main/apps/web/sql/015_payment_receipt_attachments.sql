-- Payment receipt/invoice attachments for POS surcharge/expense payments.

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = false;

create table if not exists public.payment_receipt_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELED')),
  expires_at timestamptz not null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_delete boolean not null default false
);

create table if not exists public.payment_attachments (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  original_file_name text,
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  is_delete boolean not null default false
);

create unique index if not exists uq_payment_receipt_upload_sessions_bucket_storage_path
  on public.payment_receipt_upload_sessions (bucket, storage_path);

create index if not exists idx_payment_receipt_upload_sessions_branch_status_expires
  on public.payment_receipt_upload_sessions (branch_id, status, expires_at desc)
  where is_delete = false;

create unique index if not exists uq_payment_attachments_bucket_storage_path
  on public.payment_attachments (bucket, storage_path)
  where deleted_at is null and is_delete = false;

create index if not exists idx_payment_attachments_payment_created_at
  on public.payment_attachments (payment_id, created_at)
  where deleted_at is null and is_delete = false;

create index if not exists idx_payment_attachments_branch_created_at
  on public.payment_attachments (branch_id, created_at desc)
  where deleted_at is null and is_delete = false;

alter table public.payment_receipt_upload_sessions enable row level security;
alter table public.payment_attachments enable row level security;

grant select, insert, update, delete on public.payment_receipt_upload_sessions to authenticated;
grant select, insert, update, delete on public.payment_attachments to authenticated;

drop policy if exists payment_receipt_upload_sessions_branch_access
  on public.payment_receipt_upload_sessions;
create policy payment_receipt_upload_sessions_branch_access
  on public.payment_receipt_upload_sessions
  for all
  using (
    public.can_access_branch(branch_id)
    or created_by_profile_id = auth.uid()
  )
  with check (
    public.can_access_branch(branch_id)
    or created_by_profile_id = auth.uid()
  );

drop policy if exists payment_attachments_branch_access on public.payment_attachments;
create policy payment_attachments_branch_access
  on public.payment_attachments
  for all
  using (public.can_access_branch(branch_id))
  with check (public.can_access_branch(branch_id));

drop policy if exists payment_receipts_storage_select on storage.objects;
drop policy if exists payment_receipts_storage_insert on storage.objects;
drop policy if exists payment_receipts_storage_update on storage.objects;
drop policy if exists payment_receipts_storage_delete on storage.objects;

create policy payment_receipts_storage_select
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'payment-receipts');

create policy payment_receipts_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'payment-receipts');

create policy payment_receipts_storage_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'payment-receipts')
  with check (bucket_id = 'payment-receipts');

create policy payment_receipts_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'payment-receipts');
