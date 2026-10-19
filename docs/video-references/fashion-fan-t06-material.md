# T06 — Fashion Fan: fabric, hair, depth and transition finish

Task T06 is implemented on the shared `feat/fashion-fan-reference-clone` branch and must be reviewed inside **PR #22**. No separate PR or changes to the video rendering service.

## Original reference and design constraints

Compared original 360×640 / 30 FPS video at frames 90, 153, 214, 272 and cut neighborhoods 139, 184, 248. The source has four distinctly different fabric builds, large but soft person-to-rug shadows, dark hair with directional highlights, and a metal blade that temporarily covers the body. A flat recolored dress on a rigid SVG character is not a photo-equivalent reproduction.

## Files and visual improvements

- `FashionGarment.tsx`: independent SVG garment rendering with **four distinct silhouettes**:
  - black/white: dark waist and skirt, white neckline/apron, scalloped lace lower hem and pleats;
  - champagne: layered warm gold translucent hem panels and approximately 21 small pearls/sparkles;
  - silver-blue: lighter layered lace/tier dress, embroidered stripes and 13 highlights;
  - pink: wider, four-layer translucent tulle skirt with pleats/ruffles and small fabric drift.
- `FashionDemoModel.tsx`: delegates dress construction to `FashionGarment`; adds dark hair layers and highlights with bounded movement; keeps T04 independent arm/leg/head SVG joints, T05 shoes and handbag.
- `FashionFilmFinish.tsx`: soft dark ellipse under the animated model (same translation/rotation), restrained film-edge vignette and a low-opacity warm neutral veil **only within four source frames** of the three T05 cuts, after the rotating fan.
- `fashionVisualStyle.ts`: deterministic pure shape/timing data for garment build, hair movement, floor shadow and veil. Every value based on Remotion time, never stateful frame accumulation.
- `FashionClawComposition.tsx`: wires floor shadow below both the SVG mannequin and uploaded outfit image, introduces material model time, places color finish above the fan, retains the T02 camera zoom, T03 fan and T05 cut timing.
- `fashionVisualStyle.test.ts`: validates four garment types and layer counts, restrained/no flash outside cut intervals, finite deterministic values over all 296 original frames and invalid input safety.

## Local visual and test evidence

- Local 4-look SVG material study rasterized with CairoSVG. A reference-vs-material contact sheet `fashion_t06_material_study.jpg` is attached to the conversation **but not committed to GitHub**, as it includes stills from user-provided footage.
- Local pure visual-style tests: **4/4 passing** with `node --test`; red state was a missing module before implementation.
- Local `typescript.transpileModule` on material SVG component and pure visual-style functions: **0 syntax diagnostics**. This does **not** constitute full type checking or Vite build.
- Confirm presence of all T06 changes in the shared branch by GitHub PR compare and file inspection.

## Known limitations

- The preview study isolates outfits; it is **not** an application screenshot nor a pixel-perfect match to the person in the original video. Real-photographic face, skin, fabric deformation and human movement will require matching captured reference footage, a licensed model sequence, or AI garment/body animation. SVG alone cannot produce photographic equivalence.
- With uploaded static photos, T06 only adds a contact shadow/film grade: it does not distort a person's limbs or repaint an uploaded garment.
- T06 does **not** change T05 cut frames, data-source behavior, the editor UI or its export pipeline.
- Full private repository `npm run build`, entire Vitest suite, Remotion MP4 integrated export and frame-overlaid QA remain **T07**. Do not merge #22 until the full pipeline has been tested.
