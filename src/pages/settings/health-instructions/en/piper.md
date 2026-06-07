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
