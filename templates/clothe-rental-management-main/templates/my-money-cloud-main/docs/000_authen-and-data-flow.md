# Luồng xác thực và đồng bộ dữ liệu

## Sơ đồ tổng quan

```
Người dùng
  |
  v
Màn hình đăng nhập (AuthScreen)
  |------------------------------|
  |                              |
  v                              v
Email/Password               Google OAuth
  |                              |
  v                              v
Supabase Session            Popup/Browser -> Callback
  |                              |
  v                              v
Đã đăng nhập                 Trả về session
  |
  v
Kiểm tra đổi tài khoản (sau đăng nhập)
  |------------------------------|
  |                              |
  v                              v
Không đổi tài khoản         Đổi tài khoản
  |                              |
  v                              v
Tiếp tục dùng app           Xóa dữ liệu local/pending
                                 |
                                 v
                             Lấy dữ liệu user mới
```

## Web (Next-cli)

- Entry point: `Next-cli/src/features/auth/components/AuthScreen.tsx`.
- Quản lý session & anonymous logic: `Next-cli/src/features/auth/hooks/useAuth.tsx` (Supabase browser client).
- Đăng nhập Email/Password: `supabase.auth.signInWithPassword`.
- Đăng ký: `supabase.auth.signUp` + metadata (nếu chưa có session sẽ hiện màn hình chờ xác nhận).
- Google OAuth:
  - `supabase.auth.signInWithOAuth({ provider: "google", skipBrowserRedirect: true })`.
  - Mở popup đăng nhập Google.
  - Callback tại `Next-cli/src/app/auth/callback/page.tsx` trao đổi code lấy session,
    gửi `supabase-auth-complete` về cửa sổ cha và đóng popup.

### Chế độ ẩn danh (guest / skip sign in)

- Kích hoạt: khi người dùng nhấn nút "Bỏ qua đăng nhập" trong `AuthScreen` (xem mã gọi `enableAnonymous()` trong `AuthScreen.tsx`).
- Hành vi khi bật:
  - Nếu `isSupabaseConfigured` (env đã cung cấp `SUPABASE_URL` + anon key) thì `useAuth` gọi `supabase.auth.signInAnonymously()` (hàm `enableAnonymous` trong `Next-cli/src/features/auth/hooks/useAuth.tsx`).
  - Nếu Supabase không được cấu hình thì ứng dụng chuyển sang "local-only" anonymous: tạo `anonymousId`, lưu flag `LOCAL_STORAGE_KEYS.anonymousMode = "true"` và `LOCAL_STORAGE_KEYS.anonymousId`, giữ dữ liệu hoàn toàn trên thiết bị (localStorage keys: `transactions`, `categories`).

- Dữ liệu và đồng bộ khi chuyển từ anonymous -> đăng nhập thực:
  - Khi có session người dùng thực, hook `useAuth` sẽ kiểm tra nếu thiết bị có dữ liệu local (local categories/transactions) thì gọi `syncAnonymousData()`.
  - `syncAnonymousData()` dùng `createSupabaseAuthedClient` để upsert dữ liệu local lên bảng `categories` và `transactions` với `user_id = session.user.id` (sử dụng `upsert(..., { onConflict: 'id', ignoreDuplicates: true })`).
  - Sau sync thành công, local data sẽ bị xóa (`clearLocalCategories()`, `clearLocalTransactions()`), và nếu trước đó là local-only anonymous thì `exitAnonymous()` sẽ tắt chế độ anonymous.

- Trường hợp Supabase anonymous user đã có dữ liệu trên cloud:
  - Trước khi thoát anonymous, `useAuth` gọi `cacheSupabaseAnonymousData()` để tải dữ liệu hiện có trên cloud về local (để tránh mất dữ liệu khi sign out anonymous account).
  - `mergeAnonymousOfflineData(userId)` được dùng để hợp nhất cached/pending data của anonymous user vào local trước khi sign out.

- Các API / flags liên quan:
  - `anonymousDecisionPending`: cờ để hiển thị cảnh báo/nhiệm vụ khi có local data và user vừa đăng nhập.
  - `confirmAnonymousSync()`: thực hiện sync và trả về thành công/không.
  - `discardAnonymousData()`: gọi `backupAnonymousData()` rồi xóa local data và thoát anonymous.

- Backup: `backupAnonymousData()` upsert payload vào bảng `user_backup` (cột `data` chứa categories/transactions, `user_id` = session.user.id). Thao tác này được gọi trước khi user chọn bỏ dữ liệu khách.

- Đăng xuất: `supabase.auth.signOut()` + xóa cache local + reset app-lock.

## Mobile (Native-cli)

- Entry point: `Native-cli/features/auth/components/AuthScreen.tsx`.
- Quản lý session & anonymous logic: `Native-cli/features/auth/hooks/useAuth.tsx`.
- Đăng nhập Email/Password: `supabase.auth.signInWithPassword`.
- Đăng ký: `supabase.auth.signUp` + metadata.
- Google OAuth:
  - `supabase.auth.signInWithOAuth({ provider: "google", skipBrowserRedirect: true })`.
  - Mở WebAuth session (expo-web-browser) và redirect về `quanlytaichinh://auth-callback` (hoặc fallback web URL).
  - `completeOAuth()` trao đổi code hoặc set session.

### Chế độ ẩn danh (mobile)

- Kích hoạt: `AuthScreen` (mobile) gọi `enableAnonymous()` trong `Native-cli/features/auth/hooks/useAuth.tsx`.
- Hành vi khi bật:
  - Nếu `isSupabaseConfigured` thì `enableAnonymous()` gọi `supabase.auth.signInAnonymously()` (Supabase anonymous user).
  - Nếu không, thì bật local anonymous: lưu flag `STORAGE_KEYS.anonymousMode = 'true'` và `STORAGE_KEYS.anonymousId` trong `AsyncStorage` (local-only guest).

- Đồng bộ và merge khi user đăng nhập sau guest:
  - `syncAnonymousData()` (mobile) tương tự web: upsert các bản ghi local vào `categories`/`transactions` với `user_id = session.user.id`.
  - Sau sync thành công: xóa local data và nếu cần tắt chế độ anonymous.
  - Trước khi thoát anonymous Supabase user, `cacheSupabaseAnonymousData()` sẽ tải dữ liệu cloud hiện tại về local, sau đó `mergeAnonymousOfflineData(userId)` được gọi để merge cached/pending data.

- Các keys trên mobile: `STORAGE_KEYS.anonymousMode`, `STORAGE_KEYS.anonymousId`, `STORAGE_KEYS.localTransactions`, `STORAGE_KEYS.localCategories` (xem `Native-cli/constants/app.ts`).

- UX: khi có dữ liệu cục bộ và user chọn bỏ qua đăng nhập, app hiển thị xác nhận (Alert / confirm). Khi user sau đó đăng nhập, nếu cloud đã có dữ liệu thì hiển thị lựa chọn sync vs xóa.

- Đăng xuất: gọi `supabase.auth.signOut()` (nếu có session) và reset app-lock local.

## Quy trình đổi tài khoản sau đăng nhập (Web + Mobile)

```
Đăng nhập thành công
  |
  v
So sánh email mới với lastSignedInEmail
  |-------------------------------|
  |                               |
  v                               v
Trùng email                   Khác email
  |                               |
  v                               v
Tiếp tục dùng app            Xóa local/pending
                                  |
                                  v
                             Lấy dữ liệu user mới
```

## Quy trình đồng bộ dữ liệu (Web + Mobile)

```
Local storage (transactions/categories)
  |
  v
Nếu offline -> lưu local + queue sync
  |
  v
Khi online + có session
  |
  v
Kiểm tra dữ liệu cloud
  |-------------------------------|
  |                               |
  v                               v
Server có dữ liệu           Server chưa có dữ liệu
  |                               |
  v                               v
Hiện cảnh báo mất dữ liệu    Đồng bộ local lên cloud
  |
  v
Người dùng chọn "Tiếp tục"
  |
  v
Upsert lên cloud (ignoreDuplicates)
```

Phân biệt rõ 2 trạng thái: **offline đã đăng nhập** và **ẩn danh**.

- Dữ liệu local được lưu trong local storage (`transactions`, `categories`) để hỗ trợ offline.
- Offline nhưng đã đăng nhập:
  - Giao dịch mới vẫn lưu local + enqueue sync.
  - Khi online trở lại, hệ thống tự đồng bộ lên cloud (không cảnh báo mất dữ liệu).
- Ẩn danh chuyển sang đăng nhập:
  - Luôn đồng bộ dữ liệu local lên tài khoản mới (upsert).
- Đồng bộ dùng `upsert` với `ignoreDuplicates` để tránh ghi đè dữ liệu đã có.

## Cảnh báo khi đăng xuất ở chế độ offline

- Nếu người dùng đang offline và còn dữ liệu chưa đồng bộ (pending queue):
  - Hiển thị cảnh báo trước khi đăng xuất.
  - Cho phép hủy đăng xuất để tránh mất dữ liệu.

## Xử lý sao lưu dữ liệu (Backup)

 - Bảng backup trên Supabase: `public.user_backup` (xem `docs/supabase/00_create_data_backup.sql`).
 - Mục đích: lưu lại dữ liệu local trước khi người dùng quyết định bỏ dữ liệu ẩn danh.
 - Thao tác trong code:
   - `backupAnonymousData()` (cả web & mobile) sẽ upsert payload vào `user_backup` gồm `user_id`, `device` và `data` (categories/transactions + `deletedAt`).
   - `discardAnonymousData()` gọi `backupAnonymousData()` rồi xóa local data và thoát anonymous.
 - Ghi chú: hiện có implement cho cả `Next-cli` và `Native-cli` trong files `features/auth/hooks/useAuth.tsx`.
