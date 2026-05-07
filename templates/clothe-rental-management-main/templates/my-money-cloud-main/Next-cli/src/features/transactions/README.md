# Transactions Feature

This feature owns transaction data access, state, and UI building blocks used across the app.

## Entry points
- `hooks/useTransactions.ts`: dashboard-friendly hook that exposes stats + actions
- `components/AddTransactionModal.tsx`: UI for creating transactions
- `components/TransactionList.tsx`: UI for grouped transaction list

## Data flow
Components → Hook → Query → Service → Supabase + Adapter

## Folder map
- `adapters/`: map Supabase rows ↔ frontend models
- `services/`: Supabase data access
- `queries/`: TanStack Query hooks + keys
- `types/`: feature types
- `features/categories/constants.ts`: default categories
- `utils.ts`: date key + stats helpers
