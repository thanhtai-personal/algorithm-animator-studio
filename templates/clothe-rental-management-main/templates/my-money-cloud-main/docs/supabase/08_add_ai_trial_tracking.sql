-- Add ai_trial_used field to track if user has used their free AI trial
-- Default ai_requests_remaining to 0 (users start with 0, not 50)

alter table public.user_settings
add column if not exists ai_trial_used boolean not null default false;

-- Update default for ai_requests_remaining to 0 if it exists
-- Note: This doesn't change existing records, only affects new inserts
alter table public.user_settings
alter column ai_requests_remaining set default 0;

-- Add comment to explain the fields
comment on column public.user_settings.ai_trial_used is 'Whether user has already claimed their free AI trial requests';
comment on column public.user_settings.ai_requests_remaining is 'Number of AI voice parsing requests remaining (default 0, increases when user claims trial or purchases)';
