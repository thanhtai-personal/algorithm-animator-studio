# Algorithm Animator Studio — OSS preparation

A visual algorithm animation and video authoring toolkit with built-in text-to-speech integrations.

## 🎬 Product video showcase · Video sản phẩm thực tế

**See videos made with the studio before installing it. / Xem video sản phẩm được tạo bởi công cụ trước khi cài đặt.**

[![Code Visual Lab on YouTube](https://img.shields.io/badge/▶_Code_Visual_Lab-View_product_videos-FF0000?logo=youtube&logoColor=white)](https://www.youtube.com/channel/UCpKqiKf3QmCHGQNBlg8ngKA)

| Product-video channel | Content / Nội dung |
| --- | --- |
| **[▶ Code Visual Lab](https://www.youtube.com/channel/UCpKqiKf3QmCHGQNBlg8ngKA)** | Algorithm animations, Shorts, visual explanations / Video thuật toán và trực quan hóa |
| **▶ Second showcase channel / Kênh sản phẩm thứ hai** | **Channel URL required / Cần bổ sung link chính xác** — intentionally not linked until verified, to avoid directing viewers to a similarly named channel |

<!-- Maintainer TODO: supply the exact second YouTube channel URL/handle, then replace the unlinked second row above and add its own clickable showcase badge. Do not use a generic YouTube search URL as a substitute for a channel. -->

**Status (22 October 2026):** OSS release preparation is still **in progress**. This repository is not ready to be made Public: the full Git history, third-party model/media rights, dependency integrity and runtime tests have **not yet been cleared**. TTS providers are optional adapters; install their engines, models and voice assets separately, after reviewing each upstream license. Legacy preset media has been removed from the current tree, but remains in the Git history.

## Features retained in the OSS edition

- **Algorithm Shorts:** sorting, searching, graph visualizations, custom code, previews and exports.
- **Maze Pathfinding:** graph/pathfinding competition and visualization.
- **Algorithm Long Video:** long-form explainers with Canvas/FFmpeg and the algorithm-oriented Remotion renderer.
- **Voice tools (optional adapters):** Piper; Supertonic; VieNeu TTS; GPT-SoVITS; ElevenLabs (hosted/proprietary); RVC/Applio TTS and voice conversion. Provider binaries, weights and recordings are separate.
- Local provider settings/health, model discovery, generated audio and video files.

## Example outputs made with Algorithm Animator Studio

These are example videos produced with the tool (finished outputs, not walkthroughs of the application):

- [Bruno Fernandes: 100 Goals!](https://www.youtube.com/watch?v=h2EwOys6evI)
- [100 Bruno Fernandes United Assists](https://www.youtube.com/watch?v=-BIriLyQXkw)

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

All local TTS engines are optional and run independently of the main app. This repository contains provider adapters, not third-party runtimes or downloaded model weights. Install only the engine(s) you need, keep their Python environments and models outside this repository, and enable only those providers in `.env`.

**VieNeu-TTS is external-only:** its SDK/model/sample assets are not bundled with this repository. You can skip VieNeu entirely and leave `KAI_PROVIDER_VIENEU_ENABLED=false`. To use it, clone and run the separate upstream checkout using [the instructions below](#3-vieneu-tts--optional-external-vietnamese-tts).

### Quick start

From the app repository root:

```bash
npm ci
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`). Keep secrets and local paths in `.env`; never commit it. Start the app with `npm run dev`, then open `http://localhost:3000/text-to-speech`. You can also run `npm run dev:server` and `npm run dev:client` in separate terminals.

| Engine | Upstream download | Runtime/model | Connection from the app |
| --- | --- | --- | --- |
| Piper | [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) | Local executable + separately downloaded voice | `PIPER_EXE`, `MODEL_DIR` |
| Supertonic | [Python service](https://github.com/supertone-oss-archive/supertonic-py) · [source](https://github.com/supertone-oss-archive/supertonic) | Local HTTP server; downloads model on first run | `SUPERTONIC_BASE_URL` (default `http://127.0.0.1:6688`) |
| VieNeu-TTS (optional/experimental) | [pnnbao97/VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) | External Python checkout; model downloads on first synthesis | `VIENEU_SOURCE_DIR`, `VIENEU_PYTHON` |
| GPT-SoVITS | [RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | External Python runtime, API and model checkpoints | `GPT_SOVITS_BASE_URL` (default port `9880`) |
| RVC/Applio | [IAHispano/Applio](https://github.com/IAHispano/Applio) | External Gradio app + user-authorized voice model | `RVC_APPLIO_BASE_URL`, API template |
| ElevenLabs | [Hosted service](https://elevenlabs.io/) | Proprietary cloud service; not open source | `ELEVENLABS_API_KEY` |

**Recommended first setup: Piper.** It is the simplest local path. Start with one engine, confirm it works, then add other providers only if needed. No TTS provider is required to use the algorithm visualizers.

### 1. Piper — local TTS

Official source: [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl). Install its command-line runtime in a separate virtual environment.

Windows PowerShell (run from the app repository root):

```powershell
py -3.11 -m venv ../.venv-piper
../.venv-piper/Scripts/python.exe -m pip install --upgrade pip
../.venv-piper/Scripts/python.exe -m pip install piper-tts
```

Linux/macOS:

```bash
python3 -m venv ../.venv-piper
../.venv-piper/bin/python -m pip install --upgrade pip
../.venv-piper/bin/python -m pip install piper-tts
```

Set `.env` to the executable created in that environment. Use the path that matches your OS:

```env
PIPER_EXE=../.venv-piper/Scripts/piper.exe
MODEL_DIR=../tts-models/piper
```

On Linux/macOS, set `PIPER_EXE=../.venv-piper/bin/piper`. Test the executable with `--help`, then open **Settings → Voice** and download a supported model. The app does not bundle ONNX voice weights. Each voice model has its own license; check its model card before use or redistribution: [TTS model audit](docs/oss/third-party-audit.md). Piper runs locally through the backend, so it does **not** need a separate HTTP server.

### 2. Supertonic — local HTTP TTS

Official Python service: [supertone-oss-archive/supertonic-py](https://github.com/supertone-oss-archive/supertonic-py). The upstream project is archived and receives no further maintenance. Source code and model weights have separate licenses; the weights are not bundled here.

Create a separate Python environment and install the server package:

```powershell
py -3.11 -m venv ../.venv-supertonic
../.venv-supertonic/Scripts/python.exe -m pip install --upgrade pip
../.venv-supertonic/Scripts/python.exe -m pip install "supertonic[serve]"
../.venv-supertonic/Scripts/Activate.ps1
```

Linux/macOS: create `../.venv-supertonic` with `python3 -m venv`, install `"supertonic[serve]"` using that environment's Python, then activate it with `source ../.venv-supertonic/bin/activate`.

Add these values to the app `.env`:

```env
SUPERTONIC_BASE_URL=http://127.0.0.1:6688
SUPERTONIC_MODEL=supertonic-3
SUPERTONIC_CORS=http://localhost:3000
KAI_PROVIDER_SUPERTONIC_ENABLED=true
```

With the Supertonic environment activated, run this from the app repository root in its own terminal:

```bash
npm run supertonic:serve
```

The service downloads model assets on first use. Keep its terminal open and check `http://127.0.0.1:6688/v1/health`. Leave `KAI_PROVIDER_SUPERTONIC_ENABLED=false` if it is not installed. Review the model license before commercial use or redistribution; open-source server code does not automatically make model weights OSI-approved.

### 3. VieNeu-TTS — optional external Vietnamese TTS

VieNeu is optional and **not bundled**. The adapter targets the open-source v3 SDK; the upstream project states that v4 is proprietary. Model checkpoints, preset voices and sample recordings have separate terms. Do not copy upstream presets or samples into this repository. If you need a simpler setup, use Piper or Supertonic instead.

Clone the upstream project as a sibling folder, not inside this repository:

```bash
git clone https://github.com/pnnbao97/VieNeu-TTS.git ../VieNeu-TTS
```

Configure `.env` (Windows shown; Linux/macOS uses `../VieNeu-TTS/.venv/bin/python`):

```env
VIENEU_SOURCE_DIR=../VieNeu-TTS
VIENEU_PYTHON=../VieNeu-TTS/.venv/Scripts/python.exe
VIENEU_MODE=v3turbo
KAI_PROVIDER_VIENEU_ENABLED=true
VIENEU_AUTO_START=false
```

Install the SDK into the external checkout's own virtual environment and check its dependencies:

```bash
npm run vieneu:install
npm run vieneu:health
```

The backend invokes the Python bridge on demand when generating audio; you do not need to launch Gradio or use `npm run dev:full`. The v3 model downloads on first use and may require substantial disk space. If `npm run vieneu:health` fails or generation is incompatible with the downloaded upstream version, set `KAI_PROVIDER_VIENEU_ENABLED=false` and use another provider. This adapter has not yet passed a real-model end-to-end test in this environment. See [the dedicated VieNeu guide](docs/vieneu-local-tts-provider.md) and [license audit](docs/oss/third-party-audit.md).

### 4. GPT-SoVITS — local TTS / voice cloning

Official source and current installation instructions: [RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS). Clone it outside the app repository:

```bash
git clone https://github.com/RVC-Boss/GPT-SoVITS.git ../GPT-SoVITS
```

Install it using the script and device option documented by the version you downloaded. For example, Windows with PowerShell 7 can use `pwsh -F install.ps1 --Device CPU --Source HF`; Linux can use `bash install.sh --device CPU --source HF`. Select a supported CUDA/CPU option for your hardware and follow upstream instructions to download the required checkpoints. Models are not included here.

Start the **API server**, not just the WebUI. From the GPT-SoVITS checkout, use the Python interpreter installed by that checkout:

```bash
python api_v2.py -a 127.0.0.1 -p 9880
```

The upstream `api_v2.py` exposes `/tts` and `/docs`. Keep the process running in its own terminal. In the app `.env`, set:

```env
GPT_SOVITS_SOURCE_DIR=../GPT-SoVITS
GPT_SOVITS_BASE_URL=http://127.0.0.1:9880
GPT_SOVITS_TTS_ENDPOINT=/tts
KAI_PROVIDER_GPT_SOVITS_ENABLED=true
```

Leave `GPT_SOVITS_START_COMMAND` empty if starting the API manually. To let the app start it, set `GPT_SOVITS_START_COMMAND` to the actual Python executable from your GPT-SoVITS installation followed by `api_v2.py -a 127.0.0.1 -p 9880`, then use `npm run gpt-sovits:serve`. Check `http://127.0.0.1:9880/docs` and configure reference audio/text and supported languages in **Settings → Voice → GPT-SoVITS**. Language support varies by model/version.

### 5. RVC/Applio — voice conversion and optional TTS

Official source: [IAHispano/Applio](https://github.com/IAHispano/Applio). Clone it separately and follow current upstream installation instructions:

```bash
git clone https://github.com/IAHispano/Applio.git ../Applio
```

On Windows, run `run-install.bat` once and then `run-applio.bat` from the Applio checkout. On Linux/macOS, follow upstream instructions for `run-install.sh` and `run-applio.sh`. Keep the Gradio server running. The local address/port may vary; use the actual URL shown by Applio.

Example `.env` values for a typical Windows install (change paths and port to match your machine):

```env
RVC_APPLIO_BASE_URL=http://127.0.0.1:6969
RVC_APPLIO_PYTHON=C:/Applio/env/Scripts/python.exe
KAI_PROVIDER_APPLIO_ENABLED=true
```

Install the Gradio client into the Python environment used by the app's Applio bridge:

```bash
C:/Applio/env/Scripts/python.exe -m pip install --upgrade gradio_client
```

Use **Settings → Voice → Applio** and follow [the API/template guide](docs/applio-api-template-and-voice-text.md) to copy the correct Gradio `api_name` and parameters for your installed version. Do not assume every Applio release uses the same endpoint. Applio is often used to convert source speech, so generate source speech with a TTS provider first; use only voice models and recordings you have permission to use.

### 6. ElevenLabs — hosted, not open source

ElevenLabs is a proprietary hosted service, not a local open-source engine. Add your own `ELEVENLABS_API_KEY` to `.env` and never commit it.

### Start and verify the app

1. Install app dependencies (`npm ci`) and copy `.env.example` to `.env`.
2. Set local origins to `http://localhost:3000` where appropriate.
3. Start the app with `npm run dev`.
4. Start only the provider you installed: Piper is invoked by the backend; Supertonic and GPT-SoVITS run as separate HTTP processes; Applio runs its Gradio server; VieNeu uses its external Python SDK on demand.
5. Open `http://localhost:3000/text-to-speech`, select the provider and use **Settings → Voice / Health Check**. Check the provider's own URL/command above first.

`npm run dev` does not install or launch all optional TTS runtimes. Avoid `npm run dev:full` until every provider it may start is installed and configured. After changing `.env`, restart the Node backend. If an optional provider is missing, disable its `KAI_PROVIDER_*_ENABLED` flag; algorithm visualizations should still run. First-run downloads may be large and may require compatible CPU/GPU hardware. Review each source, model and voice asset license before use or redistribution.

## Local media and asset licensing

The open-source tree intentionally **does not bundle** unverified animal sprite sheets, third-party sound effects, MIDI tunes or old demo recordings. **Animal Columns still works** with twenty procedurally drawn animal markers, generated landscape artwork and the built-in Web Audio SFX/music engine. Existing algorithm, Maze and video export features are not gated on the removed assets.

For **local personal use only**, you may supply your own correctly licensed sprites and effects under `src/assets/sprites/`, `src/assets/audios/select-audio/` and `src/assets/audios/swap-audio/`; the Vite glob discovers compatible files automatically. Sprite sheets must have the expected 20-level filename pattern and matching frame layout; arbitrary PNGs will not render correctly. These directories are ignored by Git, and a local-only use case does **not** automatically permit uploading third-party media to a public repository. Original author's terms still apply to uploads and videos.

See [asset provenance and replacement policy](docs/oss/ASSET_PROVENANCE.md), [historical refs audit](docs/oss/REF_TIP_AUDIT_20261022.md) and [history sanitization](docs/oss/HISTORY_SANITIZATION.md). The six optional TTS setup guides above remain valid; external model assets and voice recordings also have separate license terms.

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

This GitHub repository remains Private. The earlier cleanup PR #28 was merged into `main` as internal preparation, **not** as approval to publish; media provenance, earlier Git history, a clean build and end-to-end provider tests still require clearance. **Do not treat these proposed documents as a declaration that the current branch is safe to publish.**

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
