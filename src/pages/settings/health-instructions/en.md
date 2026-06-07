## system

Kai Studio must be able to run its local backend and write generated files after the desktop install.

### Fix

1. Close Kai Studio and open it again from the installed desktop shortcut so the bundled backend starts cleanly.
2. If Windows Firewall asks for permission, allow localhost/private network access.
3. Open Settings -> Data and choose a writable folder. Avoid `Program Files` or other protected folders.
4. Check the current generated folder: `{{GENERATED_DIR}}`.
5. Save settings, restart the app, then click Check again.

## piper

Piper needs `piper.exe` plus one `.onnx` and `.onnx.json` pair for each declared voice model.

### Install

1. Install Piper for Windows or use the bundled Piper environment if you already created one.
2. Create a normal writable model folder, for example `C:\KAI-STUDIO\models`.
3. Download each Piper voice as two matching files: `model.onnx` and `model.onnx.json`.

### Values to enter in settings

1. Find the real `piper.exe` path, usually `models\.venv\Scripts\piper.exe` or `C:\KAI-STUDIO\piper\piper.exe`.
2. In Settings -> Voice, set `PIPER_EXE` to the `piper.exe` path.
3. In Settings -> Data/Voice, set `MODEL_DIR` to the folder containing the model files.
4. Click Check again and verify `{{MODEL_COUNT}}` declared models are ready.

```txt
PIPER_EXE={{PIPER_EXE}}
MODEL_DIR=C:\KAI-STUDIO\models
```

## applio

Applio/RVC is a separate local Gradio app. Kai Studio needs its URL, Python environment, and exact Gradio `api_name` values.

### Install

1. Install Applio into a stable folder, for example `C:\TOOLS\ApplioV3.6.2`.
2. Start Applio with its `.bat` file, for example `run-applio.bat`.
3. Keep the Applio Gradio browser tab open.
4. Install `gradio_client` into the exact Python used by Applio.

```bat
{{APPLIO_START_COMMAND}}
{{APPLIO_PYTHON}} -m pip install -U gradio_client
```

### Values to enter in settings

1. Copy the URL from the Applio browser tab, usually `http://127.0.0.1:6969`.
2. Set `RVC_APPLIO_BASE_URL` to that URL.
3. Set `RVC_APPLIO_START_COMMAND` to the `.bat` file that starts Applio.
4. Set `RVC_APPLIO_PYTHON` to the Python used by Applio. If Applio has `env\Scripts\python.exe`, use that instead of system Python.

### Get api_name for voice-to-voice

1. In Applio, open the inference/convert tab.
2. Select the `.pth` voice model and `.index` file.
3. Open `http://127.0.0.1:6969/config` in the browser, changing host/port if your Applio URL is different.
4. Find the object in `dependencies` whose inputs/outputs match the voice conversion block in the Inference tab.
5. Copy the real `api_name` into `RVC_APPLIO_API_NAME`. With the current Applio config, voice-to-voice uses `/enforce_terms`.
6. Copy the exact argument order from that dependency into `convertTemplates[].argTemplate` in Settings -> Voice -> Applio templates.

### Get api_name for Applio TTS

1. In Applio, open the TTS tab.
2. Choose a TTS voice, for example `vi-VN-HoaiMyNeural` or `vi-VN-NamMinhNeural`.
3. Open `http://127.0.0.1:6969/config` in the browser.
4. Find the dependency with the text, TTS voice, and TTS speed inputs from the TTS tab.
5. Copy `api_name` and the exact argument order.
6. Open Settings -> Voice -> Applio templates and update `ttsTemplates[].apiName` and `argTemplate`.

### Currently failed endpoint

`{{FAILED_APIS}}`

If the endpoint above does not exist in `/config`, replace it with the real `api_name` from `dependencies`. If your Applio build does not expose that API, remove or disable the matching template.

```txt
RVC_APPLIO_BASE_URL={{APPLIO_BASE_URL}}
RVC_APPLIO_API_NAME=/enforce_terms
ttsTemplates[].apiName=/enforce_terms_2
```

## supertonic

Supertonic is a local TTS server. Health must pass `/v1/health` and `/v1/styles` before Kai Studio can generate audio.

### Install

1. Install the Supertonic package/server on this machine.
2. In this repo, the expected install command is `npm run supertonic:install`.
3. Start the server with `npm run supertonic:serve` or the command provided by your packaged app.

```bat
npm run supertonic:install
npm run supertonic:serve
```

### Values to enter in settings

1. Open the base URL in a browser, usually `http://127.0.0.1:6688`.
2. Verify `{{SUPERTONIC_BASE_URL}}{{SUPERTONIC_HEALTH_ENDPOINT}}` returns JSON.
3. Verify `{{SUPERTONIC_BASE_URL}}{{SUPERTONIC_STYLES_ENDPOINT}}` returns a voice/style list.
4. In Settings -> Voice -> Supertonic, set `SUPERTONIC_BASE_URL` and the endpoints in use.
5. If styles are empty, import a Supertonic voice/style JSON or load a model that includes voices.

```txt
SUPERTONIC_HEALTH_ENDPOINT={{SUPERTONIC_HEALTH_ENDPOINT}}
SUPERTONIC_STYLES_ENDPOINT={{SUPERTONIC_STYLES_ENDPOINT}}
SUPERTONIC_IMPORT_STYLE_ENDPOINT={{SUPERTONIC_IMPORT_STYLE_ENDPOINT}}
SUPERTONIC_TTS_ENDPOINT={{SUPERTONIC_TTS_ENDPOINT}}
```

## vieneu

VieNeu runs through a configured Python environment. Health checks Python, the bridge script, and whether the `vieneu` SDK imports.

### Install

1. Fork the VieNeu-TTS repo to your GitHub account.
2. Clone the source locally. This project now expects `C:\DATA\working\sources\VieNeu-TTS` by default.
3. Create the virtual environment inside the VieNeu source and install it in editable mode, so local VieNeu source edits are picked up by KAI Studio.

```bat
cd /d C:\DATA\working\sources
git clone https://github.com/<your-github-user>/VieNeu-TTS.git VieNeu-TTS
cd VieNeu-TTS
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e . --extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/
```

If the source already exists at `C:\DATA\working\sources\VieNeu-TTS`, skip `git clone` and start from `cd VieNeu-TTS`.

### Values to enter in settings

1. In Settings -> Voice -> VieNeu, set `VIENEU_PYTHON` to `C:/DATA/working/sources/VieNeu-TTS/.venv/Scripts/python.exe`.
2. Choose `VIENEU_MODE`: use `turbo` or `standard` for the local SDK.
3. Use `remote` only if you have an OpenAI-compatible VieNeu endpoint.
4. For voice clone, choose `VIENEU_REFERENCE_AUDIO` and fill `VIENEU_REFERENCE_TEXT` with the reference audio transcript.
5. Set `VIENEU_TIMEOUT_MS=1200000` if the machine loads models slowly.

## elevenlabs

ElevenLabs is a cloud TTS provider. Health checks whether the API key can call `/v1/user` without generating audio.

### Get API key and voice ID

1. Open the ElevenLabs dashboard.
2. Create or copy an API key from profile/developer settings.
3. In Kai Studio, open Settings -> API Key and paste it into `ELEVENLABS_API_KEY`.
4. Open Voice Library or VoiceLab, then copy the voice ID of each voice you want to use.
5. Add the voice ID to the ElevenLabs voices list.

### Verify

1. Health uses endpoint `/v1/user`.
2. When generating audio, Kai Studio uses `/v1/text-to-speech/{voiceId}`.
3. If `/v1/user` fails, verify the key, account quota, and internet/proxy access.

```txt
ELEVENLABS_API_KEY=<your secret key>
ELEVENLABS_VOICES=[{"id":"voice_id","label":"Voice label"}]
```
