Applio/RVC là app Gradio local chạy riêng. Kai Studio cần URL, Python environment và đúng các giá trị Gradio `api_name`.

### Cài đặt

1. Cài Applio vào thư mục ổn định, ví dụ `C:\TOOLS\ApplioV3.6.2`.
2. Chạy Applio bằng file `.bat`, ví dụ `run-applio.bat`.
3. Giữ tab Gradio của Applio đang mở trong browser.
4. Cài `gradio_client` vào đúng Python mà Applio dùng.

```bat
{{APPLIO_START_COMMAND}}
{{APPLIO_PYTHON}} -m pip install -U gradio_client
```

### Lấy thông tin điền setting

1. Copy URL trên browser của Applio, thường là `http://127.0.0.1:6969`.
2. Điền `RVC_APPLIO_BASE_URL` bằng URL đó.
3. Điền `RVC_APPLIO_START_COMMAND` bằng đường dẫn file `.bat` khởi động Applio.
4. Điền `RVC_APPLIO_PYTHON` bằng Python mà Applio dùng. Nếu Applio có `env\Scripts\python.exe`, dùng đường dẫn đó thay vì Python hệ thống.

### Lấy api_name cho voice-to-voice

1. Trong Applio, mở tab inference/convert.
2. Chọn voice model `.pth` và index `.index`.
3. Mở `http://127.0.0.1:6969/config` trên browser, đổi host/port nếu bạn dùng URL khác.
4. Tìm object trong `dependencies` có input/output tương ứng khối convert voice của tab Inference.
5. Copy giá trị `api_name` thật và điền vào `RVC_APPLIO_API_NAME`. Với config Applio hiện tại, voice-to-voice dùng `/enforce_terms`.
6. Copy đúng thứ tự tham số từ dependency đó vào `convertTemplates[].argTemplate` trong Settings -> Voice -> Applio templates.

### Lấy api_name cho Applio TTS

1. Trong Applio, mở tab TTS.
2. Chọn TTS voice, ví dụ `vi-VN-HoaiMyNeural` hoặc `vi-VN-NamMinhNeural`.
3. Mở `http://127.0.0.1:6969/config` trên browser.
4. Tìm dependency có input text, TTS voice và TTS speed của tab TTS.
5. Copy `api_name` và đúng thứ tự argument.
6. Mở Settings -> Voice -> Applio templates và cập nhật `ttsTemplates[].apiName` cùng `argTemplate`.

### Endpoint đang fail

`{{FAILED_APIS}}`

Nếu endpoint trên không có trong `/config`, hãy thay bằng `api_name` thật trong `dependencies`. Nếu bản Applio không expose API đó, xoá hoặc tắt template tương ứng.

```txt
RVC_APPLIO_BASE_URL={{APPLIO_BASE_URL}}
RVC_APPLIO_API_NAME=/enforce_terms
ttsTemplates[].apiName=/enforce_terms_2
```
