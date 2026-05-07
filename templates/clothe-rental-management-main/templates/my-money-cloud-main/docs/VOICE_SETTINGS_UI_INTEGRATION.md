# AI Voice Settings UI Integration

## Overview
Added a new setting toggle in the Profile Preferences screen to enable/disable auto-create functionality from voice input.

## Changes Made

### 1. i18n Keys Added

#### Vietnamese (vi.ts)
```typescript
"profile.aiVoiceSettings": "Cài đặt nhập liệu bằng giọng nói",
"profile.autoCreateTransaction": "Tự động tạo giao dịch",
"profile.autoCreateTransactionHint": "Bỏ qua modal xác nhận, tự động tạo giao dịch từ voice",
```

#### English (en.ts)
```typescript
"profile.aiVoiceSettings": "Voice input settings",
"profile.autoCreateTransaction": "Auto-create transaction",
"profile.autoCreateTransactionHint": "Skip confirmation, auto-create from voice",
```

### 2. ProfilePreferencesCard Updates

**File**: `src/features/profile/components/ProfilePreferencesCard.tsx`

**Changes**:
1. Imported `useAIVoiceSettings` hook from `@/lib/hooks/useAIVoiceSettings`
2. Added hook initialization:
   ```typescript
   const { ignoreVoiceVerify, setIgnoreVerify } = useAIVoiceSettings();
   ```
3. Added new toggle section between "Change Password" and "Theme" sections:
   ```tsx
   <Separator />
   <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
     <div>
       <p className="text-sm font-semibold">{t("profile.aiVoiceSettings")}</p>
       <p className="text-xs text-muted-foreground">{t("profile.autoCreateTransactionHint")}</p>
     </div>
     <Switch
       checked={ignoreVoiceVerify}
       onCheckedChange={async (checked) => {
         await setIgnoreVerify(checked);
         toast.success(checked ? t("auth.lockEnabled") : t("auth.lockDisabled"));
       }}
     />
   </div>
   <Separator />
   ```

## User Flow

1. User navigates to Profile screen
2. Clicks into "Preferences" section
3. Finds "Voice input settings" toggle
4. Toggles on/off to enable/disable auto-create
5. Settings synced to database (authenticated) or localStorage (anonymous)
6. Toast notification confirms change

## Integration with Existing Flow

### When Toggle is ON (ignoreVoiceVerify = true)
1. User speaks transaction: "chi 50k cafe"
2. Voice recognized → AI parsing (if AI mode enabled)
3. Transaction auto-created → Toast notification
4. No confirmation modal shown

### When Toggle is OFF (ignoreVoiceVerify = false)
1. User speaks transaction: "chi 50k cafe"
2. Voice recognized → AI parsing (if AI mode enabled)
3. Confirmation modal shown → User confirms
4. Transaction created

## Technical Details

- **Hook**: `useAIVoiceSettings` handles state and sync
- **Storage**: 
  - Authenticated: Supabase `user_settings.ignore_voice_verify`
  - Anonymous: localStorage `spendsmart:ignore-voice-verify`
- **Component Position**: Between "Change Password" accordion and "Theme" section
- **UI**: Switch component with supporting text
- **Feedback**: Toast notifications on toggle

## Testing Checklist

- [ ] Profile settings page loads correctly
- [ ] "Voice input settings" toggle visible
- [ ] Toggle reflects current state from `useAIVoiceSettings`
- [ ] Toggling ON saves to database/localStorage
- [ ] Toggling OFF saves to database/localStorage
- [ ] Toast notification shows on toggle
- [ ] Voice input respects toggle state
- [ ] Settings persist after page refresh
- [ ] Works for both authenticated and anonymous users

## Future Enhancements

1. Add option to show remaining AI requests in settings
2. Add button to purchase more AI requests
3. Show AI mode status alongside voice settings
4. Add help text explaining the difference between auto-create and modal confirm
