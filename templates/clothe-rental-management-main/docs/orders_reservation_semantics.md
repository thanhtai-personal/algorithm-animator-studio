# Orders Reservation Semantics (Task 009)

## Canonical Date Range
- `rental_orders.start_date` / `end_date` follow `[start_date, end_date)` semantics.
- DB constraint already enforces `end_date > start_date`.
- Availability overlap rule:
  - conflict when `existing.start_date < new_end_date` AND `existing.end_date > new_start_date`.

## Source Of Truth For Availability
- `reservation_windows` is the source of truth for lock windows.
- `reservation_windows_item_range_excl` (`EXCLUDE USING gist`) is the final anti-overlap guard.
- App-level precheck runs before write, then DB-level constraint catches race conditions.

## `items.status = RESERVED` vs `reservation_windows`
- In MVP domain core, booking lock is represented by `reservation_windows`, not by forcing `items.status = RESERVED`.
- `items.status` is still used for operational state (READY/ON_RENT/LAUNDRY/...).
- Therefore an item can remain `READY` while being blocked for a specific date window by active reservation lock(s).

## When Reservation Windows Are Active
- Active lock statuses: `RESERVED`, `CONFIRMED`, `PICKED_UP`.
- Non-lock statuses (`DRAFT`, `RETURNED`, `COMPLETED`, `CANCELLED`) release/deactivate reservation windows.

## Cancel/Refund Obligation Baseline (MVP)
- `DRAFT` / `RESERVED` / `CONFIRMED`: cancel allowed (manager+), reservation windows released.
- `PICKED_UP`: cancel not allowed in domain core; use return flow instead.
- Refund monetary policy execution is deferred to payments/order-detail tasks, but audit write-point contract is present (`ORDER_REFUND_RECORDED`).

## Domain Error Contract (selected)
- `ITEM_UNAVAILABLE`: app precheck found item blocked/not ready/out-of-branch.
- `RESERVATION_OVERLAP_CONFLICT`: DB race conflict from exclude constraint.
- `ORDER_STATUS_TRANSITION_INVALID`: transition not allowed by status machine.
- `FORBIDDEN_CONFIRMED_EDIT` / `FORBIDDEN_MANAGER_ACTION`: role constraint violation.
