# OSS architecture and component boundaries

## Purpose

Algorithm Animator Studio generates short and long videos explaining sorting, searching and pathfinding algorithms. The core should start without accounts, hosted AI services or local TTS engines. Media and optional voice providers are separate capabilities.

## High-level data flow

```text
React/Vite UI (src/pages/{Index,AlgorithmWorld,LongContent,TextToSpeech}.tsx)
  ├─ useAlgorithmStudio / algorithm definitions (src/lib/algorithms/)
  ├─ 3D/Canvas algorithm visualization (src/features/algorithm-video-3d/)
  ├─ algorithm/timeline Remotion compositions (src/features/remotion-video/)
  ├─ timeline editor (src/features/video-editor/)
  └─ voiceApi.ts (Piper, Supertonic, VieNeu, GPT-SoVITS, RVC/Applio, ElevenLabs)
                     ↓ localhost HTTP calls
Node/Express server (server/index.ts, default port 5050)
  ├─ videoRoutes → FFmpeg/Remotion → generated local media
  ├─ resource/model routes → local file/model discovery
  ├─ health/provider-startup → optional runtime status
  └─ TTS routers → user-installed CLI/Python/HTTP engines, or hosted API key
```

## Retained source of truth

| Layer | Paths |
|---|---|
| UI entrypoints | `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/AlgorithmWorld.tsx`, `src/pages/LongContent.tsx`, `src/pages/TextToSpeech.tsx` |
| Algorithms | `src/lib/algorithms/`, `src/pages/studio/` |
| Visuals | `src/features/algorithm-video-3d/`, `src/lib/renderer.ts` (if present in current tree) |
| Video engine | `src/features/remotion-video/remotion/Root.tsx` contains AlgorithmExplainer and TimelineVideo; `server/routes/videoRoutes.ts` |
| TTS adapters | `src/lib/voiceApi.ts`, `server/routes/{generate,piperRuntime,supertonic,vieneu,gptSoVits,elevenLabs,rvcApplio}Routes.ts` |
| Local optional startup | `scripts/start-{supertonic,vieneu,gpt-sovits}.mjs` and optional Applio/Whisper bridges |
| Validation | `scripts/assert-oss-retained-surface.mjs`, `scripts/tests/oss-*.check.mjs`, `src/test/OssAlgorithmTtsRegression.test.ts` |

## Non-goals / removed subsystems

No user login is required for manual algorithms. Publishing channels, AI video agents, news/story pipelines, YouTube download tools, standalone Math/Preset video and bundled pretrained voices were removed during OSS cleanup. These must not be reintroduced through accidental dependencies.

## Trust boundaries

- `.env` is local and ignored; never commit tokens or user recordings. The client must not receive provider secret keys.
- Bind local provider ports to loopback when possible. Do not expose the development Express API to untrusted networks.
- Model downloads are opt-in and license-reviewed; never automatically distribute weight files as part of MIT source.
- Remotion, FFmpeg and Piper runtime/binaries have their own license conditions. See [THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md).
- Input files and command paths are security sensitive. Avoid untrusted shell interpolation and unrestricted file reads.
