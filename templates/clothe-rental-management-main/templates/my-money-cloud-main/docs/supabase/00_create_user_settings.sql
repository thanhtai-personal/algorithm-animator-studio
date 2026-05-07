create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_mode text not null default 'light',
  theme_variant text not null default 'sunset',
  language text not null default 'en',
  background_type text not null default 'default',
  background_value text,
  pro_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint theme_mode_check check (theme_mode in ('light', 'dark')),
  constraint background_type_check check (background_type in ('default', 'color')),
  constraint theme_variant_check check (
    theme_variant in ('sunset', 'cosmic', 'ocean', 'forest', 'rose', 'midnight')
  )
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "Users can view their settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their settings"
  on public.user_settings for delete
  using (auth.uid() = user_id);
