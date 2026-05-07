# AppLockStore Analysis

**Kiểm tra:** January 21, 2026  
**File:** `src/features/auth/stores/AppLockStore.ts`  
**Trạng thái:** ✅ **CORRECT PLACEMENT**

---

## 📋 Chi Tiết Store

### File Info
- **Vị trí:** `src/features/auth/stores/AppLockStore.ts`
- **Kích thước:** ~50 lines
- **Loại:** MobX Observable Store
- **Phạm vi:** Feature-specific (auth only)

### Chức Năng
- Runtime-only state (NOT persisted, NOT in user settings)
- PIN input digits management
- Error tracking
- Lock state management
- PIN verification

---

## 🔍 State Structure

```typescript
class AppLockStore {
  // Runtime state (ephemeral)
  locked: boolean;              // Is app currently locked?
  pinDigits: string[];          // Current PIN input digits
  error: string | null;         // Error message if wrong PIN
  attempting: boolean;          // Is PIN verification in progress?
}
```

### Setter Methods
- `setLocked(boolean)` - Update lock state
- `setPinDigits(string[])` - Update input digits
- `setError(string | null)` - Set error message
- `setAttempting(boolean)` - Track verification state
- `resetPinInput()` - Clear input fields
- `reset()` - Full reset

### Verification
- `verifyPin(userId, pin, pinHash)` - Async PIN verification
- Calls `verifyAppLockPin()` from `/lib/appLock`

---

## 📊 Usage Analysis

### ✅ Used In
```
AppLockGate.tsx (1 usage)
└── appLockStore (observer)
```

### Imported By
```typescript
import { appLockStore } from "@/features/auth/stores/AppLockStore";
```

### Integration Points
1. **AppLockGate Component** - Main component using the store
   - Renders PIN input UI
   - Calls store methods on user interaction
   - Observes store state changes

2. **app/providers.tsx** - Wraps entire app
   ```tsx
   <AppLockGate>
     {children}
   </AppLockGate>
   ```

---

## 🏗️ Store Organization

### Current Pattern in Next-cli

**Global Stores** (in `/src/store/`)
```
authStore.ts       (User auth, settings, session)
categoryStore.ts   (Categories for transactions)
transactionStore.ts (All transactions)
statsStore.ts      (Statistics summaries)
themeVariantStore.ts (Theme variant preference)
offlineQueueStore.ts (Offline sync queue)
```

**Feature-Specific Stores** (in `/src/features/[feature]/stores/`)
```
app-shell/stores/appShellStore.ts      (App shell UI state)
dashboard/stores/homeUiStore.ts        (Home page UI state)
auth/stores/AppLockStore.ts            (App lock PIN state) ✅
```

### Pattern Analysis

**When to use Global Store** (`/src/store/`)
- ✅ Cross-feature data (user, auth state)
- ✅ Core app data (transactions, categories)
- ✅ Frequently accessed by multiple features

**When to use Feature-Specific Store** (`/src/features/[feature]/stores/`)
- ✅ Local UI state (loading, modals, forms)
- ✅ Runtime-only state (ephemeral)
- ✅ Used only within one feature
- ✅ NOT persisted to storage

---

## ✅ AppLockStore Classification

| Aspect | Analysis |
|--------|----------|
| **Scope** | Feature-specific (auth only) ✅ |
| **Persistence** | Runtime-only (NOT persisted) ✅ |
| **Usage** | Single component (AppLockGate) ✅ |
| **Data Type** | UI state (lock, PIN input) ✅ |
| **Current Location** | `/features/auth/stores/` ✅ |
| **Should Move?** | NO ✅ |

---

## 📝 Folder Structure Recommendation

✅ **CURRENT STRUCTURE IS CORRECT**

```
src/
├── store/                    (Global stores)
│   ├── authStore.ts
│   ├── categoryStore.ts
│   ├── transactionStore.ts
│   └── ...
│
└── features/
    └── auth/
        ├── hooks/
        │   ├── login/
        │   ├── sync/
        │   ├── routing/
        │   └── ...
        │
        ├── stores/          ✅ Feature-specific stores
        │   └── AppLockStore.ts (Perfect location)
        │
        ├── components/
        │   ├── AppLockGate.tsx (Uses appLockStore)
        │   └── ...
        │
        └── ...
```

---

## 🔗 Dependency Graph

```
providers.tsx (app root)
    └── AppLockGate.tsx (component)
        ├── useAppLockGate (hook)
        │   └── appLockStore
        │       └── verifyAppLockPin() from /lib/appLock
        └── appLockStore (direct usage in JSX)
```

---

## ✅ Verification Checklist

- ✅ Store is used (not dead code)
- ✅ Store is in correct location
- ✅ Consistent with feature-specific pattern
- ✅ Runtime-only (not persisted)
- ✅ Single feature scope
- ✅ Proper imports (all using correct paths)
- ✅ No cross-feature dependency issues

---

## 🎯 Conclusion

**Status:** ✅ **NO ACTION REQUIRED**

AppLockStore is:
- ✅ In the correct location (`features/auth/stores/`)
- ✅ Properly used (by AppLockGate component)
- ✅ Appropriately scoped (feature-specific)
- ✅ Following project patterns (feature stores pattern)
- ✅ Not requiring movement

### Why It Belongs Here
1. **Feature-Specific** - Only AppLock logic
2. **Runtime-Only** - Ephemeral state, not persisted
3. **Scoped** - Used only in `auth` feature
4. **Pattern** - Matches `app-shell` and `dashboard` stores

The current organization is optimal for maintainability.

---

**Last Checked:** January 21, 2026
