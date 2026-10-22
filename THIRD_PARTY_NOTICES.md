# Third-party software and asset notices

**Status: inventory for OSS preparation — NOT a final shipped-binary notice.** This is an attribution and compliance inventory, not a substitution for the full license texts of dependencies actually distributed. Verify the exact versions and bundled artifacts at release time.

| Component / service | How the app uses it | Upstream terms / obligations to review |
|---|---|---|
| [Remotion](https://github.com/remotion-dev/remotion) | `remotion` and `@remotion/*` npm packages used for preview and video rendering | **Remotion License — source-available, not OSI open source**. Commercial/company eligibility restrictions may require a paid license: https://www.remotion.dev/docs/license/pricing and https://github.com/remotion-dev/remotion/blob/main/LICENSE.md |
| [FFmpeg](https://ffmpeg.org/) / [@ffmpeg-installer/ffmpeg](https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg) | Video/audio encoding; installed or distributed binaries | FFmpeg is LGPL-2.1-or-later by default, possibly GPL where optional components are enabled; inspect the exact configured binary and comply with redistribution/codec requirements: https://ffmpeg.org/legal.html |
| [Piper](https://github.com/OHF-Voice/piper1-gpl) | Optional independently installed CLI/local TTS runtime | The current OHF Piper implementation is GPL-3.0; it is not vendored here. Models have **independent** model-card terms, e.g. some non-commercial or attribution conditions |
| [Supertonic](https://github.com/supertone-oss-archive/supertonic) | Optional separate TTS Python runtime / local HTTP service | Sample code MIT; model weights OpenRAIL-M. Upstream project was archived in 2026. User installs the code and models separately. Review terms for the chosen version |
| [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) | Optional external sibling checkout / Python bridge | SDK Apache-2.0, but some bundled upstream preset voices/samples previously identified as **CC BY-NC 4.0**. None of the vendor checkout or its voice samples is intended to be shipped here |
| [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | Optional independently installed speech synthesis API | Upstream source's MIT license does **not** grant rights to all datasets, pretrained models or cloned voices |
| [Applio](https://github.com/IAHispano/Applio) | Optional external Gradio voice conversion runtime | Upstream source MIT; user-supplied voice models, reference recordings and derivatives require separate rights |
| [ElevenLabs](https://elevenlabs.io/) | Optional remote commercial API via user-supplied key | Proprietary hosted service, not open-source software; API use and generated content governed by service terms |
| [React, Vite, Lucide, shadcn/ui and other npm libraries](https://www.npmjs.com/) | Frontend and Node build/runtime dependencies | Each package retains its own license and notices. Audit the lockfile and distributed dependency tree, especially transitive binaries and fonts, before a binary release |

## Bundled media requiring a decision

`src/assets/sprites/`, `src/assets/audios/`, `src/assets/marble-*.wav`, `haaland.jpg` and other tracked media are listed in [ASSET_PROVENANCE](docs/oss/ASSET_PROVENANCE.md). **Do not treat these files as MIT, CC0 or public domain without evidence.**

## Requirements for a release

1. Generate an SBOM or inventory from the **actual release build**, not only from `package.json`; preserve applicable licenses and notices for the versions distributed.
2. For Windows/Electron packages, record whether executable FFmpeg/Piper or other codec libraries are bundled; provide the required notices and corresponding source if applicable.
3. Verify Remotion use and redistribution terms independently, including downstream company size/use-case restrictions; the app's MIT license does not replace the Remotion License.
4. Record every shipped media file's author, source URL, license/consent, and attribution in the asset register; do not ship unknown-rights media.
5. Verify that a clean external TTS setup does not download/install models silently on behalf of a user without revealing model terms. Obtain permission for voice cloning/conversion.

This list is incomplete until a dependency and binary provenance scan is run. See `docs/oss/RELEASE_CHECKLIST.md`.
