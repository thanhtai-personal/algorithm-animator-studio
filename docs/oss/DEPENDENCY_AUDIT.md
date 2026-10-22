# Dependency license review — 22 October 2026

**Status: incomplete, source-only release not legally cleared.** Based on tracked `package-lock.json`; `node_modules` and any distributable platform binaries were not installed/audited in this environment.

| Check | Current lockfile result |
| --- | ---: |
| Dependency package entries | **1,272** |
| Entries with `license` metadata | **1,261** |
| Missing license metadata | **11** |
| MIT | **1,014** |
| ISC | **87** |
| Apache-2.0 | **48** |

**Important:** SPDX metadata is not enough to authorize redistribution; the exact license text and binary build matter.

## Mandatory review categories

- **Remotion 4.0.515:** custom Remotion License, not MIT and not OSI-approved. Includes compositor binaries with no license property in the npm lockfile. Determine permitted publisher, company and downstream usage before claiming the combined application is unrestricted OSS.
- **GSAP 3.15.0:** lockfile says “Standard 'no charge' license”; do not assume conventional MIT-style rights. Verify allowed distribution/use or eliminate the dependency if not necessary.
- **FFmpeg/FFprobe:** optional precompiled OS-specific binaries report GPLv3 or GPL-3.0 for multiple Windows/Linux targets, while wrappers report LGPL. A Windows installer can ship GPL-covered binaries even though the app source is MIT; inspect exact binary, notice and corresponding source obligations.
- **11 entries without license metadata:** 7 OS-specific `@remotion/compositor-* ` packages, `@remotion/media`, `busboy`, `streamsearch`, `webgl-constants`. Check upstream package tarballs/license files and dependencies; unknown is not automatically a violation, but cannot be marked cleared.
- **Voice engines/model weights:** independently installed Piper, Supertonic, VieNeu, GPT-SoVITS and Applio plus hosted ElevenLabs retain upstream and model-card restrictions; their weights, sample recordings and reference voices are not automatically MIT.
- **Project source and media:** identity artwork and site-verification artifacts without verified rights/purpose were replaced/removed from current HEAD on the security branch. Confirm ownership of remaining original code before licensing it as MIT.

## Locally reproducible checks

```bash
npm ci
npm run audit:oss:deps
npm sbom --sbom-format cyclonedx > artifacts/oss-dependency-audit/npm-sbom.cdx.json
npm run validate:oss
```

`audit:oss:deps` deliberately exits nonzero for missing/custom/copyleft metadata until the maintainer reviews the actual obligations. The report goes to ignored `artifacts/oss-dependency-audit` (no silent “pass”). The CycloneDX SBOM must be generated from a checked-out installed build, reviewed and retained privately for release evidence. Do not upload confidential scan findings to public issues.

## Release policy

Source-only releases may include code that integrates separately licensed dependencies, but the top-level MIT license **does not grant unrestricted rights** to Remotion, GSAP, FFmpeg binaries or speech models. No Windows installer should be published before the exact shipped binary manifest and obligations are checked.
