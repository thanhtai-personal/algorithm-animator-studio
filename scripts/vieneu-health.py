#!/usr/bin/env python
from __future__ import annotations

import importlib.util
import json
import os
import sys


def configure_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def print_json(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=True))


configure_stdio()

BASE_REQUIRED_MODULES = [
    ("sea_g2p", "sea-g2p"),
    ("numpy", "numpy"),
    ("soundfile", "soundfile"),
    ("yaml", "PyYAML"),
    ("requests", "requests"),
    ("tqdm", "tqdm"),
]

MODE_REQUIRED_MODULES = {
    "v3turbo": [
        ("onnxruntime", "onnxruntime"),
        ("huggingface_hub", "huggingface-hub"),
    ],
    "v3nano": [
        ("onnxruntime", "onnxruntime"),
        ("huggingface_hub", "huggingface-hub"),
    ],
    "standard": [
        ("llama_cpp", "llama-cpp-python"),
        ("onnxruntime", "onnxruntime"),
        ("huggingface_hub", "huggingface-hub"),
    ],
    "turbo": [
        ("llama_cpp", "llama-cpp-python"),
        ("onnxruntime", "onnxruntime"),
        ("huggingface_hub", "huggingface-hub"),
    ],
    "remote": [
        ("onnxruntime", "onnxruntime"),
        ("huggingface_hub", "huggingface-hub"),
    ],
}


def main() -> int:
    try:
        import vieneu  # type: ignore
        version = getattr(vieneu, "__version__", "unknown")
    except Exception as exc:
        print_json({
            "ok": False,
            "sdkInstalled": False,
            "error": f"Không import được package vieneu: {exc}",
            "installCommand": "npm run vieneu:install",
        })
        return 1

    mode = str(os.environ.get("VIENEU_MODE") or "v3turbo").strip().lower()
    missing = find_missing_modules(BASE_REQUIRED_MODULES + MODE_REQUIRED_MODULES.get(mode, []))
    if missing:
        packages = ", ".join(item["package"] for item in missing)
        modules = ", ".join(item["module"] for item in missing)
        print_json({
            "ok": False,
            "sdkInstalled": False,
            "version": version,
            "mode": mode,
            "missingModules": missing,
            "error": f"VieNeu SDK import được nhưng thiếu dependency Python: {modules}. Hãy cài lại VieNeu deps: npm run vieneu:install",
            "installCommand": "npm run vieneu:install",
            "pipHint": f"{sys.executable} -m pip install -e \"{os.environ.get('VIENEU_SOURCE_DIR') or '../VieNeu-TTS'}\" --extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/",
            "packages": packages,
        })
        return 1

    print_json({
        "ok": True,
        "sdkInstalled": True,
        "version": version,
        "mode": mode,
        "python": sys.executable,
    })
    return 0


def find_missing_modules(modules: list[tuple[str, str]]) -> list[dict[str, str]]:
    seen = set()
    missing: list[dict[str, str]] = []
    for module, package in modules:
        if module in seen:
            continue
        seen.add(module)
        if importlib.util.find_spec(module) is None:
            missing.append({"module": module, "package": package})
    return missing


if __name__ == "__main__":
    raise SystemExit(main())
