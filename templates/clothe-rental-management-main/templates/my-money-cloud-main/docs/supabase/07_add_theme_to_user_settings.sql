-- Add theme field to user_settings table
-- This field stores the user's preferred theme (light or dark)

alter table public.user_settings
add column if not exists theme text default 'light';

-- Add constraint to ensure theme is either 'light' or 'dark'
alter table public.user_settings
add constraint theme_check check (
  theme in ('light', 'dark')
);

-- Add comment to explain the theme field
comment on column public.user_settings.theme is 'User preferred theme appearance (light or dark mode)';
