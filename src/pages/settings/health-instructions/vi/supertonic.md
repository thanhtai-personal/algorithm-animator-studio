Supertonic là TTS server local. Health cần pass `/v1/health` và `/v1/styles` trước khi Kai Studio tạo audio.

### Cài đặt

1. Cài package/server Supertonic trên máy này.
2. Trong repo này, lệnh cài dự kiến là `npm run supertonic:install`.
3. Khởi động server bằng `npm run supertonic:serve` hoặc lệnh đi kèm bản app đóng gói.

```bat
npm run supertonic:install
npm run supertonic:serve
```

### Lấy thông tin điền setting

1. Mở base URL trên browser, thường là `http://127.0.0.1:6688`.
2. Kiểm tra `{{SUPERTONIC_BASE_URL}}{{SUPERTONIC_HEALTH_ENDPOINT}}` trả JSON.
3. Kiểm tra `{{SUPERTONIC_BASE_URL}}{{SUPERTONIC_STYLES_ENDPOINT}}` trả danh sách voice/style.
4. Trong Settings -> Voice -> Supertonic, điền `SUPERTONIC_BASE_URL` và các endpoint đang dùng.
5. Nếu styles trống, import Supertonic voice/style JSON hoặc load model có voice.

```txt
SUPERTONIC_HEALTH_ENDPOINT={{SUPERTONIC_HEALTH_ENDPOINT}}
SUPERTONIC_STYLES_ENDPOINT={{SUPERTONIC_STYLES_ENDPOINT}}
SUPERTONIC_IMPORT_STYLE_ENDPOINT={{SUPERTONIC_IMPORT_STYLE_ENDPOINT}}
SUPERTONIC_TTS_ENDPOINT={{SUPERTONIC_TTS_ENDPOINT}}
```
