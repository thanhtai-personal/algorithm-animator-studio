create table if not exists public.user_security_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  screen_lock_enabled boolean not null default false,
  screen_lock_method text,
  screen_lock_pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint screen_lock_method_check
    check (screen_lock_method in ('pin', 'biometric') or screen_lock_method is null)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_security_settings_updated_at
on public.user_security_settings;

create trigger set_user_security_settings_updated_at
before update on public.user_security_settings
for each row execute function public.set_updated_at();

alter table public.user_security_settings enable row level security;

drop policy if exists "Users can view their security settings" on public.user_security_settings;
create policy "Users can view their security settings"
  on public.user_security_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their security settings" on public.user_security_settings;
create policy "Users can insert their security settings"
  on public.user_security_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their security settings" on public.user_security_settings;
create policy "Users can update their security settings"
  on public.user_security_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their security settings" on public.user_security_settings;
create policy "Users can delete their security settings"
  on public.user_security_settings for delete
  using (auth.uid() = user_id);
