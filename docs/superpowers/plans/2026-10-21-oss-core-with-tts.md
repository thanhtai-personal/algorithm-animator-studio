# Implementation plan: Algorithm Animator OSS Core + every existing TTS provider
Date: 2026-10-21
Plan status: DRAFT / staged execution; destructive implementation must be validated as groups, not mass-delete.
Related design: `docs/superpowers/specs/2026-10-21-oss-core-with-tts-design.md`.
Branch: `chore/oss-algorithm-tts-cleanup-20261021`
Baseline main: `8009a08aeb8df6e0d1e15440f9e80c4b17d80d7a`
Owner archive clone: external backup reported by user; **not independently verified**, so leave `main` intact until merge.

## Task 0 — Non-product housekeeping + plan
- Add design and plan; ignore `.tmp-*/` and `package-lock.json.bak-*`.
- Remove only the tracked throwaway audio transcript `.tmp-five-prayers-whisper/five-prayers.json` and old backup lock `package-lock.json.bak-internal-registry`. Keep canonical `package-lock.json`.
- Verification: branch diff must show exactly plan/spec, ignore change and two removed files. Never assume deleting files purges them from history.
- Commit: `docs(oss): plan algorithm and TTS-first source cleanup`.

## Task 1 — Create baseline, dependency and licenses inventory
Files: `docs/oss/oss-file-inventory.md`, `docs/oss/third-party-audit.md`, `docs/oss/baseline-checks.md`.
- Map imports from algorithm/maze/long/TTS routes to shared modules and every runtime service. Map `server/index.ts` router dependencies and `AppLayout` navigation.
- Document direct/transitive third-party assets: ONNX Piper weights, `libs/VieNeu-TTS`, MP3, images, fonts, sprites, remotion/ffmpeg and remote TTS terms. Classify keep, replace, remove, unknown. Never mark unknown as safe.
- Snapshot reproducible test/build outputs from clean install with Node LTS (`npm ci; npm test; npm run build; npm run build:server`), `python3 scripts/context_index.py check` if index remains.
- Gate: owners' code vs third-party content separated; no destructive code pruning before dependency graph exists.

## Task 2 — Freeze acceptance tests for KEEP surface
Files: `src/test/oss/`, `server/routes/**/*.test.ts` or existing test conventions, `.github/workflows/oss-core-ci.yml`.
- Add failing tests (RED first) for `/algorithms`, `/algorithms/maze`, `/algorithms/video-long`, `/text-to-speech`, `/settings` / required audio assets route; check redirects and no orphan links.
- Snapshot `ALGORITHMS` categories and representative frame streams. Test deterministic sorting/search/graph and maze.
- For TTS, mock local HTTP/network; assert config/generate endpoint shapes for Piper, Supertonic, VieNeu, GPT-SoVITS, ElevenLabs, Applio conversion + TTS/template APIs and missing-provider graceful errors. Include audio-file response checks.
- Integration gate: `npm test`, `npm run build`, `npm run build:server` pass locally before phase 3.

## Task 3 — Untangle retained algorithm screens from AI/social
Files: `src/App.tsx`, `src/pages/AlgorithmChannelPage.tsx`, `src/pages/AlgorithmLongVideoPage.tsx`, `src/pages/MazePathfindingPage.tsx`, `src/components/appNavigation.ts`, `src/lib/menuFeatureSettings.ts`.
- Remove `AiVideoAgent` tabs/imports; preserve and foreground manual preview/export screens.
- Make `/` land on algorithm studio (also keep direct `/text-to-speech`). Preserve meaningful legacy algorithm redirects; remove dead news/story/social routes.
- Simplify sidebar to Algorithms Short, Maze, Algorithms Long, TTS, Assets if needed, Settings. Keep UI translations. Remove auth gates from local algorithms/TTS, unless a route legitimately requires remote secrets/permission.
- GREEN: route test + Vite build, manual preview and export checked.

## Task 4 — Prune unrelated frontend product domains
Targets only after Task 3 tests pass:
`src/features/{story-author,story-review,story-video,mu-news,github-trending,youtube-channel,social-channel,channel-manager,publishing-ops}`;
`src/pages/{NewsChannelPage,StoryChannelPage,StoryAuthorStudio,StoryReviewChannelPage,StoryReviewStudio,StoryVideoStudio,YoutubePublishing,YoutubeTools,SocialPublishing}.tsx`.
- Evaluate and then remove `src/features/{ai-video-agent,preset-video,rhythmic-studio,marble-tower-video,action-duel,math-video}`, unrelated pages and orphan components. Preserve a shared part of `video-editor`, `remotion-video`, generated-file UI or common renderer whenever required for algorithm export/TTS output.
- Do NOT remove algorithms, 3D preview, voices, shared i18n/config or render services.
- Verify `rg -n` for imports, run tests and Vite build after each logical deletion commit.

## Task 5 — Server/API isolation, with TTS preserved
Files: `server/index.ts`, `server/routes/`, `server/services/`, `server/models/`, `server/config/paths.ts`.
- Split retained API routers into explicit algorithm render/media and voice adapters; remove social, story, YouTube, news, generic AI/publishing routers and worker startup only after all imports/side effects are migrated.
- Keep generate/voice/model and all six provider groups: Piper, Supertonic, VieNeu, GPT-SoVITS, ElevenLabs, RVC/Applio. Keep TTS template management, provider startup, FFmpeg, generated audio files and API health.
- Restrict unsafe public network exposure / configurable CORS and file-serving traversal; do not break localhost/Electron workflow.
- Tests: health/config, mock generation errors and success for every provider, audio file retrieval and conversions; server build passes.

## Task 6 — Dependency + assets, model redistribution
Files: `package.json`, lock, `scripts/`, `src/assets/`, `public/`, `models/`, `libs/`, `electron/`, `docs/`.
- After imports are severed, remove orphan packages/scripts and non-core media, reference videos, music, stock/sprite and private doc content.
- Audit `models/*.onnx` licenses, voice weight provenance and `libs/VieNeu-TTS` licensing. If not proven redistributable, keep provider *integration*, replace packaged weights/vendor code with opt-in installer/external paths; retain Vietnamese/English capability when legitimately installed.
- Reconcile CLI dev with optional providers: a missing optional TTS dependency must not crash algorithm startup; clear install/health notes and documented setup commands.
- Rebuild lockfile reproducibly using public registry; check no private registry/auth tokens.
- Run clean `npm ci`, lint/test/build, export, TTS matrix and Windows Electron smoke if desktop promised.

## Task 7 — Open-source compliance and clean publication gate
Files: `README.md`, `LICENSE` (license decision after rights check), `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `THIRD_PARTY_NOTICES.md`, `docs/oss/`.
- README quick start with offline demo, output examples, provider installation/keys, supported platforms and honest limitations. No private file paths, users, images or unpublished datasets.
- Run full Git-history credential scan and artifact provenance. Deleting current files is insufficient; if history contains secrets, revoke/rotate them and agree a separately authorized history rewrite / fresh-history migration.
- Add `oss-core-ci.yml` green checks, release notes v0.1.0, setup smoke from new clone, npm dependency audit, disabled OAuth/publish endpoints.
- Final approval: project owner reviews deletion diff and compliance evidence. **Do not switch repository to Public automatically**.

## Task 8 — Ready-for-open-source evidence
- Verify accessible documentation and demo with external contributor clean install; collect bug reports, issues, adoption evidence.
- Compare with OpenAI Codex for OSS program criteria; submission is separate and does not imply acceptance.
- Open PR with evidence, accept review, merge explicitly, then confirm sanitized history and public-readiness prior to visibility change.

## Task acceptance checklist for EVERY destructive commit
- TTS API contracts for all provider groups are still present or demonstrably preserved by an equivalent adapter.
- Algorithm/maze/long manual routes render and export; no stale imports/nav.
- Test/build output inspected; CI status accounted for (runner failure != code pass).
- No files removed merely because their filenames suggest non-use: require import search + runtime verification.
- Full repo remains PRIVATE until owner explicitly authorizes public release.
