alter table if exists public.branch_settings
  add column if not exists is_rental_module_enabled boolean,
  add column if not exists is_makeup_module_enabled boolean;

update public.branch_settings
set
  is_rental_module_enabled = coalesce(is_rental_module_enabled, true),
  is_makeup_module_enabled = coalesce(is_makeup_module_enabled, true)
where is_rental_module_enabled is null
   or is_makeup_module_enabled is null;

alter table if exists public.branch_settings
  alter column is_rental_module_enabled set default true,
  alter column is_rental_module_enabled set not null,
  alter column is_makeup_module_enabled set default true,
  alter column is_makeup_module_enabled set not null;
