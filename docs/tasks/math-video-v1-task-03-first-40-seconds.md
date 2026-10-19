# Math Video v1.0 — Task 03: Tái dựng 40 giây đầu theo video mẫu

**TRẠNG THÁI CẬP NHẬT (19/10/2026): ĐÃ CÓ MP4 PREVIEW 40 GIÂY.** Remotion đã render 1280×720, 25fps, 1.000 frame và GitHub Actions thành công: [run #39250458457](https://github.com/thanhtai-personal/algorithm-animator-studio/actions/runs/39250458457). Các dòng `BLOCKED` bên dưới đã cũ, **không còn ngăn tiến độ**. Bản dựng chưa giống hệt video tham chiếu; tiếp tục đối chiếu frame, audio và chuyển động.

**Trạng thái:** PLANNED — **BLOCKED BY Task 01 (#24) và Task 02 (#25)**  
**Nhánh:** `feature/math-video-studio-v1`  
**Kế hoạch tổng thể:** [Math Video v1.0](../plans/2026-10-19-math-video-studio-v1.md)  
**Task 01:** [Scene manifest + benchmark](math-video-v1-task-01-benchmark.md) · **GitHub Issue #24**  
**Task 02:** [Math Geometry Engine](math-video-v1-task-02-geometry-engine.md) · **GitHub Issue #25**  
**PR:** [#23 — Draft](https://github.com/thanhtai-personal/algorithm-animator-studio/pull/23)

> Đây là **đặc tả công việc cho Coder**, không phải báo cáo đã dựng video. Không bắt đầu triển khai khi chưa có scene manifest đã xác minh và các SVG primitives cần thiết. Không suy đoán thời điểm, màu hoặc chuyển động chỉ từ ảnh khảo sát mỗi 2 giây.

## 1. Goal / Definition of success

Tái dựng đúng **khoảng [0, 40) giây đầu tiên** của video tham chiếu `FDown.vn_Tai_video_Facebook_720p (HD)_0dc1.mp4` bằng **Remotion + React/TypeScript + SVG** sử dụng geometry engine của Task 02 và timing chính xác của Task 01. Video gốc dùng làm benchmark/đối chiếu, không nhúng nguyên video hoặc slideshow ảnh vào output.

- Kích thước cố định: **1280 × 720 px (16:9)**.
- Framerate: **25 FPS**.
- Timeline preview v1: **1.000 frames**; phạm vi source frame **0–999**, end-exclusive **1000**.
- Video tổng sau này: **15.217 frames**; composition dài phải cấu thành từ scenes/chapter độc lập, không hard-code giải pháp 40 giây vào toàn dự án.
- Độ trung thực cao với các hình học/nhân vật, màu, stroke, text, bố cục, lớp chuyển động, nhịp timing; các sai lệch phải được ghi rõ. Không tuyên bố pixel-perfect khi thiếu font hoặc source animation gốc.

## 2. Gate / prerequisites

1. **Task 01 (#24)** có manifest từ video thực, frame boundary/keyframes cho ít nhất 0–1000 frame, benchmark visual (màu, kích thước, typography, layer, timing), và trạng thái review rõ ràng; đối với toàn video, manifest vẫn cần đủ coverage theo DoD Task 01.
2. **Task 02 (#25)** có geometry helpers và SVG primitives đã test (tam giác, cung góc, trục/góc, text, StickFigure, frame interpolation), seek deterministic.
3. Coder có quyền đọc đúng video gốc tham chiếu hoặc keyframe evidence đã được tạo và xác minh từ Task 01. Nếu không: `BLOCKED_REFERENCE_UNAVAILABLE`.
4. Nếu một trong các gate chưa đạt: **dừng triển khai và báo `BLOCKED_BY_TASK_01`/`BLOCKED_BY_TASK_02`**. Không tạo các scene dựa trên frame timings tự nghĩ ra.

## 3. Shot/beat checklist sơ bộ (chưa là scene boundary)

| Mốc quan sát từ Task 01 | Nội dung phải tái dựng (kiểm tra lại với manifest) |
|---|---|
| 0–4s | Background đen; người que xuất hiện góc trái; dựng tam giác vuông xám |
| 4–8s | Đánh dấu góc alpha; làm nổi cạnh đối/huyền và công thức **sin = đối / huyền** (cyan) |
| 8–12s | Hiện **cos = kề / huyền** (cam); đối chiếu pose nhân vật, checklist |
| 12–18s | Chuyển biểu cảm/pose; thẻ câu hỏi **sin 120° = ?** xuất hiện bên phải |
| 18–25s | Tam giác/góc thay đổi; minh họa góc 120°, giữ đúng layer và nhịp |
| 25–32s | Máy tính hoặc vùng ghi chú dưới câu hỏi; kiểm tra đường nét, chữ, transition |
| 32–40s | Cắt/chuyển sang trục góc nằm ngang; người que, vạch góc, vùng hình chữ nhật vuông góc và nhãn |

**Các khoảng trên là mốc khảo sát, không phải keyframe chính thức.** Áp dụng giá trị chính xác từ Task 01, tách thành beat con nếu có hiệu ứng xuất hiện hoặc biến mất xen giữa.

## 4. Deliverables trong source

- `src/features/math-video/scenes/MathIntroScene.tsx` hoặc các cảnh nhỏ hơn, dùng primitives hiện có; composition scene không chứa logic render hoặc UI điều khiển.
- `src/features/math-video/compositions/MathVideoFirst40Composition.tsx` (hoặc tên theo convention): ghép các đoạn theo frame, đảm bảo audio/visual transitions ổn định. Có thể register **composition thử nghiệm riêng** nếu cần để chạy Remotion Studio; tránh ép video 40s vào `AlgorithmExplainer` hiện có.
- `src/features/math-video/data/first40SceneCues.ts` hoặc data manifest adapter: **single source of truth** từ Task 01, không copy timing thành hai nơi độc lập; timecode tính bằng frame.
- `src/features/math-video/__tests__/*`: geometry behavior/animation state ở frame mốc; deterministic tests cho seek.
- `docs/video-references/math-sincos-v1-first40-qa.md`: so sánh từng mốc, mức độ khớp, blockers, bảng TODO sửa sai lệch, bằng chứng export.
- **Video render preview MP4 40s** trong output cục bộ/artifact hợp lệ; không commit video gốc, không nhầm video source với video tái dựng.
- Khả năng tách scene để tái sử dụng về sau, **chưa xây dựng route/editor `/videos/math`** trong Task 03 trừ khi PR quyết định đổi phạm vi.

## 5. Hướng triển khai kỹ thuật

1. Checkout branch feature và cập nhật mới nhất; đọc `AGENTS.md`, `.agents/skills/reactjs/SKILL.md`, `docs/ai-context/README.md`; chạy `python3 scripts/context_index.py query "math video remotion geometry scene timeline"`.
2. Review manifest 0–1000, lựa chọn thiết kế scene boundary để không gap/overlap. `[startFrame, endFrame)` luôn end-exclusive. Chỉ số frame local = globalFrame - startFrame.
3. Coder viết kiểm thử và **proof of concept 0–8s** trước: thành phần người que, tam giác, cung góc, nhãn sin/cos. Xuất still frames và so với source, sửa trước khi đi tiếp.
4. Tiếp tục **8–20s** rồi **20–40s**; các chuyển động từ hàm pure + `useCurrentFrame()`, `interpolate()`, `spring()` có seed nếu cần. Không dựa vào CSS wall-clock animation, `Date.now()`, random không seed, timeouts.
5. Xuất MP4 preview **1280×720 @25fps, 1.000 frames**, codec H.264; dùng renderer hiện có và công cụ FFmpeg/ffprobe để chứng minh độ dài, frame count và resolution.
6. Nếu có âm thanh: chỉ ghép audio có quyền sử dụng; nếu audio gốc là bắt buộc để nghiệm thu độ giống, ghi blocker quyền và bàn giao video không có audio thay vì lén chèn audio nguồn.
7. So sánh các mốc frame `0, 50, 100, 150, 200, 250, 350, 400, 450, 500, 600, 650, 750, 800, 850, 900, 999` và **mọi keyframe / scene boundary của manifest**. Tạo contact sheet/reference-vs-render; không coi chỉ số SSIM/MAE đơn lẻ là đủ vì timing/antialiasing khác biệt.
8. Thực hiện test, `npm run build`, lint targeted; `python3 scripts/context_index.py check` nếu thay đổi indexed boundary. Commit thay đổi đúng scope trên feature branch và cập nhật PR/issue. Không merge main/force push.

## 6. Acceptance criteria (Coder self-review + user review)

- [ ] Tài liệu Task 01 và Task 02 đã hoàn thành/review trước lúc bắt đầu code.
- [ ] Video source đã truy cập, đối chiếu trực tiếp và không đưa source video vào composition/output.
- [ ] Preview dựng lại chạy **40s, 25fps, 1280×720, 1.000 frame**; ffprobe xác nhận.
- [ ] Người que, tam giác và công thức sin/cos đúng hình học/dấu toán; câu hỏi sin 120° hiển thị đúng.
- [ ] Các đối tượng, text, màu, font, stroke, chuyển cảnh và timing khớp theo manifest, sai lệch còn lại được nêu kèm timestamp/frame.
- [ ] Không có frame trắng bất ngờ, flicker, đối tượng nhảy sai vị trí, clipping, nhãn lỗi dấu hoặc text layout overflow.
- [ ] Seek frame 250 hai lần qua các trình tự khác nhau tạo cùng visual; render repeatability theo test.
- [ ] Có bằng chứng ảnh đối chiếu ít nhất các mốc được liệt kê và mọi boundary quan trọng.
- [ ] Build/tests được chạy và ghi kết quả thật; không kết luận đã hoàn thành nếu chưa có MP4 xuất thực tế.
- [ ] Không ảnh hưởng các preset, editor, API của KAI STUDIO; không thêm tùy chỉnh v1.1+.
- [ ] User được xem preview và chấp thuận hướng hình ảnh trước khi phát triển **Task 04 (dựng 40s–hết video)**.

## 7. Out of scope

- Tái dựng 40 giây còn lại trở đi; phần từ giây 40 đến hết thuộc Task 04+.
- UI đầy đủ ở route `/videos/math`, thư viện quản lý và production export long video thuộc task kế tiếp.
- AI tự sinh đề toán, thay nội dung, đổi màu/font theo lựa chọn người dùng.
- Commit dữ liệu media gốc khi chưa có quyền phân phối.

**Lưu ý quan trọng:** Khi #24 và #25 vẫn mở/thiếu artifact, Task 03 chỉ ở trạng thái **PLANNED / BLOCKED**, không phải đã giao Coder chạy hay đã có scene đầu tiên.
