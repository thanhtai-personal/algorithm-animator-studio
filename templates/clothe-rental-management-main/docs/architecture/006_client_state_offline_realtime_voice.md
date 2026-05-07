# 006 - Client State, Offline, Realtime, Voice

## 1) State ownership model

### 1.1 Server state
- TanStack Query quản lý:
  - fetch lifecycle
  - cache/retry/invalidation

### 1.2 UI-visible state
- MobX stores quản lý:
  - trạng thái hiển thị
  - local persistence
  - intent actions

### 1.3 Quy tắc
- Query lấy dữ liệu -> merge store -> UI render từ store.
- Không để query result và store cùng làm source of truth cho cùng dữ liệu.

## 2) Web feature data flow
```text
Component
  -> Hook
    -> Query/Mutation
      -> Service
        -> apps/server API
```

## 3) Offline-first principles
- Offline không phải edge-case, là happy-path được hỗ trợ.
- Mutation có thể queue/replay khi online (theo từng module/flow).
- Luôn ưu tiên merge/reconcile thay vì blind overwrite.
- Khi logout mà còn pending sync cần cảnh báo user.

## 4) PWA (web)
- Có route fallback `/offline`.
- Cấu hình PWA/dev flag qua `NEXT_PUBLIC_PWA_DEV`.
- Cache/public strategy ưu tiên các route an toàn, tránh cache bừa toàn bộ dashboard API.

## 5) Realtime
- Client nhận realtime signal qua kênh backend (`apps/server`) hoặc event endpoint đã chuẩn hóa.
- Không subscribe trực tiếp business tables từ runtime ngoài `apps/server`.
- Realtime update nên coi là near-real-time signal; query refetch vẫn là reconcile authority.

## 6) Voice architecture

### 6.1 Web
- Shared primitives trong:
  - `apps/web/src/components/voice/**`
  - `apps/web/src/lib/voice/**`
- Voice transcription server-side dùng service config (`voiceTranscriptionConfig`).

### 6.2 Mobile
- Stack hiện hành: `expo-speech-recognition` (không dùng `@react-native-voice/voice`).
- Shared voice helpers trong `apps/mobile/src/lib/voice/**`.

### 6.3 Zalo mini apps
- Mỗi mini app có voice primitives riêng trong `src/lib/voice/**`.
- Gọi API trung tâm qua `VITE_API_BASE_URL`.

## 7) State-related anti-patterns cần tránh
- Component gọi thẳng API/service.
- Hook nhồi nhiều trách nhiệm (fetch + mutation + formatting + UI state).
- Lưu cùng dữ liệu ở nhiều store không có owner rõ ràng.
- Xử lý async voice result sau khi modal đóng (stale update race).

## 8) Regression checklist (state/offline/voice)
- [ ] Query invalidation đầy đủ sau create/update/delete.
- [ ] UI list/detail không cần hard refresh mới đồng bộ.
- [ ] Offline queue hoạt động đúng khi mất mạng.
- [ ] Voice stop/cancel không để pending async callback ghi đè state mới.
- [ ] Không phát sinh double keyboard conflict ở luồng nhập số tùy biến.
