# Applio API template và text tạo voice

Tài liệu này hướng dẫn cách điền Applio templates cho KAI STUDIO qua file `server/data/config/rvc-applio-templates.json`, đồng thời cung cấp bộ text mẫu phù hợp để tạo audio nguồn trước khi chuyển sang custom voice bằng Applio/RVC.

Applio trong app này là bước **voice-to-voice**:

```txt
Text kịch bản
→ Piper / ElevenLabs / Supertonic tạo audio nguồn
→ Applio/RVC convert audio nguồn sang custom voice
→ App dùng file audio đã convert để preview hoặc export video
```

Mỗi template phải tự khai báo `argTemplate`. App không còn dùng fallback template trong `.env`.

---

## 1. Mục tiêu của API template

Trong Settings → Voice → Applio, field **Applio voice templates** được lưu vào:

```txt
server/data/config/rvc-applio-templates.json
```

Trong file này, `convertTemplates` là JSON array, mỗi item là một voice/template có thể chọn khi bấm **Chuyển sang custom voice**.

Mỗi `argTemplate` là một JSON array mô phỏng danh sách tham số truyền vào `client.predict(...)` của Gradio/Applio.

Nếu muốn dùng Applio như một provider tạo voice độc lập từ text, điền `ttsTemplates`. Array này dành cho tab **Text to Speech** của Applio. App sẽ gửi text trực tiếp sang Applio, Applio dùng EdgeTTS làm giọng nguồn rồi RVC chuyển sang voice model đã chọn nếu template có model/index.

Ví dụ minh họa:

```json
[0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
```

Mỗi bản Applio có thể khác thứ tự tham số, nên không nên copy máy móc ví dụ trên. Cách đúng là lấy template từ **Use via API** trong chính UI Applio của bạn.

---

## 2. Cách lấy template từ Applio UI

1. Chạy Applio server.
2. Mở Applio trên browser, ví dụ:

```txt
http://127.0.0.1:6969
```

3. Vào tab convert/inference đang dùng để chuyển giọng.
4. Chọn model `.pth`, `.index`, pitch, F0 method, protect, index rate giống lúc convert thủ công.
5. Tìm nút hoặc link **Use via API** của Gradio.
6. Copy đoạn `client.predict(...)`.

Ví dụ Gradio có thể hiển thị gần giống:

```python
client.predict(
    0,
    handle_file("C:/input/source.wav"),
    "my_voice.pth",
    "C:/Applio/logs/my_voice/added_IVF123.index",
    "rmvpe",
    0.75,
    3,
    0,
    0.25,
    0.33,
    "wav",
    api_name="/infer_convert"
)
```

Bạn cần lấy:

- `api_name`: điền vào `apiName` của template.
- danh sách tham số trước `api_name`: chuyển thành `argTemplate` của template.

---

## 3. Cách chuyển `client.predict(...)` thành JSON template

Từ ví dụ trên:

```python
client.predict(
    0,
    handle_file("C:/input/source.wav"),
    "my_voice.pth",
    "C:/Applio/logs/my_voice/added_IVF123.index",
    "rmvpe",
    0.75,
    3,
    0,
    0.25,
    0.33,
    "wav",
    api_name="/infer_convert"
)
```

Chuyển thành JSON array:

```json
[0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
```

Điền JSON này vào `argTemplate` của một item trong Settings → Voice → Applio → **Applio voice templates**.

---

## 4. Placeholder được app hỗ trợ

| Placeholder | Ý nghĩa |
| --- | --- |
| `${input}` | File audio nguồn, được gửi bằng `gradio_client.handle_file(...)`. Đây là lựa chọn nên dùng cho input audio. |
| `${input_path}` | Đường dẫn file audio nguồn dạng text. Chỉ dùng nếu API Applio của bạn yêu cầu string path thay vì file upload. |
| `${output}` | Đường dẫn output mong muốn. Chỉ dùng nếu API của bạn có tham số output path. |
| `${text}` | Text kịch bản gửi vào tab Text to Speech của Applio. |
| `${model}` | Giá trị `RVC_APPLIO_MODEL_NAME`. |
| `${model_name}` | Giống `${model}`. |
| `${index}` | Giá trị `RVC_APPLIO_INDEX_PATH`. |
| `${index_path}` | Giống `${index}`. |
| `${pitch}` | Giá trị `RVC_APPLIO_PITCH`. |
| `${f0_method}` | Giá trị `RVC_APPLIO_F0_METHOD`, thường là `rmvpe`. |
| `${index_rate}` | Giá trị `RVC_APPLIO_INDEX_RATE`, thường 0.5-0.8. |
| `${protect}` | Giá trị `RVC_APPLIO_PROTECT`, thường 0.33-0.5. |
| `${filter_radius}` | Giá trị `RVC_APPLIO_FILTER_RADIUS`, thường là 3. |
| `${tts_voice}` | Voice nguồn EdgeTTS trong Applio, ví dụ `en-US-SteffanNeural`. |
| `${tts_speed}` | Tốc độ TTS của Applio, thường từ `-100` đến `100`. |
| `${speed}` | Giống `${tts_speed}` nếu API của Applio đặt tên tham số là speed. |

Các giá trị không cần thay đổi có thể để cố định trong JSON, ví dụ `0`, `0.25`, `"wav"`.

---

## 5. Ví dụ cấu hình nhiều template

Paste vào `convertTemplates` trong Settings:

```json
[
  {
    "id": "male-news",
    "label": "Nam đọc news",
    "apiName": "/infer_convert",
    "modelName": "male_news.pth",
    "indexPath": "C:/TOOLS/ApplioV3.6.2/logs/male_news/added.index",
    "pitch": 0,
    "f0Method": "rmvpe",
    "indexRate": 0.75,
    "protect": 0.33,
    "filterRadius": 3,
    "argTemplate": [0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
  },
  {
    "id": "female-story",
    "label": "Nữ đọc truyện",
    "apiName": "/infer_convert",
    "modelName": "female_story.pth",
    "indexPath": "C:/TOOLS/ApplioV3.6.2/logs/female_story/added.index",
    "pitch": 0,
    "f0Method": "rmvpe",
    "indexRate": 0.65,
    "protect": 0.45,
    "filterRadius": 3,
    "argTemplate": [0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
  }
]
```

Các field trong mỗi template:

- `id`: mã ổn định, không dấu, dùng để app gửi khi convert.
- `label`: tên hiển thị trong dropdown chọn custom voice.
- `apiName`: giá trị `api_name` từ Use via API.
- `modelName`: tên model `.pth` truyền vào Applio nếu API cần.
- `indexPath`: đường dẫn file `.index`, có thể để rỗng nếu API/model không cần.
- `pitch`, `f0Method`, `indexRate`, `protect`, `filterRadius`: tham số convert mặc định của template.
- `argTemplate`: JSON array tham số Gradio. Có thể dùng `argTemplateJson` nếu muốn lưu array dưới dạng string.

---

## 6. Ví dụ cấu hình một template convert

Nếu model đã được chọn sẵn trong UI Applio và `Use via API` không có tham số model/index, hãy bỏ `${model}` hoặc `${index}` khỏi template. Template phải khớp đúng thứ tự tham số mà `Use via API` đưa ra.

---

## 7. Ví dụ cấu hình Applio Text-to-Speech

Trong Applio, mở tab **Text to Speech**, chọn voice model, index file, TTS voice, chỉnh TTS speed, sau đó bấm **Use via API**. Copy đúng `api_name` và thứ tự tham số của `client.predict(...)`.

Ví dụ minh họa:

```json
[
  {
    "id": "my-voice-tts",
    "label": "Giọng của tôi - Applio TTS",
    "apiName": "/infer_tts",
    "modelName": "my_voice.pth",
    "indexPath": "C:/TOOLS/ApplioV3.6.2/logs/my_voice/added.index",
    "ttsVoice": "en-US-SteffanNeural",
    "ttsSpeed": 0,
    "f0Method": "rmvpe",
    "indexRate": 0.65,
    "protect": 0.45,
    "filterRadius": 3,
    "argTemplate": ["${text}", "${tts_voice}", "${tts_speed}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${protect}", "${filter_radius}"]
  }
]
```

Paste template TTS vào `ttsTemplates` trong Settings.

Lưu ý: `apiName` và `argTemplate` ở trên chỉ là ví dụ. Nếu Applio của bạn dùng endpoint hoặc thứ tự tham số khác, hãy dùng đúng nội dung trong **Use via API** của máy bạn.

---

## 8. Cách kiểm tra template

1. Settings → Health Check.
2. Kiểm tra:

```txt
Applio server       xanh
Applio Python       xanh
Applio API template xanh
```

3. Tạo audio nguồn bằng Piper/ElevenLabs/Supertonic.
4. Nếu dùng convert template, tạo audio nguồn rồi bấm **Chuyển sang custom voice**.
5. Nếu dùng TTS template, chọn provider **Applio TTS/RVC** trong app rồi bấm tạo voice.

Nếu lỗi:

- `Applio API template` chưa xanh: chưa điền `convertTemplates` hoặc `ttsTemplates` trong `server/data/config/rvc-applio-templates.json`.
- Không thấy provider Applio tạo voice được: chưa điền `ttsTemplates` trong `server/data/config/rvc-applio-templates.json`.
- `Python bridge RVC/Applio thất bại`: kiểm tra `RVC_APPLIO_PYTHON` và package `gradio_client`.
- `result did not contain a downloadable audio file`: API trả về format khác, cần copy lại đúng `Use via API`.
- Giọng bị rè: giảm `index_rate`, tăng `protect`, dùng nguồn đọc chậm và rõ hơn.

---

## 9. Bộ text tiếng Việt để tạo voice nguồn

Dùng text này để tạo audio bằng Piper/ElevenLabs/Supertonic, sau đó chuyển bằng Applio. Text cố tình có câu ngắn, câu dài, số, dấu câu, tên riêng và nhiều âm tiếng Việt để kiểm tra độ rõ.

```txt
Xin chào, đây là bài kiểm tra giọng đọc cho hệ thống tạo video tự động.

Hôm nay chúng ta sẽ thử một đoạn thuyết minh rõ ràng, tốc độ vừa phải, nhấn nhá tự nhiên và dễ nghe. Mục tiêu là tạo ra một file audio nguồn sạch, sau đó chuyển sang custom voice bằng Applio.

Trong một trận bóng đá, khoảnh khắc quan trọng thường đến rất nhanh. Một đường chuyền chính xác, một pha bứt tốc bên cánh trái, hoặc một cú dứt điểm ở phút chín mươi có thể thay đổi toàn bộ cục diện trận đấu.

Manchester United đang gây áp lực ở khu vực giữa sân. Bruno Fernandes nhận bóng, quan sát rất nhanh, rồi mở sang cánh phải. Hậu vệ đối phương lùi về, nhưng khoảng trống đã xuất hiện trước vòng cấm.

Tỷ số hiện tại là một không. Đội chủ nhà kiểm soát bóng năm mươi tám phần trăm, tung ra mười hai cú sút, trong đó có bốn lần bóng đi trúng khung thành.

Ở pha bóng tiếp theo, tiền đạo trẻ di chuyển thông minh sau lưng trung vệ. Anh khống chế bóng bằng chân phải, xoay người, rồi tung cú sút chìm vào góc xa. Thủ môn đã bay người hết cỡ nhưng không thể cản phá.

Đây là kiểu tình huống mà người xem rất thích: nhanh, rõ, giàu cảm xúc, nhưng không quá ồn ào. Giọng đọc cần giữ nhịp ổn định để video nghe chuyên nghiệp hơn.

Bây giờ hãy thử một số cụm âm khó: Nguyễn, Quyền, Huỳnh, Trường, chiến thuật, chuyển trạng thái, kiểm soát, phản công, khoảng trống, quyết định, chuyên nghiệp.

Tiếp theo là các con số: một, hai, ba, bốn, năm; mười lăm phút; hai mươi ba cầu thủ; một trăm linh tám nghìn lượt xem; ba phẩy năm triệu người theo dõi.

Kết thúc bài kiểm tra. Nếu đoạn audio này nghe rõ, không bị nuốt chữ, không quá nhanh và không quá gắt, bạn có thể dùng nó làm nguồn để chuyển sang custom voice.
```

Gợi ý tạo audio nguồn:

```txt
Speech rate: 0.90-0.96
Sentence silence: 0.25-0.55
Nguồn audio: WAV nếu có thể
```

---

## 10. Bộ text tiếng Anh để test âm quốc tế

```txt
Hello, this is a voice conversion test for an automated video production workflow.

The purpose of this sample is to create a clean source narration with steady pacing, clear pronunciation, and natural pauses. After generating this audio, the system will convert it into a custom voice using Applio.

In football news, timing matters. A single pass, a fast transition, or a late goal can completely change the story of the match.

The midfielder receives the ball near the center circle, looks up, and sends a sharp pass into the right channel. The winger accelerates, beats the defender, and delivers a low cross into the penalty area.

The score is two to one. The home team has sixty two percent possession, fifteen total shots, and six attempts on target.

This narration should sound calm, confident, and easy to follow. It should not be too fast, too dramatic, or too flat.

Now we test a few names and technical phrases: Manchester United, Liverpool, tactical transition, pressing shape, expected goals, defensive line, and counter attack.

End of the test. If this audio sounds clean and stable, it is ready for voice conversion.
```

---

## 11. Text ngắn để test nhanh

```txt
Đây là đoạn test nhanh cho Applio. Tôi sẽ tạo audio nguồn trước, sau đó chuyển sang custom voice. Nếu giọng đọc rõ, không rè, không méo tiếng và giữ được nhịp tự nhiên, cấu hình hiện tại có thể dùng để tạo video.
```

---

## 12. Checklist trước khi bấm convert

- Applio server đang chạy.
- `RVC_APPLIO_BASE_URL` mở được trong browser.
- `RVC_APPLIO_PYTHON` trỏ đúng Python có `gradio_client`.
- `convertTemplates` là JSON array hợp lệ.
- Mỗi template có `apiName` khớp `Use via API`.
- `${input}` nằm đúng vị trí tham số audio nguồn.
- `${model}` và `${index}` chỉ xuất hiện nếu API của Applio yêu cầu.
- Audio nguồn đã được tạo trong app.
