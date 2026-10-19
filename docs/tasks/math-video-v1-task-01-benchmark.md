# Math Video v1.0 — Task 01: Reference benchmark & scene manifest

**Status:** TODO / giao cho Coder, chưa phải kết quả scene manifest đã xác minh  
**Branch:** `feature/math-video-studio-v1`  
**Plan:** [2026-10-19-math-video-studio-v1.md](../plans/2026-10-19-math-video-studio-v1.md)  
**Draft PR:** #23  
**Scope:** phân tích video, đặc tả frame-based; **chưa làm UI, chưa render video tái dựng**.

## Mục tiêu

Phân rã *toàn bộ* video tham chiếu thành timeline có thể triển khai bằng Remotion và làm benchmark chi tiết cho **00:00–00:40**. Chỉ bắt đầu viết scene/animation sau khi đã xác nhận timecode, các thành phần và đường chuyển động. Không dùng ảnh chụp hoặc video gốc làm thành phẩm v1.

## Nguồn và thông số đã xác minh

- Tên tệp đính kèm trong cuộc trò chuyện: `FDown.vn_Tai_video_Facebook_720p (HD)_0dc1.mp4`.
- Video: H.264, 1280×720, 25 fps, **15.217 frame**, duration video **608,680 giây**.
- Audio: AAC, 48 kHz, duration **608,766708 giây**. Khác biệt ~0,087 giây so với thời lượng video.
- SHA-256 file nguồn: `d6e5123f38293abd35b34c48b9b3d61127e5f99f9a01622ebae176e00ef0f1a5`.
- Valid frame IDs: `0..15216`. Tất cả phân đoạn timeline dùng khung **[startFrame, endFrame)**; `endFrame` cuối phải bằng `15217` (exclusive).
- File video gốc **chưa nằm trong Git**, nên Coder **phải được cấp quyền truy cập bản đính kèm này** trong phiên triển khai hoặc nhận file nguồn qua một kênh được cho phép. Không đoán timecode khi thiếu file.
- **Không commit nguồn video/audio** vào Git; chỉ ghi metadata, mô tả, timeline và tư liệu kiểm thử có quyền sử dụng.

## Quan sát trực tiếp — 40 giây đầu

Đây là các **mẫu ảnh lấy mỗi 2 giây**, không phải boundary đã chốt. Cần xem video theo từng frame ở các điểm chuyển:

| Mốc kiểm tra | Visual quan sát |
| --- | --- |
| 00s / f0 | Nền đen; nhân vật người que trắng ở góc dưới trái |
| 02s / f50 | Tam giác vuông màu xám hiện bên phải người que |
| 04s / f100 | Tam giác + đánh dấu góc alpha ở đỉnh trái |
| 06s / f150 | Nhãn cyan `sin = đối / huyền`, cạnh đối và huyền |
| 08s / f200 | Thêm nhãn cam `cos = kề / huyền`, cạnh kề |
| 10s / f250 | Người que giơ tay; checklist minh họa |
| 14–16s / f350–400 | Thẻ câu hỏi `sin 120° = ?` xuất hiện bên phải |
| 18s / f450 | Tam giác biến dạng/xoay; góc tù 120° |
| 20–24s / f500–600 | Quay về tam giác, minh họa cung góc; thẻ câu hỏi vẫn hiện |
| 26–30s / f650–750 | Máy tính và bảng minh họa dưới thẻ câu hỏi |
| 32–34s / f800–850 | Chuyển sang trục góc nằm ngang có vạch chia; nhân vật đứng tại ~60° |
| 36–40s / f900–1000 | Vùng hình chữ nhật góc vuông trên trục, chú thích; người que bước ra ngoài |

**Không suy ra chính xác frame mở/đóng chỉ từ bảng này**. Khi lập manifest phải scrubbing, rà lại cả chuyển động ở giữa, nhịp camera và chữ xuất hiện/biến mất.

## Đầu ra bắt buộc

1. `docs/video-references/math-sincos-v1.scene-manifest.json`: schema có version, source metadata, timeline `fps=25`, `totalFrames=15217`, danh sách scene với id, `startFrame`, `endFrame` (exclusive), name, elements, animation cues, on-screen text/formulas, camera/transitions, voice/sfx/music cue nếu nhận diện được và trạng thái xác minh `verified` / `requiresReview`.
2. `docs/video-references/math-sincos-v1-scene-breakdown.md`: mô tả từng cảnh và mốc quan sát; 0–40s cần chi tiết theo keyframes; cả video phải có coverage tất cả chapter, không chỉ map sơ bộ trong plan.
3. `docs/video-references/math-sincos-v1-benchmark.md`: thông số style (black background, tỷ lệ bố cục, kích thước font/stroke ước lượng, palette kiểm chứng bằng pixel), danh sách primitives hình học, sai số/độ bất định và giải pháp kiểm tra.
4. Tạo **contact sheets** đối chiếu: 0–40s tối thiểu mỗi 2 giây; toàn bộ video mỗi 10–15 giây và dày hơn ở scene boundaries. Tài liệu nêu nơi lưu và nguồn cho từng frame; tránh commit media nguồn trái phép.
5. Nếu không truy cập được video thực, dừng với **BLOCKED_REFERENCE_UNAVAILABLE** và báo cách mở quyền cho Coder; không tự đánh dấu deliverable đã hoàn thành.

## Quy trình Coder

1. Đọc `AGENTS.md`, `.agents/skills/reactjs/SKILL.md`, `docs/ai-context/README.md`, chạy `python3 scripts/context_index.py query "math video remotion preset scene timeline"` trên workspace repo; đọc plan và các nguồn code hiện tại liên quan.
2. Xác minh SHA-256 + `ffprobe` của video nguồn, trích có kiểm soát keyframe ảnh, không OCR hàng loạt.
3. Định danh scene boundary theo timestamp/frame trên *video thực*, đảm bảo cả chuyển đoạn và overlay; cảnh dài có thể chia thành các beat con có timecode rõ ràng.
4. Viết JSON manifest + breakdown + benchmark; dùng nguồn gốc riêng cho verified vs approximate, không nội suy các đoạn chưa xem.
5. Chạy validator kiểm tra JSON schema, scene IDs, index, đơn vị thời gian, không gap/overlap ngoài overlay đã định nghĩa, `first.startFrame=0`, `last.endFrame=15217`; chạy test/script minh chứng.
6. Commit tài liệu/fixtures, cập nhật PR hiện có hoặc tạo PR khác **nếu** workflow repository yêu cầu; giữ nguyên `main`, không force-push. Nêu cụ thể mọi blocker chưa xử lý.

## Acceptance / Definition of Done

- [ ] Đã thật sự đọc được bản video nguồn có đúng SHA-256.
- [ ] Cả 15.217 frame được cover bởi timeline các scene liên tục, theo convention end-exclusive.
- [ ] Đoạn đầu 0–40s có keyframes, typography, objects, cues, camera, animation timings có thể đưa thẳng cho coder dựng.
- [ ] 40s đầu và toàn bộ video có bằng chứng hình ảnh/timecodes, mô tả rõ cảnh khác nhau.
- [ ] Đã phân biệt lời đọc, text trên màn hình và nhận định chưa được xác minh. Không tự chế lời thoại.
- [ ] Audio và quyền sử dụng được ghi chú; chưa tự động đưa audio gốc vào output.
- [ ] Không thay đổi animation UI, renderer, thư viện video hay unrelated source trong Task 01.
- [ ] Lưu tài liệu trong Git cùng commit SHA; báo cáo điểm cần user quyết định.

**Sau khi nghiệm thu Task 01:** Task 02 = viết nền tảng SVG geometry/primitives và unit test; sau đó mới Task 03 = tái dựng 40 giây đầu.
