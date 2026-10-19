# T03 — Ceiling-fan geometry and sweep timing

**Scope:** Three metal ceiling-fan blades, shared fixed shaft, reference-based timing, temporal echoes and shadow. Based on T01's supplied 296-frame 360×640 clip and stacked on T02 scene PR #20.

## Visual evidence

The source clip shows a bronze circular housing cropped by the upper screen edge, two diagonal blades during the opening black outfit, and a straight central blade passing over the model during transition events. It does **not** rotate uniformly at 0.96-second intervals. The rotor is largely held in place for 0–3.4s and visibly sweeps in bursts around 3.8–4.9s, 6.07–6.86s and 8.17–9.1s.

Reference comparisons are available in this conversation as `t03_fan_comparison.jpg` and a 296-frame 30 FPS `t03_fashion_fan_preview.mp4` showing fan over T02 carpet and sofa. The prototype preview does NOT include real model motion, soundtrack or application export pipeline.

## Source files

- `FashionCeilingFan.tsx`: procedural fan drawing, broad flat bronze blades with hinge/bolts, 3x120-degree rotor offsets, an always-fixed top housing, shadow and velocity-dependent ghost trail. Ignores legacy `imageSrc` (no more mismatched Openclipart overriding the bronze fan), preserves prop compatibility.
- `fashionFanMotion.ts`: pure time-to-angle mapping with smooth keyed interpolation, hub (180,36), fan stops and burst timing. Deterministic for arbitrary Remotion seeks; blur derived from previous fractional-frame angles rather than frame-by-frame accumulation.
- `FashionStage.tsx`: re-exports existing T02 `FashionLivingRoom` and new fan module for compatibility with `FashionClawComposition`.
- `fashionFanMotion.test.ts`: asserts offsets, stationary interval, keyframe timing, continuity across 296 frames, blur bounds, ordered trails, invalid input fallback.

## Checking

- Local RED→GREEN tested through Node v22 `--experimental-strip-types --test`, 6/6 pure motion checks passing.
- TypeScript `transpileModule`: 0 diagnostics for rotor source and motion module (this is NOT a full app type-check).
- Rendered 296 isolated fan SVG frames and composited over T02 stage; encoded H.264 360×640, **296 frames, 30 FPS, 9.8667 seconds**, verified by ffprobe.
- The exact local fan source matches the GitHub blob via git SHA-1: `cda00fb59fa3cb8ce0ea4e57cd05f9385a1dec1d`; motion module `d2221956bf9f388e92b965b4f6013d56606e5f26`.

**Remaining QA:** No full KAI STUDIO `npm run build`, Vitest suite or integrated Remotion export in this private repo via GitHub connector; these are required before merge. Geometry and angular keyframes are hand-matched estimates, not automated tracking; video reference and PR must be reviewed side-by-side in-app. T04/T05 will correct the model's entrance and outfit switches; T03 deliberately does not change them.

**PR sequencing:** T03 branches from T02's head and should be reviewed / merged AFTER T02. It should not be directly merged to main while T02 is pending.
