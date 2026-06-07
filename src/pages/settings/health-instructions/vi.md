## system

Kai Studio cần chạy được backend local và ghi được file generated sau khi cài app desktop.

### Cách khắc phục

1. Đóng Kai Studio rồi mở lại từ shortcut desktop để backend đi kèm khởi động sạch.
2. Nếu Windows Firewall hỏi quyền, cho phép app truy cập localhost/private network.
3. Mở Settings -> Data và chọn thư mục có quyền ghi. Tránh `Program Files` hoặc thư mục bị bảo vệ.
4. Kiểm tra thư mục generated hiện tại: `{{GENERATED_DIR}}`.
5. Lưu settings, restart app, rồi bấm Kiểm tra lại.

## piper

Piper cần `piper.exe` và mỗi voice model phải có đủ cặp `.onnx` + `.onnx.json`.

### Cài đặt

1. Cài Piper cho Windows hoặc dùng Piper environment đã tạo sẵn.
2. Tạo thư mục model có quyền ghi, ví dụ `C:\KAI-STUDIO\models`.
3. Tải mỗi voice Piper thành hai file trùng tên: `model.onnx` và `model.onnx.json`.

### Lấy thông tin điền setting

1. Tìm đúng đường dẫn `piper.exe`, thường là `models\.venv\Scripts\piper.exe` hoặc `C:\KAI-STUDIO\piper\piper.exe`.
2. Trong Settings -> Voice, điền `PIPER_EXE` là đường dẫn `piper.exe`.
3. Trong Settings -> Data/Voice, điền `MODEL_DIR` là thư mục chứa model.
4. Bấm Kiểm tra lại và xác nhận đủ `{{MODEL_COUNT}}` model đang khai báo.

```txt
PIPER_EXE={{PIPER_EXE}}
MODEL_DIR=C:\KAI-STUDIO\models
```

## applio

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
5. Copy giá trị `api_name` thật và điền vào `RVC_APPLIO_API_NAME`. Giá trị thường gặp là `/infer_convert`, nhưng bản Applio của bạn có thể khác hoặc không expose endpoint này.
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
RVC_APPLIO_API_NAME=/infer_convert
ttsTemplates[].apiName=/infer_tts
```

## supertonic

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

## vieneu

VieNeu chạy qua Python environment được cấu hình. Health kiểm tra Python, bridge script và SDK `vieneu` có import được không.

### Cài đặt

1. Cài Python phù hợp với VieNeu.
2. Tạo virtual environment riêng, ví dụ `C:\KAI-STUDIO\vieneu\.venv`.
3. Cài VieNeu vào environment đó bằng chính `python.exe` của environment.

```bat
{{VIENEU_PYTHON}} -m pip install vieneu --extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/
```

### Lấy thông tin điền setting

1. Trong Settings -> Voice -> VieNeu, điền `VIENEU_PYTHON` là `.venv\Scripts\python.exe`.
2. Chọn `VIENEU_MODE`: dùng `turbo` hoặc `standard` cho SDK local.
3. Chỉ dùng `remote` nếu bạn có endpoint VieNeu kiểu OpenAI-compatible.
4. Nếu clone giọng, chọn `VIENEU_REFERENCE_AUDIO` và điền `VIENEU_REFERENCE_TEXT` là transcript của audio tham chiếu.
5. Điền `VIENEU_TIMEOUT_MS=1200000` nếu máy load model chậm.

## elevenlabs

ElevenLabs là cloud TTS provider. Health kiểm tra API key có gọi được `/v1/user` mà không tạo audio.

### Lấy API key và voice ID

1. Mở dashboard ElevenLabs.
2. Tạo hoặc copy API key trong profile/developer settings.
3. Trong Kai Studio, mở Settings -> API Key và dán vào `ELEVENLABS_API_KEY`.
4. Mở Voice Library hoặc VoiceLab, copy voice ID của từng giọng muốn dùng.
5. Thêm voice ID vào danh sách ElevenLabs voices.

### Kiểm tra

1. Health dùng endpoint `/v1/user`.
2. Khi tạo audio, Kai Studio dùng `/v1/text-to-speech/{voiceId}`.
3. Nếu `/v1/user` fail, kiểm tra key, quota tài khoản và internet/proxy.

```txt
ELEVENLABS_API_KEY=<your secret key>
ELEVENLABS_VOICES=[{"id":"voice_id","label":"Voice label"}]
```
