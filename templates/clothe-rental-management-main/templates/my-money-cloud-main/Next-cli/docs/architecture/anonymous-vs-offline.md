# Anonymous Mode vs Offline Mode

## 1. Định nghĩa

### Anonymous Mode (Guest Mode)
- **Purpose**: Cho phép user dùng app mà không cần đăng nhập
- **Trigger**: User click "Skip Login" trên auth screen
- **State**: `isAnonymous = true`, `isLocalAnonymous = true`
- **Storage**: Local Storage với key `spendsmart:anonymous-*`
- **Sync**: KHÔNG sync với server (no user account)
- **Data**: Chỉ lưu local, mất khi clear browser data
- **Network**: Có thể online hoặc offline

### Offline Mode (Network Disconnected)
- **Purpose**: Cho phép app hoạt động khi mất mạng
- **Trigger**: `navigator.onLine = false`
- **State**: `isOnline = false`
- **Storage**: Queue trong `offlineQueueStore` + cache
- **Sync**: Tự động sync khi online lại (chỉ với logged-in users)
- **Data**: Pending operations được replay khi có mạng
- **Auth**: Áp dụng cho cả logged-in và anonymous users

## 2. Ma trận hành vi

| Feature | Logged + Online | Logged + Offline | Anonymous + Online | Anonymous + Offline |
|---------|----------------|------------------|-------------------|-------------------|
| **Transactions** | ✅ Save to server | ⏳ Queue → sync later | 💾 Local only | 💾 Local only |
| **Categories** | ✅ Save to server | ⏳ Queue → sync later | 💾 Local only | 💾 Local only |
| **Settings** | ✅ Save to server | ⏳ Queue → sync later | 💾 Local only | 💾 Local only |
| **Currency** | ✅ Server (immutable) | ⏳ Queue → sync later | 💾 Local only | 💾 Local only |
| **Store (IAP)** | ✅ Enabled | ❌ Need network | ❌ Need account | ❌ Need account + network |
| **AI Assistant** | ✅ Enabled | ❌ Need network | ❌ Need account | ❌ Need account + network |
| **Sync Banner** | ✅ No banner | ⚠️ Show "Offline" | 🚫 No sync | 🚫 No sync |
| **Data Persistence** | ☁️ Cloud + cache | 💾 Cache + queue | 💾 Local only | 💾 Local only |

## 3. Implementation Plan

### Phase 1: Tách logic rõ ràng ✅

**File changes:**
1. `useAuth.tsx` - Export cả `isAnonymous` VÀ `isOnline` riêng biệt
2. `useUserSettings.tsx` - Check `isAnonymous` cho local storage path
3. `useOfflineSync.tsx` - Check `isAnonymous`, skip queue nếu anonymous
4. `AIBotButton.tsx` - Disable nếu `isAnonymous || !isOnline`
5. `StorePage.tsx` - Overlay nếu `isAnonymous || !isOnline`

### Phase 2: Offline Queue behavior

**Logic:**
```typescript
// In offlineSync.ts
export function shouldQueue(isAnonymous: boolean, isOnline: boolean) {
  // Anonymous users: KHÔNG queue (nowhere to sync)
  if (isAnonymous) return false;
  
  // Logged-in users: Queue khi offline
  return !isOnline;
}

export function shouldSyncNow(isAnonymous: boolean, isOnline: boolean) {
  // Only sync if logged in AND online
  return !isAnonymous && isOnline;
}
```

### Phase 3: UI indicators

**Components:**
1. **Header Sync Banner**
   - Logged + Offline: "⚠️ Offline - Changes will sync when online"
   - Logged + Online + Pending: "🔄 Syncing..." (with button)
   - Anonymous: NO banner (no sync concept)

2. **Store Overlay**
   - Logged + Offline: "Store needs online"
   - Anonymous + Online: "Store needs account - Please sign in"
   - Anonymous + Offline: "Store needs account and internet"

3. **AI Button**
   - Hidden if `isAnonymous || !isOnline`
   - Tooltip: "AI Assistant requires account and internet"

### Phase 4: Settings persistence

**useUserSettings.tsx:**
```typescript
const updateSettings = async (updates: Partial<UserSettings>) => {
  if (isAnonymous) {
    // Anonymous: always local storage, no queue
    const current = getOfflineSettings();
    saveOfflineSettings({ ...current, ...updates });
    return true;
  }
  
  if (!isOnline) {
    // Logged + Offline: queue for sync
    const optimistic = { ...settings, ...updates };
    writeCachedSettings(user.id, optimistic);
    enqueueSettingsUpdate(updates);
    return true;
  }
  
  // Logged + Online: direct API call
  return await patchSettings(updates);
}
```

## 4. Testing Checklist

- [ ] Anonymous + Online: Local storage works, no queue
- [ ] Anonymous + Offline: Local storage works, no queue
- [ ] Logged + Online: API calls work, no queue
- [ ] Logged + Offline: Queue works, sync when online
- [ ] Anonymous → Login: Prompt to sync local data
- [ ] Offline → Online: Auto-sync pending operations
- [ ] Store disabled when `isAnonymous || !isOnline`
- [ ] AI disabled when `isAnonymous || !isOnline`

## 5. Migration từ code hiện tại

### Đã làm đúng ✅
- `isAnonymous` và `isOnline` là 2 state riêng biệt trong `useAuth`
- Store và AI đã check `isOnline`
- Offline queue đã có trong `offlineQueueStore`

### Cần fix 🔧
1. **Queue logic**: Skip queue nếu `isAnonymous` (không có server để sync)
2. **Settings**: Tách rõ local storage path cho anonymous
3. **UI messages**: Phân biệt "need account" vs "need network"
4. **Sync banner**: Ẩn với anonymous users

## 6. Code conventions

```typescript
// ✅ ĐÚNG: Check cả 2 điều kiện riêng biệt
if (isAnonymous) {
  // Guest user flow (local storage only)
}
if (!isOnline) {
  // Offline flow (queue or cache)
}

// ❌ SAI: Gộp chung 2 concepts
if (isAnonymous || !isOnline) {
  // Không rõ ý nghĩa: guest hay offline?
}

// ✅ ĐÚNG: Ma trận đầy đủ
if (isAnonymous && !isOnline) {
  // Guest + Offline: local only
} else if (isAnonymous && isOnline) {
  // Guest + Online: local only (but could upgrade)
} else if (!isAnonymous && !isOnline) {
  // Logged + Offline: queue for sync
} else {
  // Logged + Online: direct API
}
```

## 7. User flows

### Flow 1: Skip Login → Use App → Sign In Later
1. User clicks "Skip Login" → `isAnonymous=true`
2. User adds transactions → saved to local storage
3. User decides to sign in → Prompt: "Sync local data to cloud?"
4. If yes → Upload local data to new account
5. Clear local flag → `isAnonymous=false`

### Flow 2: Login → Go Offline → Resume Online
1. User logged in → `isAnonymous=false`, `isOnline=true`
2. Network drops → `isOnline=false`, operations queued
3. Network back → `isOnline=true`, auto-sync queue
4. All synced → clear queue

### Flow 3: Skip Login → Go Offline → Back Online
1. User skip login → `isAnonymous=true`, `isOnline=true`
2. Network drops → `isOnline=false`
3. User adds transactions → local storage only (NO queue)
4. Network back → `isOnline=true`
5. Nothing to sync (still anonymous)
