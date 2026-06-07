# RVC/Applio local voice provider cho KAI STUDIO

Tài liệu này hướng dẫn tích hợp provider **RVC/Applio local** để clone/chuyển giọng bản thân miễn phí theo workflow:

```txt
Kịch bản long content
→ Piper local tạo giọng nguồn theo từng scene
→ RVC/Applio local chuyển từng đoạn sang model giọng custom
→ backend ghép WAV cuối cùng
→ nhúng voice-over vào video export
```

Provider này khác với Supertonic custom JSON. Supertonic cần voice JSON riêng, còn RVC/Applio dùng model `.pth` + optional `.index` đã train bằng giọng của bạn.

---

## 1. Cài Applio/RVC

Cách dễ nhất trên Windows:

1. Tải bản Applio precompiled hoặc cài qua Dione Launcher.
2. Giải nén vào đường dẫn đơn giản, ví dụ:

```txt
C:\Applio
```

3. Chạy:

```bat
run-applio.bat
```

Khi Applio mở UI trong browser, ghi lại URL local. Thường là một trong các dạng:

```txt
http://127.0.0.1:6969
http://127.0.0.1:7860
```

---

## 2. Train hoặc import model giọng của bạn

Trong Applio:

1. Chuẩn bị dataset giọng sạch khoảng 10–30 phút.
2. Train model theo tab **Training**.
3. Sau khi train xong, bạn cần ít nhất:

```txt
model .pth
optional index .index
```

Với speech/narration, nên bắt đầu bằng:

```txt
F0 method: rmvpe
Pitch: 0
Index rate: 0.75
Protect: 0.33
```

Hướng dẫn train chi tiết và bộ text mẫu để thu âm dataset nằm ở:

```txt
docs/applio-rvc-model-training-guide.md
```

---

## 3. Cài Python client cho bridge

Provider mới dùng `scripts/rvc-applio-gradio-bridge.py` để gọi Gradio API của Applio.

Cài trong Python đang dùng để chạy bridge:

```bash
python -m pip install -U gradio_client
```

Nếu Applio có môi trường Python riêng, có thể dùng trực tiếp Python đó:

```txt
C:\Applio\env\Scripts\python.exe
```

---

## 4. Lấy API template từ Applio

Xem hướng dẫn chi tiết và text mẫu để tạo voice tại:

```txt
docs/applio-api-template-and-voice-text.md
```

Trong UI Applio:

1. Vào tab **Inference** hoặc tab convert tương ứng.
2. Chọn model `.pth` và `.index` như khi convert thủ công.
3. Tìm nút/link **Use via API** của Gradio.
4. Copy `api_name` và danh sách tham số của `client.predict(...)`.

Sau đó đổi các giá trị file/input/model thành placeholder của KAI STUDIO.

Các placeholder hỗ trợ:

```txt
${input}         Upload file audio nguồn bằng gradio_client.handle_file
${input_path}    Đường dẫn file audio nguồn dạng text
${output}        Đường dẫn file output mong muốn
${model}         modelName trong template JSON
${model_name}    modelName trong template JSON
${index}         indexPath trong template JSON
${index_path}    indexPath trong template JSON
${pitch}         pitch trong template JSON
${f0_method}     f0Method trong template JSON
${index_rate}    indexRate trong template JSON
${protect}       protect trong template JSON
${filter_radius} filterRadius trong template JSON
```

Ví dụ template **minh họa**. Applio/RVC mỗi bản có thể khác tham số, nên hãy ưu tiên template copy từ **Use via API** của máy bạn:

```json
[0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
```

Nếu API của bạn yêu cầu model đã chọn sẵn trong UI và không nhận `${model}`, hãy bỏ tham số đó khỏi template theo đúng `Use via API`.

---

## 5. Cấu hình `.env`

Chỉ thêm hoặc sửa các biến runtime sau:

```env
# RVC/Applio local voice conversion provider
RVC_APPLIO_BASE_URL=http://127.0.0.1:6969
RVC_APPLIO_START_COMMAND=C:/Applio/run-applio.bat
RVC_APPLIO_API_NAME=/infer_convert
RVC_APPLIO_PYTHON=python
```

Model, index, pitch, f0 method, index rate, protect, filter radius và `argTemplate` nằm trong `server/data/config/rvc-applio-templates.json`. Có thể chỉnh các template này trong màn **Settings -> Voice -> Applio**.

`RVC_APPLIO_START_COMMAND` là lệnh tùy chọn được `npm run dev` chạy cùng frontend/backend/Supertonic. Nếu để trống, app không tự start Applio và bạn cần chạy Applio thủ công.

Lưu ý: tích hợp hiện tại dùng Applio/RVC để **chuyển giọng từ audio nguồn**, không phải text-to-speech trực tiếp. Hãy tạo audio trước bằng Piper, ElevenLabs hoặc Supertonic, sau đó bấm nút chuyển sang custom voice để gọi Applio.

---

## 6. Sử dụng trong Long Content Studio

1. Chạy Applio trước, hoặc cấu hình `RVC_APPLIO_START_COMMAND` để `npm run dev` tự chạy.
2. Chạy KAI STUDIO:

```bash
npm run dev
```

3. Vào **Long Content**.
4. Mở panel **Voice-over**.
5. Chọn provider tạo audio nguồn: Piper, ElevenLabs hoặc Supertonic.
6. Bấm **Tạo voice-over cho video**.
7. Khi audio đã tạo xong, bấm **Chuyển sang custom voice** để gọi Applio.

Backend sẽ xử lý file audio đã tạo:

```txt
generated audio WAV/MP3/... → RVC WAV
```

File kết quả lưu ở:

```txt
server/data/generated/rvc-applio/YYYY-MM-DD/
```

---

## 7. Lỗi thường gặp

### Missing gradio_client

Cài lại:

```bash
python -m pip install -U gradio_client
```

Hoặc trỏ `RVC_APPLIO_PYTHON` tới đúng Python env của Applio.

### Chưa cấu hình RVC_APPLIO_ARG_TEMPLATE_JSON

Mở Applio UI → **Use via API** → copy template `client.predict(...)` → chuyển sang JSON array với placeholder.

### Server chưa kết nối

Kiểm tra:

```txt
RVC_APPLIO_BASE_URL
```

Mở URL đó trên browser. Nếu không vào được, Applio chưa chạy hoặc khác port.

### Output không có file audio

Nguyên nhân thường là template sai thứ tự tham số. Chạy thử convert thủ công trong Applio, sau đó copy lại **Use via API** đúng tab/function đang dùng.

### Giọng bị rè/robot

Thử:

```txt
F0 method: rmvpe
Pitch: 0
Index rate: 0.5–0.8
Protect: 0.33–0.5
Nguồn Piper đọc chậm hơn: speechRate 0.9–0.96
```

---

## 8. Ghi chú pháp lý

Chỉ train/convert giọng của chính bạn hoặc người đã cho phép. Nếu dùng đăng YouTube/kiếm tiền, nên ghi rõ nội dung có sử dụng AI voice khi nền tảng yêu cầu.
