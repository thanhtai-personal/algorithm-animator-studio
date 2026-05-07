-- Add AI voice input settings to user_settings table
-- ai_requests_remaining: number of AI voice parse requests the user has left (default 50 for trial)
-- ignore_voice_verify: if true, skip confirmation modal and create transaction directly from AI voice parsing

alter table public.user_settings
add column if not exists ai_requests_remaining integer not null default 0;

alter table public.user_settings
add column if not exists ignore_voice_verify boolean not null default false;

-- Add constraint to ensure ai_requests_remaining is not negative
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_requests_remaining_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
    add constraint ai_requests_remaining_check
    check (ai_requests_remaining >= 0);
  end if;
end $$;

comment on column public.user_settings.ai_requests_remaining is 'Number of AI voice parse requests remaining for the user. Starts at 50 for trial users.';
comment on column public.user_settings.ignore_voice_verify is 'If true, skip confirmation modal when using AI voice input and create transaction immediately.';
