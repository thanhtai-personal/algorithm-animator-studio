# Spec: Bố trí Korobeiniki dùng chung cho nhạc cụ Marble Music

## Objective

Mọi họ nhạc cụ thật trong Rhythmic Studio dùng chung ngôn ngữ bố trí wall-score của Korobeiniki: nhạc cụ gắn trên tường thành từng cụm câu, nốt nhanh được đặt gần nhau, khoảng nghỉ dài có đoạn chuyển rõ ràng và camera đủ rộng để người xem theo dõi mà không chóng mặt.

Phạm vi gồm `piano`, `xylophone`, `marimba`, `vibraphone`, `boomwhacker`, `pluck`, `metallophone`, `gong`, `flute` và các họ nhạc cụ được resolver của `mixed` chọn theo từng đoạn. Các course phi nhạc cụ như Color Pegs và Neon Comet giữ bố trí riêng.

## Assumptions

1. “Giống Korobeiniki” là giống thuật toán bố trí, nhịp chuyển cụm, ray và camera; không biến mọi nhạc cụ thành ống.
2. Mỗi họ giữ đúng mesh, playing surface, collision footprint, màu nốt và âm thanh riêng.
3. Mỗi nhạc cụ được xoay theo pháp tuyến va chạm đã giải để mặt chơi đón hướng bi đến và hướng nảy đi hợp lý; góc xoay không chỉ dùng để trang trí.
4. Wall-score trở thành bố trí mặc định/bắt buộc cho mọi họ nhạc cụ thật; các layout cũ không còn thay đổi course của nhóm này.
5. Trang trí chữ Korobeiniki và năm ống dẫn nhập chỉ xuất hiện trong preset tham chiếu Korobeiniki.
6. Preview 2D, preview 3D và video export phải dùng cùng course và settings resolver.

## Tech Stack

- React 18, TypeScript, Vite.
- Three.js/React Three Fiber và Canvas 2D hiện có.
- Worker chuẩn bị marble course hiện có.
- Vitest cho logic, geometry và regression.

## Commands

- Test mục tiêu: `npx vitest run src/test/RhythmicSharedWallScoreLayout.test.ts src/test/RhythmicMixedInstrumentPhrases.test.ts src/test/RhythmicKorobeinikiPreset.test.tsx src/test/RhythmicInstrumentPlayingSurface3D.test.ts`
- Full test: `npm test`
- Build bắt buộc: `npm run build`
- Dev: `npm run dev:client`

## Project Structure

- `src/features/rhythmic-studio/lib/wallScoreLayout.ts`: thuật toán vị trí, khoảng cách nốt nhanh, cụm câu và ray dùng chung.
- `src/features/rhythmic-studio/lib/korobeinikiReferenceLayout.ts`: chỉ còn dữ liệu đo và trang trí riêng của preset Korobeiniki.
- `src/features/rhythmic-studio/lib/marbleCourse.ts`: chọn wall-score builder cho mọi concrete instrument family.
- `src/features/rhythmic-studio/engine/presetObstaclePlan.ts`: chọn style riêng theo family.
- `src/features/rhythmic-studio/components/*`: camera, ray và lifecycle nhận diện wall-score chung thay vì chỉ Korobeiniki.
- `src/test/*`: test dùng chung và hồi quy Korobeiniki.

## Code Style

```ts
export function usesSharedWallScore(settings: StudioSettings) {
  return settings.instrumentFamily !== "auto";
}

export function wallScoreStyleForFamily(
  family: InstrumentFamily,
): PlatformStyle {
  // Trả về style thật của family; không hard-code wall-boomwhacker-tube.
}
```

- Hàm layout thuần không phụ thuộc React hoặc Three.js.
- Dữ liệu Korobeiniki riêng không rò vào các family khác.
- Ưu tiên resolver hiện có thay vì tạo thêm state song song.
- Mọi source file mới hoặc được chạm không quá 400 dòng.

## Testing Strategy

- Unit: mọi concrete family nhận cùng chuỗi hit position/timing từ một MIDI nhưng style khác nhau đúng family.
- Geometry: bi tiếp xúc playing surface, nhạc cụ xoay theo collision normal và bi không xuyên mesh của từng family.
- Phrase/spacing: nốt nhanh co khoảng cách thay vì tăng tốc; nghỉ dài tạo boundary/ray.
- Integration: Mixed đổi family nhưng giữ cùng wall-score course; worker payload và export resolver nhất quán.
- Regression: Korobeiniki vẫn giữ 39 nốt, màu/ống/trang trí riêng và camera `1.14`.

## Boundaries

- Always: giữ timing MIDI; giữ geometry/audio riêng; dùng cùng course cho preview/export; bảo toàn Korobeiniki reference.
- Ask first: biến các preset phi nhạc cụ thành wall-score; xóa lựa chọn layout khỏi UI; thay đổi tempo hoặc thời gian nốt.
- Never: hard-code mọi platform thành `wall-boomwhacker-tube`; dùng tốc độ bi cao để bù nốt nhanh; bỏ collision test.

## Success Criteria

1. Cùng một MIDI tạo vị trí/cụm wall-score tương đương cho mọi concrete instrument family.
2. Piano vẫn là phím Piano, Gong vẫn là Gong, Flute vẫn là ống sáo; âm thanh va chạm tương ứng không đổi.
3. Góc xoay của từng nhạc cụ làm mặt chơi vuông góc hợp lý với hướng va chạm, và đường bi chạm đúng playing surface.
4. Nốt nhanh làm nhạc cụ gần nhau; tốc độ bi không tăng đột ngột.
5. Các khoảng nghỉ dài tạo đoạn chuyển và ray như Korobeiniki.
6. Camera của mọi wall-score dùng framing rộng và chuyển động ổn định.
7. Mixed có thể đổi family theo câu nhưng không đổi hệ bố trí.
8. Không có bi xuyên nhạc cụ trong các mẫu kiểm tra của mọi family.
9. Test mục tiêu và `npm run build` pass; file chạm không quá 400 dòng.

## Implementation Plan

1. Viết test contract cho shared wall-score bằng ba family đại diện: Piano, Gong và Flute.
2. Tách primitive layout/rail khỏi phần reference-only của Korobeiniki.
3. Áp dụng builder chung và style resolver cho toàn bộ concrete families và Mixed.
4. Tổng quát hóa camera, ray, viewport lifecycle, góc xoay theo collision normal và collision clearance.
5. Chạy regression cho toàn bộ family, Korobeiniki, 2D/3D và build.

## Open Questions

- Cần xác nhận các assumptions, đặc biệt việc giữ Color Pegs/Neon ngoài phạm vi và không biến mọi nhạc cụ thành ống.
