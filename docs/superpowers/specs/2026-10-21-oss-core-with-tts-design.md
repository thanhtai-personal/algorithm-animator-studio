# Algorithm Animator OSS Core + TTS — scope and design
Date: 2026-10-21
Status: PROPOSED — not approved for public release

## Objective
Trim the existing **private** `thanhtai-personal/algorithm-animator-studio` repository back into a coherent, installable, maintainable open-source algorithm animation and video authoring application **with its existing TTS/voice toolset preserved**. The owner has already cloned the larger project to another source for archival. Do not change repository visibility, merge a destructive PR, rewrite protected history or publish a release during cleanup.

## Design alternatives
- A. Delete entire unrelated directories from the monorepo now: fast, but breaks imports, routes, navigation, exports and TTS shared services. REJECT.
- **B. Incrementally subtract by dependency boundaries in the current repository**: keep functional routes and APIs, add regression gates, then prune orphan files in reviewable PRs. SELECT.
- C. Replace with a new core repository and leave this repo unchanged: easiest clean history, but violates the owner's explicit request to work here. Potential backup/fallback for a later clean release.

## Must retain (functional contracts)
1. Short algorithm animation: sorting, searching, graph algorithms, algorithm custom code; visual preview; output/export.
2. Maze/pathfinding and comparison modes; 3D algorithm visuals where dependencies and licenses allow.
3. Long-form algorithm video: visualization, local render/export (FFmpeg and Remotion utilities only as used by retained features).
4. **All current TTS / voice tools**: Piper (models/status/install/generation), Supertonic (generation and style import), VieNeu TTS, GPT-SoVITS, ElevenLabs, RVC/Applio (TTS + conversion/templates); existing voice-over media outputs; settings/provider health and local startup support needed by these tools.
5. Shared UI/i18n/themes needed for the above; offline/local workflows and desktop integration as a separate release gate.
6. Fail gracefully when a provider/model/API key is unavailable; never require proprietary accounts to preview algorithms.

Canonical entrypoints:
- `src/pages/Index.tsx`, `src/pages/AlgorithmWorld.tsx`, `src/pages/LongContent.tsx`
- `src/features/algorithm-video-3d/`, `src/lib/algorithms/`, `src/lib/renderers/`
- `src/pages/TextToSpeech.tsx`, `src/lib/voiceApi.ts`
- `server/routes/{generate,model,piperRuntime,supertonic,vieneu,gptSoVits,rvcApplio,elevenLabs,health,providerStartup,system,setupWizard}Routes.ts` as applicable
- Backend voice services + models/types, `server/config/paths.ts`, `server/services/{RuntimeEnvService,EnvFileService}.ts`
- `scripts/start-*.mjs` required by retained providers; `libs/VieNeu-TTS` adapter subject to redistribution audit.

## Candidate removable product domains AFTER importer migration and tests
- Story creation/review/video, GitHub Trending and football/MU news
- Social provider OAuth, YouTube channel publishing, publishing queues, web extraction unrelated to kept features
- General-purpose AI video agent/presets and common video creation screens (retain shared render utilities only)
- Rhythmic/marble tower/action duel demos and math reference video studio (unless separately licensed and explicitly kept later)
- Assets/music/sprites/references exclusively used by removed domains; archived local/media/scratch artifacts
- Unused API handlers, dependencies, scripts and docs

`src/pages/AlgorithmChannelPage.tsx` and `src/pages/AlgorithmLongVideoPage.tsx` currently import `AiVideoAgent` into an agentic/manual tab UI. Those entrypoints MUST be rewritten to retain manual creation before deleting the agent subsystem. `server/index.ts` composes many unrelated routers and background services. It MUST be refactored with tests before removing any of them. `src/App.tsx`, `appNavigation.ts`, `menuFeatureSettings.ts` and Settings depend on unrelated product areas and must be simplified as one coherent route/nav change.

## TTS redistributability and secrets
The Git tree includes four Piper `.onnx` models (~268 MB), `libs/VieNeu-TTS` vendored source, and other media, including two large preset MP3 files. **Do not remove installed provider integrations just because model files are restricted**. Replace bundled non-redistributable voice weights/models or third-party code with an opt-in documented download/external-path installation only AFTER a licensed equivalent or verified provider initialization is available. Assess model-card license, upstream software license, voice/consent, attribution, non-commercial clauses, and binary provenance individually. A single `LICENSE` for own code does not relicense those assets.
Audit Git history for secrets and sensitive data (past commits survive deleting files), OAuth/social credentials, references to private machine paths, private accounts and business metadata. Never include real API keys or transcripts in sample config or test snapshots.

## Architecture boundary
```
React/Vite UI
  algorithm routes -> algorithm + 3D + render modules
  /text-to-speech   -> voiceApi -> local Express voice adapters
  settings/assets   -> provider config, model installation, generated audio
Local Express runtime
  algorithm export services (FFmpeg/Remotion) + generated-files endpoints
  TTS: Piper | Supertonic | VieNeu | GPT-SoVITS | ElevenLabs | RVC/Applio
```
Maintain an explicit allowlist of retained routes and provider APIs. No surprising auto-publish, social OAuth or remote public inference exposure. The current Express `cors()` and file-serving behavior requires threat review; localhost-only APIs must not be deployed as anonymous open proxies.

## Verification requirements (no shortcuts)
- Baseline records before removal: `npm ci`, `npm test`, `npm run build`, `npm run build:server`; record baseline failures separately.
- Web smoke: algorithm sorting/search/graph preview, maze race, long video, short/long export; no auth/sign-in requirement for local open-source use.
- TTS matrix: provider config/health, available/unavailable/missing-model handling, generation to playable output for each configured provider; Applio template read/write and voice conversion; voice-over sync where retained.
- Desktop: Windows Electron build and startup/provider detection if claiming desktop support; otherwise mark experimental with verified commands.
- CI: unit + typecheck/lint + build + focused endpoint tests with mocked network calls; optional full render smoke.
- Safety: `git diff --check`, dependency/license/SBOM review, secret scan of *full history*, asset rights, clean new-user install, and no broken navigation.
- Public gate: add a compliant license only for owned code after rights audit; README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, THIRD_PARTY_NOTICES, tagged release and real runnable demo. Owner separately approves any visibility change or Git history rewrite.

## Explicit current status
This is a design, not evidence of successful build, tests, license clearance or public-readiness. CI from previous commits has failed before recorded steps, so passing local tests must be obtained independently.
