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
