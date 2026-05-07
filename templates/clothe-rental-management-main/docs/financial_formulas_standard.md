# Financial Formulas Standard (Finance V1)

## Version
- `FINANCE_V1_PAYMENT_POSTED_COGS`

## Source of truth
- Revenue/deposit metrics are derived from `payments.status = POSTED` only.
- Order status transitions do not create revenue by themselves.

## Payment rules
- Revenue-eligible payment types: `RENT`, `FEE`.
- `DEPOSIT` increases `deposit_collected_total` only.
- `REFUND` is classified into:
  - `RENT_REFUND`: reduces revenue (`refund_effective`).
  - `DEPOSIT_REFUND`: increases `deposit_refunded_total` only.
- `VOIDED` payments are excluded from all metrics.

## Core formulas
- `revenue_gross = sum(POSTED payments in allow-list REVENUE_ELIGIBLE_PAYMENT_TYPES)`
- `revenue_net = revenue_gross - refund_effective`
- `cogs`:
  - `SALE`: sum immutable `rental_order_items.cogs_snapshot_amount` and recognize by payment ratio.
  - `RENTAL`: fallback `0` (`RENTAL_COGS_FALLBACK_ZERO`) until rental-cost inputs are available.
- `gross_profit = revenue_net - cogs`
- `profit_margin = gross_profit / revenue_net` (guard divide-by-zero -> `0`)
- `outstanding_debt = receivable_valid - collected_valid` (floored at `0`)
- `deposit_collected_total = sum(POSTED DEPOSIT)`
- `deposit_refunded_total = sum(POSTED REFUND classified as DEPOSIT_REFUND)`

## Time aggregation
- Daily/monthly/yearly boundaries use branch timezone.
- Payment event time (`payments.created_at`) is used as aggregation timestamp.
