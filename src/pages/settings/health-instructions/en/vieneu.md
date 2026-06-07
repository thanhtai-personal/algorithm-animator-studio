VieNeu runs from the local source under `libs/VieNeu-TTS`. Health checks Python, the bridge scripts, and whether the `vieneu` SDK can be imported.

### Install

1. The VieNeu-TTS source is already placed in this repo at `libs/VieNeu-TTS`.
2. Run the install command to create `.venv` inside that folder and install the source in editable mode.
3. After install, `npm run dev` starts an additional `vieneu` process to verify that the bridge is ready.

```bat
npm run vieneu:install
npm run vieneu:health
npm run dev
```

If you want to update VieNeu from your own fork, replace the source under `libs/VieNeu-TTS` or set `VIENEU_SOURCE_DIR` to your fork path before running `npm run vieneu:install`.

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
