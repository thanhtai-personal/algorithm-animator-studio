# Open-source release gate — Algorithm Animator Studio

**CURRENT STATUS: BLOCKED / NOT PUBLIC-READY.** Do not merge the draft cleanup PR, make the repository public or publish an installer until each applicable blocking check below is evidenced. This checklist is deliberately a set of release gates rather than optimistic progress percentages.

## Ownership, license and legal

- [ ] Owner/rightsholder approves the top-level MIT copyright attribution and confirms the ownership/rights to license every original source contribution.
- [x] Proposed MIT `LICENSE`, licensing scope, notices and asset provenance register added **on the cleanup branch** (not yet published from `main`).
- [ ] Audit source borrowed from templates, tutorials, projects, dependencies and any generated code; preserve/reconcile incompatible file-specific rights.
- [ ] Decide and document the actual third-party binary distribution format (source-only vs bundled Windows/Electron).
- [ ] Confirm the Remotion License applies to maintainers **and downstream usage**; this is source-available, not OSI open source; disclose the limitation.
- [ ] Confirm GPL/LGPL notices and source distribution obligations for the **specific FFmpeg/Piper binaries** bundled, if any.
- [ ] Review all external Piper/Supertonic/VieNeu/GPT-SoVITS/Applio model, sample and reference-audio licenses; do not ship unapproved weights or presets.
- [ ] Resolve every UNKNOWN entry in `ASSET_PROVENANCE.md`; remove/replace unapproved images, audio, MIDI and unused assets. A project MIT license is not evidence for asset rights.
- [ ] Produce final dependency/SBOM + third-party notices for the actual build.

## Repository and history security

- [ ] Scan **all refs and commit history** for tokens, OAuth secrets, private user/model/audio assets, absolute local paths and unlicensed large binaries.
- [ ] Rotate any credential discovered, even if removed from the current tree.
- [ ] Decide history sanitization vs a fresh root/history; receive owner approval before irreversible rewrite/force-push. Validate that all refs/tags/releases used for Public exclude sensitive objects.
- [ ] Verify `.env.example` contains placeholders only and no retired OAuth/channel settings.
- [ ] Enable Private Vulnerability Reporting, branch protection, required checks and dependency alerts where available.

## Engineering quality

- [ ] `npm ci` works from a fresh clone using Node.js 22.
- [ ] `npm run test:oss:static` and `npm run validate:oss` pass with executable evidence, not just checked-in test code.
- [ ] `npm run lint` passes or all accepted warnings are documented.
- [ ] `npm run build` and `npm run build:server` produce working artifacts.
- [ ] Browser smoke: Algorithm Short, Maze, Long Video, TTS and Settings all load with no optional provider installed.
- [ ] Sorting/searching/pathfinding regression tests pass; video preview/export smoke produces playable files with expected audio.
- [ ] Each configured TTS provider's contract and actual synthesis tested separately (Piper, Supertonic, VieNeu, GPT-SoVITS, ElevenLabs; Applio voice conversion) with permitted sample voices; unavailable-provider states are safe.
- [ ] Remotion AlgorithmExplainer/TimelineVideo and FFmpeg output tested; Electron packaging tested if a binary will be distributed.
- [ ] GitHub Actions actually runs steps and reports a green conclusion; existing pre-run runner failure must be resolved.

## Public repository polish

- [x] README includes feature scope, local start commands and separate TTS installation instructions.
- [x] CONTRIBUTING, SECURITY, code of conduct and SUPPORT prepared on OSS branch.
- [ ] Triage, remove or archive obsolete internal docs and environment examples before making Public.
- [ ] Confirm license + disclaimer text with project owner and final copyright holder.
- [ ] Add tagged release/version, changelog and accurate screenshot/demo media whose rights are verified.
- [ ] Verify links from `README.md` and GitHub issue/PR templates, then review proposed public README for truthful tested capabilities.

## Release decision

Only the maintainer/owner may approve the merge, legal rights decisions, history changes and visibility switch. **A draft license file does not approve publication.** Record signoff date, tested commit, checks, dependency manifest and asset clearance before release.
