# Algorithm Animator Studio — public-release preparation documents

This folder contains the maintainer-facing materials for a possible source release. **Presence of these files is not release clearance.** The repository remains Private and the cleanup PR remains Draft until evidence is recorded.

- [Licensing boundaries](LICENSING.md) — what the proposed MIT license covers and does not cover.
- [Asset provenance](ASSET_PROVENANCE.md) — known-unverified sprite, sound, image and MIDI groups.
- [Third-party TTS audit](third-party-audit.md) — Piper/VieNeu weight and voice risks.
- [Third-party notices](../../THIRD_PARTY_NOTICES.md) — Remotion, FFmpeg, TTS and dependency obligations.
- [Architecture](ARCHITECTURE.md) — algorithm/Remotion/TTS separation.
- [Development](DEVELOPMENT.md) — reproducible local setup and checks.
- [Release checklist](RELEASE_CHECKLIST.md) — manual approval and green build gates.
- [History sanitization](HISTORY_SANITIZATION.md) — safe strategies for removing private historical content.
- [Release notes template](RELEASE_NOTES_TEMPLATE.md) — evidence-backed release notes.
- [Cleanup work log](cleanup-progress-2026-10-21.md) — implementation record; not a substitute for test logs.

Use `npm run validate:oss` for functional checks after `npm ci`. Separately, `npm run audit:oss:release` intentionally exits nonzero until the maintainer clears the remaining release blockers and updates the gate. Do not turn that failure into a skipped CI status.
