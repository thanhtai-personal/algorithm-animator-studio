alter table if exists public.showroom_page_configs
  add column if not exists theme_config_json jsonb;
