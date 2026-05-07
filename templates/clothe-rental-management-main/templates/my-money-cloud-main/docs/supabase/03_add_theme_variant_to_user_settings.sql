alter table public.user_settings
add column if not exists theme_variant text not null default 'sunset';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'theme_variant_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
    add constraint theme_variant_check
    check (theme_variant in ('sunset', 'cosmic', 'ocean', 'forest', 'rose', 'midnight'));
  end if;
end $$;
