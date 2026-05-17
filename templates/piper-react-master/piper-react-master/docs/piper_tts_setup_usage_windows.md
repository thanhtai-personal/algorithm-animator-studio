# Hướng dẫn cài đặt và sử dụng Piper TTS trên Windows

Tài liệu này ghi lại quy trình setup **Piper TTS** để chuyển văn bản thành file audio `.wav` / `.mp3` trên máy cá nhân Windows.

Mục tiêu:

```text
Text truyện
→ Piper TTS chạy local
→ output.wav
→ FFmpeg convert sang MP3
→ CapCut/Premiere ghép ảnh, nhạc, subtitle
→ xuất video YouTube
```

---

## 1. Kiểm tra Python

Mở **CMD** hoặc **PowerShell**:

```cmd
py --version
```

Ví dụ máy đang có:

```cmd
Python 3.13.7
```

Nếu máy chưa có Python, có thể cài bằng:

```cmd
winget install Python.Python.3.12
```

Sau khi cài, đóng terminal và mở lại.

---

## 2. Cấu trúc thư mục khuyên dùng

Ví dụ dự án của mình:

```text
C:\DATA\working\videos\truyen-audio
│
├── models
│   ├── .venv
│   ├── vi_VN-vais1000-medium.onnx
│   ├── vi_VN-vais1000-medium.onnx.json
│   ├── vi_VN-25hours_single-low.onnx
│   ├── vi_VN-25hours_single-low.onnx.json
│   ├── vi_VN-vivos-x_low.onnx
│   ├── vi_VN-vivos-x_low.onnx.json
│   ├── en_US-lessac-medium.onnx
│   ├── en_US-lessac-medium.onnx.json
│   ├── en_US-ryan-medium.onnx
│   └── en_US-ryan-medium.onnx.json
│
└── audio-tests
    ├── input.txt
    ├── input_clean.txt
    ├── input_en.txt
    ├── output.wav
    ├── output_25hours.wav
    ├── output_vivos.wav
    └── output_en_ryan.wav
```

Có thể tạo thư mục:

```cmd
mkdir C:\DATA\working\videos\truyen-audio
cd C:\DATA\working\videos\truyen-audio
mkdir models
mkdir audio-tests
```

---

## 3. Tạo môi trường ảo Python

Đi vào thư mục `models`:

```cmd
cd C:\DATA\working\videos\truyen-audio\models
```

Tạo virtual environment:

```cmd
py -m venv .venv
```

Kích hoạt trong **CMD**:

```cmd
.venv\Scripts\activate.bat
```

Sau khi kích hoạt, terminal sẽ có dạng:

```cmd
(.venv) C:\DATA\working\videos\truyen-audio\models>
```

> Lưu ý:
>
> - Trong **CMD**, dùng `activate.bat`.
> - Trong **PowerShell**, dùng `Activate.ps1`.
> - Nếu đang dùng CMD mà chạy `.ps1`, Windows có thể hiện popup “Select an app to open this .ps1 file”. Đó là do chạy sai môi trường.

---

## 4. Cài Piper TTS

Trong môi trường ảo:

```cmd
python -m pip install --upgrade pip
python -m pip install piper-tts
```

Kiểm tra Piper:

```cmd
piper --help
```

Nếu không nhận lệnh `piper`, thử:

```cmd
python -m piper --help
```

---

## 5. Tải model tiếng Việt

Đi vào thư mục `models`:

```cmd
cd C:\DATA\working\videos\truyen-audio\models
```

### 5.1. Model `vi_VN-vais1000-medium`

Đây là model tiếng Việt nên thử đầu tiên.

```cmd
curl -L -o vi_VN-vais1000-medium.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx"
```

```cmd
curl -L -o vi_VN-vais1000-medium.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx.json"
```

### 5.2. Model `vi_VN-25hours_single-low`

```cmd
curl -L -o vi_VN-25hours_single-low.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx"
```

```cmd
curl -L -o vi_VN-25hours_single-low.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx.json"
```

### 5.3. Model `vi_VN-vivos-x_low`

```cmd
curl -L -o vi_VN-vivos-x_low.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx"
```

```cmd
curl -L -o vi_VN-vivos-x_low.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx.json"
```

Kiểm tra file:

```cmd
dir vi_VN-*.onnx
```

Mỗi model cần đủ 2 file:

```text
*.onnx
*.onnx.json
```

Nếu thiếu file `.onnx.json`, Piper có thể lỗi hoặc không đọc được voice.

---

## 6. Tải model tiếng Anh

Tiếng Anh có nhiều model hơn tiếng Việt, chất lượng thường ổn hơn.

Đi vào thư mục `models`:

```cmd
cd C:\DATA\working\videos\truyen-audio\models
```

### 6.1. Giọng `en_US-lessac-medium`

```cmd
curl -L -o en_US-lessac-medium.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx"
```

```cmd
curl -L -o en_US-lessac-medium.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json"
```

### 6.2. Giọng `en_US-ryan-medium`

```cmd
curl -L -o en_US-ryan-medium.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx"
```

```cmd
curl -L -o en_US-ryan-medium.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json"
```

### 6.3. Giọng `en_US-libritts_r-medium`

```cmd
curl -L -o en_US-libritts_r-medium.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx"
```

```cmd
curl -L -o en_US-libritts_r-medium.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json"
```

Kiểm tra:

```cmd
dir en_US-*.onnx
```

---

## 7. Tạo file text test tiếng Việt

Đi vào thư mục test:

```cmd
cd C:\DATA\working\videos\truyen-audio\audio-tests
```

Tạo file:

```cmd
notepad input.txt
```

Dán nội dung:

```text
Đêm ấy, mưa rơi trắng núi.
Trần Mặc đứng trước cổng tông môn, trong tay chỉ còn một thanh kiếm gãy.
Hắn từng nghĩ mình sinh ra để làm kẻ tầm thường.
Nhưng khi giọt máu đầu tiên rơi xuống chuôi kiếm, cả trời đất bỗng im lặng.
```

Lưu file ở dạng UTF-8.

---

## 8. Chạy Piper đọc tiếng Việt

### 8.1. Cách không khuyên dùng với CMD

Lệnh này đôi khi bị lỗi encoding tiếng Việt:

```cmd
type input.txt | piper --model ..\models\vi_VN-vais1000-medium.onnx --output_file output.wav
```

Nếu gặp lỗi kiểu:

```text
UnicodeEncodeError: 'utf-8' codec can't encode character ...
```

thì nên dùng PowerShell như phần dưới.

### 8.2. Cách khuyên dùng: CMD gọi PowerShell đọc UTF-8

Đứng trong thư mục `audio-tests`:

```cmd
cd C:\DATA\working\videos\truyen-audio\audio-tests
```

Chạy:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output.wav"
```

Mở file nghe:

```cmd
start output.wav
```

---

## 9. Piper đọc dấu chấm thành “chấm” thì xử lý thế nào?

Một số model tiếng Việt có thể đọc dấu `.` thành chữ **“chấm”** thay vì ngắt câu.

Cách xử lý thực tế:

```text
Không đưa dấu chấm trực tiếp vào Piper
→ đổi dấu . ! ? thành xuống dòng
→ dùng --sentence_silence để tạo khoảng nghỉ
```

Tạo file sạch:

```cmd
notepad input_clean.txt
```

Dán nội dung dạng mỗi câu một dòng, bỏ dấu chấm cuối câu:

```text
Đêm ấy, mưa rơi trắng núi

Trần Mặc đứng trước cổng tông môn, trong tay chỉ còn một thanh kiếm gãy

Hắn từng nghĩ mình sinh ra để làm kẻ tầm thường

Nhưng khi giọt máu đầu tiên rơi xuống chuôi kiếm, cả trời đất bỗng im lặng
```

Chạy Piper:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output_clean.wav"
```

Mở nghe:

```cmd
start output_clean.wav
```

---

## 10. Script tự làm sạch text tiếng Việt

Tạo file:

```cmd
notepad clean_text.py
```

Dán code:

```python
from pathlib import Path
import re

input_path = Path("input.txt")
output_path = Path("input_clean.txt")

text = input_path.read_text(encoding="utf-8")

# Chuẩn hóa một số dấu đặc biệt
text = text.replace("…", ".")
text = text.replace("。", ".")
text = text.replace("，", ",")
text = text.replace("“", '"').replace("”", '"')
text = text.replace("‘", "'").replace("’", "'")

# Đổi dấu kết câu thành xuống dòng để Piper nghỉ
text = re.sub(r"[.!?]+", "\n", text)

# Đổi dấu chấm phẩy, hai chấm thành dấu phẩy nhẹ
text = re.sub(r"[;:]+", ",", text)

# Xóa các ký tự dễ bị đọc thành chữ hoặc gây lỗi
text = re.sub(r"[\"'()\[\]{}<>*_#|\\/]", " ", text)

# Dọn khoảng trắng
lines = []
for line in text.splitlines():
    line = re.sub(r"\s+", " ", line).strip()
    if line:
        lines.append(line)

output_path.write_text("\n".join(lines), encoding="utf-8")

print(f"Đã tạo {output_path}")
```

Chạy:

```cmd
python clean_text.py
```

Sau đó tạo audio:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output.wav"
```

---

## 11. Test các model tiếng Việt

### 11.1. Test `vi_VN-vais1000-medium`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output_vais1000.wav"
```

```cmd
start output_vais1000.wav
```

### 11.2. Test `vi_VN-25hours_single-low`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-25hours_single-low.onnx' --sentence_silence 0.6 --output_file output_25hours.wav"
```

```cmd
start output_25hours.wav
```

Nếu thấy warning kiểu:

```text
WARNING:piper.phoneme_ids:Missing phoneme from id map
```

thì chưa chắc là lỗi. Hãy mở file WAV nghe thử. Nếu có file và nghe được thì Piper đã chạy xong, chỉ là model không map hoàn hảo một số âm.

### 11.3. Test `vi_VN-vivos-x_low`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vivos-x_low.onnx' --sentence_silence 0.6 --output_file output_vivos.wav"
```

```cmd
start output_vivos.wav
```

---

## 12. Test model tiếng Anh

Tạo file:

```cmd
notepad input_en.txt
```

Dán nội dung:

```text
That night, the rain fell across the ancient mountains.

A young disciple stood before the broken gate of the immortal sect.

In his hand was an old sword, covered in rust and silence.

He did not know that the sword had once sealed a demon god for ten thousand years.
```

### 12.1. Test `en_US-lessac-medium`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_en.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\en_US-lessac-medium.onnx' --sentence_silence 0.6 --output_file output_en_lessac.wav"
```

```cmd
start output_en_lessac.wav
```

### 12.2. Test `en_US-ryan-medium`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_en.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\en_US-ryan-medium.onnx' --sentence_silence 0.7 --output_file output_en_ryan.wav"
```

```cmd
start output_en_ryan.wav
```

### 12.3. Test `en_US-libritts_r-medium`

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_en.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\en_US-libritts_r-medium.onnx' --sentence_silence 0.7 --output_file output_en_libritts.wav"
```

```cmd
start output_en_libritts.wav
```

---

## 13. Chỉnh khoảng nghỉ câu

Tham số:

```cmd
--sentence_silence 0.6
```

Gợi ý:

```text
0.3  → nghỉ ngắn
0.5  → khá tự nhiên
0.6  → ổn cho kể chuyện
0.8  → chậm, có không khí hơn
0.9  → rất chậm, hợp đoạn bi tráng/cao trào
```

Với truyện tiên hiệp, nên thử:

```text
--sentence_silence 0.6 đến 0.8
```

---

## 14. Chuyển WAV sang MP3 bằng FFmpeg

Piper thường xuất `.wav`. WAV dùng được trong CapCut/Premiere, nhưng file khá nặng. Có thể chuyển sang `.mp3`.

Cài FFmpeg:

```cmd
winget install Gyan.FFmpeg
```

Đóng terminal, mở lại, kiểm tra:

```cmd
ffmpeg -version
```

Convert WAV sang MP3:

```cmd
ffmpeg -i output.wav -codec:a libmp3lame -q:a 2 output.mp3
```

Mở file MP3:

```cmd
start output.mp3
```

---

## 15. Hạ pitch để giọng trầm hơn

Nếu model tiếng Việt nghe hơi nữ/quá mỏng, có thể hạ pitch bằng FFmpeg.

Ví dụ:

```cmd
ffmpeg -i output.wav -filter:a "asetrate=22050*0.92,aresample=22050,atempo=1.087" output_lower_pitch.wav
```

Mở nghe:

```cmd
start output_lower_pitch.wav
```

Nếu muốn trầm hơn nữa:

```cmd
ffmpeg -i output.wav -filter:a "asetrate=22050*0.88,aresample=22050,atempo=1.136" output_male_like.wav
```

> Lưu ý: cách này chỉ làm giọng trầm hơn, không biến thành giọng nam thật. Nếu muốn giọng nam tự nhiên hoặc clone giọng, nên dùng Vbee/ElevenLabs/FPT/Viettel AI.

---

## 16. Các lỗi thường gặp

### 16.1. Lỗi không tìm thấy model

Lỗi:

```text
ValueError: Unable to find voice: models\vi_VN-vais1000-medium.onnx
```

Nguyên nhân: sai đường dẫn model.

Nếu đang đứng ở:

```text
C:\DATA\working\videos\truyen-audio\audio-tests
```

thì model nằm ở:

```text
..\models\vi_VN-vais1000-medium.onnx
```

Lệnh đúng:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output.wav"
```

Hoặc dùng đường dẫn tuyệt đối:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & 'C:\DATA\working\videos\truyen-audio\models\.venv\Scripts\piper.exe' --model 'C:\DATA\working\videos\truyen-audio\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output.wav"
```

### 16.2. Lỗi encoding tiếng Việt

Lỗi:

```text
UnicodeEncodeError: 'utf-8' codec can't encode character ...
```

Nguyên nhân: CMD đọc tiếng Việt bằng `type input.txt` bị sai encoding.

Không nên dùng:

```cmd
type input.txt | piper ...
```

Nên dùng:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.6 --output_file output.wav"
```

### 16.3. Lỗi `wave.Error: # channels not specified`

Lỗi:

```text
wave.Error: # channels not specified
```

Thường là lỗi phụ sau khi Piper crash trước đó, ví dụ do:

- file input không tồn tại;
- lỗi encoding;
- model không tìm thấy;
- Piper không nhận được text.

Cách xử lý:

```cmd
del output.wav
```

Sau đó sửa lỗi chính rồi chạy lại.

### 16.4. Lỗi không tìm thấy `input_clean.txt`

Lỗi:

```text
Cannot find path ... input_clean.txt because it does not exist.
```

Nguyên nhân: chưa tạo file `input_clean.txt`.

Tạo bằng:

```cmd
notepad input_clean.txt
```

Hoặc chạy script:

```cmd
python clean_text.py
```

### 16.5. Warning `Missing phoneme from id map`

Thông báo:

```text
WARNING:piper.phoneme_ids:Missing phoneme from id map
```

Đây thường là warning, không nhất thiết là lỗi. Hãy kiểm tra file WAV:

```cmd
dir output_25hours.wav
start output_25hours.wav
```

Nếu nghe được, có thể bỏ qua. Nếu đọc quá tệ, đổi model khác.

---

## 17. Lệnh dùng nhanh hằng ngày

### 17.1. Tạo audio tiếng Việt từ `input_clean.txt`

```cmd
cd C:\DATA\working\videos\truyen-audio\audio-tests
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_clean.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\vi_VN-vais1000-medium.onnx' --sentence_silence 0.7 --output_file output.wav"
```

### 17.2. Convert sang MP3

```cmd
ffmpeg -i output.wav -codec:a libmp3lame -q:a 2 output.mp3
```

### 17.3. Tạo audio tiếng Anh bằng giọng `ryan`

```cmd
cd C:\DATA\working\videos\truyen-audio\audio-tests
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content .\input_en.txt -Raw -Encoding UTF8 | & '..\models\.venv\Scripts\piper.exe' --model '..\models\en_US-ryan-medium.onnx' --sentence_silence 0.7 --output_file output_en_ryan.wav"
```

---

## 18. Gợi ý dùng cho kênh truyện

Với truyện audio tiếng Việt, Piper phù hợp để:

- test workflow text → audio;
- tạo nháp audio;
- làm demo;
- chạy local/offline không tốn phí API.

Nhưng nếu cần giọng thật sự hay, có cảm xúc, hoặc clone giọng của mình, nên cân nhắc:

```text
Vbee Voice Cloning
ElevenLabs
FPT.AI Voice Maker
Viettel AI TTS
```

Gợi ý workflow kênh:

```text
1. Viết/tóm tắt truyện
2. Làm sạch text bằng clean_text.py
3. Piper xuất WAV
4. FFmpeg convert MP3
5. CapCut ghép ảnh + nhạc nền + subtitle
6. Xuất MP4
7. Đăng YouTube/Facebook/TikTok
```

---

## 19. Ghi nhớ nhanh

```text
Piper cần đủ 2 file:
- model.onnx
- model.onnx.json

Tiếng Việt nên đọc bằng PowerShell UTF-8:
Get-Content -Raw -Encoding UTF8

Không nên pipe tiếng Việt bằng CMD:
type input.txt | piper ...

Nếu Piper đọc dấu chấm thành "chấm":
- đổi dấu câu thành xuống dòng
- dùng --sentence_silence

Nếu báo wave.Error:
- đó thường là lỗi phụ
- xem lỗi phía trên mới là nguyên nhân chính
```
