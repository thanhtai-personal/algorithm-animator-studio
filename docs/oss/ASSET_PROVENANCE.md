# Bundled media and provenance audit — 22 October 2026

**Scope:** `audit/oss-media-history-20261022`, based on the merged `main` state. The application is mainly a local tool, but publishing its source/history and redistributing models or example media still requires permission. Individual non-commercial licenses are not automatically compatible with a permissive OSS release.

## Current-tree decisions

| Group | Status | Functional replacement / action |
| --- | --- | --- |
| `src/assets/sprites/01_mouse.png` … `20_giraffe.png` | Removed (20 sprites, origin/license not documented) | Animal columns use 20 procedural animal symbols and keep value/weight mapping; licensed compatible sprite packs can be installed locally |
| `src/assets/sprites/land-tile.jpg` | Removed | Procedural sky, trees, grass and ground replace its use in the animal-column renderer |
| `src/assets/audios/select-audio/*.mp3`, `swap-audio/*.mp3` | Removed (9 MP3 assets, source/license not verified) | Web Audio procedural SFX remains; optionally install a properly licensed effect pack locally |
| `src/assets/audios/midis/SuperMarioMakerTitleTheme.mid` | Removed (1 MIDI) | Do not distribute a recognizable third-party musical composition without a license; use procedural/custom licensed music |
| `src/assets/marble-*.wav` | Removed (4 historic sound files, no longer needed) | No required current dependency; procedural SFX and user music still available |
| `haaland.jpg` | Removed (1 historic photograph) | Not needed for Algorithm / TTS; photographer/publicity rights unconfirmed |
| `public/favicon.ico`, `public/kai-studio-logo.svg`, `public/placeholder.svg` | **Removed on security-hardening branch** | Replaced logo usage with existing Lucide icon; simple new SVG favicon. Historical copies remain reachable until separately addressed |
| External Piper/Supertonic/VieNeu/GPT-SoVITS/Applio models and voices | **Not bundled** | Keep optional independent installs; follow `docs/oss/third-party-audit.md` and the provider README |
| FFmpeg/Remotion/npm dependencies | **Required code/runtime, not covered by repository MIT** | Use each upstream license and attribution; read `THIRD_PARTY_NOTICES.md` |

**Removed now:** 36 tracked media files (~30.4 MB). This is a current-tree change, not Git-history deletion. The animal-sprite artwork changes appearance to procedurally drawn symbols; original sprite animation frames are deliberately not redistributed.

## Criteria for any new bundled assets

For each proposed asset document: file hash, author/rightsholder, authoritative source URL, creation or acquisition record, exact license version, modification log, permitted redistribution and modifications, commercial limits, required credits, review date and reviewer. Only bundle if the terms are compatible with the intended public source distribution. A local file may be under a narrower license than the application itself, but it must not be claimed under MIT or silently bundled.

Third-party source available on a website is not automatically reusable. A MIDI format does not eliminate the copyright in the underlying composition. AI generation alone does not establish unrestricted rights.

## Release blockers

- Verify the security-hardening PR is merged and the unverified `public/` image and site-verification files are absent from new HEAD; old history still requires review.
- Run regression tests and real browser/Canvas/Remotion smoke checks for the procedural animal mode and SFX; these have **not** been certified in the current tool environment.
- Check all historical Git refs and past commit objects, including old sprite/music/model copies and potential credential files. Current-tree deletion is not enough.
- No license grant is made for the previously tracked unknown-rights media.
