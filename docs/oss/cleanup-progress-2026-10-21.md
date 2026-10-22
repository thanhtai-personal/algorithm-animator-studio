# Algorithm Animator OSS cleanup — evidence ledger
Updated: 2026-10-22
Source branch: `chore/oss-algorithm-tts-cleanup-20261021`
Draft PR: https://github.com/thanhtai-personal/algorithm-animator-studio/pull/28
Original main commit: `8009a08aeb8df6e0d1e15440f9e80c4b17d80d7a`

## Completed on the separate branch (NOT merged into main)
1. Wrote the target architecture, task plan, source/model inventory, new README and safe .gitignore.
2. Detached algorithm short, maze and long-form pages from `AiVideoAgent` / auto-publishing. Removed those product routes and made algorithm studio the landing page.
3. Enabled local algorithm configuration and video export without a login in `Index`, `AlgorithmWorld` and `LongContent`.
4. Retained 3D, sorting/search/graph/maze engines, Canvas/FFmpeg/Remotion, generated assets and all TTS UIs/service registrations: Piper, Supertonic, VieNeu, GPT-SoVITS, ElevenLabs and RVC/Applio.
5. Removed retired story/news/action-duel, rhythmic/marble and AI-agent/social publishing frontend modules and pages. Removed unused agent background notifier and job-management UI.
6. Unmounted news/story/web extraction/AI agent/publish/YouTube-upload backend routes and workers; removed 27 corresponding backend route, service, model or configuration modules. **YouTube Tools have now been detached from Settings and removed from the backend.**
7. Removed seven old social/publish/YouTube frontend API clients, **without removing algorithm-related YouTube metadata helpers**.
8. Simplified navigation and local menu settings to five OSS modules (Algorithm Short, Maze, Long, TTS, Assets). Changed localStorage namespace so older KAI Studio visibility flags cannot hide the new defaults.
9. Removed an obsolete locked registry backup, scratch transcript and 5 stale generated knowledge-graph artifacts. Updated `docs/ai-context/index.json`, agent instructions and context guide. Removed nonexistent remote-control-app scripts and index entries.
10. Added Node structural / dangling-import checks under `scripts/tests/oss-*.check.mjs` and a CI workflow that also requests Vitest + Vite + server builds.
11. Removed YouTube Tools download/transcript source, worker/WebSocket leftovers, cookies/UI options, a YouTube-specific test and outdated docs. `/api/health` now reports FFmpeg and FFprobe independently of YouTube status and preserves the Piper/TTS health responses.
12. Removed **102 obsolete Vitest tests** referring to already deleted Rhythmic, Marble Tower, MuNews and AI Agent modules, plus the separate YouTube Tools test. Updated AppLayout test to cover algorithm/maze mobile sidebar; core algorithm and video-editor tests remain.
13. **Isolated Remotion**: `Root.tsx` now registers `AlgorithmExplainer` and `TimelineVideo` only. Preset/Math registration, video API endpoints, rhythmic transcode endpoint and preset-aware bundle cache removed. Algorithm Remotion template accepts only `algorithm-explainer` while keeping bars/maze, background music and voice.
14. Deleted standalone `src/features/{math-video,preset-video}` modules, their backend services/routes/model, and leftover exclusive scripts/tests/workflows. Removed 7 legacy preset media assets (~32.3 MB) plus unrelated Math/Fashion/Rhythmic documents (~32.5 MB combined in this step). `remotion:render:test` and `dev:remotion` scripts remain.
15. Updated Remotion technical docs and AI context to refer to the supported renderer and tracked test paths. **These changes are not evidence that actual rendering or TTS has passed.**
16. Added `WhisperCliService.ts` and repaired the auto-lyrics import so it no longer depends on removed YouTube Tools. Added `WHISPER_PYTHON` runtime configuration and retained compatibility with the older `YOUTUBE_TOOLS_PYTHON` setting during migration.
17. Expanded `OssAlgorithmTtsRegression.test.ts` to cover 26 deterministic sorting algorithms, linear/binary search, BFS/DFS/Dijkstra, A*, all seven TTS generation/conversion endpoints, all six provider health/config flows, Piper model discovery and Supertonic style import. Expanded the local-import guard to scan `.mts`/`.cts` and detect local `require()` calls. These tests have been authored but **not executed successfully**.
18. Added `npm run test:oss:static` and a single `npm run validate:oss` command for the retained-surface guard, OSS structural checks, Vitest suite, web build and server bundle. The CI workflow now uses that same command after `npm ci` to reduce drift between local and CI validation.
19. Removed all four Piper ONNX weight files and their matching JSON configs from the current Git tree (~268 MB); kept the Piper provider, model catalog, download endpoints and UI install flow. Added an audit explaining why models are opt-in and not bundled. The downloaded files are now ignored by Git. This only cleans the current tree; the weights remain in earlier commits and must be addressed before any public release.

## File counts — actual Git tree set comparison
Both recursive Git tree snapshots were compared by **blob path**, rather than trusting GitHub's paginated/truncated compare file list:
- Baseline: **1,312 tracked files**.
- Current branch before externalizing VieNeu: **669 tracked files**; after removing the 94-file vendor checkout: **575 tracked files**.
- Current comparison: **758 tracked files deleted**, **21 added**, **36 modified**.
- **599 deleted files under `src/` or `server/`**.
- Legacy feature and backend source, obsolete specs, tests, scripts, and preset media were removed. Counts are from a full recursive Git tree diff; do not rely on GitHub compare results truncated at 300 files.
- No `models/*.onnx` deleted, pending independent license/model-card audit.

## Verified vs. NOT verified
**Verified by GitHub tree and connector source reads:**
- Protected Algorithm/TTS files are still tracked, including six provider route groups and algorithm definitions.
- Backend composition root still registers voice, model, provider startup, health, resources, and video routes; targeted unrelated endpoints are no longer mounted.
- `src/App.tsx` routes still include Algorithm, Maze, Long, TTS, Assets and Settings and omit Story/News/Jobs/Channel.
- `Settings.tsx` no longer requests `/api/youtube-tools/health` as a `Promise.all` dependency; system health now reports FFmpeg/FFprobe status and TTS provider requests are preserved.
- The Git tree no longer contains the 102 orphaned deleted-feature tests or the YouTube Tools test; the retained algorithm/video test files still exist.
- AI context index's primary/doc paths were checked against the tracked tree and had no missing paths after updates.
- The original `main` commit was unchanged when last checked.
- A source/tree check confirms AlgorithmExplainer and TimelineVideo Remotion compositions remain and Math/Preset source directories are absent.

**NOT verified by successful execution:**
- `npm ci`, `npm test`, `npm run build`, `npm run build:server`, `python3 scripts/context_index.py check`.
- End-to-end video export, browser navigation, Windows Electron, and provider TTS audio output.
- New import-integrity script and expanded regression tests have **not** been executed against a full checkout in this session. `npm run validate:oss` is now available but has not passed.
- Latest GitHub Actions runs (including `39707745662` and `39707738903`) are marked **failure** with `runner_id=0` and `steps=[]`; retries reproduce the same pre-run failure. No test/build step has run, and the available connector cannot retrieve job annotations/logs. The root cause remains unconfirmed; check repository Actions availability/account billing or use a checked-out local workspace. Do not infer a source failure or success from these runs.
- Redistribution rights and full secret/history scan.

## Next atomic stages (keep PR Draft)
1. **Validation gate remains blocked.** Run `npm ci && npm run validate:oss` from a real checkout and fix any failures. In parallel, resolve why GitHub Actions fails before runner allocation; inspect Actions settings/billing or configure a permitted runner. Do not make the private repository public just to get CI running.
2. **Implemented static source separation:** Math/Preset and old rhythmic transcode are gone; prove full `npm test`, web/server builds, algorithm Remotion CLI render and timeline MP4 export against a clean checkout before marking this complete.
3. **Done: YouTube Tools removed from Settings and backend**; check FFmpeg/FFprobe status and all six TTS provider health flows in a running environment before publication.
4. Continue optional voice isolation: the Piper binaries are no longer bundled, but remain in Git history. Audit and isolate the VieNeu preset/sample voice assets (`voices.json` declares CC BY-NC 4.0) while keeping the VieNeu provider integration and an opt-in install path. Verify provider setup after the change.
5. Audit full Git history for secrets/sensitive media and third-party asset licenses. Deletion from latest tree does not remove history; rotate any compromised credentials.
6. Remove remaining dead dependencies/scripts/media, close stale CI workflows, write license/SECURITY/CONTRIBUTING/THIRD_PARTY_NOTICES and verify a clean user install.
7. Only with explicit owner approval and legal/CI signoff: merge PR, address history sanitation strategy (legacy media remains in past commits), and switch to Public.

This ledger is a status record; it is **not** evidence of a passing build or license clearance.
