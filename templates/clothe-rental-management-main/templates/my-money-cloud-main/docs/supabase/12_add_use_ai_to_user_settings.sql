-- Add use_ai toggle to user_settings
alter table public.user_settings
  add column if not exists use_ai boolean default true;

comment on column public.user_settings.use_ai is 'Enable AI voice mode for voice transaction drawer (default true).';
