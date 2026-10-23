ElevenLabs là cloud TTS provider. Health kiểm tra API key có gọi được `/v1/user` mà không tạo audio.

### Lấy API key và voice ID

1. Mở dashboard ElevenLabs.
2. Tạo hoặc copy API key trong profile/developer settings.
3. Trong Kai Studio, mở Settings -> API Key và dán vào `ELEVENLABS_API_KEY`.
4. Mở Voice Library hoặc VoiceLab, copy voice ID của từng giọng muốn dùng.
5. Thêm voice ID vào danh sách ElevenLabs voices.

### Kiểm tra

1. Health dùng endpoint `/v1/user`.
2. Khi tạo audio, Kai Studio dùng `/v1/text-to-speech/{voiceId}`.
3. Nếu `/v1/user` fail, kiểm tra key, quota tài khoản và internet/proxy.

```txt
ELEVENLABS_API_KEY=<your secret key>
ELEVENLABS_VOICES=[{"id":"voice_id","label":"Voice label"}]
```
