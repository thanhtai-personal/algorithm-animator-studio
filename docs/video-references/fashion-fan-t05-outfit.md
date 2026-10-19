# T05 — Outfit swaps aligned to the ceiling-fan passes

**Task:** synchronize 4 reference outfits with only 3 fan-masked cuts. Keeps the shared PR #22 on `feat/fashion-fan-reference-clone`; no new PR.

## Source reference

Source: 296 frames at 30 FPS, top-down fashion clip supplied by the user. T01 identified broad inspection windows, not exact hard cuts. T05 manually inspected extra neighboring source frames with the fan covering the body. We selected three **art-directed cut positions** inside those windows, balancing visible dress change with the procedural fan angles from T03:

| Cut | Frame (30 FPS) | Time (s) | Change | T03 blade angle at cut |
| --- | ---: | ---: | --- | ---: |
| 1 | **139** | 4.6333 | black/white → champagne | 360° |
| 2 | **184** | 6.1333 | champagne → silver-blue | 480° |
| 3 | **248** | 8.2667 | silver-blue → pink | approx. 711.5° |

The rotor has three blades, 120° apart. At all three cuts a blade is within 12° of the model-covering downward orientation. These are *approximate artistic alignment choices*, not a frame-accurate segmentation inference from the uploaded clip.

## Code

- `fashionOutfitTimeline.ts`: single source of truth `FASHION_LOOK_CUT_FRAMES`, `FASHION_LOOKS`, `getFashionLookAtFrame`, `getFashionLookAtSeconds` and `resolveFashionOutfitSource`. Deterministic for Remotion random seeks and different output FPS; negative/invalid time handling.
- `FashionClawComposition.tsx`: replaces the **incorrect modulo 0.96-second switches** with the timeline. The selected user photo also follows these times; with fewer than four photos the last one remains rather than repeating older outfits.
- `FashionDemoModel.tsx`: four palettes (black-white, champagne, silver-blue, pink) rather than three cycling palettes. The vector model synchronously updates shoes, dress detailing and a handbag matching each outfit. A photo remains an ordinary photo: we do not draw a fake handbag or shoes over the user's photo.
- `fashionOutfitTimeline.test.ts`: 6 test groups on 296 reference frames, exactly 3 cuts, stable looks, fan occlusion, timing independent of output FPS, accessory palettes and partial upload behavior.

## Verification

- Isolated Node 22 test harness: **6/6 pass** (red→green); TypeScript transpilation diagnostics for `fashionOutfitTimeline.ts` and T03 motion: 0. These are isolated logic tests, **not** proof that the full application builds.
- No modification to T01/T02/T03 geometry, T04 model motion, API, or custom outfit upload handling.
- **Not yet verified:** full `npm run build`, `npm test` across the private repo, actual integrated Remotion export and frame-by-frame comparison. These are required under T07 before PR merge.

## Known visual limitations / T06–T07 handoff

- In T05 the four vector outfits still share one cartoon dress silhouette; they differ in color, trim, shoe color and bags. High-fidelity pleats/lace/garment geometry belong to T06.
- When actual product photos are uploaded, no AI virtual try-on or articulated full-body video is generated; upload count above four uses only the first four in this 4-look source-match mode. Future custom wardrobe sequencing is a separate task.
- T03 blade angular keyframes were art-directed. The source video has variable blur and occlusion; precise pixel-level visual matching requires side-by-side overlays in T07.
