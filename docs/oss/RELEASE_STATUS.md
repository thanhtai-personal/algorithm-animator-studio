# Release status / decision record — 22 October 2026

Repository: `thanhtai-personal/algorithm-animator-studio`  
Visibility observed on GitHub: **Public**  
Default branch: `main`  
License file: MIT for original code owned or licensed by project contributors (pending owner rights signoff)  
GitHub Releases: **none** observed as of this check  
Tags: no tag refs observed in the checked Git refs response  
Proposed first source release: `v0.1.0` **not created**  
Windows/Electron binaries: **not cleared for redistribution**

## Release blockers

| Gate | State | Evidence / reason |
| --- | --- | --- |
| Source ownership & third-party media | **BLOCKED** | Initial ownership approval pending, replaced uncleared web assets pending PR merge, historical media remains accessible |
| Dependencies & platform binaries | **BLOCKED** | 1,272 npm packages examined from lockfile; custom Remotion/GSAP terms, GPL FFmpeg platform artifacts, 11 packages missing license metadata |
| Secrets and full Git history | **BLOCKED** | Nonempty historical signing credential fields found in old PR tips; full content scan and owner rotation review not completed |
| Tests/build/voice inference | **BLOCKED** | GitHub Actions runner failure before steps; no reproducible green `validate:oss`, algorithm/video/audio acceptance log |
| Release metadata and docs | **IN PROGRESS** | Legal docs exist, source-only draft workflow/snapshot script prepared, version and provenance signoff pending |

## Required next decision

**Do not create an official release/tag or claim this public repository is sanitized.** The fact it is already Public changes the urgency, not the evidence threshold.

1. Owner identifies any real Android signing credentials and applies app-specific rotation/revocation. Run a full-history scanner in a local complete clone.
2. Owner and rights reviewer approve MIT copyright attribution plus all retained original source/media. Clear Remotion/GSAP and platform FFmpeg obligations; source-only and binary licensing must be assessed separately.
3. CI runner becomes available and `npm ci && npm run validate:oss` succeeds; browser/algorithm, Remotion MP4, TTS unavailable-state and actual provider tests produce logs.
4. Decide whether to publish a **new clean-history repository** as the official source, rather than release from this repository carrying old public refs. Produce and verify a source-only snapshot with no `.git` or runtime/model assets.
5. Only then bump `package.json`/lockfile to `0.1.0`, create a signed/verified tag and publish accurate release notes. This branch does not do those irreversible steps.

The current state is a public **development repository**, not an approved official version.
