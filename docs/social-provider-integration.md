# Hướng dẫn tích hợp TikTok/Facebook/Instagram provider

Tài liệu này mô tả cách bổ sung OAuth provider cho màn hình `/channel`. Hiện tại YouTube đã có luồng OAuth bằng popup; TikTok, Facebook và Instagram đang bị disable vì chưa có backend/config tương ứng. Khi tích hợp provider nào, provider đó chỉ được enable nếu server báo đã có đầy đủ config.

## Nguyên tắc UI

- Nút `Add channel` chỉ hiển thị provider đã khai báo trong menu provider.
- Provider chưa có OAuth/backend config phải `disabled`, không cho click.
- Không tạo kênh nháp khi người dùng chọn provider.
- Kênh chỉ được thêm vào workspace sau khi OAuth thành công và server lấy được profile kênh/account.
- OAuth phải mở bằng popup hoặc tab mới, không điều hướng đè lên trang `/channel` hiện tại.
- Callback OAuth trong popup phải gửi kết quả về trang mở popup, sau đó tự động đóng popup/tab.

## Popup Contract

Frontend đã có helper tại `src/lib/oauthPopup.ts`.

Provider callback trong popup cần gọi:

```ts
notifyOAuthOpener({
  provider: "tiktok", // hoặc "facebook" | "instagram"
  status: "success",
  channelTitle: profileName,
});
window.setTimeout(() => window.close(), 250);
```

Nếu lỗi:

```ts
notifyOAuthOpener({
  provider: "facebook",
  status: "error",
  message: "OAuth exchange failed.",
});
```

Trang cha sẽ nhận message cùng origin qua `window.postMessage`. Vì vậy redirect/callback URL nên quay về cùng origin với app, ví dụ:

- `http://localhost:3000/channel`
- `https://algorithm-animator-studio.vercel.app/channel`

## API Contract Để Thêm Provider

Mỗi provider nên có các endpoint backend tối thiểu:

```txt
GET  /api/{provider}/config
GET  /api/{provider}/auth-url?redirectUri=...
POST /api/{provider}/exchange-code
POST /api/{provider}/profile
POST /api/{provider}/disconnect
```

`GET /config` trả về:

```json
{
  "hasClientId": true,
  "hasClientSecret": true,
  "redirectUri": "http://localhost:3000/channel",
  "requiredScopes": ["..."]
}
```

`POST /exchange-code` nhận:

```json
{
  "code": "oauth-code",
  "redirectUri": "http://localhost:3000/channel"
}
```

Và trả về token metadata cần lưu:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": "2026-06-04T12:00:00.000Z"
}
```

`POST /profile` trả về profile để thêm vào shared channel menu:

```json
{
  "id": "provider-account-id",
  "name": "Channel name",
  "handle": "@handle",
  "url": "https://...",
  "thumbnailUrl": "https://..."
}
```

## Biến Môi Trường Đề Xuất

TikTok:

```txt
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/channel
```

Facebook:

```txt
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:3000/channel
```

Instagram:

```txt
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:3000/channel
```

Không enable provider nếu thiếu bất kỳ biến bắt buộc nào.

## TikTok

1. Tạo app trong TikTok for Developers.
2. Khai báo redirect URI trỏ về `/channel`.
3. Xin scope cần dùng cho profile và publishing. Tối thiểu cần profile/account scope để lấy danh tính kênh.
4. Backend tạo auth URL, exchange code lấy token, sau đó lấy profile.
5. Frontend chỉ thêm kênh sau khi profile hợp lệ.

Cần lưu ý: TikTok publishing API và scope có thể cần app review. Nếu chỉ có OAuth profile thì provider có thể connect được, nhưng tab upload nên hiển thị thông báo "not supported yet" cho đến khi có API publish.

## Facebook

1. Tạo app trong Meta Developers.
2. Cấu hình OAuth redirect URI về `/channel`.
3. Xin permission cho Page management/publishing theo nhu cầu.
4. Sau khi exchange code, lấy danh sách Pages người dùng có quyền quản lý.
5. Mỗi Page được xem là một channel riêng trong workspace.

Nên lưu Page access token và Page ID, không chỉ lưu user token.

## Instagram

1. Dùng Meta app và kết nối Instagram Business/Creator account.
2. Cấu hình redirect URI về `/channel`.
3. Xin permission Instagram Graph API phù hợp.
4. Sau OAuth, lấy Facebook Pages, tìm Instagram Business Account gắn với Page.
5. Mỗi Instagram Business Account được xem là một channel riêng.

Instagram publishing thường yêu cầu account Business/Creator và asset URL công khai khi publish media.

## Frontend Wiring

Sau khi backend provider sẵn sàng:

1. Thêm API client trong `src/lib/{provider}Api.ts`.
2. Thêm hook manager tương tự `useYoutubeChannelManager`.
3. Cập nhật `buildProviderStates` trong `src/pages/YoutubePublishing.tsx` để đọc config thật.
4. Cập nhật `addProviderChannel` để gọi popup connect của provider đó.
5. Chỉ ghi vào social workspace khi popup thành công và profile đã được lấy từ server.
6. Khi xóa kênh, gọi endpoint disconnect/revoke nếu provider có hỗ trợ, sau đó mới xóa local workspace.

## Kiểm Thử

- Provider thiếu config: nút disabled, click không tạo channel.
- Provider đủ config: click mở popup/tab mới, trang `/channel` hiện tại không bị điều hướng.
- OAuth success: popup đóng, channel mới xuất hiện trong shared channel menu.
- OAuth error/close: không tạo channel.
- Delete channel: gọi disconnect provider và xóa channel khỏi workspace.
