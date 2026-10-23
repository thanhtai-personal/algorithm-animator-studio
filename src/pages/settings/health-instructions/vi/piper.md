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
