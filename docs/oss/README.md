# Algorithm Animator Studio — public-release preparation documents

This folder contains the maintainer-facing materials for a possible source release. **Presence of these files is not release clearance.** PR #28 has been merged and the repository is already Public; **an official release remains blocked** pending security, legal and test evidence.

- [Licensing boundaries](LICENSING.md) — what the proposed MIT license covers and does not cover.
- [Asset provenance](ASSET_PROVENANCE.md) — known-unverified sprite, sound, image and MIDI groups.
- [Third-party TTS audit](third-party-audit.md) — Piper/VieNeu weight and voice risks.
- [Third-party notices](../../THIRD_PARTY_NOTICES.md) — Remotion, FFmpeg, TTS and dependency obligations.
- [Architecture](ARCHITECTURE.md) — algorithm/Remotion/TTS separation.
- [Development](DEVELOPMENT.md) — reproducible local setup and checks.
- [Release checklist](RELEASE_CHECKLIST.md) — manual approval and green build gates.
- [Public history response](PUBLIC_HISTORY_RESPONSE_20261022.md) — known signing-config exposure and owner steps.
- [Dependency inventory](DEPENDENCY_AUDIT.md) — lockfile/binary license blockers.
- [Release status](RELEASE_STATUS.md) — factual version and visibility record.
- [History sanitization](HISTORY_SANITIZATION.md) — safe strategies for removing private historical content.
- [Release notes template](RELEASE_NOTES_TEMPLATE.md) — evidence-backed release notes.
- [Cleanup work log](cleanup-progress-2026-10-21.md) — implementation record; not a substitute for test logs.

## Example outputs made with the tool

- [Bruno Fernandes: 100 Goals!](https://www.youtube.com/watch?v=h2EwOys6evI)
- [100 Bruno Fernandes United Assists](https://www.youtube.com/watch?v=-BIriLyQXkw)

These links show finished videos produced with Algorithm Animator Studio; they are not application walkthroughs or evidence that the current source build has passed validation.

Use `npm run validate:oss` for functional checks after `npm ci`. Separately, `npm run audit:oss:release` intentionally exits nonzero until the maintainer clears the remaining release blockers and updates the gate. Do not turn that failure into a skipped CI status.
