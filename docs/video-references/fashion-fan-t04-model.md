# Fashion Fan — T04 Model Motion (part of consolidated PR)

## Scope and reference

T04 follows the user's supplied 360×640 @30 FPS 296-frame source. The woman starts on the pink sofa **on the left**, rolls to the rug, and rests in the centre by **frame 24 (0.8s)**. The previous implementation instead translated the entire model **from the top** and rotated it by -310 degrees. This task replaces that motion only; T05 still owns the exact fashion-change timeline.

## Implementation

- `fashionModelMotion.ts`: deterministic, frame-seek-safe reference-space motion. 0–0.8s goes from `x=-118px`, `y=+11px`, `rotation=-64deg` to `0,0,0`, easing smoothly. No vertical fall; after 0.8s only small breathing/tilt.
- `FashionDemoModel.tsx`: articulated SVG stand-in (shoulder/hip/head pivots). Pose keys for first black look, hands behind head (champagne), crossed legs (silver), and spread arms (pink), plus gentle breathing/dress movement. Shoulders and feet no longer move only as one rigid sheet.
- `FashionClawComposition.tsx`: converts model motion from 360×640 reference units to actual render width/height, preserving T02 whole-scene zoom and T03 ceiling-fan positioning. Shows articulated stand-in when no **user-uploaded** outfits exist. Uploaded still photos retain whole-photo movement only; they are not falsely portrayed as articulated people.
- `fashionModelMotion.test.ts`: 4 regression groups, 296 frame-wide finite/deterministic and bounds checks, named pose checks.

## Verified / not verified

Isolated local Node 22 `--experimental-strip-types --test` test run: **4 tests passed, 0 failed**. `typescript.transpileModule` returned 0 diagnostics for the motion module. Original negative check failed with `ERR_MODULE_NOT_FOUND` before implementation. Source files are under 400 lines.

**Not yet run:** full Vite build, full Vitest suite, Remotion integrated export or frame-by-frame real-person visual comparison; private repo checkout not present in local tool environment. These are mandatory prior to merge.

## Limits and next steps

A single JPEG/PNG portrait cannot realistically bend limbs; real-image articulation requires segmentation, multiple pose frames, video footage, or skeletal animation assets. Until these exist, the vector mannequin provides a stable *motion test reference* rather than photorealistic human animation. T05 must replace the old 0.96s modulo clothing switches with actual reference windows; T06 will polish visual fidelity, and T07 must validate export and side-by-side frames.

## PR discipline

T01–T04 changes live in **one** new shared feature branch and **one** PR targeting `main`; previous individual PRs #19, #20, #21 are superseded, not merged. T05–T07 should push to the **same** feature branch and PR. Avoid unnecessary commits/deployments; batch reviewed changes.
