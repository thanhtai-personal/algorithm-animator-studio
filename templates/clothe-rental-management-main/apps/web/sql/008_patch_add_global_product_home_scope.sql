alter table if exists public.showroom_page_configs
  drop constraint if exists showroom_page_configs_page_key_check;

alter table if exists public.showroom_page_configs
  add constraint showroom_page_configs_page_key_check
  check (page_key in ('PRODUCT_HOME', 'GLOBAL_PRODUCT_HOME'));


create index if not exists idx_showroom_page_configs_page_locale_published
  on public.showroom_page_configs (page_key, locale, is_published, is_active, updated_at desc);
