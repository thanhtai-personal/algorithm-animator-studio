# Spec: Âm thanh nhạc cụ và đèn theo màu nốt

## Trạng thái

Chờ người dùng duyệt trước khi triển khai.

## Mục tiêu

Mỗi va chạm trong Rhythmic Studio phải tạo thành một sự kiện âm thanh–hình ảnh thống nhất:

```text
MIDI note → nhạc cụ vật lý bị chạm → âm sắc đúng nhạc cụ
          → màu nốt chuẩn → đèn trên đúng nhạc cụ sáng cùng màu
```

Ánh xạ này phải dùng chung trong xem trước, phát nhạc và video xuất, ở cả chế độ 2D lẫn 3D.

## Các quyết định đề xuất cần duyệt

1. **Màu nốt:** dùng 12 màu cố định cho 12 pitch class C, C#, D, D#, E, F, F#, G, G#, A, A#, B. Cùng tên nốt ở các quãng tám giữ nguyên hue để khán giả học được quan hệ nốt–màu; quãng tám chỉ thay đổi độ sáng tối đa ±8%, không tạo màu mới.
2. **Chiêng và sáo:** bổ sung nhạc cụ thật sự, gồm style/hình học `gong-disc` và `flute-pipe`, không giả lập bằng cách gọi cymbal/rail là chiêng/sáo. Cymbal hiện có vẫn là cymbal và có âm riêng.
3. **Hợp âm:** phát tất cả nốt trong hợp âm. Một bề mặt đại diện cho hợp âm có dải LED chia thành các đoạn theo màu từng nốt; không chọn một màu duy nhất rồi làm mất thông tin các nốt còn lại.
4. **Quy tắc ưu tiên âm:** loại vật thể thực tế bị bi chạm quyết định âm sắc. Dữ liệu GM program/percussion của MIDI chỉ là fallback khi vật thể là loại chung, không được làm trống phát tiếng piano hay chiêng phát tiếng marimba.
5. **Âm nhạc cụ gốc:** bật mặc định cho preset nhạc cụ. Tùy chọn synth thủ công vẫn được giữ làm fallback cho platform chung và không làm thay đổi âm của drum/gong/flute đã nhận diện.
6. **Không dùng sample có bản quyền không rõ nguồn:** giai đoạn này tổng hợp âm bằng Web Audio để âm thanh đi cùng project và được ghi vào export. Sample ngoài chỉ được thêm sau khi có nguồn và giấy phép rõ ràng.

## Hiện trạng và nguyên nhân cần sửa

- `useRhythmicPlayback` đang chọn âm theo `settings.instrumentFamily`, không nhận platform/style thực tế của va chạm. Preset mixed/corridor vì vậy có thể hiện cymbal nhưng phát âm của nhạc cụ khác.
- Callback va chạm hiện chỉ truyền `NoteEvent`; nó chưa truyền chỉ số/platform đã bị chạm nên audio không có đủ thông tin để chọn nhạc cụ chính xác.
- `paletteColor` còn dùng index, pitch tương đối và palette. Cùng một MIDI note có thể đổi màu theo vị trí hoặc preset.
- Chưa có synth voice riêng cho gong và flute; `metal-hit` quá ngắn để đại diện cho tiếng chiêng ngân.
- Chưa có family/style/mesh riêng cho flute hoặc gong.
- 3D có emissive material nhưng một số bề mặt kim loại phát sáng quá yếu; một số đèn còn giữ sáng sau va chạm thay vì có attack/hold/decay rõ ràng.
- Hai renderer đã dùng `platform.color`, nhưng chưa có một hàm màu nốt chuẩn làm nguồn sự thật duy nhất.
- Audio export đã lấy track từ AudioEngine. Nếu mọi va chạm đi qua cùng engine, âm mới có thể được ghi trong cả video 2D và 3D mà không thay kiến trúc export.

## Phạm vi chức năng

### 1. Hồ sơ nhạc cụ chuẩn

Tạo một module thuần dữ liệu cho từng loại nhạc cụ:

- `piano-key`, `piano-keyboard` → piano.
- `xylophone-key`, `xylophone-bar`, `instrument-key` → xylophone/mallet.
- `marimba-bar` → marimba.
- `vibraphone-bar` → vibraphone.
- `boomwhacker-tube` → boomwhacker/tube.
- `pluck-pad`, `instrument-wire` → plucked string.
- `drum-disc` → drum; drum MIDI có thể chọn kick/snare/tom trong cùng họ trống.
- `instrument-cymbal` → cymbal với attack sáng và decay vừa.
- `gong-disc` → gong với partial phi điều hòa và decay dài.
- `flute-pipe` → flute với breath transient và tonal sustain theo pitch.
- `instrument-rail` → tuned metal/metal hit.
- `instrument-pad` → percussion pad; nếu `event.isDrum` thì dùng loại trống MIDI, nếu không thì dùng mallet trung tính.
- Các platform trang trí/chung → GM program của MIDI nếu có, sau cùng mới dùng synth preset thủ công.

Module trả về một `InstrumentVoiceId`, không để component UI tự chọn `SynthPreset` rời rạc.

### 2. Màu nốt chuẩn

Tạo `noteColorForMidi(midi)` độc lập với index, preset, renderer và palette nghệ thuật.

Bảng màu đề xuất:

| Nốt | Màu | Hex |
| --- | --- | --- |
| C | đỏ san hô | `#ff5d68` |
| C# | cam đỏ | `#ff7a45` |
| D | cam | `#ff9f3f` |
| D# | vàng hổ phách | `#ffc247` |
| E | vàng chanh | `#e6dc52` |
| F | xanh lá | `#70d66b` |
| F# | xanh ngọc | `#42d5a8` |
| G | cyan | `#42cfe8` |
| G# | xanh lam | `#4ca4ff` |
| A | chàm | `#6f7cff` |
| A# | tím | `#a86df2` |
| B | hồng tím | `#e266d3` |

Màu thân/vật liệu nền có thể tiếp tục theo preset, nhưng LED/emissive, ripple va chạm, hạt va chạm và màu bi chuyển tiếp tại nốt phải lấy từ màu nốt chuẩn. Không để material metallic làm lệch hue đến mức nhìn thành màu khác.

### 3. Sự kiện va chạm thống nhất

Thay callback `onNote(event)` bằng dữ liệu va chạm có định danh rõ:

```ts
interface InstrumentHitEvent {
  event: NoteEvent;
  platformIndex: number;
  platformStyle: PlatformStyle;
  noteColor: string;
  chordEvents?: NoteEvent[];
}
```

2D và 3D cùng tạo sự kiện từ `platform.event`, không suy ngược theo thời gian ở audio hook. Seek/resume không được phát lại nốt trước playhead; mỗi event chỉ phát một lần trong một playback token.

### 4. Âm thanh Web Audio

Bổ sung voice riêng, có tham số và envelope có thể kiểm thử:

- Drum: transient noise + thân màng có pitch drop; biến thể kick/snare/tom theo percussion note.
- Cymbal: noise kim loại/high-pass, attack gần tức thời, decay vừa.
- Gong: các partial phi điều hòa, attack mềm hơn cymbal, decay dài, pitch vẫn liên hệ với MIDI note.
- Flute: oscillator gần sine/triangle, breath-noise ngắn, attack mềm, vibrato rất nhẹ, sustain theo duration.

Tất cả voice đi qua bus/master/compressor hiện tại, tôn trọng volume, brightness, stereo width, reverb và được nối vào record destination. Không tạo `AudioContext` mới cho từng nốt.

Ngưỡng bảo vệ:

- Không im lặng ngoài ý muốn.
- Không NaN/Infinity trong automation.
- Peak từng voice và hợp âm đại diện không clip trước compressor.
- Không để node chạy vô hạn sau khi voice kết thúc.

### 5. Đèn nhạc cụ

Tách hàm tính pulse thuần cho đèn với ba pha attack/hold/decay theo thời điểm va chạm. Giá trị màu luôn là `noteColor` của hit đang hoạt động.

- 3D: thêm LED/emissive component rõ ràng cho drum, cymbal, gong, flute và các thanh phím; thân vật liệu vẫn giữ đặc tính gỗ/kim loại.
- 2D: vẽ cùng màu và cùng envelope tương ứng bằng glow/ring/LED, không chỉ đổi màu toàn bộ vật thể.
- Đèn không latch vô hạn. Khi hết decay, nó về mức nền.
- Các hit liên tiếp trên cùng nhạc cụ khởi động lại pulse từ màu nốt mới, không trộn thành màu sai.
- Hợp âm dùng nhiều đoạn LED, mỗi đoạn giữ chính xác màu nốt của nó.

### 6. Bổ sung nhạc cụ vào preset

- Thêm `gong` và `flute` vào danh sách instrument family/style phù hợp.
- Cho preset mixed/corridor/showcase phân bố drum, cymbal, gong và flute có chủ đích, không thay thế toàn bộ nhạc cụ cũ.
- Giữ mode 2D và toàn bộ preset hiện có.
- Project lưu cũ được merge với default mới và không bị lỗi vì thiếu field.

## Kiến trúc dự kiến

```text
NoteEvent + MarblePlatform
        ↓
instrumentHitProfile (pure, shared)
        ├── voice id ──→ AudioEngine ──→ speakers + export audio track
        └── note color → 2D LED / 3D emissive / impact VFX
```

Các file mới dự kiến được chia nhỏ để tuân thủ giới hạn 400 dòng:

- `lib/noteColors.ts`
- `lib/instrumentHitProfiles.ts`
- `lib/instrumentLight.ts`
- phần voice mới trong một module audio riêng nếu `synthVoices.ts` có nguy cơ vượt giới hạn
- mesh 2D/3D riêng cho gong/flute
- test thuần và test tích hợp tương ứng trong `src/test/`

## Kế hoạch TDD và kiểm thử

### Tầng 1 — Unit test bắt buộc

Viết test thất bại trước khi triển khai:

- Tất cả `PlatformStyle` đều trả về voice/fallback có định nghĩa.
- `drum-disc`, `instrument-cymbal`, `gong-disc`, `flute-pipe` lần lượt trả về drum, cymbal, gong, flute.
- Platform style thắng global family và GM program khi là nhạc cụ nhận diện được.
- Cùng MIDI note luôn trả cùng hex qua mọi index/settings/preset.
- 12 pitch class có 12 màu khác nhau; octave giữ hue theo quyết định đã duyệt.
- Light envelope đúng màu ở attack/hold/decay và tắt sau decay.
- Hai hit gần nhau đổi sang màu nốt mới, không giữ màu cũ.
- Hợp âm giữ đủ danh sách màu, không làm mất nốt.

### Tầng 2 — Audio graph/voice test

- Dùng AudioContext giả có ghi lệnh để kiểm tra node, oscillator/noise, filter, envelope, thời điểm start/stop và routing vào đúng bus.
- Với `OfflineAudioContext` trong browser: render fixture drum–cymbal–gong–flute; đo RMS envelope và phổ để chứng minh bốn âm không im lặng và khác nhau có ý nghĩa.
- Kiểm tra gong decay dài hơn cymbal; flute có sustain dài hơn drum transient; peak không vượt ngưỡng đã đặt.

### Tầng 3 — Playback và renderer integration

- Fixture MIDI tổng hợp ngắn gồm drum, cymbal, gong, flute và một hợp âm, với timestamp cách nhau đủ để đo riêng từng hit.
- Dùng `src/assets/audios/midis/SuperMarioMakerTitleTheme.mid` làm bài hồi quy MIDI/course dài; file này đã được bộ test vật lý hiện tại sử dụng ổn định.
- Xác minh 2D và 3D phát đúng một hit cho mỗi event trong một playback token.
- Xác minh seek/resume không double-trigger.
- Xác minh renderer nhận đúng note color và pulse tại chính timestamp va chạm.
- Xác minh native collision audio không chạy đồng thời với scheduled MIDI gây nhân đôi.

### Tầng 4 — Kiểm thử video xuất

Chỉ chạy browser tự động một lượt kiểm thử có chủ đích sau khi unit/integration/build đã xanh:

- Xuất clip ngắn 2D và clip ngắn 3D từ cùng fixture.
- Dùng ffprobe xác nhận 720×1280, có video stream và audio stream.
- Tách bốn đoạn va chạm, kiểm tra không silent và fingerprint phổ/envelope khác nhau.
- Chụp frame đúng timestamp, kiểm tra LED của từng nhạc cụ gần màu nốt kỳ vọng trong sai số render cho phép.
- Kiểm tra console không có WebGL/WebAudio/unhandled errors.
- Dùng thư mục tạm ngoài source; xóa Chrome profile, clip và screenshot test sau khi thu kết quả. Không để lại `artifacts/`.

Môi trường hiện tại đã xác nhận có Chrome, Edge và bản `ffmpeg`/`ffprobe` đóng gói trong `node_modules`; không cần thêm dependency hoặc lưu browser profile vào repository.

### Lệnh hoàn tất

```bash
npm test -- <các test rhythmic mới>
npm test
npm run build
```

Sau thay đổi cuối cùng phải chạy lại test liên quan và build, không dùng kết quả cũ.

Baseline trước triển khai: `RhythmicAudioMix`, `RhythmicPlaybackSeek` và `RhythmicSuperMarioPhysics` gồm 20 test đều pass. Baseline này chỉ chứng minh hành vi cũ ổn định, không được dùng thay cho test nghiệm thu tính năng mới.

## Tiêu chí nghiệm thu

- Chạm drum, cymbal, gong, flute tạo bốn âm sắc phân biệt rõ khi nghe và vượt các kiểm tra envelope/phổ định lượng.
- Nhạc cụ mixed phát theo đúng platform bị chạm, không theo family chung của preset.
- Mỗi nốt có màu ổn định; cùng nốt giữ màu qua preset, 2D, 3D, preview và export.
- Đèn trên đúng nhạc cụ sáng đúng màu nốt đúng thời điểm va chạm và tắt theo decay.
- Hợp âm phát đủ nốt và hiển thị đủ màu theo quyết định đã duyệt.
- Preview và audio export không double-trigger, không silent, không clip bất thường và giữ sync.
- Cả video 2D và 3D đều hoạt động; không xóa hoặc hạ cấp mode 2D.
- Project/preset cũ vẫn load được.
- Full test suite và `npm run build` thành công.
- Không có file source mới/chạm vượt 400 dòng, không có browser artifacts còn lại trong repo.

## Ngoài phạm vi giai đoạn này

- Import VST/SoundFont hoặc thư viện sample thương mại.
- Trình chỉnh ADSR/synthesis chi tiết cho người dùng.
- Thay đổi hệ vật lý/course planner ngoài dữ liệu style cần cho nhạc cụ mới.
- Xóa synth preset thủ công, MIDI auto mode, renderer 2D hoặc preset cũ.
