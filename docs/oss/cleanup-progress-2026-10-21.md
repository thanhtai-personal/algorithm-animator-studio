# Algorithm Animator OSS cleanup — evidence ledger
Updated: 2026-10-21
Source branch: `chore/oss-algorithm-tts-cleanup-20261021`
Draft PR: https://github.com/thanhtai-personal/algorithm-animator-studio/pull/28
Original main commit: `8009a08aeb8df6e0d1e15440f9e80c4b17d80d7a`

## Completed on the separate branch (NOT merged into main)
1. Wrote the target architecture, task plan, source/model inventory, new README and safe .gitignore.
2. Detached algorithm short, maze and long-form pages from `AiVideoAgent` / auto-publishing. Removed those product routes and made algorithm studio the landing page.
3. Enabled local algorithm configuration and video export without a login in `Index`, `AlgorithmWorld` and `LongContent`.
4. Retained 3D, sorting/search/graph/maze engines, Canvas/FFmpeg/Remotion, generated assets and all TTS UIs/service registrations: Piper, Supertonic, VieNeu, GPT-SoVITS, ElevenLabs and RVC/Applio.
5. Removed retired story/news/action-duel, rhythmic/marble and AI-agent/social publishing frontend modules and pages. Removed unused agent background notifier and job-management UI.
6. Unmounted news/story/web extraction/AI agent/publish/YouTube-upload backend routes and workers; removed 27 corresponding backend route, service, model or configuration modules. **The YouTube Tools health route is still mounted for Settings compatibility.**
7. Removed seven old social/publish/YouTube frontend API clients, **without removing algorithm-related YouTube metadata helpers**.
8. Simplified navigation and local menu settings to five OSS modules (Algorithm Short, Maze, Long, TTS, Assets). Changed localStorage namespace so older KAI Studio visibility flags cannot hide the new defaults.
9. Removed an obsolete locked registry backup, scratch transcript and 5 stale generated knowledge-graph artifacts. Updated `docs/ai-context/index.json`, agent instructions and context guide. Removed nonexistent remote-control-app scripts and index entries.
10. Added Node structural / dangling-import checks under `scripts/tests/oss-*.check.mjs` and a CI workflow that also requests Vitest + Vite + server builds.

## File counts — actual Git tree set comparison
Both recursive Git tree snapshots were compared by **blob path**, rather than trusting GitHub's paginated/truncated compare file list:
- Baseline: **1,312 tracked files**.
- Current branch: **950 tracked files**.
- **376 tracked files deleted**, **14 added**, **18 modified**.
- **369 deleted files under `src/` or `server/`**.
- Deleted source breakdown: `src/features/` 315, `src/pages/` 19, `src/lib/` 7, `src/components/` 1, `server/` 27.
- No `models/*.onnx` deleted, pending independent license/model-card audit.

## Verified vs. NOT verified
**Verified by GitHub tree and connector source reads:**
- Protected Algorithm/TTS files are still tracked, including six provider route groups and algorithm definitions.
- Backend composition root still registers voice, model, provider startup, health, resources, and video routes; targeted unrelated endpoints are no longer mounted.
- `src/App.tsx` routes still include Algorithm, Maze, Long, TTS, Assets and Settings and omit Story/News/Jobs/Channel.
- AI context index's primary/doc paths were checked against the tracked tree and had no missing paths after updates.
- The original `main` commit was unchanged when last checked.

**NOT verified by successful execution:**
- `npm ci`, `npm test`, `npm run build`, `npm run build:server`, `python3 scripts/context_index.py check`.
- End-to-end video export, browser navigation, Windows Electron, and provider TTS audio output.
- New import-integrity script, despite being checked into Git, has **not** been executed against a full checkout in this session.
- Latest GitHub Actions jobs are marked **failure** with no recorded steps; runner/log access still blocks a trustworthy green baseline.
- Redistribution rights and full secret/history scan.

## Next atomic stages (keep PR Draft)
1. **Get runnable CI / checked-out local workspace**. Run npm install/test/build and all `node --test scripts/tests/oss-*.check.mjs` checks. Fix dangling imports before any merge.
2. **Separate legacy Math/Preset Video from the core Remotion engine and `server/routes/videoRoutes.ts`** before deleting them. Both remain coupled to current video rendering; do not blind-delete.
3. **Remove YouTube Tools health from TTS Settings first** (currently a `Promise.all` dependency); only then remove the YouTube Tools backend and remaining helpers. Keep model-provider health.
4. Isolate optional voice model dependencies. Keep all six TTS integrations while auditing four Piper ONNX weights and `libs/VieNeu-TTS` rights, attribution, download paths and opt-in installation.
5. Audit full Git history for secrets/sensitive media and third-party asset licenses. Deletion from latest tree does not remove history; rotate any compromised credentials.
6. Remove remaining dead dependencies/scripts/media, close stale CI workflows, write license/SECURITY/CONTRIBUTING/THIRD_PARTY_NOTICES and verify a clean user install.
7. Only with explicit owner approval and legal/CI signoff: merge PR, address history sanitation strategy, and switch to Public.

This ledger is a status record; it is **not** evidence of a passing build or license clearance.
