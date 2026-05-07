# Hướng dẫn kỹ thuật & vận hành Native-cli

## Môi trường phát triển
- **Yêu cầu hệ thống**: Node.js 18 LTS hoặc mới hơn, npm hoặc pnpm (repo dùng workspace nên khuyến nghị pnpm 9+), và Java JDK 17 cho build native.
- **Phụ thuộc dự án**: Các package chính (Expo 53, React Native 0.79, MobX, TanStack Query, Google Mobile Ads) khai báo tại `package.json`. Cấu hình plugin và quyền hệ điều hành được định nghĩa trong `app.json`. 【F:Native-cli/package.json†L1-L53】【F:Native-cli/app.json†L1-L76】
- **Biến môi trường**: Sử dụng `react-native-config` và `expo-constants` để hợp nhất giá trị API base URL và thông số build. Có thể khai báo `.env` với các khóa trùng `extra` trong `app.json` (ví dụ `API_BASE_URL`). 【F:Native-cli/constants/env.ts†L1-L34】【F:Native-cli/app.json†L70-L86】

## Google AdMob (Mobile Ads)
1. Tạo app trong AdMob và lấy **App ID** cho Android/iOS.
2. Cập nhật `app.json` plugin `react-native-google-mobile-ads`:
   - `androidAppId`: dán App ID Android.
   - `iosAppId`: dán App ID iOS.
3. Tạo **Ad Unit** (ví dụ Banner) và khai báo trong `app.json > extra` hoặc `.env`:
   - `ADMOB_BANNER_UNIT_ID_ANDROID`
   - `ADMOB_BANNER_UNIT_ID_IOS`
   - `ADMOB_APP_OPEN_UNIT_ID_ANDROID`
   - `ADMOB_APP_OPEN_UNIT_ID_IOS`
4. Dev build dùng Test IDs tự động (code dùng `TestIds.ADAPTIVE_BANNER`), production dùng ID thật.
5. Nếu chạy iOS production, giữ `userTrackingUsageDescription` trong plugin để đáp ứng App Tracking Transparency.
6. Sau khi đổi App ID/Ad Unit ID, chạy lại `eas build` hoặc `expo prebuild` để cập nhật native config.

## Thiết lập & chạy cục bộ
1. Cài đặt dependencies trong `Native-cli/`: `npm install` (hoặc `pnpm install` nếu bạn dùng pnpm).
2. Khởi động dev client: `npm run start` để mở Metro bundler.
3. Sử dụng `npm run dev` cho Expo Dev Client với port cố định 8000 (yêu cầu app dev client đã cài trên thiết bị). 【F:Native-cli/package.json†L8-L21】

## Build Android
- **Bản development**: `npm run build:dev` (EAS build profile `development`, tạo dev client `.apk` để debug). 【F:Native-cli/package.json†L12-L21】【F:Native-cli/eas.json†L7-L26】
- **Bản preview**: `npm run build:preview` tạo internal distribution `.apk` với profile `preview`.
- **Bản store**: `npm run build:android` (profile `production`, xuất `.aab` sẵn sàng submit). EAS dự án tham chiếu `projectId` trong `app.json > extra.eas`. 【F:Native-cli/eas.json†L7-L22】【F:Native-cli/app.json†L70-L86】

## Build iOS
- **Chuẩn bị**: Cài Xcode 15+, CocoaPods và đăng nhập `expo login`.
- **Chạy simulators**: `npm run ios` để mở Expo Run iOS (yêu cầu macOS). 【F:Native-cli/package.json†L8-L21】
- **Build EAS**: Sử dụng `eas build -p ios --profile production` từ thư mục dự án (profile có thể bổ sung trong `eas.json` khi cần). 【F:Native-cli/eas.json†L7-L26】

## Cập nhật OTA (Over-the-Air)
1. Đảm bảo version trong `app.json` (trường `version`) và `package.json` đã cập nhật khi cần bump binary.
2. Chạy `eas update --branch <branch-name> --message "Mô tả"` để phát hành bundle OTA. EAS dùng `projectId` tại `extra.eas.projectId` nhằm gắn phiên bản với ứng dụng. 【F:Native-cli/app.json†L64-L86】
3. Sử dụng nhánh `production` cho bản phát hành chính thức, `preview` hoặc `development` cho thử nghiệm. Nhớ sync schema dữ liệu nếu API thay đổi breaking.

## Kiểm thử & đảm bảo chất lượng
- **Linting**: `npm run lint` (wrapper `expo lint`) để kiểm tra lỗi ESLint/TypeScript. 【F:Native-cli/package.json†L8-L21】
- **Kiểm thử thủ công**: Tập trung vào kịch bản đọc offline (bật chế độ máy bay để xác nhận AsyncStorage trả dữ liệu lịch sử đọc và cấu hình), đăng nhập, và đồng bộ lịch sử khi chuyển từ offline sang online.
- **Theo dõi lỗi**: Axios interceptor sẽ log timeout, 401; đảm bảo kiểm tra console Metro để phát hiện issue. 【F:Native-cli/utils/api.ts†L1-L74】

## Tích hợp wiki nội bộ
- Các tài liệu tiếng Việt được lưu trong `Native-cli/docs/vi/`. Từ wiki dự án (nếu có), liên kết sang tài liệu này để nhóm vận hành truy cập nhanh.
