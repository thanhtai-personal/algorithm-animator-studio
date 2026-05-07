# Payments Ledger Convention (MVP Phase 1)

## 1) Scope
- Applies to web admin module `/{locale}/payments` and order payment mutations.
- Manual payment workflow only (no online gateway callback / webhook auto-status).

## 2) Domain Convention
- `type`: `RENT` | `DEPOSIT` | `FEE` | `REFUND`
- `method`: `CASH` | `BANK` | `MOMO`
- `status`: `POSTED` | `VOIDED`
- `amount` is always stored as positive value.
- Signed convention for reconciliation/net cashflow:
  - `RENT`/`DEPOSIT`/`FEE` => inflow (`+amount`)
  - `REFUND` => outflow (`-amount`)

## 3) Posting & Totals Rules
- Reports and reconciliation totals only count records with `status=POSTED`.
- `VOIDED` records stay for audit trace and are excluded from posted totals.
- Payments list totals include:
  - by method (net signed)
  - by type (gross by type)
  - inflow/refund/net + daily cashbook summary

## 4) Refund Traceability
- Refund records keep positive `amount`, classified by `type=REFUND`.
- Minimum trace fields for refund:
  - `reason`
  - `source`
- Source conventions used by system:
  - Return settlement refund: `source=ORDER_RETURN_SETTLEMENT`
  - Cancel-order refund: `source=ORDER_CANCELLED`
  - Manual refund from order detail: `source=ORDER_MANUAL_REFUND` (default)

## 5) Overpayment Policy (Explicit Block)
- `DEPOSIT` payment is blocked if it exceeds remaining required deposit.
- `RENT`/`FEE` payment is blocked if it exceeds remaining order charge (`total_amount - rent_paid - fee_paid`).
- Refund is blocked if it exceeds refundable deposit.

## 6) Status Workflow & Mutation Governance
- Admin-only manual status update (`POSTED <-> VOIDED`).
- Manager/Staff cannot change payment status.
- Correction policy (MVP):
  - no direct edit/delete payment record
  - use `VOIDED + create new payment` strategy
- Every manual status change writes audit event (`PAYMENT_STATUS_UPDATED`).

## 7) RBAC
- Staff: view only own branch scope.
- Manager+: can export CSV.
- Admin: can update payment status manually.
