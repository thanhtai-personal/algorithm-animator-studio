-- Add currency field to user_settings table
-- This field stores the user's selected currency and cannot be changed after selection

alter table public.user_settings
add column if not exists currency text;

-- Add constraint to ensure currency is one of the supported currencies
alter table public.user_settings
add constraint currency_check check (
  currency in ('VND', 'USD', 'CNY', 'KRW', 'JPY', 'INR') or currency is null
);

-- Add comment to explain the currency field
comment on column public.user_settings.currency is 'User selected currency (cannot be changed after initial selection). NULL means user has not completed onboarding.';
