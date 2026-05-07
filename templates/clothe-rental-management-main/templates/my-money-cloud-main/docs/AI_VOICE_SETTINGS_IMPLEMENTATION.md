# AI Voice Settings Implementation Guide

## Overview
This document describes the implementation of database-backed AI voice settings for the voice transaction entry feature.

## Features Added

### 1. AI Request Count Tracking in Database
- **Field**: `ai_requests_remaining` in `user_settings` table
- **Purpose**: Persist purchased AI requests across sessions, survives logout and data clear
- **Default**: 50 free requests
- **Behavior**:
  - For authenticated users: Stored in Supabase `user_settings` table
  - For anonymous users: Falls back to localStorage (`spendsmart:ai-requests-remaining`)

### 2. Auto-Create Transaction from Voice (Skip Confirmation)
- **Field**: `ignore_voice_verify` in `user_settings` table
- **Purpose**: Skip confirmation modal and create transaction directly from voice input
- **Default**: `false` (shows confirmation modal)
- **Behavior**:
  - When `true`: Voice input → AI parse → Auto-create transaction
  - When `false`: Voice input → AI parse → Show confirmation modal

## Files Modified

### 1. Database Migration
**File**: `docs/supabase/04_add_ai_voice_settings.sql`

```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_requests_remaining integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS ignore_voice_verify boolean NOT NULL DEFAULT false;

ALTER TABLE user_settings
ADD CONSTRAINT ai_requests_remaining_check CHECK (ai_requests_remaining >= 0);
```

**To Execute**:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the migration script
3. Click "Run"
4. Verify columns created: `ai_requests_remaining`, `ignore_voice_verify`

### 2. Type Definitions
**File**: `src/lib/userSettingsSync.tsx`

Added to `UserSettingsPayload`:
```typescript
ai_requests_remaining?: number;
ignore_voice_verify?: boolean;
```

### 3. New Hook: useAIVoiceSettings
**File**: `src/lib/hooks/useAIVoiceSettings.tsx`

**Methods**:
- `isLoading`: Loading state
- `remainingRequests`: Current AI request count
- `ignoreVoiceVerify`: Auto-create flag
- `useRequest()`: Decrement request count (syncs to DB)
- `addRequests(count)`: Add purchased requests (syncs to DB)
- `setIgnoreVerify(value)`: Toggle auto-create mode (syncs to DB)

**Usage Example**:
```typescript
const { remainingRequests, ignoreVoiceVerify, useRequest, addRequests, setIgnoreVerify } = useAIVoiceSettings();

// After voice parsing with AI
useRequest(); // Decrements count

// After user purchases 100 requests
addRequests(100); // Adds to count

// Toggle auto-create
setIgnoreVerify(true); // Enable auto-create
setIgnoreVerify(false); // Disable auto-create
```

### 4. VoiceInlineRecorder Updates
**File**: `src/features/voice-transaction/components/VoiceInlineRecorder.tsx`

**Changes**:
1. Added `onAutoCreate` prop for direct transaction creation
2. Imported `useAIVoiceSettings` hook
3. Changed AI request consumption from `useAIMode.useRequest()` to `useAIVoiceSettings.useRequest()`
4. Added conditional logic:
   ```typescript
   if (ignoreVoiceVerify && onAutoCreate) {
     await onAutoCreate(transactionInput); // Skip modal
   } else {
     onOpenConfirm(transactionInput); // Show modal
   }
   ```

### 5. Dashboard Integration
**File**: `src/features/dashboard/index.tsx`

**Changes**:
Added `onAutoCreate` callback to `VoiceInlineRecorder`:
```typescript
<VoiceInlineRecorder
  onOpenConfirm={(tx) => {
    setVoiceTransactionData(tx);
    setIsAddModalOpen(true);
  }}
  onCloseConfirm={handleCloseVoiceModal}
  onAutoCreate={async (tx) => {
    const success = await handleAddTransaction(tx);
    if (success) {
      setIsAddModalOpen(false);
    }
  }}
  isLoading={loading}
/>
```

## Migration Path

### From useAIMode to useAIVoiceSettings

**Before**:
```typescript
const { isAIModeOn, useRequest, requestsRemaining } = useAIMode();
useRequest(); // Consumes request (localStorage only)
```

**After**:
```typescript
const { isAIModeOn } = useAIMode(); // Keep for on/off toggle
const { useRequest, remainingRequests } = useAIVoiceSettings(); // Use for request tracking
useRequest(); // Consumes request (syncs to database)
```

## Data Flow

### Authenticated User Flow
1. User enables AI mode → `isAIModeOn = true`
2. User speaks transaction → AI parses
3. `useAIVoiceSettings.useRequest()` decrements count
4. Count synced to Supabase `user_settings.ai_requests_remaining`
5. Count persists across logout/data clear

### Anonymous User Flow
1. User enables AI mode → `isAIModeOn = true`
2. User speaks transaction → AI parses
3. `useAIVoiceSettings.useRequest()` decrements count
4. Count stored in localStorage `spendsmart:ai-requests-remaining`
5. Count resets on data clear (no database persistence)

### Auto-Create Flow (ignore_voice_verify = true)
1. User speaks: "chi 50k cafe"
2. AI parses: `{ amount: 50000, type: "expense", description: "cafe" }`
3. Check `ignoreVoiceVerify`:
   - **True**: Auto-create transaction → Toast notification → Done
   - **False**: Show confirmation modal → User clicks confirm → Create transaction

## Testing Checklist

- [ ] Execute migration in Supabase dashboard
- [ ] Verify `ai_requests_remaining` and `ignore_voice_verify` columns created
- [ ] Test authenticated user: Voice input → Check count in Supabase
- [ ] Test anonymous user: Voice input → Check count in localStorage
- [ ] Test auto-create on: Voice input → Transaction created without modal
- [ ] Test auto-create off: Voice input → Modal shown → Confirm → Transaction created
- [ ] Test data clear: Verify `ai_requests_remaining` preserved in database (authenticated only)
- [ ] Test purchase flow: Call `addRequests(100)` → Verify count updated in DB

## Future Enhancements

1. **Purchase UI**: Add button/page for users to buy AI request packs
2. **Settings UI**: Add toggle in settings to enable/disable `ignore_voice_verify`
3. **Request Usage Analytics**: Track AI request usage per user
4. **Request Expiration**: Add expiry date for purchased requests
5. **Batch Requests**: Allow users to create multiple transactions from single voice input

## Notes

- Migration script uses `IF NOT EXISTS` guards for safe re-execution
- `useAIVoiceSettings` automatically syncs to database for authenticated users
- Anonymous users fall back to localStorage (no persistence across sessions)
- `useAIMode` still controls AI on/off toggle, `useAIVoiceSettings` handles request tracking
- Check constraint ensures `ai_requests_remaining >= 0` (prevents negative values)
