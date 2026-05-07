// Đặt version cho cache để khi deploy mới có thể xoá cache cũ, tránh dùng asset lỗi thời.
const CACHE_NAME = "spendsmart-cache-v1";
// App shell tối thiểu để PWA có thể cài đặt và mở offline.
const ASSETS = ["/", "/manifest.webmanifest", "/favicon.png"];

self.addEventListener("install", (event) => {
  // Pre-cache app shell để lần đầu tải nhanh và có thể mở khi offline.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      // Kích hoạt service worker mới ngay để update không bị chậm.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // Dọn cache cũ để người dùng không bị kẹt với asset cũ.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      // Nhận quyền điều khiển trang hiện tại ngay, không cần reload.
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Chỉ cache request GET để không ảnh hưởng POST/PUT API.
  if (event.request.method !== "GET") return;

  // Điều hướng trang cần xử lý riêng để HTML luôn mới.
  const isNavigation = event.request.mode === "navigate";
  const url = new URL(event.request.url);

  if (isNavigation) {
    event.respondWith(
      // Network-first cho HTML để user nhận bản mới nhanh nhất.
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          // Lưu HTML mới nhất để fallback khi offline.
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        // Khi offline thì fallback cache hoặc root shell.
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    // Cache-first cho asset tĩnh để tải nhanh và hoạt động offline tốt.
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Chỉ cache response OK (200-299)
          if (response.ok) {
            const cloned = response.clone();
            // Lưu asset đã tải để dùng lần sau.
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch((error) => {
          // Log lỗi nhưng không throw để tránh uncaught promise
          console.warn('[SW] Failed to fetch:', event.request.url, error.message);
          // Trả về response rỗng thay vì crash
          return new Response('', {
            status: 408,
            statusText: 'Request Timeout - Offline',
          });
        });
    })
  );
});
