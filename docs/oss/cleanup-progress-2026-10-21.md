# OSS cleanup progress — 2026-10-21

Draft PR: https://github.com/thanhtai-personal/algorithm-animator-studio/pull/28
Branch: `chore/oss-algorithm-tts-cleanup-20261021`
Original main SHA: `8009a08aeb8df6e0d1e15440f9e80c4b17d80d7a`

## Completed changes (branch only)
- Wrote scope/spec and the Task 0–8 cleanup plan.
- Removed tracked scratch transcription and obsolete internal-registry backup lockfile (NOT from Git history).
- Added static protected-surface assertions for all six TTS provider families and algorithm files.
- Separated manual algorithm short, maze and long UI wrappers from the `AiVideoAgent` tab.
- Removed old route declarations for story, news, generic video/publishing and demo pages; made `/` open Algorithms.
- Navigation now lists Algorithms, TTS, generated assets, jobs and settings. Core algorithm feature toggles now default on.
- Local algorithm configuration / export no longer require a user login at the three manual pages.
- Removed 12 previously routed but now unmounted page files. Backend services, TTS and shared render engines retained.
- Added Node structural regression checks; run explicitly in the OSS CI workflow.

## Verification actually observed
- GitHub compare and recursive tree: 12 intended page paths no longer tracked; `Index`, `AlgorithmWorld`, `LongContent`, `TextToSpeech` remain; six voice router files remain.
- Static source checks of route paths, no-login logic, algorithm defaults and TTS server router registration passed in connector-read text (not executable UI testing).
- GitHub Actions on cleanup branch reports FAILURE with job steps absent. No `npm ci`, Vitest, Vite build, server build, frontend smoke, or TTS inference run can be certified from these results.
- The connected GitHub API permits file changes but no runnable private repo checkout on the model runtime; treat buildability as an open risk.

## Incomplete / next actions
1. Investigate GitHub Actions unable to start steps, establish a real `npm ci` / test / build baseline.
2. Map all imports before deleting `src/features`, `server/routes`, services or shared editor/Remotion assets.
3. Remove unused feature implementation and third-party binaries only with a passed test/build gate.
4. Update voice settings so unrelated YouTube checks do not make the entire health tab fail.
5. Audit credentials across Git history; verify licensed provenance of four Piper ONNX files and VieNeu vendor/model, media and fonts.
6. Review TTS integration behavior and optional provider startup in clean installations, including Windows desktop.
7. Add legal docs and first audited release; separately approve Git-history sanitation and switching visibility.
