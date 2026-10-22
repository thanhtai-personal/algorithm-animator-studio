# Audited Git tree inventory — Algorithm Animator + all TTS integrations
Date: 2026-10-21
Source: private `main` commit `8009a08aeb8df6e0d1e15440f9e80c4b17d80d7a`.
Audit method: GitHub tree / file reads. **Static inventory only; build/test, software licenses and runtime behavior are not verified.**

## Tree size / package layout
GitHub recursive tree: 1,462 entries, including directories; `src/features/` 461 blobs (~2.6 MB), `src/pages/` 102 (~0.7 MB), `src/lib/` 134 (~0.8 MB), `server/` 111 (~0.6 MB), `scripts/` 31 (~0.2 MB), `libs/` 94 (~3.6 MB), `models/` 9 (~268.2 MB), `public/` 12 (~32.4 MB), `src/assets/` 35 (~30.4 MB). Sizes are tree blob payload totals, not disk checkout or packed ZIP sizes.

## Retain — verified entrypoints, KEEP behavior unchanged
| Scope | Current path(s) | Static evidence / acceptance |
| --- | --- | --- |
| Algorithm definitions | `src/lib/algorithms/index.ts`, sorting/search/graph modules | 27 sort, 2 search, 4 graph registrations plus custom code; retain test coverage, order/frame output |
| Algorithm short | `src/pages/Index.tsx`, `src/pages/studio/`, `src/pages/AlgorithmChannelPage.tsx` | Currently `AlgorithmChannelPage.tsx` mounts both `AiVideoAgent` and manual `Index`; detach agent before deletion |
| Maze + 3D | `src/pages/AlgorithmWorld.tsx`, `src/pages/MazePathfindingPage.tsx`, `src/pages/algorithm-world/`, `src/features/algorithm-video-3d/` | Preserve pathfinding, visual preview, race/export modes |
| Long video | `src/pages/LongContent.tsx`, `src/pages/AlgorithmLongVideoPage.tsx`, `src/pages/long-content/` | `AlgorithmLongVideoPage.tsx` also imports agent; detach carefully |
| Voice UI/API | `src/pages/TextToSpeech.tsx`, `src/lib/voiceApi.ts` | Current UI offers Piper, Supertonic, VieNeu, GPT-SoVITS, ElevenLabs, Applio TTS/voice conversion |
| Piper | `server/routes/generateRoutes.ts`, `server/routes/piperRuntimeRoutes.ts`, `server/services/TtsGenerationService.ts`, `server/services/PiperService.ts`, `server/services/PiperModelInstallService.ts` | `/generate`, `/preview-audio`, `/piper-runtime/status`, `/piper-runtime/install-model` |
| Supertonic | `server/routes/supertonicRoutes.ts`, `server/services/SupertonicService.ts` | config + generate + style import |
| VieNeu | `server/routes/vieneuRoutes.ts`, `server/services/VieneuService.ts`, `libs/VieNeu-TTS` | config + generate, local SDK and optional remote mode |
| GPT-SoVITS | `server/routes/gptSoVitsRoutes.ts`, `server/services/GptSoVitsService.ts` | config + generate |
| ElevenLabs | `server/routes/elevenLabsRoutes.ts`, `server/services/ElevenLabsService.ts` | config + generate, requires user-provided key |
| RVC/Applio | `server/routes/rvcApplioRoutes.ts`, `server/services/RvcApplioService.ts`, `RvcApplioTemplateFileService.ts` | config, templates GET/PUT, convert, TTS |
| Provider settings, media | `server/index.ts`, `server/config/paths.ts`, runtime/env/provider/setup routes and services; generated audio endpoints | Preserve local generated output access and provider start/health; do not break Electron local paths |
| Rendering | `src/lib/renderers/`, `src/features/remotion-video/`, FFmpeg services/scripts | Keep only files used by retained algorithm video/output, remove orphan generic compositions later |

## Candidate removal clusters, not yet green-lit per file
- `src/features/story-author`, `story-review`, `story-video`; story pages.
- `src/features/github-trending`, `mu-news`; football/news pages.
- `src/features/channel-manager`, `social-channel`, `publishing-ops`, `youtube-channel`; OAuth/publish workers.
- `src/features/ai-video-agent` after detaching the algorithm route pages; user requested voice tools, not agent video generation.
- `src/features/preset-video`, `math-video`, `rhythmic-studio`, `marble-tower-video`, `action-duel` AFTER export and shared dependency audit.
- `src/features/video-editor` and `src/features/remotion-video` are **not** whole-directory deletion candidates until core render dependencies are mapped.
- `server/index.ts` currently imports a large set of routers and starts publishing/realtime jobs; deleting these files first breaks startup.
- `src/App.tsx` still routes to all product domains; `src/components/appNavigation.ts` and settings feature flags must be updated as a matched atomic change.
- `src/pages/Index.tsx`, `AlgorithmWorld.tsx`, `LongContent.tsx` currently use auth/profile checks for export/config. OSS local flows need permission redesign before removing auth endpoints.

## Asset provenance and release blockers
| Tracked asset | Size | Present finding | Release disposition |
| --- | ---: | --- | --- |
| `models/en_US-libritts_r-medium.onnx` | 78.6 MB | Piper model tracked in Git | Check exact model license + provenance |
| `models/en_US-lessac-medium.onnx` | 63.2 MB | Piper model tracked | Check model license |
| `models/en_US-ryan-medium.onnx` | 63.2 MB | Piper model tracked | Check model license |
| `models/vi_VN-vais1000-medium.onnx` | 63.2 MB | Piper Vietnamese voice tracked | Check model/data license; preserve install path |
| `libs/VieNeu-TTS/LICENSE` | text | Upstream source tree includes Apache-2.0 license text | Verify provenance, modifications, attribution and *separate model rights* |
| `public/preset-assets/five-prayers/five-prayers.mp3` | 24.4 MB | Reference/preset audio | Remove after preset consumer removal unless licensed |
| `public/preset-assets/number-eight-in-red.mp3` | 7.3 MB | Reference/preset audio | Same, do not blindly retain |
| `src/assets/sprites/*.png` | ~30 MB combined | Game/visual sprites | Audit image ownership, consumers and redistribution rights |
| `.tmp-five-prayers-whisper/five-prayers.json` | ~0.3 MB | One-off transcription scratch | Removed on OSS preparation branch only; still exists in Git history |
| `package-lock.json.bak-internal-registry` | ~0.57 MB | Backup lock | Removed on OSS preparation branch only; still exists in Git history |

## Security/CI known constraints
- `server/index.ts` currently allows broad CORS and serves generated files; threat model as local-only tooling, do not expose anonymous API publicly without specific hardening.
- `.env.example` lists optional provider credentials, OAuth and model paths. They are config names, not evidence of leaked secrets; audit commit history separately.
- Last observed GitHub Actions Math CI runs failed with no job step records. Treat runner failure as infrastructure uncertainty; it is NOT proof source fails or passes.
- No root `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md` currently; README is a 2-line Lovable TODO. Compliance work is gated on provenance.

## Next deterministic action
Inventory `rg` imports in a real checkout/worktree; install via `npm ci`; run `npm test`, `npm run build`, `npm run build:server`; record output before PRs deleting domains. The connected GitHub service here can inspect/commit files but cannot run code inside the private repository, so these validations remain unexecuted.

## Update after the 2026-10-21 cleanup commits
This document captured the ORIGINAL pre-cleanup tree. Most story/news/rhythmic/marble/agent/social source and associated backend files have since been removed on the draft PR branch; its keep/remove lists above are historical, not current live file inventories. See [cleanup progress](cleanup-progress-2026-10-21.md) for actual branch counts. Math/Preset Video and YouTube Tools are deliberately retained until shared Remotion and Settings imports are safely separated.
