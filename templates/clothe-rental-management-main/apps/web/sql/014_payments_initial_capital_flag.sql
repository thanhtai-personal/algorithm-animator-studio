-- Task 092: add initial-capital classification flag to payments.

begin;

alter table if exists public.payments
  add column if not exists is_initial_capital boolean;

update public.payments
set is_initial_capital = false
where is_initial_capital is null;

alter table if exists public.payments
  alter column is_initial_capital set default false,
  alter column is_initial_capital set not null;

create index if not exists idx_payments_is_initial_capital
  on public.payments (is_initial_capital);

commit;

