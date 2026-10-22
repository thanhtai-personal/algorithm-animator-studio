# Algorithm Animator Studio — OSS preparation

A visual algorithm animation and video authoring toolkit with built-in text-to-speech integrations.

**Status (22 October 2026):** Source and legal release preparation **in progress** on `chore/oss-algorithm-tts-cleanup-20261021`. This repository is not ready to be made Public: the full Git history, third-party model/media rights, dependency integrity and runtime tests have **not yet been cleared**. Do not redistribute bundled third-party voice weights until their model licenses and provenance are confirmed. Legacy preset media has been removed from the current tree, but remains in the Git history.

## Features retained in the OSS edition

- **Algorithm Shorts:** sorting, searching, graph visualizations, custom code, previews and exports.
- **Maze Pathfinding:** graph/pathfinding competition and visualization.
- **Algorithm Long Video:** long-form explainers with Canvas/FFmpeg and the algorithm-oriented Remotion renderer.
- **Voice tools (optional adapters):** Piper; Supertonic; VieNeu TTS; GPT-SoVITS; ElevenLabs (hosted/proprietary); RVC/Applio TTS and voice conversion. Provider binaries, weights and recordings are separate.
- Local provider settings/health, model discovery, generated audio and video files.

Removed from this OSS preparation branch: story/news/social publishing, unrelated demos, the generic Math/Preset Video library and legacy source media. Algorithm Explainer and Timeline Remotion compositions are still retained. Other shared modules await dependency auditing.

## Local development

Requirements: Node.js 22, npm, and any optional Python/FFmpeg/model prerequisites for the TTS providers you choose to use.

```bash
npm ci
npm run dev:server
```

In a second terminal:

```bash
npm run dev:client
```

Open `http://localhost:3000/algorithms` or `http://localhost:3000/text-to-speech`. The local backend defaults to port `5050`; update `.env.example` values in a local `.env` file as needed. `npm run dev` now starts **only the client and Node backend**, so no optional Python TTS runtime is required. `npm run dev:full` additionally attempts to start provider processes; use it only after you have installed and enabled the selected engines.

## Voice provider setup

Every optional TTS engine is installed **outside this repository**. The app owns only its adapters, bridge scripts and provider configuration. A missing provider/model must not block starting the core algorithm application. By default, the `.env.example` provider auto-start flags are disabled; enable only the engine you installed.

| Engine | Download / project | Startup method | How the app connects |
| --- | --- | --- | --- |
| Piper | [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) and voice model selected in Settings | Local executable, **no HTTP process** | `PIPER_EXE` + `MODEL_DIR` |
| Supertonic | [supertone-inc/supertonic](https://github.com/supertone-oss-archive/supertonic) / its [Python service](https://github.com/supertone-oss-archive/supertonic-py) | `npm run supertonic:serve` after installing Python package | `SUPERTONIC_BASE_URL` (default `http://127.0.0.1:6688`) |
| VieNeu-TTS | [pnnbao97/VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) — **separate sibling checkout** | Python bridge on demand; optional `npm run vieneu:serve` | `VIENEU_SOURCE_DIR`, `VIENEU_PYTHON` |
| GPT-SoVITS | [RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) — separate checkout | Its upstream API, or `npm run gpt-sovits:serve` with a configured start command | `GPT_SOVITS_BASE_URL` (usually port 9880) |
| RVC/Applio | [IAHispano/Applio](https://github.com/IAHispano/Applio) — separate checkout | Its Gradio server, optionally started by `npm run dev:applio` | `RVC_APPLIO_BASE_URL`, `RVC_APPLIO_PYTHON`, Gradio API template |
| ElevenLabs | Proprietary hosted service, **not open source** | No local runtime | `ELEVENLABS_API_KEY` |

**Core app start (without any optional TTS installs)**

```bash
npm ci
npm run dev
```

Once an engine is installed, start it using the appropriate command below, preferably in a separate terminal. Keep the Node backend and browser app running. The base app can render algorithms without a VieNeu checkout, a Supertonic environment, or Applio/GPT-SoVITS running; trying to generate with an unavailable provider will show a provider-specific error.

Install only the provider(s) you intend to use. The app adapters remain in this repository; model weights, vendor runtimes and their Python environments should be installed separately. This avoids a multi-gigabyte clone and keeps third-party model licenses separate from the app source.

### 1. Piper — local TTS, simplest CPU option

- Runtime: install the Piper executable from the [official Piper project](https://github.com/OHF-Voice/piper1-gpl) and set `PIPER_EXE` in `.env` to its full path.
- Voice: open **Settings → Voice** and download a supported model, or configure a compatible model in `MODEL_DIR`. The app does not bundle ONNX weights.
- No separate HTTP service is required; the backend calls the local executable.
- Review the exact voice model card before use. Piper model licenses vary; see [the third-party audit](docs/oss/third-party-audit.md).

### 2. Supertonic — local HTTP TTS service (archived upstream)

The Supertonic project moved to an archived read-only repository in September 2026. Source examples and model weights have separate license conditions; consult [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md) before installing. The commands below remain a compatibility guide and are not a promise of upstream support.

Official project: [Supertonic](https://github.com/supertone-oss-archive/supertonic).

Create a dedicated Python environment, activate it, then install and run the server from the app repository:

```powershell
py -3.11 -m venv ..\.venv-supertonic
..\.venv-supertonic\Scripts\Activate.ps1
python -m pip install --upgrade pip
npm run supertonic:install
```

Linux/macOS activation is `source ../.venv-supertonic/bin/activate` after creating the environment with `python3 -m venv ../.venv-supertonic`. Keeping this environment outside the repository avoids accidentally committing runtime files.

Set these values in `.env` for local browser development:

```env
CLIENT_ORIGIN=http://localhost:3000
SUPERTONIC_BASE_URL=http://127.0.0.1:6688
SUPERTONIC_MODEL=supertonic-3
SUPERTONIC_CORS=http://localhost:3000
KAI_PROVIDER_SUPERTONIC_ENABLED=true
```

Run the provider in its own terminal with `npm run supertonic:serve`. On first use the runtime may download model assets. Keep that terminal open. A direct equivalent is `supertonic serve --host 127.0.0.1 --port 6688 --model supertonic-3 --cors http://localhost:3000` after activating the provider environment. Check `http://127.0.0.1:6688/v1/health` before returning to the app.

### 3. VieNeu-TTS — optional Vietnamese TTS, external checkout

VieNeu source and its preset/sample voice assets are **not bundled** in this repository. Download the upstream project separately; do not copy non-commercial preset/sample assets back into this repo.

From the Algorithm Animator Studio repository root:

```bash
git clone https://github.com/pnnbao97/VieNeu-TTS.git ../VieNeu-TTS
```

Use Python 3.10 or 3.11, then set the following in `.env` (Windows shown; use `../VieNeu-TTS/.venv/bin/python` on Linux/macOS):

```env
VIENEU_SOURCE_DIR=../VieNeu-TTS
VIENEU_PYTHON=../VieNeu-TTS/.venv/Scripts/python.exe
VIENEU_AUTO_START=true
VIENEU_START_MODE=bridge
VIENEU_MODE=turbo
KAI_PROVIDER_VIENEU_ENABLED=true
```

Install into VieNeu's own virtual environment and verify the SDK:

```bash
npm run vieneu:install
npm run vieneu:health
```

The backend invokes VieNeu directly through the external Python environment **when generation is requested**; `VIENEU_AUTO_START=true` only starts a managed bridge health process and is not required for normal local requests. To run it separately for diagnostics, use `npm run vieneu:health`; to open the optional upstream Gradio UI, set `VIENEU_START_MODE=gradio` and run `npm run vieneu:serve`. The first generation may download model files. If using upstream VieNeu v3, follow its model/backend instructions; the existing app adapter may need version-specific validation. Review the upstream project's code, model and voice-asset terms before commercial use or redistribution; the repository's own audit is at [docs/oss/third-party-audit.md](docs/oss/third-party-audit.md).

If you do not install VieNeu, leave `KAI_PROVIDER_VIENEU_ENABLED=false` and `VIENEU_AUTO_START=false`. The other TTS providers do not depend on VieNeu.

### 4. GPT-SoVITS — experimental local voice cloning

Upstream source and install instructions: [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS). To keep it outside this repository, you can clone it from the app root with `git clone https://github.com/RVC-Boss/GPT-SoVITS.git ../GPT-SoVITS`, then follow that version's installation instructions and download its required models separately. Start its API using the launch script supplied by the version you installed; the documented default API address is `http://127.0.0.1:9880`.

Configure `.env` with your actual paths:

```env
GPT_SOVITS_SOURCE_DIR=../GPT-SoVITS
GPT_SOVITS_START_COMMAND=C:/AI/GPT-SoVITS/go-api.bat
GPT_SOVITS_BASE_URL=http://127.0.0.1:9880
KAI_PROVIDER_GPT_SOVITS_ENABLED=true
```

Then run `npm run gpt-sovits:serve` in its own terminal, or start the upstream API yourself. Verify the upstream API is responding on the configured port before selecting this provider; the exact launcher is version-dependent. The launch filename and dependency requirements vary by GPT-SoVITS version; use the script provided by your downloaded version. Configure reference audio and prompt text in **Settings → Voice → GPT-SoVITS**.

### 5. RVC/Applio — optional voice conversion

Download Applio from its [official repository](https://github.com/IAHispano/Applio), or clone the source to a separate folder such as `../Applio`; follow the current upstream installation instructions, then start it separately (commonly `run-applio.bat`). Download/train the voice model outside this repository and only use models you have permission to use.

Example `.env` settings; update paths and API name to match your installation:

```env
RVC_APPLIO_BASE_URL=http://127.0.0.1:6969
RVC_APPLIO_START_COMMAND=C:/Applio/run-applio.bat
RVC_APPLIO_PYTHON=C:/Applio/env/Scripts/python.exe
KAI_PROVIDER_APPLIO_ENABLED=true
```

Install `gradio_client` in the Python environment configured by `RVC_APPLIO_PYTHON`:

```bash
npm run applio:install
```

If Applio uses a separate Python environment, run `C:/Applio/env/Scripts/python.exe -m pip install -U gradio_client` instead. Follow [the Applio API/template guide](docs/applio-api-template-and-voice-text.md) to configure the matching Gradio endpoint. RVC/Applio is primarily a **voice-conversion** step: generate source speech with a TTS provider first, then convert it.

### 6. ElevenLabs — hosted, not open source

ElevenLabs is an optional cloud provider, not a self-hosted open-source engine. Add your own `ELEVENLABS_API_KEY` in `.env`; never commit the key.

### Start the app and selected provider(s)

1. Install app dependencies: `npm ci`, then copy `.env.example` to `.env`.
2. Set local origins such as `CLIENT_ORIGIN=http://localhost:3000` and `VITE_CLIENT_ORIGIN=http://localhost:3000`.
3. Start the backend with `npm run dev:server` and the frontend in another terminal with `npm run dev:client`.
4. Start only the selected local provider using its command above. Piper is launched by the backend; Supertonic, GPT-SoVITS and Applio run as separate processes; VieNeu uses its own external Python environment.
5. Open `http://localhost:3000/text-to-speech` and use **Settings → Voice / Health Check** to configure and verify the provider.

`npm run dev` deliberately starts only the browser app and Node backend. For experienced users, `npm run dev:full` also attempts to start optional providers; do not use it until the providers you enabled are installed and configured. Keep disabled providers at `KAI_PROVIDER_*_ENABLED=false`. Models may be several GB and may need a compatible GPU, disk space and first-run downloads. Only use voice cloning/conversion with consent and rights.

## Development checks

From a clean checkout with Node.js 22:

```bash
npm ci
npm run validate:oss
```

The command checks the retained algorithm/TTS surface, runs the OSS structural/import checks and Vitest regression suite, then builds the web client and server bundle.

For release review, run `npm run audit:oss:release` separately. It **deliberately exits with an error** while legal/history/asset and verification gates remain unsigned; its failure is a safety signal, not a green test. See [the history/publication playbook](docs/oss/HISTORY_SANITIZATION.md). It stops on the first failure. This command has been added for reproducible local validation but has **not yet been executed successfully** in the current session.

These checks are *not* a guarantee of rights clearance, complete runtime behavior or usable Windows installer. See `docs/oss/2026-10-21-source-inventory.md` and `docs/superpowers/plans/2026-10-21-oss-core-with-tts.md` for outstanding work. Recent GitHub Actions jobs fail before runner assignment (no steps/logs recorded); resolve that infrastructure issue or run the command in a checked-out workspace before treating the baseline as green.

## License, assets and third parties

**MIT is proposed for the original Algorithm Animator Studio code and documentation** that contributors have the right to license: see [LICENSE](LICENSE) and [LICENSING.md](docs/oss/LICENSING.md). This does **not** give a blanket MIT license to bundled artwork, recorded sounds, pretrained voices, independent TTS services, FFmpeg or Remotion.

**Remotion is source-available under its own license, not OSI-open-source;** usage terms depend on the user/organization and may require commercial licensing. **FFmpeg** has LGPL/GPL obligations depending on the build. See [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md), [TTS model audit](docs/oss/third-party-audit.md), and [asset provenance](docs/oss/ASSET_PROVENANCE.md).

This GitHub repository remains Private and the cleanup PR remains Draft because media provenance, earlier Git history, a clean build and end-to-end provider tests still require clearance. **Do not treat these proposed documents as a declaration that the current branch is safe to publish.**

## Contributing and project policy

Read [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md), [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), [SUPPORT](SUPPORT.md), and the [release gate checklist](docs/oss/RELEASE_CHECKLIST.md). The initial release and security support policy will only become active after maintainer approval.

## Documentation

| Topic | Guide |
|---|---|
| Architecture and supported modules | [OSS architecture](docs/oss/ARCHITECTURE.md) |
| Local setup, validation and tests | [Development](docs/oss/DEVELOPMENT.md) |
| Piper / Supertonic / VieNeu / GPT-SoVITS / Applio | [Standalone TTS services](docs/local-voice-services.md) |
| Remotion and timeline video | [Video renderer](docs/remotion-video-engine.md) |
| Legal scope and dependencies | [Licensing scope](docs/oss/LICENSING.md) · [Third-party notices](THIRD_PARTY_NOTICES.md) |
| Unverified artwork / media | [Asset provenance](docs/oss/ASSET_PROVENANCE.md) |
| Public release readiness | [Release checklist](docs/oss/RELEASE_CHECKLIST.md) |
