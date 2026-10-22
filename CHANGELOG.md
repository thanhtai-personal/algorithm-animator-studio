# Changelog

This project follows a simple Keep a Changelog style. Version numbers and release dates will be assigned only after a tested public release.

## [Unreleased] — OSS preparation

### Added
- Documented external Piper, Supertonic, VieNeu-TTS, GPT-SoVITS, RVC/Applio and ElevenLabs integration and opt-in installation.
- Algorithm and TTS regression/structural tests and reproducible `npm run validate:oss`.
- Proposed MIT license for original code, governance docs, third-party notices, provenance ledger and release checklist.

### Changed
- Simplified the app to Algorithm Short, Maze, Long Video, generated assets, settings and optional TTS.
- Kept AlgorithmExplainer and TimelineVideo Remotion compositions.
- Separated optional local TTS runtime installation and configuration from the core application.

### Removed
- Story/news/social publishing and unrelated Math/Preset, rhythmic and demo application code.
- Bundled Piper ONNX weights, vendored VieNeu source and voice assets from the **current Git tree** (old commits remain).
- Retired YouTube download tools and obsolete backend/frontend tests.

**Not a release:** Changes in this private branch have not been approved for distribution. No completed CI/build/runtime/asset-history clearance is claimed.
