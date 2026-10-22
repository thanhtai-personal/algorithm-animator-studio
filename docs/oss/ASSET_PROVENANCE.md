# Bundled asset provenance register

**Release blocker — 22 October 2026.** These assets are currently tracked but their rights have not been verified. Their presence in a private worktree is **not** permission to distribute them in an MIT source release.

| Current file group | Current role | Rights status | Required action before Public / download |
|---|---|---|---|
| `src/assets/sprites/01_mouse.png` through `20_giraffe.png` | Algorithm animal-column sprite-sheet visualizations | **UNKNOWN** source, artist, license and redistribution permission | Find original author/source and permitted license, or replace with owned procedural/CC0 material; attach proof in this register |
| `src/assets/sprites/land-tile.jpg` | Sprite/visual background tile | **UNKNOWN** | Verify provenance or replace/remove |
| `src/assets/audios/select-audio/*.mp3` and `swap-audio/*.mp3` | UI / animation effects | **UNKNOWN** recordist, sample library and license | Replace with appropriately licensed sound effects or document exact permission & attribution |
| `src/assets/audios/midis/SuperMarioMakerTitleTheme.mid` | MIDI tune potentially based on third-party musical composition | **HIGH RISK**, musical composition rights not established | Remove from release, including generated audio or video derived from it; do not assume MIDI files are public domain |
| `src/assets/marble-*.wav` | Historical audio clips | **UNKNOWN** | Remove if unreferenced; otherwise obtain rights or replace |
| `haaland.jpg` | Historical standalone image | **UNKNOWN**, possible publicity/third-party photographic rights | Remove from public tree unless permission is documented |
| `public/favicon.ico`, `public/placeholder.svg`, other UI illustrations | User interface assets | **NOT YET AUDITED** | Verify origin and terms; replace template-supplied assets if necessary |
| Downloaded TTS/voice/model data | Not bundled by policy | Individual model/voice-specific licenses | Keep external; document exact model license and source before redistributing any weights |

## Evidence checklist for each asset

Record: **path, author/rightsholder, source URL or creation evidence, exact license (version), attribution text, modification history, permitted uses including redistribution/commercial use, verifier, date verified**. Use one row per asset (or per provably licensed asset pack).

Do **not** infer an asset license from a nearby dependency's MIT license. Attribution alone is not sufficient where distribution permission is missing, and AI-generated status alone does not prove unrestricted copyright or publicity rights.

Until approved, the project source can be prepared privately, but the history and current unverified media prevent a release-clearance claim. The repository should remain Private.
