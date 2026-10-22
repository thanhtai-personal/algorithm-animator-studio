# Algorithm Animator Studio — OSS preparation

A visual algorithm animation and video authoring toolkit with built-in text-to-speech integrations.

**Status (22 October 2026):** Open-source cleanup **in progress** on `chore/oss-algorithm-tts-cleanup-20261021`. This repository is not ready to be made Public: the full Git history, third-party model/media rights, dependency integrity and runtime tests have **not yet been cleared**. Do not redistribute bundled third-party voice weights until their model licenses and provenance are confirmed. Legacy preset media has been removed from the current tree, but remains in the Git history.

## Features retained in the OSS edition

- **Algorithm Shorts:** sorting, searching, graph visualizations, custom code, previews and exports.
- **Maze Pathfinding:** graph/pathfinding competition and visualization.
- **Algorithm Long Video:** long-form explainers with Canvas/FFmpeg and the algorithm-oriented Remotion renderer.
- **Voice tools (all current adapters):** Piper; Supertonic; VieNeu TTS; GPT-SoVITS; ElevenLabs; RVC/Applio TTS and voice conversion.
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

Open `http://localhost:3000/algorithms` or `http://localhost:3000/text-to-speech`. The local backend defaults to port `5050`; update `.env.example` values in a local `.env` file as needed. The full `npm run dev` command also attempts to launch several optional voice providers; use split terminals above for a smaller development setup.

## Voice provider setup

Install only the provider(s) you intend to use. The app adapters remain in this repository; model weights, vendor runtimes and their Python environments should be installed separately. This avoids a multi-gigabyte clone and keeps third-party model licenses separate from the app source.

### 1. Piper — local TTS, simplest CPU option

- Runtime: install the Piper executable from the [official Piper project](https://github.com/OHF-Voice/piper1-gpl) and set `PIPER_EXE` in `.env` to its full path.
- Voice: open **Settings → Voice** and download a supported model, or configure a compatible model in `MODEL_DIR`. The app does not bundle ONNX weights.
- No separate HTTP service is required; the backend calls the local executable.
- Review the exact voice model card before use. Piper model licenses vary; see [the third-party audit](docs/oss/third-party-audit.md).

### 2. Supertonic — local HTTP TTS service

Official project: [Supertonic](https://github.com/supertone-inc/supertonic).

Create a dedicated Python environment, activate it, then install and run the server from the app repository:

```powershell
py -3.11 -m venv .venv-supertonic
.\.venv-supertonic\Scripts\Activate.ps1
python -m pip install --upgrade pip
npm run supertonic:install
```

Linux/macOS activation is `source .venv-supertonic/bin/activate` after creating the environment with `python3 -m venv .venv-supertonic`.

Set these values in `.env` for local browser development:

```env
CLIENT_ORIGIN=http://localhost:3000
SUPERTONIC_BASE_URL=http://127.0.0.1:6688
SUPERTONIC_MODEL=supertonic-3
SUPERTONIC_CORS=http://localhost:3000
KAI_PROVIDER_SUPERTONIC_ENABLED=true
```

Run the provider in its own terminal with `npm run supertonic:serve`. On first use the runtime may download model assets. Keep that terminal open.

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

The app invokes VieNeu through its Python bridge; a separate Gradio UI is not required. To run the optional Gradio UI, set `VIENEU_START_MODE=gradio` and run `npm run vieneu:serve`. The first generation may download model files. Review the upstream project's code, model and voice-asset terms before commercial use or redistribution; the repository's own audit is at [docs/oss/third-party-audit.md](docs/oss/third-party-audit.md).

If you do not install VieNeu, leave `KAI_PROVIDER_VIENEU_ENABLED=false` and `VIENEU_AUTO_START=false`. The other TTS providers do not depend on VieNeu.

### 4. GPT-SoVITS — experimental local voice cloning

Upstream source and install instructions: [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS). Clone/download it into a separate folder (for example `../GPT-SoVITS`) and follow its own setup instructions. Start its API using the launch script supplied by the version you installed; the documented default API address is `http://127.0.0.1:9880`.

Configure `.env` with your actual paths:

```env
GPT_SOVITS_SOURCE_DIR=../GPT-SoVITS
GPT_SOVITS_START_COMMAND=C:/AI/GPT-SoVITS/go-api.bat
GPT_SOVITS_BASE_URL=http://127.0.0.1:9880
KAI_PROVIDER_GPT_SOVITS_ENABLED=true
```

Then run `npm run gpt-sovits:serve` in its own terminal, or start the upstream API yourself. The launch filename and dependency requirements vary by GPT-SoVITS version; use the script provided by your downloaded version. Configure reference audio and prompt text in **Settings → Voice → GPT-SoVITS**.

### 5. RVC/Applio — optional voice conversion

Download Applio from its [official repository](https://github.com/IAHispano/Applio), install it using its current instructions, then start it separately (commonly `run-applio.bat`). Import/train a voice model you have permission to use.

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

The all-in-one `npm run dev` command may launch enabled providers as well. If a provider is not installed, disable its startup gate in `.env` rather than installing every engine. Models may be several GB and may need a compatible GPU, disk space and first-run downloads. Only use voice cloning/conversion with consent and rights.

## Development checks

From a clean checkout with Node.js 22:

```bash
npm ci
npm run validate:oss
```

The command checks the retained algorithm/TTS surface, runs the OSS structural/import checks and Vitest regression suite, then builds the web client and server bundle. It stops on the first failure. This command has been added for reproducible local validation but has **not yet been executed successfully** in the current session.

These checks are *not* a guarantee of rights clearance, complete runtime behavior or usable Windows installer. See `docs/oss/2026-10-21-source-inventory.md` and `docs/superpowers/plans/2026-10-21-oss-core-with-tts.md` for outstanding work. Recent GitHub Actions jobs fail before runner assignment (no steps/logs recorded); resolve that infrastructure issue or run the command in a checked-out workspace before treating the baseline as green.

## Licensing

No repository-wide open-source license is granted yet. Source code, vendored libraries, Piper models and other binary assets can have **different** authors and redistribution terms. A top-level LICENSE will only be selected after ownership and third-party notices are reviewed.

## Contributing

Work is still underway in a private draft PR. A contributor guide, security contact, first release and public roadmap will be added once a clean build and legal/provenance review are complete.
