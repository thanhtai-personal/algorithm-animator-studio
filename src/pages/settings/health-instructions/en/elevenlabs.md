ElevenLabs is a cloud TTS provider. Health checks whether the API key can call `/v1/user` without generating audio.

### Get API key and voice ID

1. Open the ElevenLabs dashboard.
2. Create or copy an API key from profile/developer settings.
3. In Kai Studio, open Settings -> API Key and paste it into `ELEVENLABS_API_KEY`.
4. Open Voice Library or VoiceLab, then copy the voice ID of each voice you want to use.
5. Add the voice ID to the ElevenLabs voices list.

### Verify

1. Health uses endpoint `/v1/user`.
2. When generating audio, Kai Studio uses `/v1/text-to-speech/{voiceId}`.
3. If `/v1/user` fails, verify the key, account quota, and internet/proxy access.

```txt
ELEVENLABS_API_KEY=<your secret key>
ELEVENLABS_VOICES=[{"id":"voice_id","label":"Voice label"}]
```
