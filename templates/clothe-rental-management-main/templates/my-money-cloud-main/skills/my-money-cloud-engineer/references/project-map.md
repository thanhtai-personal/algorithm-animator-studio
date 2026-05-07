# Project Map

## High-Signal Files

### Core Rules

- `.mcp.full.md`
- `AGENTS.md`

### Auth and Data Flow

- `docs/000_authen-and-data-flow.md`
- `docs/test-case/auth-cases.md`
- `Next-cli/src/store/authStore.ts`
- `Native-cli-remake/src/store/authStore.ts`

### Transactions

- `Next-cli/src/features/transactions/**`
- `Native-cli-remake/src/features/transactions/**`
- `Next-cli/src/store/transactionStore.ts`
- `Native-cli-remake/src/store/transactionStore.ts`

### Categories

- `Next-cli/src/features/categories/**`
- `Native-cli-remake/src/features/categories/**`
- `docs/supabase/*category*`

### Voice (Mobile)

- `Native-cli-remake/src/lib/voice/useVoiceRecorder.ts`
- `Native-cli-remake/src/lib/voice/useSpeechRecognition.ts`
- `Native-cli-remake/src/features/dashboard/screens/HomeScreen.tsx`
- `Native-cli-remake/src/features/transactions/components/AddTransactionModal.tsx`
- `Native-cli-remake/src/features/transactions/components/AIVoiceTransactionModal.tsx`

## Quick Checklists

### Auth Change Checklist

- Confirm onboarding gate behavior (`currency`).
- Confirm anon mode still works without cloud account.
- Confirm anon-to-existing-account decision path (no silent data loss).
- Confirm logout warning when offline queue is pending.

### Transaction Change Checklist

- Confirm list updates immediately after create/update/delete.
- Confirm offline mutation queue still enqueues.
- Confirm store and query state are not divergent.

### Voice Change Checklist

- Confirm close/cancel uses native abort flow.
- Confirm no stale parse callback opens modal after reset.
- Confirm confirm-modal scroll and submit visibility on repeat runs.
- Confirm second voice run behaves like first run.
