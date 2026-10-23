# Licensing policy and scope

**Prepared for maintainer approval — 22 October 2026.** This repository is already PUBLIC, but no official release is cleared. This supersedes the previous private-branch wording.

## The project's own code

The `LICENSE` file proposes **MIT** for the original application source and documentation for which the Algorithm Animator Studio maintainers possess licensing rights. Contributors should supply only work they are entitled to license under MIT. Do not assume code copied from another project is covered merely because it is tracked in this repository.

The GitHub repository may use a different display license until GitHub rescans the default branch; the public default branch already contains MIT, but this does not grant rights to historical third-party media or prove ownership of every source contribution. The copyright holder should review the copyright line before merge.

## What is *not* relicensed by the MIT file

- **Third-party dependencies** loaded from npm, pip or separate installations: their own upstream terms apply, notably Remotion's custom license.
- **Local TTS engines** (Piper, Supertonic, VieNeu, GPT-SoVITS, Applio), weights, pretrained speakers, datasets and sample voices: distinct code/data licenses, not distributed as part of this repository by default.
- **Bundled artwork and recorded audio** whose provenance is currently unverified: *not licensed for reuse under the project's MIT grant*. See `docs/oss/ASSET_PROVENANCE.md`; do not include them in a public distribution until authorized, replaced with provably licensed alternatives or removed.
- Trademarks and rights of publicity are not granted by a software license. Sample files may require separate permissions.

The MIT grant does not override existing copyright notices, contracts or dependency license restrictions. If a copied source file has different rights, obtain permission/relicense appropriately or remove/replace it before publishing.

## Distribution vs source availability

Opening the application repository is separate from bundling a desktop executable. A distributed installer can bring in Remotion, FFmpeg, Piper and additional model and codec conditions that do not follow from MIT. Review the package and binary license manifest for each release; do not ship a Windows installer until the review is complete.

See [THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md), [asset provenance](ASSET_PROVENANCE.md), [TTS audit](third-party-audit.md) and [release checklist](RELEASE_CHECKLIST.md). This document is a licensing scope note, not legal advice.
