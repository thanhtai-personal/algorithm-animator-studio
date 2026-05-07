create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount bigint not null,
  description text,
  category_id text not null,
  type text not null check (type in ('income', 'expense')),
  date timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);