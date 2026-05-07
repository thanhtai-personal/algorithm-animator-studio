# Auth Hooks

Tập hợp các hooks quản lý authentication, sync settings, và routing trong ứng dụng.

Được tổ chức theo chức năng: **Login**, **Sync**, **Routing**.

---

## 📁 Cấu Trúc Thư Mục

```
hooks/
├── README.md (tài liệu này)
├── index.ts (main exports)
├── useAuth.tsx (core public API)
│
├── login/ (Xử lý form login & auth actions)
│   ├── useLoginForm.ts
│   ├── useOAuthMessageListener.ts
│   ├── usePasswordResetFlow.ts
│   ├── useAuthActions.ts
│   ├── useLoginScreen.ts (orchestrator)
│   └── index.ts
│
├── sync/ (Đồng bộ settings & hydration)
│   ├── useUserSettingsSync.ts
│   ├── useSettingsHydration.ts
│   └── index.ts
│
└── routing/ (Auth gates & route redirects)
    ├── useAuthGate.ts (orchestrator)
    ├── useAuthRouting.ts
    └── index.ts
```

---

## 🎯 Chi Tiết Từng Hook

### 🔐 Core API

#### `useAuth` _(useAuth.tsx)_
**Vị trí:** Root level (`hooks/useAuth.tsx`)

**Chức năng:**
- Public API chính cho authentication
- Observer pattern với MobX authStore
- Cấp quyền truy cập trạng thái auth cho toàn ứng dụng

**Sử dụng:**
```typescript
import { useAuth } from "@/features/auth/hooks";

export function MyComponent() {
  const { user, isAnonymous, enableAnonymous } = useAuth();
  return <div>{user?.email ?? "Guest"}</div>;
}
```

---

### 📋 Login Folder

#### `useLoginForm`
**Chức năng:**
- Quản lý form state (email, password, displayName, phone, etc.)
- Cung cấp `updateField()` để cập nhật một trường
- Cung cấp `resetFormField()` để reset nhiều trường

**Ví dụ:**
```typescript
const { form, updateField, resetFormField } = useLoginForm();

updateField("email", "user@example.com");
resetFormField("password", "confirmPassword");
```

---

#### `useOAuthMessageListener`
**Chức năng:**
- Lắng nghe OAuth completion messages từ Supabase
- Xử lý lỗi OAuth
- Cleanup event listeners tự động

**Cách hoạt động:**
- Window message listener được setup tự động
- Hiển thị toast error nếu OAuth có lỗi
- Cleanup khi component unmount

---

#### `usePasswordResetFlow`
**Chức năng:**
- Quản lý flow reset password
- Gửi email reset password
- Xác nhận reset với password mới
- Theo dõi `resetSent` state

**Tham số:**
```typescript
const { resetSent, handleResetRequest, handleResetConfirm, ... } = 
  usePasswordResetFlow(email, loading, setLoading);
```

**Trách nhiệm:**
- Gọi Supabase API để gửi email
- Validate form trước khi gửi
- Show toast notifications

---

#### `useAuthActions`
**Chức năng:**
- Xử lý tất cả auth API calls
- Sign in/up với email & password
- Google OAuth sign in
- Guest/anonymous sign in

**Handler:**
```typescript
const { handleSubmit, handleGoogleSignIn, handleGuestSignIn } = useAuthActions();

// Sign in/up
await handleSubmit(mode, form, loading, setLoading);

// OAuth
await handleGoogleSignIn(loading, setLoading);
await handleGuestSignIn(loading, setLoading);
```

---

#### `useLoginScreen` (Orchestrator)
**Chức năng:**
- Orchestrator chính cho login UI
- Compose tất cả sub-hooks trên
- Quản lý view state (form, resetRequest, resetConfirm, signupSuccess)
- Quản lý mode state (signIn, signUp)

**Return Object:**
```typescript
{
  state: {
    mode,           // "signIn" | "signUp"
    view,           // "form" | "resetRequest" | "resetConfirm" | "signupSuccess"
    resetSent,      // boolean
    loading,        // boolean
    form,           // FormState
  },
  derived: {
    isSignIn,       // boolean
    isResetRequest, // boolean
    isResetConfirm, // boolean
    isSuccess,      // boolean
    showGuestOption,// boolean
  },
  copy,             // AuthCopy (header, labels, etc.)
  handlers: {
    updateField,
    handleSubmit,
    handleResetRequest,
    handleResetConfirm,
    handleGoogleSignIn,
    handleGuestSignIn,
    goToResetRequest,
    returnToForm,
    toggleMode,
    completeSignUpSuccess,
  },
}
```

---

### 🔄 Sync Folder

#### `useUserSettingsSync` _(226 → 180 lines)_
**Chức năng:**
- Orchestrate 3-way sync: UI ↔ Offline Storage ↔ Server
- Merge offline + server preferences (offline priority)
- Normalize và validate settings
- Sync changes tới server

**Flow:**
1. Hydrate offline settings khi anonymous
2. Persist anonymous preferences locally
3. Khi login: merge offline + server, apply to UI
4. Sync merged preferences tới server

**Sử dụng utilities:**
- `normalizeSettings()` - Validate & normalize từ bất kỳ nguồn nào
- `mergeOfflinePreferences()` - Merge offline + server
- `applyPreferences()` - Apply tới UI frameworks
- `arePreferencesDifferent()` - Compare payloads

**Ví dụ:**
```typescript
// Trong AuthGate hoặc app root component
useUserSettingsSync();
// Tự động sync settings từ tất cả nguồn
```

---

#### `useSettingsHydration`
**Chức năng:**
- Hydrate offline settings cho anonymous sessions
- Fetch user settings từ server
- Single effect per concern

**Trách nhiệm:**
1. Khi anonymous & chưa hydrate → hydrate offline settings
2. On mount → fetch settings từ server

**Sử dụng:**
```typescript
// Được gọi bởi useAuthGate
useSettingsHydration();
```

---

### 🛣️ Routing Folder

#### `useAuthGate` (Orchestrator)
**Chức năng:**
- Main orchestrator cho auth setup
- Compose 3 sub-hooks: settings sync, hydration, routing
- Cung cấp `isWaiting` state và loading message

**Sử dụng:**
```typescript
// Trong layout hoặc page component
const { isWaiting, loadingMessage } = useAuthGate(isOnboardingPage);

if (isWaiting) {
  return <div>{loadingMessage}</div>;
}
```

**Tham số:**
- `isOnboardingPage` (optional): Skip onboarding redirect nếu đang trên trang onboarding

---

#### `useAuthRouting`
**Chức năng:**
- Xử lý route redirects dựa trên auth state
- Redirect unauthenticated users tới login
- Redirect tới onboarding khi currency missing
- Track loading state

**Logic Redirect:**
1. Nếu NOT logged in AND NOT anonymous → `/auth`
2. Nếu missing currency AND NOT onboarding page → `/onboarding`

**Return:**
```typescript
const { isWaiting } = useAuthRouting({ isOnboardingPage: true });
```

---

## 📦 Import Patterns

### Từ Main Export
```typescript
import { 
  useAuth,
  useLoginScreen,
  useAuthGate,
  useUserSettingsSync,
  useAuthRouting,
} from "@/features/auth/hooks";
```

### Từ Subfolder
```typescript
import { useLoginForm } from "@/features/auth/hooks/login";
import { useUserSettingsSync } from "@/features/auth/hooks/sync";
import { useAuthGate } from "@/features/auth/hooks/routing";
```

### Từ Specific Hook File
```typescript
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
```

---

## 🔗 Integration Example

### Typical Component Setup
```typescript
"use client";

import { useAuthGate } from "@/features/auth/hooks/routing";
import { useLoginScreen } from "@/features/auth/hooks/login";

// Layout component
export function AuthLayout() {
  const { isWaiting, loadingMessage } = useAuthGate();

  if (isWaiting) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return <YourContent />;
}

// Login page component
export function LoginPage() {
  const { state, handlers, copy } = useLoginScreen();

  return (
    <LoginForm
      mode={state.mode}
      view={state.view}
      form={state.form}
      handlers={handlers}
      copy={copy}
    />
  );
}
```

---

## 🎨 Architecture Principles

### Single Responsibility
- Mỗi hook có **một** chức năng rõ ràng
- `useLoginForm` - Form state only
- `useAuthActions` - Auth API calls only
- `usePasswordResetFlow` - Password reset workflow only

### Composition Pattern
- Orchestrators compose focused hooks
- `useLoginScreen` = Form + OAuth Listener + Reset Flow + Auth Actions
- `useAuthGate` = Settings Sync + Hydration + Routing

### Offline-First
- Settings được lưu offline
- Offline settings merged with server (offline priority)
- Sync tới server khi login

### Store-First Hydration
- Server → MobX Store → UI Components
- Store là single source of truth
- UI frameworks (next-themes, i18n) sync với store

---

## 🧪 Testing Tips

### Isolated Hook Testing
```typescript
// useLoginForm is simple - easy to test
const { form, updateField } = renderHook(() => useLoginForm());
```

### Mock Dependencies
```typescript
// Mock Supabase client for useAuthActions
jest.mock("@/lib/supabase/client");

// Mock authStore for useSettingsHydration
jest.mock("@/store/authStore");
```

### Component Integration Testing
```typescript
// Test useAuthGate with full flow
render(<AuthGate><TestComponent /></AuthGate>);
```

---

## 📝 Maintenance Notes

### Recently Refactored (Jan 21, 2026)
1. **useUserSettingsSync**: 226 → 180 lines
   - Extracted utilities: `settingsNormalization.ts`, `settingsApplication.ts`
   - Clearer separation of concerns

2. **useAuthGate**: 54 → 34 lines
   - Split into `useSettingsHydration` + `useAuthRouting`
   - Now pure orchestrator

3. **useLoginScreen**: 307 → 154 lines
   - Split into 4 focused hooks
   - Much cleaner composition

### Hook Dependencies Graph
```
useAuthGate
  ├── useUserSettingsSync
  │   ├── useAuth
  │   ├── normalizeSettings (utility)
  │   └── mergeOfflinePreferences (utility)
  ├── useSettingsHydration
  │   └── authStore
  └── useAuthRouting
      └── authStore

useLoginScreen
  ├── useLoginForm
  ├── useOAuthMessageListener
  ├── usePasswordResetFlow
  │   └── getSupabaseBrowserClient
  └── useAuthActions
      ├── getSupabaseBrowserClient
      └── useAuth
```

---

## 🚀 Usage in Real Components

### AuthGate.tsx
```typescript
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isWaiting, loadingMessage } = useAuthGate();

  if (isWaiting) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return children;
}
```

### LoginScreen.tsx
```typescript
export function LoginScreen() {
  const { state, derived, copy, handlers } = useLoginScreen();

  return (
    <div>
      <h1>{copy.title}</h1>
      {derived.isSignIn ? (
        <SignInForm {...handlers} />
      ) : (
        <SignUpForm {...handlers} />
      )}
    </div>
  );
}
```

---

## ✅ Checklist for Future Hooks

Khi thêm hook mới, đảm bảo:
- [ ] Hook có **một** chức năng rõ ràng
- [ ] Đặt trong thư mục phù hợp (login/sync/routing)
- [ ] Export từ `index.ts` của thư mục
- [ ] Update main `hooks/index.ts` nếu cần
- [ ] Thêm JSDoc comments
- [ ] Đơn vị test (nếu phức tạp)
- [ ] Update README này

---

**Last Updated:** January 21, 2026  
**Created by:** Auth Refactoring Task
