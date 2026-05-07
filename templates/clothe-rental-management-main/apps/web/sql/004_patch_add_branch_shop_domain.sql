alter table public.branches
  add column if not exists shop_domain text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'branches_shop_domain_not_blank'
  ) then
    alter table public.branches
      add constraint branches_shop_domain_not_blank
      check (shop_domain is null or btrim(shop_domain) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'branches_shop_domain_slug_check'
  ) then
    alter table public.branches
      add constraint branches_shop_domain_slug_check
      check (shop_domain is null or shop_domain ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end $$;

create unique index if not exists branches_shop_domain_unique_ci
  on public.branches (lower(shop_domain))
  where shop_domain is not null;
