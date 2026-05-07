# Tài liệu deeplink cho luồng đăng nhập (hiện tại)

## Mục tiêu

- Cho phép Google OAuth trên mobile trả về app bằng deeplink.
- Nếu không thể dùng deeplink thì fallback về web callback.

## Cấu hình hiện tại

### Mobile (Native-cli)

- `Native-cli/app.json`:
  - `expo.scheme`: `quanlytaichinh`
  - Không có `android.intentFilters` hay `ios.associatedDomains` -> chỉ hỗ trợ custom scheme.
- Thư viện:
  - `expo-linking`
  - `expo-web-browser`
- Đích deeplink dùng trong code:
  - `quanlytaichinh://auth-callback`

### Web (Next-cli)

- Callback web: `Next-cli/src/app/auth/callback/page.tsx`
- URL callback đang dùng để fallback:
  - `https://kata-smart-spend.vercel.app/auth/callback`

### Supabase

Các URL phải được whitelist trong Auth Redirect URLs:

- `quanlytaichinh://auth-callback`
- `https://kata-smart-spend.vercel.app/auth/callback`
- (nếu chạy web local) `http://localhost:3000/auth/callback`

## Luồng hoạt động hiện tại (Mobile)

1. User bấm “Tiếp tục với Google”.
2. `Native-cli/features/auth/hooks/useAuth.tsx` gọi:
   - `resolveAuthRedirectUrl()` để lấy redirect URL.
   - `supabase.auth.signInWithOAuth({ redirectTo, skipBrowserRedirect: true })`
3. Mở trình duyệt in-app bằng:
   - `WebBrowser.openAuthSessionAsync(data.url, redirectTo)`
4. Sau khi Google login thành công:
   - Supabase redirect về `redirectTo`.
   - Nếu `redirectTo = quanlytaichinh://auth-callback` thì app nhận deeplink.
5. App bắt deeplink qua:
   - `Linking.addEventListener("url", ...)`
   - Hàm `completeOAuth(url)` đọc `code` hoặc `access_token` và set session.

## Luồng hoạt động hiện tại (Web)

1. OAuth redirect về `/auth/callback`.
2. `Next-cli/src/app/auth/callback/page.tsx`:
   - `exchangeCodeForSession` hoặc `setSession`
   - Gửi `postMessage` về cửa sổ cha và đóng popup.

## Điểm dễ lỗi thường gặp

- Redirect URL không nằm trong Supabase Auth Redirect URLs → Supabase fallback về URL khác.
- App chưa nhận deeplink (custom scheme chưa được đăng ký đúng hoặc app chưa được cài).
- Trình duyệt Google trả về `localhost` khi `redirectTo` là `http://localhost:3000/...`.
- Thiếu `intentFilters`/`associatedDomains` nếu muốn hỗ trợ `https://` deeplink thay vì `quanlytaichinh://`.

## Checklist kiểm tra nhanh

- `app.json` có `scheme: "quanlytaichinh"`.
- Supabase Auth Redirect URLs có đủ:
  - `quanlytaichinh://auth-callback`
  - `https://kata-smart-spend.vercel.app/auth/callback`
- Trên Android đã cài app (deeplink chỉ hoạt động khi app đã cài).
- Kiểm tra deeplink thủ công:
  - Android: `adb shell am start -a android.intent.action.VIEW -d "quanlytaichinh://auth-callback"`
  - iOS (sim): `xcrun simctl openurl booted "quanlytaichinh://auth-callback"`

## File liên quan

- `Native-cli/app.json`
- `Native-cli/features/auth/hooks/useAuth.tsx`
- `Next-cli/src/app/auth/callback/page.tsx`
