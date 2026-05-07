# UI Clone Plan - Native-cli

## Screens cần clone từ Next-cli

### 1. Auth Screens
- [ ] LoginScreen - `features/auth/components/LoginScreen.tsx`
- [ ] AuthGate - `features/auth/components/AuthGate.tsx`
- [ ] AccountSwitchPrompt - `features/auth/components/AccountSwitchPrompt.tsx`
- [ ] auth-screen/* - OAuth flow screens

### 2. Onboarding Screens
- [ ] LanguageStep - `features/onboarding/components/LanguageStep.tsx`
- [ ] ThemeStep - `features/onboarding/components/ThemeStep.tsx`
- [ ] PaletteStep - `features/onboarding/components/PaletteStep.tsx`
- [ ] CurrencyStep - `features/onboarding/components/CurrencyStep.tsx`

### 3. App Shell (Main)
- [ ] AppShellScreen - `features/app-shell/screens/AppShellScreen.tsx`
- [ ] HomeScreen - `features/app-shell/screens/HomeScreen.tsx`
- [ ] SettingsScreen - `features/app-shell/screens/SettingsScreen.tsx`
- [ ] StatsScreen - `features/app-shell/screens/StatsScreen.tsx`
- [ ] StoreScreen - `features/app-shell/screens/StoreScreen.tsx`

### 4. Components (UI Widgets)
- [ ] Transaction components
- [ ] Category components
- [ ] Chart/Stats components
- [ ] Settings panels

## Approach
1. Rewrite screens as React Native / Expo Router screens
2. Keep logic (hooks, stores) unchanged
3. Replace Radix UI with React Native components
4. Replace Next routing with Expo routing

## Current Status
- ✓ Stores cloned
- ✓ Hooks cloned
- ✓ Services cloned
- ⏳ Screens - Starting now
