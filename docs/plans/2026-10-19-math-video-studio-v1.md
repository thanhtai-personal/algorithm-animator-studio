# KAI STUDIO — Math Video Studio v1.0

**Loại tài liệu:** đặc tả triển khai / handoff cho Coder  
**Repo mục tiêu:** `thanhtai-personal/algorithm-animator-studio` (nhánh `main`, chỉ đọc tại thời điểm phân tích)  
**Nguồn tham chiếu:** video đính kèm `FDown.vn_Tai_video_Facebook_720p (HD)_0dc1.mp4`  
**Trạng thái:** KẾ HOẠCH — chưa thay đổi source / chưa render bản tái dựng.

## 1. Mục tiêu và nguyên tắc

Tạo một màn hình **Video toán học / Math Video Studio** mới trong KAI STUDIO. Phiên bản đầu tiên chỉ có **01 template: “Sin, cos và ứng dụng – tái dựng video mẫu”**. Tái dựng bằng đồ họa/code/animation thực sự, KHÔNG gọi video gốc rồi xuất lại, KHÔNG dựng một slideshow tĩnh hoặc chỉ lồng các frame chụp từ video. Đối chiếu từng phân cảnh, nhịp cắt, chuyển động, typography, màu sắc, bố cục và âm thanh theo bản tham chiếu. Giữ nguyên các module khác.

“Giống hệt” được hiểu là **mục tiêu độ trung thực thị giác, nhịp và nội dung rất cao**, không cam kết pixel-perfect khi thiếu project/font/source animation gốc. Báo cáo minh bạch các đoạn chưa khớp. Sửa bản v1 tới khi user nghiệm thu trước khi thêm tùy chỉnh.

## 2. Thông số kiểm tra trực tiếp từ video upload

- Container: MP4; codec video H.264, audio AAC stereo 48 kHz.
- Kích thước: **1280×720 px**, tỷ lệ **16:9**.
- Tốc độ hình: **25 fps**, CFR.
- Video có **15.217 frame**; tương ứng **608,68 giây** hình ảnh. Container/audio ghi duration gần **608,77 giây** (~10:09).
- Nền chủ đạo **đen**, vector tối giản trắng/xám; nhấn **xanh cyan** và **cam**, một số vùng mờ xám.
- Visual grammar: người que, tam giác, đường tròn lượng giác, cung góc, phương trình, tia chiếu, sóng sin/cos, đồ thị tan, hình minh họa vật lý, địa cầu và điện xoay chiều; thông tin/chuyển động xuất hiện theo nhịp lời trình bày.
- Text/công thức nhiều tiếng Việt; cần dùng font hỗ trợ Unicode, glyph toán, dấu và ký hiệu chính xác.

## 3. Storyboard khảo sát (mốc GẦN ĐÚNG, chưa phải edit decision list tới từng frame)

| Khoảng khảo sát | Nội dung / các dạng hình cần tái dựng |
| --- | --- |
| `00:00–00:40` | Người que mở đầu; tam giác vuông; tỷ lệ sin đối/huyền, cos kề/huyền; câu hỏi “sin 120° = ?”; minh họa phép đo góc/bảng. |
| `00:40–01:50` | Mặt phẳng/đường tròn lượng giác; vectơ bán kính, đối/kề, tọa độ dọc; điểm di chuyển theo góc, 120°, các dấu/quadrant. |
| `01:50–02:50` | Quan hệ của sin/cos qua đường tròn; đối xứng và góc; minh họa `sin² + cos² = 1` và hai bình phương thành hình diện tích. |
| `02:50–03:40` | Chuyển từ chuyển động tròn sang sóng; diễn giải lịch sử/cách dùng lượng giác; đường cos dao động. |
| `03:40–04:00` | Tam giác và góc bù phụ; công thức `cos α = sin (90°−α)` và các nhãn chữ. |
| `04:00–04:55` | `tan = sin / cos`, vòng tròn, tiếp tuyến, đường tiệm cận, đồ thị tan tăng vọt, giá trị bị gián đoạn; chú thích. |
| `04:55–05:50` | Dây/cung/chord trên đường tròn, chuyển đổi khái niệm “sinus/sin”; minh họa hình học và âm thoa/sóng. |
| `05:50–06:15` | Sóng/âm thoa, vô hạn; chuyển cảnh với người que và tia sáng. |
| `06:15–07:05` | Ứng dụng trong thiên văn/đo đạc: địa cầu, tia sáng, kích thước, đồ thị dòng trục, góc nhìn/chân trời. |
| `07:05–08:25` | Tính chiều cao/cây bằng tang và khoảng cách; độ dốc/đường dốc/đo đạc, biến thiên tỷ lệ; người que và hình tam giác. |
| `08:25–09:20` | Sóng AC 50 Hz, vòng tròn quay và hai sóng lệch pha, điện áp 220 V, vectơ pha. |
| `09:20–10:09` | Quay lại đường tròn sin, nhân vật/tam giác và câu hỏi “sin 120° = ?” để khép chủ đề. |

**Bắt buộc trước khi viết scene:** Coder cần xem toàn bộ video, chạy shot/scene breakdown ở bước 1–5 giây hoặc dày hơn tại đoạn chuyển cảnh, trích các keyframe lớn, xuất `scene-manifest.json` có `startFrame`, `endFrame`, title, elements, animation cues, subtitles/captions, sound cues. Bảng trên chỉ là *map nội dung sơ bộ*, KHÔNG được dùng để đoán timing chuẩn.

## 4. Source hiện có — cơ hội tái sử dụng

Đã đọc các file ở nhánh main:

- `src/App.tsx`: router React lazy, KAI STUDIO shell.
- `src/components/appNavigation.ts`: menu theo nhóm, i18n Việt/Anh.
- `src/lib/menuFeatureSettings.ts`: bật/tắt feature menu và trạng thái lưu ở localStorage.
- `src/features/remotion-video/remotion/Root.tsx`: registry composition.
- `src/features/preset-video/presetVideoRegistry.ts` + `PresetVideoComposition.tsx`: đăng ký preset động.
- `server/routes/videoRoutes.ts`: `/api/video/render-preset` có tiến độ dạng NDJSON.
- `server/services/PresetVideoRenderService.ts`: nhận `landscape-720p` và thời lượng tới 30 phút; progress rendering/muxing/verifying.
- `server/services/RemotionRenderService.ts`: nhánh `AlgorithmExplainer` riêng **clamp duration tối đa 600 giây**; **KHÔNG tái sử dụng trực tiếp cho video 608,68 giây** trừ khi có điều chỉnh có kiểm thử. Bundle Remotion đã được chia sẻ.
- `src/pages/VideoCreate.tsx`: thư viện video và editor; tránh tạo thư viện output thứ hai.
- `AGENTS.md`: cần đọc local ReactJS skill, AI context index trước khi sửa code; build trước khi bàn giao; tệp source mới/chạm ưu tiên <=400 dòng.

**Khuyến nghị thiết kế:** Đăng ký video đầu tiên như một preset/composition được phát triển trong `src/features/math-video/` (hoặc thư mục tương đương theo conventions hiện tại), sử dụng composition của hệ Remotion, kết nối luồng `render-preset` hiện có **sau khi kiểm tra hợp đồng dữ liệu của preset**. Tuy nhiên UI là màn riêng `/videos/math` để phát triển thành loại video độc lập. Không ép template toán vào `AlgorithmExplainer` (hiện thiên về card/bars), không thêm renderer song song.

## 5. Màn hình UI v1

- Đường dẫn dự kiến `/videos/math`.
- Một item ở sidebar: **Video toán học / Math Video**, trong nhóm phù hợp với cấu trúc hiện tại; bổ sung menu feature-id và đặt bật theo mặc định nếu người dùng cần mở ngay.
- Header: `Video toán học` và subtitle `Tái dựng video Sin – Cos`.
- Main content: **một preview 16:9 lớn** (Remotion Player) và **thanh điều khiển** Play/Pause, timecode, scrub, nhảy tới scene; danh sách chapter gọn bên dưới/ở một panel duy nhất. Không có nhiều scrollbar lồng nhau.
- Khu thao tác: trạng thái Remotion health, nút **Tạo video MP4** là primary; trạng thái chuẩn bị/đang render/xác minh/thành công/thất bại + tiến độ render thật nếu pipeline cung cấp.
- Khi thành công: xem video kết quả, mở/tải file, xuất hiện trong thư viện video có sẵn.
- Optional QA local: nếu user tải video tham chiếu, có thể so sánh 2 video đồng bộ timecode cạnh nhau (UI này dành cho kiểm thử, không nằm trong composition video).
- Tạo được cả khi user chưa upload file tham chiếu ở runtime: template đã được code hóa. Không phụ thuộc internet, AI model, TTS, cloud rendering hoặc tệp video gốc để phát/để xuất bản tái dựng (ngoại trừ asset hợp lệ được đóng gói).
- Cần loading/empty/error, keyboard focus và giao diện desktop/responsive phù hợp.
- Không thêm bảng điều khiển tùy biến style/đề tài/số liệu trong v1.

## 6. Cấu trúc kỹ thuật khuyến nghị

```
src/features/math-video/
  components/MathVideoPreview.tsx
  components/MathVideoSceneList.tsx
  compositions/MathVideoComposition.tsx
  scenes/<01_intro, 02_unit_circle, 03_identity, ...>.tsx
  primitives/MathAxes.tsx
  primitives/UnitCircle.tsx
  primitives/RightTriangle.tsx
  primitives/MathFormula.tsx
  primitives/PlotCurve.tsx
  primitives/StickFigure.tsx
  data/sceneManifest.ts
  lib/mathGeometry.ts
  lib/mathVideoTypes.ts
  __tests__/<relevant-tests>.test.ts
src/pages/MathVideoStudio.tsx
```

Paths minh họa, Coder cần điều chỉnh theo repo. Phân chia theo **scene**, tránh một component dài hàng nghìn dòng dùng điều kiện `frame` tràn lan. Chuyển động luôn được tính từ `useCurrentFrame()` hoặc input frame, **deterministic**, seek tới frame bất kỳ phải cho ra cùng một hình. Toán học đúng về góc, sin/cos/tan, hướng quay, dấu theo góc phần tư; SVG 2D cho vector, line/circle/text, Canvas chỉ khi chứng minh hiệu quả hơn; overlay ký hiệu bằng HTML/SVG/MathJax nếu cần và phải xử lý render ổn định. Không capture video bằng `MediaRecorder` để thay thế render deterministic.

**Audio:** trích timeline cue/audio từ video nguồn phục vụ phân tích. Không mặc định sử dụng hoặc phân phối lại nhạc/giọng đọc gốc khi chưa có quyền; hỗ trợ import track đã được phép sử dụng. Nếu âm thanh là yếu tố bắt buộc cho “giống hệt”, báo rõ phụ thuộc asset/rights trước khi nghiệm thu. Không tự suy diễn câu thoại chỉ từ ảnh.

**Timeline contract:** `fps=25`, `width=1280`, `height=720`, `durationInFrames=15217`, local `startFrame`, `endFrame` rõ ràng, không scene chồng/thiếu frame ngoài các overlay chủ động. Với audio mux, target gần 608,68s và xác nhận ngoại lệ container được nêu ở phần thông số.

## 7. Tasks tuần tự cho Coder

1. **DISCOVER & BENCHMARK:** đọc `AGENTS.md`, React skill, `docs/ai-context/README.md`, index, code route/renderer. Phân rã video gốc frame-based; lưu manifest/keyframe/screenshots để review. Không commit video nguồn vào repo; tránh tải binary lớn khi không cần.
2. **FOUNDATION:** viết geometry helpers thuần (deg/rad, circle point, projection, tan asymptote, waves), primitives SVG, golden fixtures; unit tests cho góc 0/30/60/90/120/180/270/360 và tan gần 90°.
3. **MVP VISUAL:** hoàn thành cảnh 0–40s đầu thật sát mẫu. Dựng preview và kiểm thử scrub at arbitrary frame; user xác nhận phong cách/scale trước khi mở rộng 10 phút.
4. **REBUILD FULL TIMELINE:** triển khai lần lượt toàn bộ chapters; tự đối chiếu screenshot/clip theo checkpoints 10–15s và tại chuyển cảnh. Giữ màu, ngôn ngữ, font, camera, mật độ thông tin và chuyển động đồng bộ.
5. **UI & ROUTING:** thêm trang riêng, menu feature, i18n, preview, chapters, render action; không thay đổi hệ thống navigation hiện tại ngoài item mới.
6. **EXPORT INTEGRATION:** dùng preset/composition renderer đã có; thử export đoạn 5s -> 40s -> full 15.217 frames. Theo dõi thực tế tiến độ; output lưu thư viện hiện có; không để render chặn UI/crash khi ngắt kết nối; xử lý cancel/retry nếu hạ tầng hiện tại hỗ trợ, không hứa trước.
7. **VISUAL QA:** tạo bảng đối chiếu *reference vs generated* ở cùng timecode; review ít nhất tại từng scene boundary và các mốc 0s, 15s, 30s, rồi cứ 15–30s đến hết 10:09. Lưu `qa-report.md` với cảnh sai và link ảnh minh chứng; sửa cho đến khi nghiệm thu.
8. **VERIFY & DELIVER:** `npm run build`, typecheck/lint/tests liên quan, render ngắn và render full thực tế, ffprobe thông số, kiểm tra A/V; PR riêng, không đụng main/không force push, ghi rõ các điểm chưa giống mẫu. Không gọi là hoàn thành nếu chỉ có giao diện hoặc preview mock.

## 8. Acceptance criteria v1.0 (Definition of Done)

- [ ] Sidebar có Video toán học; route trực tiếp hoạt động, bilingual label đúng; các trang cũ không bị ảnh hưởng.
- [ ] Chỉ một preset `Sin & Cos — Reference Replica` đã định hình sẵn; không đòi nhập prompt/tùy chỉnh.
- [ ] Full **15.217 frame ở 25 fps, 1280×720, 16:9**, được *render từ composition*, không phải remux/cắt ghép nguyên bản nguồn.
- [ ] Toàn bộ cảnh/công thức/đồ thị/người que/vật lý có trong video nguồn được tái tạo; không dùng placeholder, ảnh tĩnh thay diễn hoạt, thiếu chương hoặc video ngắn hơn.
- [ ] Seek/preview bất kỳ frame mượt và deterministic; chart/tan, góc, nhãn không sai toán, text Việt có dấu chính xác.
- [ ] Có audio phù hợp và được phép sử dụng, đồng bộ; nếu chưa có track bản quyền hợp lệ, báo blocker minh bạch.
- [ ] Hiển thị tiến độ render thực, tình trạng lỗi và output; MP4 đã xuất được xác minh phát đến cuối.
- [ ] Có bảng compare screenshot cùng timecode, người dùng nghiệm thu độ giống bằng mắt; không tuyên bố 100% pixel-identical nếu chưa đo/thiếu asset.
- [ ] Build, tests, export full pass; PR riêng với screenshot, đường dẫn sample, hướng dẫn chạy, log kiểm thử; không làm hỏng module khác.

## 9. Roadmap SAU khi nghiệm thu v1

- **v1.1 – Custom ngoại hình:** đổi palette, font, stroke, vị trí nhãn, intro/outro, logo/watermark, time stretch từng scene; giữ bài học gốc.
- **v1.2 – Custom bài toán:** góc/quadrant, hàm sin/cos/tan, khoảng giá trị, đồ thị/tam giác/chữ, dữ liệu JSON kịch bản và validation toán học.
- **v1.3 – Timeline editor:** đổi thứ tự cảnh, thêm/bớt scene, điều chỉnh keyframes/sound cues và preset save/load.
- **v2.0 – Tạo theo đề tài:** chọn chủ đề (lượng giác, hình học, đại số, vật lý toán), AI đề xuất kịch bản; kiểm duyệt nội dung toán học và render; nhiều template.

## 10. Coder handoff prompt

> Hãy triển khai **Math Video Studio v1.0** trong `thanhtai-personal/algorithm-animator-studio` theo tài liệu kế hoạch này và video mẫu đính kèm. V1 phải tái dựng *toàn bộ* video 10:09, 1280×720, 25fps, 15.217 frame bằng Remotion/vector animation thật, đúng timeline và nội dung, không phát lại video gốc, không xuất slideshow. Trước khi code, làm scene manifest theo frame và kiểm tra cấu trúc repo hiện tại. Ưu tiên tái sử dụng registry/pipeline preset có streaming render progress, route/sidebar/library có sẵn; tạo trang `/videos/math` riêng. Làm từng bước: benchmark → geometry/primitives → tái dựng 40 giây đầu → full scenes → UI → export full → visual QA → tests/build. Mỗi lần báo cáo kèm output kiểm chứng, các sai lệch so với mẫu và blocker, không tự tuyên bố đã giống hệt. Chỉ làm v1, chưa thêm tính năng custom/AI. Tạo PR mới; không push trực tiếp main, không force push và không refactor ngoài phạm vi.