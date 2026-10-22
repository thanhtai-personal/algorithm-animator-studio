# Remotion renderer — Algorithm Animator OSS core

This branch retains **Algorithm Explainer** and **Timeline Video** as the only Remotion compositions. Legacy standalone Math Video, Preset Video, news/story card templates, their APIs and bundled preset media have been removed. Algorithmic maze/bars animations, voice audio overlays and music mixing remain in the renderer.

## Developer workflow

From a clean Node.js 22 checkout (once dependencies and the build have been verified):

```bash
npm ci
npm run dev:client
npm run dev:server
```

Open **`/algorithms/video-long`** for the maintained manual algorithm long-video interface; the generic `/video-create` route is not currently part of the OSS navigation.

For Remotion Studio:

```bash
npm run dev:remotion
```

To render the retained algorithm composition via the CLI:

```bash
npm run remotion:render:test
```

The CLI and web route are not yet certified by an actual successful build on this cleanup branch.

## Compositions (source of truth: `src/features/remotion-video/remotion/Root.tsx`)

| Composition ID | Role |
| --- | --- |
| `AlgorithmExplainer` | 16:9 / 9:16 algorithm explainer with bars or maze, voice and background music |
| `TimelineVideo` | Timeline editor compositions with audio/lyrics; retained for video editor and export |

Entry point: `src/features/remotion-video/remotion/index.ts`.

Backend API retained: `GET /api/video/remotion/health`, `POST /api/video/render-remotion`, `POST /api/video/render-timeline`, `POST /api/video/generate-from-audio`. Generated MP4s remain in the configured generated-video directory.

Key files: `RemotionVideoGenerator.tsx`, `AlgorithmExplainerComposition.tsx`, `TimelineComposition.tsx`, `server/services/RemotionRenderService.ts`, `server/services/RemotionTimelineRenderService.ts`, and `server/routes/videoRoutes.ts`.

## Migration constraints

Previous `PresetVideo`, `MathSinCosV1`, `render-preset`, `math-narration/mix` and Math-specific audio APIs are intentionally unavailable in this OSS edition. Clients calling them must migrate to the algorithm/timeline render endpoints. Do not add preset-specific imports to the shared Remotion root again.

Validate with `node --test scripts/tests/oss-remotion-isolation.check.mjs`, `npm test`, `npm run build`, `npm run build:server`, and a real Remotion preview/render once CI runners work.
