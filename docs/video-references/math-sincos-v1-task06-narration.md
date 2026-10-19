# Task 06 — Giọng đọc và đồng bộ audio, 25 FPS

**Nhánh:** `feature/math-video-studio-v1` (PR #23)  
**Trạng thái:** Đã triển khai code giao diện, tạo giọng, mixer FFmpeg, preview/export. Chưa tạo TTS trên máy thật và chưa có nghiệm thu phát hành.

## Nguyên tắc

- 37 cửa sổ: 1 đoạn mở đầu [0,1000) và 36 beat [1000,15217), cùng nguồn manifest Task 04.
- **Lời dẫn tiếng Việt là bản viết mới để chỉnh sửa, không phải transcript đã xác minh của video Facebook**. Mốc tương ứng hình ảnh là candidate có sai số, chưa đồng bộ âm vị.
- **Không sử dụng, tự lấy hay đẩy audio gốc** từ file tham chiếu; phải có quyền sử dụng và/hoặc dùng giọng tạo mới.
- Các câu chưa tạo giọng giữ im lặng; mỗi câu được cắt ở cuối beat để không tràn sang hình tiếp theo. Mixer cảnh báo cụ thể khi audio dài quá beat.

## Màn hình sử dụng

Vào `/videos/math` → **Giọng đọc & đồng bộ 25 FPS**.

1. Chọn chương và phân cảnh, chỉnh lời dẫn (lưu trên trình duyệt).
2. Mở dịch vụ Supertonic trong KAI STUDIO, chọn giọng và tốc độ; chọn **Tạo giọng cho các đoạn thiếu của chương** hoặc **Tạo giọng cho toàn bộ 37 đoạn**.
3. Nếu đã có audio tạo từ **Text To Speech**, có thể nhập đường dẫn tương đối trong Generated Audio và **Gắn**; endpoint xác minh file thuộc thư mục âm thanh được phép. Các file tùy ý trên ổ đĩa không được phép truy cập trực tiếp.
4. Bấm **Ghép giọng theo toàn bộ timeline**. Server kiểm tra 1–37 cue không trùng, file tồn tại và thời lượng WAV; FFmpeg trim từng cue, trễ audio đúng `startFrame × 40 ms`, mix và pad track lên đủ 608,68 giây thành M4A AAC 48kHz.
5. Nghe preview trong Remotion Player. Chỉnh âm lượng; khi bấm **Tạo video MP4**, hệ thống dùng `voiceoverAudioRelativePath` của track đã ghép. Không gửi audio qua clipboard, không cần giữ đường dẫn cục bộ tuyệt đối.

Các cue lỗi/rỗng sẽ không được ghép; TTS server ngừng chạy chỉ ảnh hưởng bước sinh mới, âm thanh đã có vẫn gắn lại được.

## Các file chính

- `src/features/math-video/mathNarrationCues.ts` — 37 lời dẫn mới, mốc frame, không giả transcript.
- `src/features/math-video/MathNarrationPanel.tsx` — edit text, chọn giọng Supertonic, tạo tất cả/từng chương, gắn file, ghép, cảnh báo clip quá dài.
- `src/features/math-video/mathNarrationMixPlan.ts` — graph filter FFmpeg thuần frame, có thể unit-test.
- `server/services/MathNarrationService.ts` — đường dẫn generated audio an toàn, ffprobe độ dài, FFmpeg mix, trả URL M4A.
- `server/routes/videoRoutes.ts` — POST `/api/video/math-narration/mix`.
- `src/pages/MathVideoStudio.tsx` — track preview và export dùng chung.
- `src/features/remotion-video/remotion/Root.tsx` — `MathSinCosV1` dùng `PresetVideoComposition` để CLI render tùy chọn có audio.
- `src/features/math-video/__tests__/mathNarration.test.ts` — coverage, sai phạm frame và công thức 40 ms/frame.
- `scripts/math-narration-audio-smoke.ts` — ffmpeg render two synthetic tones, kiểm tra codec và thời lượng.

## Kiểm chứng đã chạy trong phiên

**FFmpeg trực tiếp (trên container, bằng synthetic tone tự tạo, không từ video gốc):**
- Hai tiếng ở frame 250 (giây 10) và 1000 (giây 40).
- RMS âm khác 0 tại 10,2s và 40,2s; RMS bằng 0 ở giây 0, 5, 12, 20, 43, 608.
- Output AAC trong M4A dài **608,680 giây**, 48 kHz. Graph đơn đầu vào cũng chạy được, sinh track im lặng ngoài clip.
- Kiểm tra cấu trúc source: đủ 36 draft beat keys + 1 intro, UI kết nối voiceover preview/export, backend xác minh generated resource và độ dài.

**Chưa được xác minh trên CI:** GitHub Actions vẫn gặp lỗi không chạy steps từ trước Task 06. Chưa có bằng chứng chạy `npm run build`, `npm run build:server`, Vitest hoặc render Remotion mới nhất. Không coi smoke test hệ thống riêng là bằng chứng code frontend/backend đã hoàn toàn chạy được.

## Giới hạn cần QA trong Task 07

- Generate tiếng Việt thực tế với Supertonic chạy local, đo từng file và nghe thử cách đọc thuật ngữ toán.
- Nếu audio quá dài, rút gọn lời dẫn / tăng tốc nói / điều chỉnh beat sau khi xác minh video gốc. Mixer **cắt phần dư** và hiển thị cảnh báo, không lén làm dài timeline.
- Kiểm tra clip sau ghép (không tiếng nổ tại điểm nối, không méo/clip âm khi nhiều cue).
- Render MP4 có tiếng thử 40s và bản đầy đủ 608,68s trên môi trường runner hoạt động.
- Đối chiếu nhịp lời dẫn, hình ảnh và frame video tham chiếu, không tự xác nhận là giống hệt khi chưa nghiệm thu.

**Task 06 đã có code hoàn chỉnh về luồng chức năng**, nhưng chưa chốt chất lượng giọng đọc, build/export cuối và bản quyền nguồn âm thanh.
