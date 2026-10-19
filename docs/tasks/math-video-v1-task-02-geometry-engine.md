# Math Video v1.0 — Task 02: SVG Geometry & Animation Primitives

**Trạng thái:** PLANNED — **BLOCKED BY Task 01 / Issue #24**  
**Nhánh làm việc:** `feature/math-video-studio-v1`  
**Kế hoạch tổng thể:** [2026-10-19-math-video-studio-v1.md](../plans/2026-10-19-math-video-studio-v1.md)  
**Task 01:** [Reference benchmark & scene manifest](math-video-v1-task-01-benchmark.md)  
**Draft PR theo dõi kế hoạch:** #23

> **Không đánh dấu Task 02 hoàn thành và không thực hiện tái dựng phân cảnh cho tới khi Task 01 được xác minh và review.** Task 02 chỉ xây dựng thư viện nguyên thủy phục vụ các cảnh đã được xác nhận, không tự ước lượng timing hoặc hình dạng của video tham chiếu.

## 1. Mục tiêu

Tạo thư viện toán học và SVG primitives dùng chung cho **Math Video Studio**. Các cảnh sau này có thể mô tả bằng **tọa độ / góc / frame / tham số chuyển động** để tạo video 1280 × 720, 25 fps, với kết quả xác định khi tua tới frame bất kỳ. Chỉ cần phiên bản tối thiểu đủ phục vụ video Sin/Cos đầu tiên; chưa làm công cụ tùy chỉnh v1.1+.

## 2. Điều kiện tiên quyết (gate)

1. Task 01 / #24 được review và có `docs/video-references/math-sincos-v1.scene-manifest.json`, breakdown, benchmark hoặc có bằng chứng cụ thể những phần nào đã xác minh.
2. Xác định nhóm primitive thực sự được dùng trong cảnh; có ảnh keyframe đối chiếu để kiểm tra stroke, căn lề, tỉ lệ và màu.
3. Nếu Task 01 chưa đáp ứng: có thể **lập đề cương / lập issue**, nhưng **chưa triển khai code không thể xác minh**. Báo `BLOCKED_BY_TASK_01`.

## 3. Phạm vi chức năng

### A. Pure math geometry (TypeScript; không phụ thuộc DOM)

- `degreesToRadians`, `radiansToDegrees`, `normalizeAngle`; quy ước góc dương ngược chiều kim đồng hồ.
- `pointOnCircle(cx, cy, radius, angleDegrees)`, `projectToAxes(...)`, `distance`, `lerpPoint`.
- `rightTrianglePoints` trả về đỉnh và cạnh kề/đối/huyền theo hệ toạ độ và orientation rõ ràng, xử lý trường hợp suy biến có kiểm soát.
- Lấy mẫu `sin`/`cos`/`tan` với giới hạn miền, tránh nối đường qua tiệm cận `tan`; không cho giá trị `NaN`/`Infinity` lọt vào SVG path.
- Tách hệ tọa độ toán học `y-up` và SVG `y-down`, **không lẫn dấu sin**. Chỉ thực hiện phép biến đổi pixel ở một lớp rõ ràng.

### B. SVG primitives (React/TypeScript, không UI editor)

- `MathAxes`: trục X/Y, vạch chia, nhãn và tùy chọn lưới khi đúng benchmark.
- `RightTriangle`: 3 cạnh, ký hiệu góc vuông, cung góc, cạnh được nhấn màu.
- `UnitCircle`: đường tròn, bán kính, điểm chạy theo góc, phép chiếu `sin`/`cos`, hiển thị góc phần tư.
- `AngleArc`, `GuideLine`, `MathLabel`/`MathFormula` (text Unicode, ký hiệu độ và dấu; không mặc định phụ thuộc CDN/MathJax từ xa).
- `PlotCurve`: path định trước từ hàm sin/cos/tan; hỗ trợ reveal theo tiến trình và cắt ở discontinuity.
- `StickFigure`: các khớp đầu/tay/chân bằng SVG với pose/position xác định theo input, không mô phỏng vật lý hoặc random phụ thuộc thời gian.

**Ưu tiên đúng loại primitive trong benchmark của Task 01.** Không bắt buộc tạo thêm nếu video nguồn không dùng. Không gộp tất cả logic vào một composition khổng lồ.

### C. Motion helper deterministic

- `frameToSeconds(frame, fps)`, `clamp01`, `interpolateKeyframes(frame, keyframes)` hoặc dùng `interpolate()` / `spring()` Remotion nếu phù hợp.
- Animations chỉ phụ thuộc **frame và props bất biến**. Không `Date.now`, `Math.random` không seed, `setTimeout`, `requestAnimationFrame` hay CSS animation chạy theo wall-clock trong renderer.
- Tua `f=0 → f=250 → f=10 → f=250` cho ra **đúng cùng DOM/SVG** ở hai lần f=250.
- Hỗ trợ độ dài scene input độc lập với fps mà không thay đổi semantics của manifest `[startFrame, endFrame)`.

## 4. Bố cục code tham khảo

```text
src/features/math-video/
  lib/mathGeometry.ts
  lib/mathMotion.ts
  lib/mathVideoTypes.ts
  primitives/MathAxes.tsx
  primitives/RightTriangle.tsx
  primitives/UnitCircle.tsx
  primitives/AngleArc.tsx
  primitives/MathFormula.tsx
  primitives/PlotCurve.tsx
  primitives/StickFigure.tsx
  __tests__/mathGeometry.test.ts
  __tests__/mathMotion.test.ts
  __tests__/mathPrimitives.test.tsx
```

Đây chỉ là danh sách đề xuất. Coder phải đối chiếu convention hiện tại, tránh thêm package/layer không cần thiết; giữ file < 400 dòng khi khả thi.

## 5. Quy trình Coder

1. Checkout đúng nhánh feature; đọc `AGENTS.md`, `.agents/skills/reactjs/SKILL.md`, `docs/ai-context/README.md`; chạy `python3 scripts/context_index.py query "math video svg geometry remotion scene primitives"`.
2. Kiểm tra Task 01 / #24 và file manifest; nếu không đạt gate → báo blocked, chưa code.
3. Đối chiếu benchmark/keyframes, chốt contracts pure functions, màu sắc, stroke/tỉ lệ/font cần thiết. Không thay đổi `Root.tsx`, router hoặc export pipeline ở Task 02 trừ khi chứng minh dependency thực sự.
4. Thêm unit tests trước cho geometry/motion, triển khai minimal primitives; dùng strict typing, props reusable nhưng không over-engineer.
5. Tạo môi trường test/fixture nhỏ cho primitives bằng data hợp lệ từ Task 01, kiểm tra trực quan vài trạng thái cố định. Không gọi fixture là cảnh video đã tái dựng.
6. Chạy `npm run test -- --run` (hoặc `npm run test` theo package hiện tại), `npm run build`, lint targeted nếu có, cùng `python3 scripts/context_index.py check` khi cập nhật indexed boundary; báo lỗi có sẵn riêng.
7. Commit lên nhánh feature, cập nhật PR và issue với diff, checks, hình ảnh kiểm chứng; không merge/force push.

## 6. Acceptance criteria

- [ ] Task 01 đã nghiệm thu hoặc dependency được đánh dấu đúng trạng thái `BLOCKED_BY_TASK_01`.
- [ ] Geometry functions có unit test chính xác: sin/cos tại 0°, 30°, 90°, 120°, 180°, 270°, 360°; `sin(120°) = √3/2`, `cos(120°) = -1/2` với tolerance.
- [ ] Góc chuẩn, quadrant, phép chiếu, hệ toạ độ SVG và right-angle được chứng minh bằng test.
- [ ] Curve tan không nối qua tiệm cận; không sinh path invalid.
- [ ] SVG sample có thể render ra hình học đúng ở ít nhất 3 trạng thái frame; có screenshot/fixture so với benchmark, nêu chênh lệch.
- [ ] Seek lùi/tiến và render lại cùng frame deterministic, không phụ thuộc timing trình duyệt.
- [ ] Không thêm AI, tuỳ chỉnh UI, route mới, xuất MP4 hoặc làm cả cảnh video trong Task 02.
- [ ] Tests/build chạy thực tế; ghi kết quả cụ thể (không tuyên bố pass nếu chưa chạy).
- [ ] Không thay đổi các module khác và không thêm dependency nặng không cần thiết.

## 7. Ngoài phạm vi

- **Task 03:** dựng 40 giây đầu dùng primitives và frame cues từ Task 01; so sánh keyframes.
- **Task 04+:** dựng các cảnh còn lại, UI `/videos/math`, render MP4 và QA hoàn chỉnh.
- Không dùng video mẫu trực tiếp trong output, không tự sử dụng audio/giọng đọc có bản quyền khi chưa rõ quyền.

**Nhiệm vụ kế tiếp sau Task 02:** [Task 03 — Reference-faithful reconstruction of first 40s] sẽ được lập riêng sau khi hoàn thành nền tảng.
