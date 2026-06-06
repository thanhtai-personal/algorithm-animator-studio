# Hướng Dẫn Train Model Giọng Cá Nhân Bằng Applio/RVC

Tài liệu này hướng dẫn cách chuẩn bị dataset, train model trong Applio/RVC, và cung cấp bộ text để bạn thu âm giọng thật của mình làm dữ liệu train.

Quan trọng: audio train model nên là **giọng thật của bạn**. Không nên dùng audio tạo bởi Piper, ElevenLabs, Supertonic, hoặc một model AI khác để train "giọng của bạn", vì model sẽ học lại chất lượng và lỗi của nguồn AI đó.

Workflow đúng:

```txt
Bạn đọc text mẫu và thu âm
-> Cắt/làm sạch dataset
-> Applio preprocess
-> Extract features/F0
-> Train model
-> Train/create index
-> Test convert audio nguồn sang giọng của bạn
-> Cấu hình template Applio trong KAI STUDIO
```

---

## 1. Mục Tiêu Dataset

Dataset tốt cho narration/video cần:

- Giọng rõ, ít noise, không nhạc nền.
- Nhiều câu ngắn và câu dài.
- Có dấu câu, số, tên riêng, từ tiếng Anh phổ biến.
- Có nhiều âm khó trong tiếng Việt: tr/ch, s/x, r/d/gi, n/ng, l/n, uyên, ương, anh, ách.
- Tốc độ đọc tự nhiên, không quá nhanh, không diễn kịch quá mức.
- Volume ổn định, không lúc to lúc nhỏ.

Mốc thời lượng khuyến nghị:

| Mức | Thời lượng sạch | Dùng khi |
| --- | --- | --- |
| Test nhanh | 5-10 phút | Kiểm tra pipeline train/convert |
| Dùng được | 20-30 phút | Voice-over video cá nhân |
| Tốt hơn | 45-60 phút | Giọng ổn định hơn, ít méo hơn |

Nếu chỉ làm giọng thuyết minh video, 20-30 phút audio sạch thường đủ để bắt đầu.

---

## 2. Chuẩn Bị Thu Âm

Thiết lập khuyến nghị:

- Thu trong phòng yên tĩnh, tắt quạt/máy lạnh nếu có tiếng ồn.
- Đặt mic cách miệng 15-25 cm.
- Dùng pop filter nếu có.
- Đọc đều, không cần quá diễn cảm.
- Tránh clip/peaking: nếu waveform chạm trần liên tục, giảm gain.
- Nên thu WAV mono hoặc stereo, 44.1 kHz/48 kHz, 16-bit hoặc 24-bit.

Không nên:

- Thu trong phòng vang nhiều.
- Để nhạc nền, tiếng game, tiếng TV.
- Nói quá sát mic gây pop/bass quá dày.
- Ghép nhiều ngày thu có mic/volume mỗi lần quá khác nhau.
- Dùng audio đã qua noise reduction quá mạnh làm giọng bị kim loại.

---

## 3. Phần Mềm Thu Âm Phù Hợp

Ưu tiên dùng phần mềm có waveform rõ, dễ cắt đoạn sai, và export được WAV lossless. Với dataset train Applio/RVC, mục tiêu là file sạch và ổn định, không phải xử lý hiệu ứng phức tạp.

### Khuyến nghị mặc định: Audacity

Audacity phù hợp nhất để bắt đầu vì miễn phí, dễ dùng, chạy trên Windows/macOS/Linux, và hỗ trợ record/edit/export WAV.

Link chính thức:

```txt
https://www.audacityteam.org/download/
```

Thiết lập gợi ý trong Audacity:

```txt
Project rate: 44100 Hz hoặc 48000 Hz
Recording channels: Mono nếu chỉ thu một mic
Sample format: 24-bit nếu có, 16-bit cũng được
Export: WAV signed 16-bit PCM hoặc 24-bit PCM
```

Quy trình thu trong Audacity:

1. Chọn đúng microphone ở thanh input device.
2. Bấm record và đọc từng block text.
3. Nếu đọc sai, dừng 1-2 giây rồi đọc lại câu đó.
4. Sau khi thu xong, cắt bỏ đoạn sai, đoạn im lặng dài, tiếng gõ bàn hoặc tiếng thở mạnh.
5. Export từng file WAV vào thư mục dataset.

Không chỉ **Save Project** rồi đem file `.aup3` vào Applio. Applio cần file audio như `.wav`, nên phải dùng **Export Audio**.

### Lựa chọn đơn giản hơn: ocenaudio

ocenaudio phù hợp nếu bạn muốn giao diện gọn, thao tác cắt nhanh và không cần nhiều tính năng. Phần mềm này cũng có bản Windows/macOS/Linux.

Link chính thức:

```txt
https://www.ocenaudio.com/
```

Nên dùng ocenaudio khi:

- Chỉ cần record/cắt/lưu WAV.
- Không muốn nhìn quá nhiều panel.
- Muốn thao tác nhanh với từng file audio riêng.

### Lựa chọn chuyên nghiệp: Adobe Audition

Adobe Audition phù hợp nếu bạn đã có Adobe license hoặc cần công cụ xử lý audio chuyên nghiệp hơn. Audition mạnh ở waveform editing, spectral view, noise reduction và quản lý nhiều track.

Link chính thức:

```txt
https://www.adobe.com/products/audition.html
```

Nên dùng Audition khi:

- Bạn đã quen bộ Adobe.
- Cần xử lý noise thủ công cẩn thận.
- Có nhiều buổi thu và cần workflow quản lý session tốt hơn.

### Lưu file như thế nào

Định dạng khuyến nghị cho dataset:

```txt
WAV
Mono
44100 Hz hoặc 48000 Hz
16-bit PCM hoặc 24-bit PCM
Không nhạc nền
Không reverb/echo
Không normalize quá mạnh
```

Tên file nên dễ đọc:

```txt
001_intro.wav
002_bong-da.wav
003_chien-thuat.wav
004_cong-nghe.wav
005_am-kho.wav
```

Nếu thu một file dài 20-30 phút, vẫn nên cắt thành nhiều file nhỏ khoảng 5-15 giây hoặc để Applio preprocess tự cắt nếu bản Applio của bạn hỗ trợ tốt.

---

## 4. Cấu Trúc Thư Mục Dataset

Tạo một thư mục riêng, ví dụ:

```txt
C:\DATA\voice-datasets\my_voice_raw
```

Đặt file theo tên dễ kiểm tra:

```txt
001_intro.wav
002_news.wav
003_story.wav
004_numbers.wav
005_football.wav
```

Sau khi cắt/làm sạch, dùng thư mục processed riêng:

```txt
C:\DATA\voice-datasets\my_voice_clean
```

Mỗi file nên dài khoảng 5-15 giây nếu bạn cắt tay. Nếu Applio có preprocess tự động, có thể đưa file dài hơn vào dataset raw và để Applio cắt.

---

## 5. Train Trong Applio

Tên tab trong Applio có thể thay đổi theo version. Nếu UI khác, hãy tìm các bước có ý nghĩa tương đương: dataset/preprocess, feature extraction, train, index, inference.

1. Chạy Applio:

```bat
C:\TOOLS\ApplioV3.6.2\run-applio.bat
```

2. Mở UI local, thường là:

```txt
http://127.0.0.1:6969
```

3. Vào khu vực **Training**.

4. Tạo experiment/model mới:

```txt
Experiment/model name: my_voice
Dataset path: C:\DATA\voice-datasets\my_voice_raw
Sample rate: 40k hoặc 48k
Version: RVC v2 nếu có
F0/GPU: bật F0 nếu train giọng nói/hát có cao độ
```

5. Chạy **Preprocess dataset**.

6. Chạy **Extract features** hoặc **Extract F0/features**.

Thiết lập gợi ý cho voice-over:

```txt
F0 method: rmvpe
Hợp lệ cho speech: rmvpe
Nếu máy yếu: harvest hoặc crepe có thể chậm/khác tùy bản
```

7. Chạy **Train model**.

Gợi ý ban đầu:

```txt
Epochs: 100-200 cho dataset 20-30 phút
Save every epoch: 10 hoặc 20
Batch size: tùy VRAM, bắt đầu 4-8 nếu GPU yếu
```

Nếu Applio có preset, dùng preset mặc định trước. Đừng tối ưu quá sớm. Hãy train một model chạy được, test convert, rồi mới chỉnh.

8. Tạo **index**:

Sau khi train xong, chạy train/create index nếu Applio có nút riêng. File index thường nằm trong:

```txt
C:\TOOLS\ApplioV3.6.2\logs\my_voice\added_*.index
```

Model `.pth` có thể nằm trong:

```txt
C:\TOOLS\ApplioV3.6.2\assets\weights\my_voice.pth
```

Hoặc:

```txt
C:\TOOLS\ApplioV3.6.2\logs\my_voice\*.pth
```

---

## 6. Test Model Trong Applio

Trước khi cấu hình vào KAI STUDIO, test trong chính Applio:

1. Vào **Inference/Convert**.
2. Chọn model `.pth` vừa train.
3. Chọn file `.index` nếu có.
4. Upload một audio nguồn sạch, có thể là Piper/Supertonic đọc một đoạn ngắn.
5. Convert.

Tham số khởi đầu:

```txt
Pitch: 0
F0 method: rmvpe
Index rate: 0.5-0.75
Protect: 0.33-0.5
Filter radius: 3
Output format: wav
```

Nếu giọng bị robot/rè:

- Giảm `index rate` về 0.45-0.6.
- Tăng `protect` lên 0.45-0.5.
- Dùng audio nguồn đọc chậm hơn.
- Kiểm tra dataset có noise, vang phòng, hoặc clip không.

Nếu giọng chưa giống bạn:

- Tăng thời lượng dataset sạch.
- Thêm câu đọc gần đúng use case: football news, video giải thích, truyện.
- Train thêm epoch, nhưng dừng train quá lâu nếu bắt đầu nghe bị méo.

---

## 7. Kết Nối Với KAI STUDIO

Sau khi model test OK trong Applio:

1. Lấy `Use via API` trong Applio.
2. Tạo template trong Settings -> Voice -> Applio.
3. Điền model và index vào `RVC_APPLIO_TEMPLATES_JSON`.

Ví dụ:

```json
[
  {
    "id": "my-voice",
    "label": "Giọng của tôi",
    "apiName": "/infer_convert",
    "modelName": "my_voice.pth",
    "indexPath": "C:/TOOLS/ApplioV3.6.2/logs/my_voice/added.index",
    "pitch": 0,
    "f0Method": "rmvpe",
    "indexRate": 0.65,
    "protect": 0.45,
    "filterRadius": 3,
    "argTemplate": [0, "${input}", "${model}", "${index}", "${f0_method}", "${index_rate}", "${filter_radius}", 0, 0.25, "${protect}", "wav"]
  }
]
```

Chỉ dùng `argTemplate` minh họa nếu nó khớp với **Use via API** trên máy bạn. Nếu Applio của bạn có thứ tự tham số khác, hãy copy theo `client.predict(...)` của chính UI Applio.

Xem chi tiết template tại:

```txt
docs/applio-api-template-and-voice-text.md
```

---

## 8. Bộ Text Thu Âm Dataset Tiếng Việt

Cách dùng:

- Đọc bằng giọng thật của bạn.
- Mỗi block có thể thu thành một file riêng.
- Nếu đọc sai, dừng lại 1-2 giây và đọc lại câu đó; sau này cắt bỏ phần sai.
- Không cần đọc hết trong một lần. Tốt nhất giữ cùng mic, cùng phòng, cùng volume.

### Block 1: Giới Thiệu Và Giọng Thuyết Minh

```txt
Xin chào, đây là bộ dữ liệu thu âm để train model giọng cá nhân.

Tôi sẽ đọc với tốc độ vừa phải, rõ từng câu, giữ âm lượng ổn định và không nói quá nhanh.

Mục tiêu của bộ thu âm này là tạo ra một giọng đọc tự nhiên cho video thuyết minh, tin tức bóng đá, và các nội dung giải thích ngắn gọn.

Khi đọc, tôi sẽ giữ khoảng nghỉ nhẹ giữa các câu. Nếu có câu dài, tôi sẽ ngắt hơi đúng chỗ để dễ nghe.

Đây không phải là một màn trình diễn. Đây là giọng nói bình thường, rõ ràng, tự nhiên, và dễ theo dõi.
```

### Block 2: Tin Tức Bóng Đá

```txt
Trận đấu tối qua diễn ra với tốc độ rất cao ngay từ những phút đầu tiên.

Đội chủ nhà chủ động đẩy cao đội hình, gây áp lực lên hàng tiền vệ đối phương và liên tục đưa bóng ra hai biên.

Phút thứ mười bảy, tiền đạo số chín có pha di chuyển thông minh sau lưng trung vệ. Anh nhận đường chuyền dài, khống chế bằng chân phải, rồi dứt điểm chéo góc.

Thủ môn đã bay người hết cỡ, nhưng bóng vẫn đi sát cột dọc và vào lưới.

Sau bàn thắng mở tỷ số, thế trận trở nên căng thẳng hơn. Đội khách buộc phải đẩy cao, để lộ nhiều khoảng trống ở phía sau hàng phòng ngự.

Nếu duy trì được cường độ pressing và khả năng chuyển trạng thái nhanh, đội chủ nhà có thể tạo ra thêm nhiều cơ hội trong hiệp hai.
```

### Block 3: Phân Tích Chiến Thuật

```txt
Điểm đáng chú ý nằm ở cách đội bóng tổ chức khối phòng ngự tam giác bên cánh trái.

Hậu vệ biên giữ vị trí rộng, tiền vệ trung tâm lùi xuống làm điểm nối, còn tiền đạo lệch di chuyển vào khoảng trống giữa hậu vệ biên và trung vệ.

Khi bóng được luân chuyển nhanh, đối phương không kịp kéo giãn cự ly đội hình. Điều này tạo ra một hành lang tấn công rất rõ.

Tuy nhiên, chiến thuật này cũng có rủi ro. Nếu mất bóng ở khu vực giữa sân, khoảng trống sau lưng hậu vệ biên có thể bị khai thác ngay lập tức.

Vì vậy, cầu thủ cầm bóng cần ra quyết định nhanh: chuyển tiếp, giữ nhịp, hay trả bóng về tuyến sau.
```

### Block 4: Giải Thích Công Nghệ

```txt
Một thuật toán tốt không chỉ cần chạy đúng, mà còn cần dễ hiểu, dễ kiểm tra và dễ bảo trì.

Khi giải thích một bài toán, chúng ta nên bắt đầu từ trực giác. Sau đó mới đi vào chi tiết về dữ liệu, vòng lặp, điều kiện dừng, và độ phức tạp.

Ví dụ, với sắp xếp nổi bọt, ý tưởng cơ bản là đưa phần tử lớn nhất về cuối mảng sau mỗi lượt duyệt.

Thuật toán này không nhanh với dữ liệu lớn, nhưng rất phù hợp để minh họa cách so sánh và hoán đổi hoạt động.

Trong video, hình ảnh trực quan sẽ giúp người xem thấy được vì sao từng bước lại cần thiết.
```

### Block 5: Truyện Ngắn Và Cảm Xúc Nhẹ

```txt
Buổi sáng hôm đó, thành phố thức dậy trong một lớp sương mỏng.

Trên con đường nhỏ dẫn ra bến sông, một người đàn ông trẻ tuổi dừng lại, lắng nghe tiếng gió thổi qua hàng cây.

Anh không vội vã. Lần đầu tiên sau nhiều tháng, anh cảm thấy mình có đủ thời gian để nhìn mọi thứ chậm hơn.

Một chiếc lá rơi xuống mặt đường. Một chuyến xe buýt đi ngang qua. Và ở đâu đó, tiếng chuông nhà thờ vang lên rất khẽ.

Có những khoảnh khắc không cần quá đặc biệt, nhưng vẫn đủ sức làm người ta nhớ mãi.
```

### Block 6: Số, Ngày Tháng, Tên Riêng

```txt
Bây giờ tôi sẽ đọc một số cụm có chữ số và tên riêng để model học cách phát âm rõ hơn.

Một, hai, ba, bốn, năm, sáu, bảy, tám, chín, mười.

Mười lăm phút, hai mươi ba cầu thủ, bốn mươi chín nghìn khán giả, một trăm linh tám nghìn lượt xem.

Ngày hai mươi tháng mười một năm hai nghìn không trăm hai mươi sáu.

Tỷ số là hai một. Đội chủ nhà kiểm soát bóng năm mươi tám phần trăm. Tổng số cú sút là mười hai, trong đó có bốn lần trúng đích.

Manchester United, Liverpool, Arsenal, Chelsea, Tottenham, Barcelona, Real Madrid, Cristiano Ronaldo, Lionel Messi, Bruno Fernandes.
```

### Block 7: Âm Khó Tiếng Việt

```txt
Nguyễn, Quyền, Huỳnh, Trường, Chiến, Chuyển, Chuyển đổi, Chuyển trạng thái.

Sâu sắc, xanh xao, xuất sắc, sẵn sàng, song song, sáng suốt.

Ranh giới, đánh giá, giải pháp, dự đoán, dữ liệu, điều kiện, giao diện.

Luyện tập, lặp lại, nói liệu, nóng lòng, lắng nghe, lưu loát.

Khoảng trống, kiểm soát, phản công, chống bóng, thăng hoa, quyết định.

Tôi sẽ đọc chậm lại một chút để từng âm được rõ ràng, sau đó quay về tốc độ bình thường.
```

### Block 8: Câu Hỏi, Nhấn Mạnh, Và Dấu Câu

```txt
Vì sao tình huống này lại quan trọng?

Nếu cầu thủ dứt điểm sớm hơn, liệu bàn thắng có đến không?

Đây là câu hỏi mà nhiều người hâm mộ sẽ đặt ra sau trận đấu.

Hãy nhìn lại pha bóng một lần nữa. Đầu tiên là đường chuyền cắt tuyến, tiếp theo là pha chạy chỗ, và cuối cùng là cú sút vào góc xa.

Chính khoảnh khắc đó đã thay đổi cục diện.

Không ồn ào, không phức tạp, nhưng rất hiệu quả.
```

### Block 9: Đọc Dài Hơn, Nhịp Ổn Định

```txt
Trong sản xuất video, giọng đọc có vai trò rất quan trọng. Một hình ảnh đẹp có thể thu hút người xem trong vài giây đầu tiên, nhưng giọng thuyết minh mới là thứ giữ cho mạch nội dung được liên tục.

Nếu giọng đọc quá nhanh, người xem không kịp xử lý thông tin. Nếu giọng đọc quá chậm, video sẽ mất năng lượng. Nếu âm thanh có nhiều tạp âm, người xem sẽ cảm thấy mệt mỏi, ngay cả khi nội dung được viết rất tốt.

Vì vậy, khi train model giọng cá nhân, điều quan trọng nhất không phải là đọc thật nhiều, mà là đọc sạch, đọc đều, và đọc đúng phong cách mình muốn sử dụng về sau.

Nếu bạn muốn làm video tin tức bóng đá, hãy thêm nhiều câu có tên cầu thủ, tỷ số, thời gian, và các tình huống trên sân.

Nếu bạn muốn làm video giải thích công nghệ, hãy thêm nhiều câu có thuật ngữ, số liệu, và cấu trúc lý luận rõ ràng.
```

### Block 10: Kết Thúc Dataset

```txt
Đây là phần cuối của bộ thu âm mẫu.

Tôi sẽ giữ giọng đọc ổn định, phát âm rõ, và kết thúc mỗi câu bằng khoảng nghỉ ngắn.

Sau khi thu xong, tôi sẽ nghe lại để loại bỏ những đoạn có tiếng ồn, nói sai, bị vỡ âm, hoặc quá nhỏ.

Một dataset tốt sẽ giúp model học giọng tốt hơn, giảm hiện tượng méo tiếng, và tạo ra kết quả tự nhiên hơn khi chuyển voice bằng Applio.

Kết thúc phần thu âm.
```

---

## 9. Bộ Text Bổ Sung Tiếng Anh Và Từ Quốc Tế

Dùng block này nếu video của bạn hay có tên tiếng Anh, câu lạc bộ, cầu thủ, hoặc thuật ngữ công nghệ.

```txt
Hello, this is an additional recording block for English words and international names.

The goal is not to speak perfect English, but to make the voice model familiar with common sounds that appear in videos.

Manchester United, Liverpool, Arsenal, Chelsea, Tottenham Hotspur, Real Madrid, Barcelona, Bayern Munich, Paris Saint Germain.

Artificial intelligence, machine learning, source code, visual explanation, database, application, performance, rendering, browser, server, upload, download.

The final score was two to one. The team had sixty two percent possession, fifteen shots, and six attempts on target.

This sample should be read clearly, calmly, and at a natural pace.
```

---

## 10. Checklist Chất Lượng Trước Khi Train

Trước khi đưa dataset vào Applio, kiểm tra:

- Không có nhạc nền.
- Không có tiếng quạt/máy lạnh quá rõ.
- Không bị clip/vỡ tiếng.
- Không có đoạn im lặng quá dài.
- Không có đoạn nói sai chưa cắt.
- Volume giữa các file không chênh nhau quá nhiều.
- Tổng audio sạch đạt ít nhất 10 phút cho test, tốt hơn là 20-30 phút.

Nếu có thời gian, nghe ngẫu nhiên 5-10 file. Nếu tai bạn thấy khó nghe, model cũng sẽ học khó.

---

## 11. Lỗi Thường Gặp Khi Train

### Model nghe giống nhưng bị rè

Nguyên nhân thường gặp:

- Dataset có noise hoặc phòng vang.
- Audio nguồn convert quá nhanh/quá cao.
- `index rate` quá cao.
- `protect` quá thấp.

Thử:

```txt
Index rate: 0.45-0.65
Protect: 0.45-0.5
Speech rate audio nguồn: 0.9-0.96
```

### Model không giống mình

Thử:

- Tăng dataset sạch lên 30-60 phút.
- Đọc đúng phong cách sử dụng thực tế.
- Dùng index file đúng model.
- Kiểm tra có đang chọn nhầm `.pth` hoặc `.index` không.

### Train xong không thấy file index

Trong một số bản Applio, train model và train index là hai bước riêng. Tìm nút **Train index**, **Create index**, hoặc **Feature index** trong tab Training.

### Convert fail trong KAI STUDIO

Nếu convert trong Applio OK nhưng trong KAI STUDIO fail, khả năng cao là `argTemplate` không khớp `Use via API`. Copy lại `client.predict(...)` từ đúng tab convert đang dùng.

---

## 12. Ghi Chú Pháp Lý Và Đạo Đức

Chỉ train giọng của chính bạn hoặc người đã cho phép rõ ràng. Nếu dùng để đăng lên YouTube, TikTok, Facebook, hoặc các nền tảng khác, hãy tuân thủ yêu cầu công bố nội dung AI/synthetic voice của nền tảng đó.
