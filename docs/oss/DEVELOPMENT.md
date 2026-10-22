# Developer setup and validation

**Status:** pre-release; CI jobs have not yet executed a green build on the cleanup branch.

## Requirements

Node.js 22, npm and optionally FFmpeg for rendering. Use Python only for the TTS engine(s) selected. Refer to [README](../../README.md#voice-provider-setup) for each provider's official source and separate installation commands.

```bash
git clone https://github.com/thanhtai-personal/algorithm-animator-studio.git
cd algorithm-animator-studio
# Check out the OSS preparation branch while the PR remains private:
git checkout chore/oss-algorithm-tts-cleanup-20261021
npm ci
cp .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Browse `http://localhost:3000/algorithms`; API uses `http://localhost:5050` by default. The optional TTS engines do not need to start for algorithms to render. Provider secrets belong only in the local `.env` file.

## Check changes locally

```bash
npm run test:oss:static
npm test
npm run build
npm run build:server
# Same set plus the retained-surface assertion:
npm run validate:oss
```

For a targeted regression: `npx vitest run src/test/OssAlgorithmTtsRegression.test.ts`. Treat a successful mocked TTS HTTP test as a contract check, **not** proof of actual model synthesis. Add real-provider smoke tests for each enabled engine and verify an output WAV; generate algorithm MP4 and timeline render for release QA.

## Before submitting a PR

1. Keep algorithm visual results deterministic. Do not make all tests depend on downloaded models or a cloud API key.
2. Review new runtime dependencies for licensing, especially Remotion and FFmpeg binary redistributions.
3. Include output from executed tests/build. Mark blocked steps honestly.
4. Verify you added no API key, signed URL, personally identifying sample recordings, pretrained voice weights or unlicensed assets.
5. Link the updated issue/decision and explain affected feature flags and TTS providers.

## CI limitation

The baseline GitHub Actions job has reported failures before runner assignment (`runner_id=0`, no steps or logs), so its status does not prove source-level pass/fail. Check GitHub Actions settings, repository plan/billing/runner availability, and rerun after an administrator resolves the block. A fully checked-out machine can run `npm ci && npm run validate:oss` without changing repository visibility.

Do not mark the branch release-ready until those steps have been executed successfully and the complete [release checklist](RELEASE_CHECKLIST.md) is satisfied.
