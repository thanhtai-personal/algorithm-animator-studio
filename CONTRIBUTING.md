# Contributing to Algorithm Animator Studio

Thanks for improving algorithm animations, education tooling, rendering, or provider integrations.

## Before a change

Read [README.md](README.md), [architecture](docs/oss/ARCHITECTURE.md), [development guide](docs/oss/DEVELOPMENT.md), [licensing scope](docs/oss/LICENSING.md), [security policy](SECURITY.md) and [code of conduct](CODE_OF_CONDUCT.md). During OSS preparation the repo and PR may still be private; contributions will open only after the maintainer declares the project release-ready.

Prefer small PRs with a clear behavioral goal. Open an issue to discuss large API, database, rendering or licensing changes first. Avoid introducing authentication, story, news or generic publishing modules back into the OSS core.

## Set up and validate

```bash
npm ci
npm run dev
# Separate terminal or before PR:
npm run validate:oss
```

Node.js 22 is expected. The app should launch without external voice engines; no voice weight belongs in Git. `validate:oss` runs structural/import checks, Vitest and build stages. A clean-run result is required for merge; existing GitHub Actions runner failures must be resolved independently.

For affected algorithm code, add deterministic sorting/search/pathfinding test cases. For TTS, mock external requests and verify unavailable provider/model states without downloads or credential exposure. For video, verify algorithm/timeline compositions and media export after shared renderer changes.

## Code and documentation

- Use existing TypeScript/React patterns and dual-language Vietnamese/English UI where applicable.
- Add tests when changing behavior; retain every supported algorithm entrypoint and external TTS adapter unless the change is explicitly scoped.
- Update README, environment sample and provider docs when changing setup commands or defaults.
- Do not commit generated video, model weights, trained voice files, `.env`, keys, personal recordings, user datasets, binaries or third-party artwork without separately documented rights.
- Run `npm run lint` and the affected tests where possible. Report exactly which commands ran and their outcomes.

## Intellectual-property and provenance policy

Submit only code and documentation you wrote or are authorized to contribute under the project's [MIT license](LICENSE). By submitting a PR you represent you have the required rights and are willing for your original contribution to be distributed under MIT, subject to any prior separately documented rights. Do not copy code/snippets from libraries or tutorials whose terms are unclear. Preserve copyright and attribution notices; list reused assets and upstream licenses in the PR.

The project license does **not** grant rights to third-party Remotion packages, FFmpeg, TTS models or existing unknown-provenance media. Refer to [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md).

## Pull request summary

Use [the PR template](.github/pull_request_template.md). Show user-visible behavior, test results, screenshots where helpful, licensing implications and any remaining risks. Never make a failed CI check appear green.
