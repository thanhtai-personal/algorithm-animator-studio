# Request Deduplication - Final Architecture

## Overview
Final optimization to reduce duplicate API requests from 36 to <10 on first load by centralizing all settings fetch logic in AuthProvider and making components pure observers of the MobX store.

## Architecture

### Centralized Fetch Pattern

```
User Login
    ↓
AuthProvider (useAuth.tsx)
    ├─ Fetch settings ONCE (authStore.fetchSettings)
    ├─ Setup realtime subscription ONCE (authStore.setupRealtimeSubscription)
    └─ Store in MobX (authStore.setUserSettings)
          ↓
MobX Store (authStore)
    ├─ userSettings: UserSettings | null
    ├─ settingsLoading: boolean
    └─ Realtime updates → setUserSettings()
          ↓
Components (useUserSettings hook)
    ├─ Read from authStore.userSettings (reactive)
    ├─ NO fetching logic
    └─ Update → API call → setUserSettings() (no refetch)
```

## Implementation Details

### 1. AuthProvider (useAuth.tsx)

**Responsibility**: Single source of truth for settings fetch

```typescript
// Track which user's settings have been fetched
const settingsFetchedUserId = useRef<string | null>(null);

useEffect(() => {
  if (!session?.user?.id) {
    settingsFetchedUserId.current = null;
    return;
  }

  // Deduplicate: only fetch if new user
  if (settingsFetchedUserId.current === session.user.id) {
    return;
  }

  settingsFetchedUserId.current = session.user.id;

  // Setup realtime subscription (singleton)
  if (supabaseClient) {
    authStore.setupRealtimeSubscription(supabaseClient);
  }

  // Fetch settings once
  void authStore.fetchSettings(getSupabaseAccessToken);
}, [session?.user?.id, supabaseClient]);
```

**Key Points:**
- Runs ONCE per user login
- Uses ref to prevent duplicate fetches
- Delegates to authStore methods
- No component-level fetching

### 2. AuthStore (authStore.ts)

**Responsibility**: Singleton state management

```typescript
class AuthStore {
  userSettings: UserSettings | null = null;
  settingsLoading = boolean = true;
  
  private fetchPromise: Promise<void> | null = null;
  private realtimeChannel: RealtimeChannel | null = null;

  // Singleton fetch with promise deduplication
  async fetchSettings(getAccessToken: () => Promise<string | null>) {
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this._fetchSettingsInternal(getAccessToken);
    await this.fetchPromise;
    this.fetchPromise = null;
  }

  // Singleton realtime subscription
  setupRealtimeSubscription(supabase: SupabaseClient) {
    if (this.realtimeChannel) return; // Already subscribed
    
    this.realtimeChannel = supabase.channel('user-settings-changes')
      .on('postgres_changes', ..., (payload) => {
        this.setUserSettings(payload.new);
      })
      .subscribe();
  }
}
```

**Key Points:**
- Promise deduplication prevents concurrent fetches
- Realtime subscription is singleton (one channel for all components)
- MobX observable triggers reactive updates

### 3. useUserSettings Hook

**Responsibility**: Pure observer (no fetching)

```typescript
export function useUserSettings(onSettingsReady?: () => void) {
  const { user, isAnonymous } = useAuth();

  // Load offline settings for anonymous users (one-time)
  useEffect(() => {
    if (user || authStore.userSettings) return;
    const offlineRaw = storageAdapter.getItem(OFFLINE_SETTINGS_KEY);
    if (offlineRaw) {
      authStore.setUserSettings(JSON.parse(offlineRaw));
    }
  }, [user]);

  // Read directly from mobx store (reactive)
  const settings = authStore.userSettings;
  const loading = authStore.settingsLoading;
  const needsOnboarding = !settings?.currency;

  const updateSettings = async (updates) => {
    // ... API call ...
    
    // Update mobx store (no refetch)
    authStore.setUserSettings(serverData);
    writeCachedSettings(user.id, serverData);
  };

  return { settings, loading, needsOnboarding, updateSettings };
}
```

**Key Points:**
- NO fetch logic (removed fetchSettings callback)
- NO local state (no useState)
- Reads directly from authStore (reactive via MobX)
- Updates call API then update store (no refetch)

## Benefits

### 1. No Duplicate Fetches
- Only 1 fetch per user login (in AuthProvider)
- Components mount/unmount doesn't trigger refetch
- useCallback dependencies don't cause cascading refetches

### 2. Reactive Updates
- MobX makes authStore.userSettings observable
- All components reading from store auto-update
- No manual subscription management

### 3. Simplified Component Logic
- Components don't need fetch callbacks
- No useCallback dependency issues
- No per-component deduplication needed

### 4. Single Source of Truth
- AuthProvider owns fetch timing
- authStore owns data
- Components only read

## Request Flow Comparison

### Before (36 requests)
```
ComponentA mounts → useUserSettings → fetchSettings
ComponentB mounts → useUserSettings → fetchSettings (duplicate!)
ComponentC mounts → useUserSettings → fetchSettings (duplicate!)
User changes → useCallback deps → refetch × 3 (9 requests!)
Currency loads → enabled flag → all queries run × 6 components (18 requests!)
```

### After (<10 requests)
```
User logs in → AuthProvider → fetchSettings (1 request)
    ↓
authStore.userSettings updated (MobX)
    ↓
All components auto-update (reactive, 0 requests)
    ↓
User changes → updateSettings → API (1 request) → setUserSettings → auto-update
```

## Currency-Gated Queries

Combined with `isReady` pattern:

```typescript
// useTransactions.ts, useCategories.ts
const isReady = Boolean((isLocal || user) && currency);

const query = useQuery({
  enabled: isReady, // Waits for currency before running
  queryKey: ['transactions', user?.id, currency],
  queryFn: ...
});
```

**Prevents:**
- Queries running before settings loaded
- Failed queries retrying
- Wasted API calls

## Testing Checklist

- [ ] Login → only 1 user_settings request in Network tab
- [ ] Multiple components mount → no additional requests
- [ ] Settings update → only 1 PATCH request, no GET refetch
- [ ] Realtime update → all components reflect changes
- [ ] Offline mode → settings queued, no network calls
- [ ] Anonymous mode → settings stored locally only
- [ ] Total first load requests: <10

## Migration Notes

### Changed Files
1. **useAuth.tsx** (AuthProvider)
   - Added settingsFetchedUserId ref
   - Added useEffect to fetch settings once per user
   - Added realtime subscription setup

2. **useUserSettings.ts**
   - Removed local state (useState)
   - Removed fetchSettings callback
   - Removed fetch useEffect
   - Removed realtime setup (moved to AuthProvider)
   - Simplified to pure observer pattern

3. **authStore.ts** (already optimized)
   - fetchPromise singleton
   - setupRealtimeSubscription singleton
   - cleanupRealtimeSubscription

### Breaking Changes
None - API surface of useUserSettings remains the same:
```typescript
const { settings, loading, needsOnboarding, updateSettings } = useUserSettings();
```

## Performance Metrics

### Expected Outcomes
- **First load requests**: 36 → <10 (70% reduction)
- **Settings refetch**: 10× → 1× (90% reduction)
- **Component mount cost**: Fetch call → Store read (instant)
- **Update latency**: Same (single API call + optimistic update)

### Monitoring
Monitor these in Network tab:
- `/api/user/settings` GET: Should be 1 per login
- `/api/user/settings` PATCH: Only when user updates
- Realtime subscription: 1 connection total (not per component)

## Future Optimizations

1. **Lazy Realtime Setup**: Only subscribe if user has multiple tabs/devices
2. **Settings Cache TTL**: Add timestamp-based invalidation
3. **Batched Updates**: Queue multiple updateSettings calls
4. **Optimistic Rollback**: Revert store on API failure

## References

- Architecture Doc: [anonymous-vs-offline.md](../architecture/anonymous-vs-offline.md)
- AppLock Deduplication: [appLock.ts](../../lib/appLock.ts) (hasUserBeenSynced pattern)
- Currency-Gated Queries: [useTransactions.ts](../../features/transactions/hooks/useTransactions.ts)
