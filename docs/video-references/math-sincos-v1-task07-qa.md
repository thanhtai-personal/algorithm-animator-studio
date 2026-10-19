# Task 07 — QA tổng thể & release gate cho Math Video Sin/Cos v1

**Nhánh:** `feature/math-video-studio-v1` — PR #23 (Draft).  
**Kết luận hiện tại:** KHÔNG ĐỦ ĐIỀU KIỆN MERGE/RELEASE cho mục tiêu “giống video gốc”. Task 07 đã có code kiểm thử, nhưng chưa có bằng chứng build và render MP4 của phiên bản Task 04–06.

## 1. Quy trình kiểm chứng

- [x] Kiểm tra độc lập MP4 từ bản dựng cũ: **15.217 frame được giải mã, H.264, 1280×720, 25/1 FPS, thời lượng 608,68 giây.** Đây không phải MP4 từ code Task 05/06. Không có audio.
- [x] Kiểm tra độc lập M4A tổng hợp trước đây: AAC 48 kHz, 608,68 giây. Hai tiếng thử đúng tại 10,2s và 40,2s, các mốc 0,5s/5s/12s/20s/43s/608s đều im lặng.
- [x] Thêm `scripts/math-video-v1-release-qa.mjs`: kiểm tra metadata gốc, 12 chapter và 36 beat liên tục, render H.264/25FPS/15.217 decoded frames/1280×720/608,68s, audio AAC 48 kHz khi cần.
- [x] Thêm `scripts/math-video-v1-release-qa.test.mjs`: kiểm thử **không tự duyệt**; từ chối video thiếu, file nghiệm thu thiếu và template chưa ký.
- [x] Thêm `scripts/math-video-v1-visual-stills.mjs`: render thực tế 36 midpoint frames vào thư mục bằng một Remotion bundle, tạo JSON index nêu rõ chưa nghiệm thu.
- [x] Thêm workflow `math-video-visual-qa.yml`; cập nhật `math-video-ci.yml` và `math-video-full-render.yml` để dùng gate.
- [ ] Chạy `npm ci`, Vitest, `npm run build` và `npm run build:server` cho commit hiện tại.
- [ ] Render 36 ảnh bằng Remotion của commit hiện tại rồi so từng ảnh với video gốc.
- [ ] Tạo và nghe 37 câu TTS tiếng Việt thực tế, chỉnh lời đọc/speed/trimming.
- [ ] Xuất MP4 10:09 từ **code Task 05/06 có giọng**, kiểm tra đủ 15.217 frame và audio AAC.
- [ ] Người có quyền sử dụng tài liệu xác nhận bản quyền audio và toàn bộ 36 phân cảnh.

## 2. Rào cản CI

Các job gần đây trong GitHub Actions thất bại trong khoảng vài giây, trả `steps: null`, tải logs bị lỗi `BlobNotFound`. Vì **không chạy đến checkout/npm**, đây là blocker trước runner; hiện chưa có bằng chứng lỗi TypeScript hay Vitest từ các job đó. Không suy đoán nguyên nhân chính xác (billing, runner provisioning, permissions) khi chưa có thông báo chính thức từ Actions.

**Cần người có quyền quản trị GitHub kiểm tra**: repository **Actions → failed run → job summary/annotations**, repository **Settings → Actions → General**, và tài khoản chủ sở hữu **Billing and licensing → Actions usage/spending**; xác minh GitHub-hosted runner có thể được cấp. Một rerun cùng cấu hình chỉ hữu ích sau khi blocker bên phía GitHub được xử lý.

## 3. Chạy kiểm tra khi runner/local dependencies sẵn sàng

```bash
npm ci
node scripts/math-video-v1-release-qa.mjs --manifest-only
node --test scripts/math-video-v1-release-qa.test.mjs
npx vitest run src/features/math-video/__tests__
npm run build
npm run build:server
npx tsx scripts/math-narration-audio-smoke.ts
node scripts/math-video-v1-visual-stills.mjs generated-videos/math-v1-qa-stills
```

Để render toàn bộ **không có giọng** làm bằng chứng chất lượng hình ảnh: chạy workflow `Math Video Full 10m Render`. Workflow chia sáu phần, bỏ AAC padding ở mỗi phần trước khi ghép stream-copy và gọi `math-video-v1-release-qa.mjs --video ...`. Việc qua gate này **không chứng minh video giống hệt gốc**, chỉ chứng minh kỹ thuật container/frame.

Để kiểm tra MP4 **có giọng đọc hợp lệ** sinh từ UI, sử dụng:

```bash
node scripts/math-video-v1-release-qa.mjs \
  --video path/to/complete-voiced-video.mp4 \
  --require-audio \
  --release \
  --acceptance path/to/filled-and-reviewed-acceptance.json
```

Mẫu khởi tạo: `docs/video-references/math-sincos-v1-acceptance-template.json`. Các trường duyệt mặc định là `false`, chưa có người duyệt. Không tự chuyển chúng thành `true` khi mới chỉ xem manifest hoặc 36 PNG render: phải đối chiếu **từng beat với nguồn** và nghe MP4 có giọng.

## 4. Tiêu chuẩn kỹ thuật và quyền nội dung

- Frame bắt đầu/chấm dứt của các beat từ Task 04 là **mốc candidate 0,2–5s**, không phải video EDL chính xác. Cần QA nhân lực và điều chỉnh.
- Reference MP4 và audio không được commit vào repo hay phát tán không có quyền.
- Lời dẫn trong Task 06 là tác phẩm viết mới, **không phải transcript**. Phải xác minh cả từ ngữ khoa học, chất lượng đọc tiếng Việt và quyền sử dụng giọng/nhạc.
- Không merge PR #23 khi Actions chưa chạy xong và thiếu bản MP4 có giọng từ code mới. Chỉ owner quyết định nghiệm thu độ giống cuối cùng.
