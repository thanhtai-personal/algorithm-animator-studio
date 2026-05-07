alter table public.user_settings
  add column if not exists anon_sync_state jsonb;

comment on column public.user_settings.anon_sync_state is 'Anonymous-to-account sync progress state (jsonb).';
