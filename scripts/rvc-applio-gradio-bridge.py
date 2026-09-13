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
import time
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
MIN_AUDIO_BYTES = 44


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", required=True)
    args = parser.parse_args()

    payload = json.loads(Path(args.payload).read_text(encoding="utf-8"))
    output_path = Path(payload["outputPath"])
    client = Client(payload["baseUrl"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    audio_path = predict_converted_audio(client, payload, output_path)
    copy_result_audio(audio_path, output_path)
    print(json.dumps({"ok": True, "outputPath": str(output_path)}, ensure_ascii=True))
    return 0


def predict_converted_audio(client: Any, payload: dict[str, Any], output_path: Path) -> str:
    result: Any = None
    for attempt in range(2):
        payload["gradioOutputPath"] = make_temp_audio_path(output_path)
        payload["gradioTtsOutputPath"] = make_temp_audio_path(
            output_path.with_name(f"{output_path.stem}.tts{output_path.suffix}")
        )
        rendered_args = [render_template_arg(item, payload) for item in payload["argTemplate"]]
        result = client.predict(*rendered_args, api_name=payload.get("apiName") or "/enforce_terms")
        audio_path = find_best_audio_path(
            result,
            [payload["outputPath"], payload["gradioOutputPath"]],
            excluded_paths=[payload["gradioTtsOutputPath"]],
        )
        if audio_path:
            return audio_path
        if attempt == 0:
            time.sleep(1)

    tts_bytes = audio_file_size(payload["gradioTtsOutputPath"])
    rvc_bytes = audio_file_size(payload["gradioOutputPath"])
    stage = "RVC conversion" if tts_bytes > MIN_AUDIO_BYTES else "Edge TTS"
    status = result[0] if isinstance(result, (list, tuple)) and result and isinstance(result[0], str) else ""
    raise RuntimeError(
        f"Applio reported completion but produced no usable converted audio after 2 attempts. "
        f"Likely failed stage: {stage}. TTS bytes: {tts_bytes}; RVC bytes: {rvc_bytes}. "
        f"Check the Applio server log and retry after restarting Applio. Status: {status[-160:]}"
    )


def render_template_arg(value: Any, payload: dict[str, Any]) -> Any:
    if isinstance(value, str):
        mapping = {
            "${input}": lambda: handle_file(payload["inputPath"]),
            "${input_path}": lambda: payload["inputPath"],
            "${output}": lambda: payload["gradioOutputPath"],
            "${tts_output}": lambda: payload["gradioTtsOutputPath"],
            "${final_output}": lambda: payload["outputPath"],
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


def make_temp_audio_path(output_path: Path) -> str:
    suffix = output_path.suffix if output_path.suffix.lower() in AUDIO_EXTENSIONS else ".wav"
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    handle.close()
    return handle.name


def find_best_audio_path(value: Any, preferred_paths: list[str], excluded_paths: list[str] | None = None) -> str | None:
    excluded = {str(Path(item).resolve()) for item in excluded_paths or []}
    for path in preferred_paths:
        if str(Path(path).resolve()) not in excluded and is_non_empty_audio_path(path):
            return path

    candidates = [path for path in list_audio_paths(value) if str(Path(path).resolve()) not in excluded]
    candidates.sort(key=lambda item: Path(item).stat().st_size if Path(item).exists() else 0, reverse=True)
    return candidates[0] if candidates else None


def audio_file_size(value: str) -> int:
    path = Path(value)
    return path.stat().st_size if path.is_file() else 0


def list_audio_paths(value: Any) -> list[str]:
    if isinstance(value, str):
        if value.startswith("http://") or value.startswith("https://"):
            downloaded = download_temp_file(value)
            return [downloaded] if is_non_empty_audio_path(downloaded) else []
        return [value] if is_non_empty_audio_path(value) else []

    if isinstance(value, dict):
        paths: list[str] = []
        for key in ("path", "name", "file", "url"):
            paths.extend(list_audio_paths(value.get(key)))
        for item in value.values():
            paths.extend(list_audio_paths(item))
        return paths

    if isinstance(value, (list, tuple)):
        paths: list[str] = []
        for item in value:
            paths.extend(list_audio_paths(item))
        return paths

    return []


def is_non_empty_audio_path(value: str) -> bool:
    path = Path(value)
    return path.suffix.lower() in AUDIO_EXTENSIONS and path.exists() and path.stat().st_size > MIN_AUDIO_BYTES


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
    if source_path.resolve() == output_path.resolve():
        return
    shutil.copyfile(source_path, output_path)


if __name__ == "__main__":
    raise SystemExit(main())
