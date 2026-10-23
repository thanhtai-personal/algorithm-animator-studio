VieNeu is an optional provider. Clone its SDK separately into `../VieNeu-TTS`; this app repo does not bundle the SDK, preset voices, or sample voice assets. Health checks Python, the bridge scripts, and whether the `vieneu` SDK can be imported.

### Install

1. Clone `https://github.com/pnnbao97/VieNeu-TTS` into `../VieNeu-TTS`, outside this app repo.
2. Run the install command to create `.venv` inside that external checkout and install the source in editable mode.
3. Use Python 3.10 or 3.11. The provider is disabled by default; set `KAI_PROVIDER_VIENEU_ENABLED=true` and `VIENEU_AUTO_START=true` in `.env` to enable it.

```bat
npm run vieneu:install
npm run vieneu:health
npm run dev
```

If you do not use VieNeu, leave `KAI_PROVIDER_VIENEU_ENABLED=false`. Do not use preset/sample voices unless their license permits your intended use.

If you want to use global Python instead of `.venv`, set `VIENEU_PYTHON=python` in `.env` or Settings -> Voice -> VieNeu. This only works when the global Python environment already has the VieNeu SDK/dependencies installed.

### Values to enter in settings

1. In Settings -> Voice -> VieNeu, set `VIENEU_PYTHON` to `{{VIENEU_PYTHON}}`.
2. Choose `VIENEU_MODE`: use `turbo` or `standard` for the local SDK.
3. Use `remote` only if you have an OpenAI-compatible VieNeu endpoint.
4. For voice clone, choose `VIENEU_REFERENCE_AUDIO` and fill `VIENEU_REFERENCE_TEXT` with the reference audio transcript.
5. Set `VIENEU_TIMEOUT_MS=1200000` if the machine loads models slowly.

### npm run dev mode

By default, `dev:vieneu` runs in `bridge` mode: it checks the SDK and keeps the process alive so the logs stay visible. The backend still generates audio through `/api/vieneu/generate` and `scripts/vieneu-generate.py`; Gradio is not required.

To open VieNeu Gradio during dev, add this to `.env`:

```env
VIENEU_START_MODE=gradio
GRADIO_SERVER_NAME=127.0.0.1
GRADIO_SERVER_PORT=7860
```
