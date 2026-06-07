#!/usr/bin/env python
"""Bridge KAI STUDIO with a local Applio/RVC Gradio server.

The Node backend writes a small JSON payload, then this script uses
`gradio_client` to call the configured Applio endpoint. Keeping this in Python
is intentional: Gradio file upload/download contracts change often, and the
official Python client hides most of those details.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import tempfile
import urllib.request
from pathlib import Path
from typing import Any

try:
    from gradio_client import Client, handle_file
except Exception as exc:  # pragma: no cover - user environment issue
    print(
        f'Missing gradio_client in Python: {sys.executable}. '
        f'Install with: "{sys.executable}" -m pip install -U gradio_client',
        file=sys.stderr,
    )
    raise exc

AUDIO_EXTENSIONS = {".wav", ".flac", ".mp3", ".ogg", ".m4a"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", required=True)
    args = parser.parse_args()

    payload = json.loads(Path(args.payload).read_text(encoding="utf-8"))
    client = Client(payload["baseUrl"])
    api_name = payload.get("apiName") or "/enforce_terms"
    rendered_args = [render_template_arg(item, payload) for item in payload["argTemplate"]]
    result = client.predict(*rendered_args, api_name=api_name)
    output_path = Path(payload["outputPath"])
    output_path.parent.mkdir(parents=True, exist_ok=True)

    audio_path = find_audio_path(result)
    if not audio_path:
        print(json.dumps({"result": make_json_safe(result)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise RuntimeError("Applio/RVC result did not contain a downloadable audio file path.")

    copy_result_audio(audio_path, output_path)
    print(json.dumps({"ok": True, "outputPath": str(output_path)}, ensure_ascii=False))
    return 0


def render_template_arg(value: Any, payload: dict[str, Any]) -> Any:
    if isinstance(value, str):
        output_path = Path(payload["outputPath"])
        mapping = {
            "${input}": lambda: handle_file(payload["inputPath"]),
            "${input_path}": lambda: payload["inputPath"],
            "${output}": lambda: payload["outputPath"],
            "${tts_output}": lambda: str(output_path.with_name(f"{output_path.stem}.tts{output_path.suffix}")),
            "${text}": lambda: payload.get("text", ""),
            "${model}": lambda: payload.get("modelName", ""),
            "${model_name}": lambda: payload.get("modelName", ""),
            "${index}": lambda: payload.get("indexPath", ""),
            "${index_path}": lambda: payload.get("indexPath", ""),
            "${pitch}": lambda: payload.get("pitch", 0),
            "${f0_method}": lambda: payload.get("f0Method", "rmvpe"),
            "${index_rate}": lambda: payload.get("indexRate", 0.75),
            "${protect}": lambda: payload.get("protect", 0.33),
            "${filter_radius}": lambda: payload.get("filterRadius", 3),
            "${tts_voice}": lambda: payload.get("ttsVoice", ""),
            "${tts_speed}": lambda: payload.get("ttsSpeed", 0),
            "${speed}": lambda: payload.get("ttsSpeed", 0),
        }
        if value in mapping:
            return mapping[value]()
        result = value
        for token, get_replacement in mapping.items():
            if token in result:
                result = result.replace(token, str(get_replacement()))
        return result

    if isinstance(value, list):
        return [render_template_arg(item, payload) for item in value]

    if isinstance(value, dict):
        return {key: render_template_arg(item, payload) for key, item in value.items()}

    return value


def find_audio_path(value: Any) -> str | None:
    if isinstance(value, str):
        if value.startswith("http://") or value.startswith("https://"):
            return download_temp_file(value)
        if Path(value).suffix.lower() in AUDIO_EXTENSIONS and Path(value).exists():
            return value
        return None

    if isinstance(value, dict):
        for key in ("path", "name", "file", "url"):
            found = find_audio_path(value.get(key))
            if found:
                return found
        for item in value.values():
            found = find_audio_path(item)
            if found:
                return found
        return None

    if isinstance(value, (list, tuple)):
        for item in value:
            found = find_audio_path(item)
            if found:
                return found

    return None


def download_temp_file(url: str) -> str:
    suffix = Path(url.split("?", 1)[0]).suffix or ".wav"
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    handle.close()
    urllib.request.urlretrieve(url, handle.name)
    return handle.name


def copy_result_audio(source: str, output_path: Path) -> None:
    source_path = Path(source)
    if not source_path.exists():
        raise FileNotFoundError(source)
    shutil.copyfile(source_path, output_path)


def make_json_safe(value: Any) -> Any:
    try:
        json.dumps(value)
        return value
    except TypeError:
        if isinstance(value, (list, tuple)):
            return [make_json_safe(item) for item in value]
        if isinstance(value, dict):
            return {str(key): make_json_safe(item) for key, item in value.items()}
        return repr(value)


if __name__ == "__main__":
    raise SystemExit(main())
