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
