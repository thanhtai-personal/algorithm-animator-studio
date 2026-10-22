# Algorithm Animator Studio vX.Y.Z

Release date: YYYY-MM-DD  
Signed-off maintainer: [name]  
Git commit/clean snapshot hash: [verified hash]  
Release distribution: source only / Electron / other (specify)

## Supported features

- Sorting, searching and pathfinding animation / short and long algorithm video.
- Remotion AlgorithmExplainer and TimelineVideo compositions.
- Optional external TTS adapters: Piper, Supertonic, VieNeu, GPT-SoVITS and RVC/Applio; optional hosted ElevenLabs. **No bundled voice models** unless listed individually with license approvals.

## Installation

Reference tested OS/Node runtime, `npm ci`, `npm run dev`, provider download/setup instructions, and known optional requirements.

## Breaking changes

List removed news/story/social/Math/Preset modules and changed routes/API contracts. Document migrations for affected older clients.

## Verification evidence

| Verification | Tested commit | Result | Link to log/report |
|---|---|---|---|
| `npm run validate:oss` | | PASS required | |
| Algorithm video generation + export | | PASS required | |
| Optional TTS provider health/voice-output smoke | | PASS or NOT TESTED (disclose) | |
| Security/history scan | | CLEAR required | |
| Asset/license provenance review | | CLEAR required | |
| Exact binary/FFmpeg/Remotion license review (if distributing executables) | | CLEAR required | |

## Third-party terms

Link to the shipped notices, model cards and dependency/binary inventory. The MIT application license does **not** replace Remotion/FFmpeg or optional TTS model terms.

## Known limitations

List unsupported use cases, optional provider dependencies and untested platforms. Do not imply undocumented licensing rights or green tests.

**Delete this template's placeholders before any public release.**
