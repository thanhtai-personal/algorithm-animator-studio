# Spec: Preset Nhạc cụ hỗn hợp

## Objective

Thêm preset `mixed-instruments` (hiển thị tiếng Việt là “Nhạc cụ hỗn hợp”) cho Rhythmic Studio. Preset dùng một chuỗi nhạc cụ theo các đoạn liên tục của MIDI, tự tạo cấu hình ban đầu từ các câu nhạc và khoảng nghỉ, đồng thời cho phép người dùng chỉnh nhạc cụ và thời lượng từng đoạn trong một right drawer.

Người dùng thành công khi có thể:

- Chọn preset Nhạc cụ hỗn hợp từ danh sách preset nhanh.
- Bấm nút “Chỉnh phối nhạc cụ” chỉ xuất hiện khi preset này được chọn.
- Xem cấu hình mặc định được tạo từ MIDI hiện tại.
- Đổi nhạc cụ, chỉnh thời lượng, thêm hoặc xóa đoạn và khôi phục gợi ý tự động.
- Nghe/xem đúng nhạc cụ theo từng đoạn trong preview và video export.

## Assumptions

1. Thời lượng là thời gian một nhạc cụ giữ vai trò chính trên timeline, không phải độ ngân của một nốt.
2. Mỗi thời điểm chỉ có một nhạc cụ chính; các đoạn được chuẩn hóa thành chuỗi liên tục, không chồng lấn.
3. Mặc định ưu tiên đổi nhạc cụ tại khoảng nghỉ sau khi nhạc cụ hiện tại đã chạy 2–5 câu nhạc. Mục tiêu thông thường là 3 câu; trong MIDI dày, dùng điểm thở tốt nhất trong phạm vi này.
4. Khi người dùng sửa thời lượng, ranh giới được bám vào nốt gần nhất để không chia đôi một hợp âm. Đoạn cuối tự phủ đến hết bài.
5. Khi đổi/import MIDI mới trong lúc preset đang được chọn, cấu hình mặc định được tạo lại cho MIDI mới.
6. Auto Mix hiện tại (đổi toàn bộ preset) vẫn là tính năng độc lập và không được bật đồng thời sau khi người dùng chọn preset Nhạc cụ hỗn hợp.

## Tech Stack

- React 18, TypeScript, Vite.
- MobX store hiện có cho trạng thái Rhythmic Studio.
- shadcn/Radix `Sheet`, `Select`, `Input`, `Button` cho right drawer.
- Vitest và Testing Library cho logic và UI.
- Worker chuẩn bị course hiện có; dữ liệu mix phải structured-clone được.

## Commands

- Test logic/UI mục tiêu: `npx vitest run src/test/RhythmicMixedInstrumentPhrases.test.ts src/test/RhythmicInstrumentMixDrawer.test.tsx src/test/RhythmicPreparedChaseCourse.test.ts`
- Full test: `npm test`
- Build bắt buộc: `npm run build`
- Dev: `npm run dev:client`

## Project Structure

- `src/features/rhythmic-studio/lib/phraseInstrumentMix.ts`: phát hiện câu, tạo plan mặc định 2–5 câu/nhạc cụ và resolver theo event.
- `src/features/rhythmic-studio/store/RhythmicStudioStore.ts`: lưu plan hiện tại và các thao tác cập nhật.
- `src/features/rhythmic-studio/engine/*`: chuyển plan qua worker và dùng cùng resolver khi dựng course.
- `src/features/rhythmic-studio/presentation/InstrumentMixDrawer.tsx`: nút và form right drawer.
- `src/features/rhythmic-studio/lib/studioPresets.ts`: khai báo preset mới.
- `src/features/rhythmic-studio/*I18n.ts`: nhãn tiếng Việt/Anh.
- `src/test/*`: test logic, worker serialization và hành vi drawer.

## Data Contract

```ts
interface InstrumentMixSegment {
  id: string;
  family: PhraseInstrumentFamily;
  startMs: number;
  endMs: number;
}
```

- `startMs` và `endMs` được lưu bằng millisecond trên timeline đã đồng bộ.
- Form hiển thị `durationSeconds = (endMs - startMs) / 1000`.
- Mọi cập nhật chạy qua hàm chuẩn hóa thuần để bảo đảm số hữu hạn, thời lượng dương, không chồng lấn và phủ đến cuối MIDI.
- Plan được lưu cùng project local; dữ liệu MIDI/audio vẫn tuân theo chính sách re-import hiện tại.

## Code Style

```ts
export function instrumentFamilyAtTime(
  segments: readonly InstrumentMixSegment[],
  timeMs: number,
): PhraseInstrumentFamily | null {
  const segment = segments.find((item) => timeMs >= item.startMs && timeMs < item.endMs);
  return segment?.family ?? segments.at(-1)?.family ?? null;
}
```

- Hàm phân tích MIDI và chuẩn hóa plan phải là hàm thuần, có tên mô tả kết quả.
- Component form là controlled UI gọi action của controller/store.
- Không thêm dependency và không refactor UI ngoài Rhythmic Studio.
- Mọi source file mới hoặc được chạm phải không quá 400 dòng.

## Testing Strategy

- Unit: nhận diện ranh giới câu, gom 2–5 câu, ưu tiên khoảng nghỉ lớn, tra nhạc cụ theo thời gian và chuẩn hóa duration.
- Integration: worker payload giữ nguyên plan và course tạo style nhạc cụ đúng ở hai phía ranh giới.
- Component: nút chỉ hiện khi preset mới được chọn; mở right drawer; đổi select/duration gọi đúng action; reset tạo lại plan tự động.
- Regression: preset đơn, Auto Mix, single/chase mode và audio dựa trên platform vẫn hoạt động.

## Boundaries

- Always: giữ Auto Mix cũ độc lập; dùng cùng plan cho preview/export; tự tạo lại default khi đổi MIDI; chạy test mục tiêu và build.
- Ask first: thay đổi cách lưu project hiện có không tương thích ngược; thêm dependency; cho nhiều nhạc cụ phát đồng thời.
- Never: đổi nhạc cụ giữa các nốt cùng timestamp; bỏ test đang lỗi để làm suite xanh; sửa rộng shadcn/generated UI.

## Success Criteria

1. Danh sách có preset “Nhạc cụ hỗn hợp”.
2. Chỉ khi preset này active mới có nút mở form trong right drawer.
3. MIDI có đủ độ dài tạo ít nhất hai đoạn với hai nhạc cụ khác nhau; mỗi đoạn mặc định thường chứa 2–5 câu và ranh giới ưu tiên khoảng nghỉ.
4. Người dùng chỉnh được nhạc cụ và thời lượng bằng giây, thêm/xóa đoạn và reset về gợi ý MIDI.
5. Các đoạn luôn liên tục từ đầu đến cuối timeline, không chia hợp âm cùng timestamp.
6. Course 2D/3D, âm thanh MIDI theo va chạm, playback và export đều dùng cùng plan.
7. Plan được lưu/tải cùng project và được structured-clone qua worker.
8. Test mục tiêu pass, `npm run build` pass, các file chạm không quá 400 dòng.

## Implementation Plan

1. Mở rộng model và logic phrase mix bằng test thuần trước.
2. Truyền plan qua store, project storage, controller và worker; kiểm thử serialization/course.
3. Thêm preset mới và nối resolver dùng chung cho stage/course/audio hiện có.
4. Thêm right drawer và test hành vi UI.
5. Chạy regression liên quan, kiểm tra số dòng và build.

## Open Questions

- Không còn câu hỏi chặn triển khai nếu các assumptions phía trên đúng.
