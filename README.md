# Algorithm Animator Studio — OSS preparation

A visual algorithm animation and video authoring toolkit with built-in text-to-speech integrations.

**Status (21 October 2026):** Open-source cleanup **in progress** on `chore/oss-algorithm-tts-cleanup-20261021`. This repository is not ready to be made Public: the full Git history, third-party model/media rights, dependency integrity and runtime tests have **not yet been cleared**. Do not distribute bundled voice weights or preset media until their terms are confirmed.

## Features retained in the OSS edition

- **Algorithm Shorts:** sorting, searching, graph visualizations, custom code, previews and exports.
- **Maze Pathfinding:** graph/pathfinding competition and visualization.
- **Algorithm Long Video:** long-form explainers with Canvas/FFmpeg and the algorithm-oriented Remotion renderer.
- **Voice tools (all current adapters):** Piper; Supertonic; VieNeu TTS; GPT-SoVITS; ElevenLabs; RVC/Applio TTS and voice conversion.
- Local provider settings/health, model discovery, generated audio and video files.

The old story/news, generic AI video, social publishing and unrelated demo routes are being removed. Some backing source/services are still tracked while dependencies are audited.

## Local development

Requirements: Node.js 22, npm, and any optional Python/FFmpeg/model prerequisites for the TTS providers you choose to use.

```bash
npm ci
npm run dev:server
```

In a second terminal:

```bash
npm run dev:client
```

Open `http://localhost:3000/algorithms` or `http://localhost:3000/text-to-speech`. The local backend defaults to port `5050`; update `.env.example` values in a local `.env` file as needed. The full `npm run dev` command also attempts to launch several optional voice providers; use split terminals above for a smaller development setup.

## Voice provider setup

Piper depends on a local executable plus compatible licensed ONNX voice models. Other providers may need local Python services, downloaded model weights, an external API key (ElevenLabs), or separately installed tools. See:
- `docs/local-voice-services.md`
- `docs/vieneu-local-tts-provider.md`
- `docs/gpt-sovits-local-provider.md`
- `docs/rvc-applio-local-voice-provider.md`
- `docs/applio-api-template-and-voice-text.md`

Do **not** check API keys, OAuth credentials, voice recordings or private datasets into Git. Only use voice conversion/cloning with appropriate consent and rights.

## Development checks

```bash
node scripts/assert-oss-retained-surface.mjs
node --test scripts/tests/oss-*.check.mjs
npm test
npm run build
npm run build:server
```

These checks are *not* a guarantee of rights clearance, complete runtime behavior or usable Windows installer. See `docs/oss/2026-10-21-source-inventory.md` and `docs/superpowers/plans/2026-10-21-oss-core-with-tts.md` for outstanding work. Current GitHub-hosted CI reports failures before job steps are recorded; runtime validation is pending.

## Licensing

No repository-wide open-source license is granted yet. Source code, vendored libraries, Piper models and other binary assets can have **different** authors and redistribution terms. A top-level LICENSE will only be selected after ownership and third-party notices are reviewed.

## Contributing

Work is still underway in a private draft PR. A contributor guide, security contact, first release and public roadmap will be added once a clean build and legal/provenance review are complete.
