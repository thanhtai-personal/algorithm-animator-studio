# Online/Offline Mode (Web) - Mô tả hoạt động hiện tại

## 1) Mục tiêu
- Mô tả chính xác cách hệ thống đang xử lý khi có mạng / mất mạng trên `apps/web`.
- Làm rõ phần nào đã hỗ trợ offline thực sự, phần nào mới ở mức fallback.
- Ghi nhận giới hạn hiện tại để tránh kỳ vọng sai khi QA.

## 2) Phạm vi tài liệu
- **In-scope:** Web app (`apps/web`) hiện tại.
- **Out-of-scope:** Offline queue đầy đủ cho toàn bộ domain nghiệp vụ (chưa có trên web).

## 3) Thành phần chính

### 3.1 Đăng ký Service Worker
- File: `apps/web/src/features/pwa/components/PwaServiceWorkerBootstrap.tsx`
- SW được đăng ký khi:
  - `NODE_ENV === "production"` hoặc
  - `NEXT_PUBLIC_PWA_DEV === "true"`.
- Khi có version SW mới, client tự `SKIP_WAITING` và reload trang để nhận cache mới.

### 3.2 Chiến lược cache trong SW
- File: `apps/web/public/sw.js`
- Cache tĩnh:
  - `cache-first` cho `/_next/static/**`, `/icons/**`, và tài nguyên `style/script/font/image`.
- Cache API:
  - Chỉ áp dụng `network-first` cho:
    - `/api/showroom/**`
    - `/api/showroom/config`
  - Mất mạng:
    - nếu có cache cũ thì trả cache,
    - nếu không có cache thì trả `503` với body `{"error":"offline"}`.
- Navigation request (`request.mode === "navigate"`):
  - nếu fetch fail do offline thì trả trang `/offline` đã precache.

### 3.3 Trang fallback offline
- File: `apps/web/src/app/offline/page.tsx`
- Hiển thị thông báo ngoại tuyến + nút `Thử lại` và `Về trang chủ`.

### 3.4 Session local/guest
- File: `apps/web/src/store/authStore.ts`, `apps/web/src/lib/storageAdapter.ts`
- App lưu local:
  - `userId`, `anonId`,
  - user settings (`user:{id}:info`) cho cloud user hoặc guest.
- Guest mode được tạo bằng `initAnonymousSession(...)` và vẫn dùng app được ở các route cho phép.

### 3.5 Cảnh báo dữ liệu chưa đồng bộ khi sign-out
- File: `apps/web/src/features/auth/utils/offlinePending.ts`, `apps/web/src/features/auth/hooks/home/useHomeSessionPanel.ts`
- Trước khi đăng xuất / thoát guest:
  - đọc key `app.offline.pending.{sessionOwnerId}` trong local storage,
  - nếu có dữ liệu pending thì bắt confirm modal cảnh báo mất dữ liệu.

## 4) Luồng hoạt động

### 4.1 Khi online
1. App bootstrap auth context (`useAuthBootstrap`).
2. API hoạt động bình thường theo luồng React Query + Service.
3. SW vẫn chạy nền để cache static/showroom API theo policy.

### 4.2 Khi offline
1. Điều hướng trang mới:
   - nếu request fail => hiển thị `/offline`.
2. Tài nguyên đã cache trước đó (static/showroom API) có thể tiếp tục dùng.
3. API dashboard nội bộ (orders/products/payments...) không có runtime cache trong SW:
   - thường sẽ fail khi mất mạng.
4. Local session (user/anon + settings local) vẫn còn trong storage.

## 5) Trạng thái “offline-first” hiện tại trên web
- Web **đã có**:
  - PWA install + SW cache/fallback cơ bản.
  - Guest/local session persistence.
  - Warning sign-out khi phát hiện pending key.
- Web **chưa có**:
  - offline queue replay đầy đủ cho các mutation nghiệp vụ.
  - cơ chế online/offline banner realtime trong UI.
  - retry/sync manager tổng quát khi mạng trở lại.

## 6) Ghi chú quan trọng về pending queue
- Key pending hiện được **đọc** để cảnh báo sign-out.
- Trong code web hiện tại chưa có luồng enqueue đồng bộ nghiệp vụ ghi key này một cách tổng quát.
- Vì vậy warning có thể chỉ xuất hiện khi key được tạo bởi flow legacy hoặc dữ liệu cũ.

## 7) Checklist test thủ công
1. Build/chạy app ở production mode (hoặc bật `NEXT_PUBLIC_PWA_DEV=true`) để SW được đăng ký.
2. Mở app online, truy cập showroom để tạo cache.
3. Tắt mạng:
   - reload route navigation => phải thấy `/offline` fallback.
   - gọi lại trang showroom đã mở => phải có khả năng dùng dữ liệu cache (nếu đã cache trước).
4. Kiểm tra dashboard API khi offline:
   - xác nhận fail đúng kỳ vọng (vì không nằm trong API cache policy hiện tại).
5. Test warning sign-out:
   - set local key `app.offline.pending.{userId}` với dữ liệu giả,
   - bấm đăng xuất và xác nhận modal cảnh báo xuất hiện.

## 8) Chẩn đoán lỗi thường gặp
- Không thấy behavior offline:
  - SW chưa đăng ký do đang dev mode và chưa bật `NEXT_PUBLIC_PWA_DEV`.
- Offline nhưng không hiện dữ liệu cache:
  - endpoint không thuộc nhóm `/api/showroom/**`.
- App vẫn dùng cache cũ sau deploy:
  - cần hard refresh/đóng mở app để SW controller đổi phiên bản hoàn tất.
