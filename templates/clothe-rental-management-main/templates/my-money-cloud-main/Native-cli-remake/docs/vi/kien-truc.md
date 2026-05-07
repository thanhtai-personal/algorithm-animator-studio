# Kiến trúc hệ thống TangThuLauNative

## Tổng quan nền tảng
- **Framework**: Ứng dụng được xây dựng bằng Expo Router trên nền React Native 0.79 và React 19, đóng gói trong `TangThuLauNative/package.json`. Các module Expo như splash screen, image, localization, audio và background task được khai báo trong `app.json` để phục vụ trải nghiệm đọc, nghe truyện và hiển thị quảng cáo. 【F:TangThuLauNative/package.json†L1-L53】【F:TangThuLauNative/app.json†L1-L86】
- **Tổ chức thư mục**: Lớp giao diện chính nằm ở `app/` (layout, điều hướng tab, màn welcome), thư viện UI chia theo domain trong `components/`, logic dùng chung ở `hooks/`, cấu hình và hằng số trong `constants/`, còn `store/` quản lý state MobX cho xác thực, lịch sử đọc, ngôn ngữ và cấu hình reader. 【F:TangThuLauNative/app†L1-L7】【F:TangThuLauNative/components†L1-L8】【F:TangThuLauNative/hooks†L1-L3】【F:TangThuLauNative/constants†L1-L9】【F:TangThuLauNative/store/index.ts†L1-L21】
- **Tích hợp dịch vụ**: `constants/env.ts` tổng hợp biến môi trường từ `react-native-config`, Expo và `process.env`, cho phép xây dựng bản native lẫn bản dev. Google Mobile Ads được cấu hình qua plugin trong `app.json`. 【F:TangThuLauNative/constants/env.ts†L1-L34】【F:TangThuLauNative/app.json†L35-L88】

## Lưu trữ và đồng bộ offline
- **Tầng cache**: Ứng dụng đóng gói wrapper `utils/asyncStorage.ts` để ưu tiên AsyncStorage native, fallback sang `localStorage` hoặc bộ nhớ tạm khi chạy trên web. Các store MobX như `HistoryStore` và `ReaderConfigStore` đọc/ghi thông qua wrapper này để duy trì dữ liệu offline. 【F:TangThuLauNative/utils/asyncStorage.ts†L1-L32】【F:TangThuLauNative/store/HistoryStore.ts†L1-L51】【F:TangThuLauNative/store/ReaderConfigStore.ts†L1-L47】
- **Lịch sử đọc**: `HistoryStore` lưu danh sách chương đã đọc dưới khóa `reading-history`, tự động nạp khi khởi tạo và đồng bộ lên API `/reading-history/sync` khi người dùng đăng nhập. `useReadingHistory` cung cấp hook truy cập store cho UI. 【F:TangThuLauNative/store/HistoryStore.ts†L1-L54】【F:TangThuLauNative/hooks/useReadingHistory.ts†L1-L12】
- **Cấu hình đọc**: `ReaderConfigStore` giữ font, màu nền, màu chữ; mọi thay đổi đều được persist vào AsyncStorage để phục hồi khi offline. Các khóa lưu trữ và cờ chức năng (ví dụ `offlineReading`) được tài liệu hóa trong `constants/app.ts`. 【F:TangThuLauNative/store/ReaderConfigStore.ts†L1-L47】【F:TangThuLauNative/constants/app.ts†L1-L53】

## Luồng xác thực & bảo mật
- **Quản lý token**: Module `utils/api.ts` tạo instance axios chung, gắn bearer token khi đăng nhập, tự động refresh khi gặp 401 (gọi `/auth/refresh`) và hủy request sau 20 giây để tránh treo. Token được lưu/clear trong AsyncStorage qua `setTokenBearer` và `clearToken`. 【F:TangThuLauNative/utils/api.ts†L1-L74】
- **Store xác thực**: `AuthStore` duy trì hồ sơ người dùng, đồng bộ lịch sử đọc sau khi `fetchProfile` thành công, đồng thời khi `clear()` sẽ xóa token và lịch sử đọc cục bộ để tránh trùng tài khoản. 【F:TangThuLauNative/store/AuthStore.ts†L1-L51】
- **MobX root store**: `store/index.ts` khởi tạo `HistoryStore` trước `AuthStore` (để đồng bộ sau đăng nhập), đồng thời expose `StoreProvider` giúp React tree truy cập chung. 【F:TangThuLauNative/store/index.ts†L1-L21】【F:TangThuLauNative/store/StoreProvider.tsx†L1-L13】

## Modules React Native đáng chú ý
- **Điều hướng & UI**: `app/(tabs)/` cấu hình tab chính, `components/ui/` chứa atom/molecule tái sử dụng, `components/home/` và `components/story/` điều khiển màn nội dung. Các màn đặc biệt như `terms.tsx` hay `change-password.tsx` sống song song trong `app/`. 【F:TangThuLauNative/app†L1-L7】【F:TangThuLauNative/components/ui†L1-L20】
- **Âm thanh & tiện ích**: `components/audio/` bao gồm player dựa trên `expo-audio`, kết hợp với cấu hình tốc độ trong `constants/app.ts`. `hooks/` đóng gói logic dịch thuật (`useTranslation`), lịch sử đọc, truy vấn API. 【F:TangThuLauNative/components/audio†L1-L20】【F:TangThuLauNative/hooks†L1-L3】【F:TangThuLauNative/constants/app.ts†L55-L71】
- **Scripts & plugins**: Thư mục `scripts/` chứa helper như `reset-project.js`, trong khi `plugins/withResizeableActivity` mở rộng cấu hình Android activity cho trải nghiệm đọc linh hoạt. 【F:TangThuLauNative/scripts†L1-L3】【F:TangThuLauNative/plugins†L1-L3】

Tài liệu này giúp nắm bắt nhanh cách ứng dụng tổ chức state, caching và luồng đăng nhập, tạo nền tảng cho việc mở rộng tính năng offline, đồng bộ đa thiết bị và bảo mật tài khoản.
