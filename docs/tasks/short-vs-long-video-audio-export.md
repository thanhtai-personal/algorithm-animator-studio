# Vì sao short video ghi được âm thanh không cần Piper, còn long video thì không

## Tóm tắt

Short video ghi được âm thanh không cần Piper vì âm thanh của short video là SFX và nhạc nền được tạo hoặc phát bên trong Web Audio graph của app. Khi export, app lấy stream ghi âm từ `audioEngine.getRecordStream()` rồi ghép với `canvas.captureStream()` để đưa vào `MediaRecorder`.

Long video cũng dùng cơ chế `MediaRecorder` như vậy, nhưng phần giọng đọc Browser TTS lại đến từ `window.speechSynthesis`. Browser SpeechSynthesis phát âm thanh trực tiếp qua hệ thống/trình duyệt, không cung cấp audio stream chuẩn để nối vào Web Audio graph. Vì vậy `MediaRecorder` không thu được giọng đọc Browser TTS. Muốn long video export có voice-over thì hiện tại cần Piper hoặc ElevenLabs để tạo file audio thật trước, sau đó app phát file đó qua `AudioEngine` và ghi vào stream export.

## Short video đang ghi âm như thế nào

Luồng short video nằm ở `src/pages/studio/videoExport.ts`:

1. Tạo canvas export và lấy video stream bằng `canvas.captureStream(0)`.
2. Gọi `audioEngine.resume()`.
3. Lấy audio stream bằng `audioEngine.getRecordStream()`.
4. Ghép video track và audio track vào một `MediaStream`.
5. Đưa stream ghép này vào `MediaRecorder`.

Âm thanh short video gồm:

- SFX compare/swap được phát bằng `audioEngine.playSfx(...)`.
- Nhạc nền procedural hoặc custom được phát qua `audioEngine`.

Trong `src/lib/audio.ts`, `getRecordStream()` tạo `MediaStreamAudioDestinationNode` và nối các gain node vào đó:

- `sfxGain`
- `musicGain`
- `voiceGain`

Vì SFX và nhạc nền của short video đều đi qua các gain node này, `MediaRecorder` thu được chúng. Không cần Piper vì short video không cần biến text thành giọng đọc; nó chỉ cần ghi âm thanh đã nằm trong Web Audio graph.

## Long video khác ở điểm nào

Long video có voice provider:

- `browser`
- `piper`
- `elevenlabs`

Khi provider là `browser`, long video dùng `speakNarration(...)` trong `src/pages/long-content/studioHelpers.ts`. Hàm này tạo `SpeechSynthesisUtterance` và gọi:

```ts
window.speechSynthesis.speak(utterance);
```

Âm thanh từ `speechSynthesis` không được nối vào `audioEngine.voiceGain`, cũng không có API ổn định để lấy ra `MediaStreamTrack`. Nó chỉ phát ra loa. Vì vậy khi long video export và tạo stream:

```ts
const audioTracks = audioEngine.getRecordStream().getAudioTracks();
const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
```

stream này chỉ chứa những âm thanh đi qua `AudioEngine`. Browser TTS không nằm trong đó, nên không được ghi vào file video.

Đó là lý do code long video đang chặn export voice bằng Browser TTS trong `src/pages/long-content/useLongContentStudio.ts`:

```ts
if (narrationEnabled && voiceProvider === "browser") {
  toast.error("Browser TTS chỉ dùng để preview. Để export có voice, hãy chọn Piper hoặc ElevenLabs rồi tạo voice-over.");
  return;
}
```

## Vì sao Piper hoặc ElevenLabs export được voice-over

Piper và ElevenLabs tạo ra file audio thật:

- Piper tạo WAV qua backend `/api/generate`.
- ElevenLabs tạo MP3 qua backend `/api/elevenlabs/generate`.

Sau khi có `voiceUrl`, long video gọi:

```ts
audioEngine.setVoiceSource(result.audioUrl);
```

Trong `src/lib/audio.ts`, `setVoiceSource(...)` tạo `HTMLAudioElement`, tạo `MediaElementAudioSourceNode`, rồi nối vào `voiceGain`:

```ts
this.voiceSrc = this.ctx.createMediaElementSource(el);
this.voiceSrc.connect(this.voiceGain);
```

`voiceGain` đã được nối vào `getRecordStream()`, nên `MediaRecorder` có thể ghi được voice-over vào video.

## Kết luận

Vấn đề không nằm ở short video hay long video dài/ngắn. Vấn đề nằm ở nguồn âm thanh:

- Short video ghi được vì SFX/nhạc nền được tạo trong Web Audio graph của app.
- Long video không ghi được Browser TTS vì `speechSynthesis` không xuất stream để app ghép vào `MediaRecorder`.
- Long video ghi được Piper/ElevenLabs vì hai provider này tạo file audio thật, app có thể phát file đó qua `AudioEngine` và đưa vào stream ghi hình.

## Hướng xử lý nếu muốn long video không phụ thuộc Piper

Có vài hướng khả thi:

1. Dùng ElevenLabs hoặc một dịch vụ TTS khác để tạo file audio, tương tự pipeline hiện tại.
2. Dùng một TTS chạy trong trình duyệt nhưng phải xuất được audio buffer hoặc audio stream để nối vào Web Audio.
3. Tạo backend TTS khác thay Piper, miễn là backend trả về file audio.
4. Không dùng Browser SpeechSynthesis cho export; chỉ giữ nó làm preview nhanh như hiện tại.

Hướng không nên kỳ vọng là "bắt âm thanh đang phát ra loa" từ Browser TTS trong tab hiện tại, vì trình duyệt không cung cấp API ổn định và an toàn để làm việc đó trong pipeline export canvas + `MediaRecorder`.
