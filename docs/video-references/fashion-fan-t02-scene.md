# Fashion Fan — T02 Scene Layout Handoff

> Scope: Background set, remote prop and scene camera only. Measured from user-supplied 360×640, 296-frame source video and T01 reference. No changes to fan blade geometry (T03), model motion (T04), or outfit switching (T05).

## Visual anchors

| Scene element | Reference | T02 decision |
| --- | --- | --- |
| Blue carpet | Frames 27 / 153 / 214 / 272 | Full-bleed dusty blue texture, fine fibre noise + broad mottling; darker at edges. No visible stripes. |
| Pink sofa | Frames 27 / 153 | Continuous curved sofa enters from off-screen left, y ≈103–602, right-hand edge roughly x≈80–100. Upholstery seams and bottom tufted cushion. |
| Small white remote | Frames 27 / 153 | Frame 27: diagonal at (308,325). Frame 153: upright at (321,325). Hidden after 6.08s to avoid the silver/pink props. |
| Camera | Frame 214 compared to 153 and 272 | Whole scene zooms smoothly 1×→1.43× from 6.33–6.90s, holds until 8.08s, and returns to 1× by 8.65s. Transform origin: 50% x, 62% y. |

## T02 code

- `FashionLivingRoom.tsx`: standalone sofa, carpet and remote SVG composition in native 360×640 coordinates.
- `fashionSetTiming.ts`: pure timing functions `getFashionCameraScale(seconds)`, `getFashionRemotePose(seconds)`.
- `FashionStage.tsx`: re-export new room; existing ceiling fan code unchanged.
- `FashionClawComposition.tsx`: apply scale to a shared set+model+fan wrapper, preserving alignment; keep warning/overlay outside zoom.
- `fashionSetTiming.test.ts`: assert zoom/remote at reference times and 296-frame bounded scale.

## QA evidence and limitations

Independent staging check (without full KAI STUDIO): rendered the SVG through headless Chromium for 0.9, 5.1 and 7.2 seconds, compared visually with source frames 27, 153, 214 and 272. Ran isolated checks for remote position / visibility and camera scale. The background is a procedural illustration, not a photographic extraction or exact replacement of original footage; sofa and rug are visually approximate.

**Limitations:** No full app `npm run build` or Remotion MP4 export was run in this GitHub-only checkout environment. The current model's entrance still starts from top and outfit switches every 0.96s — unchanged intentionally for T04/T05. T03 should refine fan separately, but must respect camera wrapper when calculating geometry.

**Acceptance for this PR:** scoped layer separation; the rug fills portrait frame without tiling; sofa enters from left and stays under the model; white remote appears only for first looks; silver zoom applies to all layers together, pink restores original field of view; 296 reference frame times finite and deterministic.
