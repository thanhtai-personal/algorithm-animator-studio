#!/usr/bin/env python
"""Tiny JSON bridge for KAI Studio -> VieNeu-TTS SDK.

Input payload example:
{
  "text": "Xin chào",
  "outputPath": "server/data/generated/vieneu/2026-06-06/demo.wav",
  "mode": "turbo",
  "emotion": "natural",
  "voiceId": "",
  "referenceAudioPath": "",
  "referenceText": "",
  "remoteApiBase": "",
  "remoteModel": ""
}
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate speech with VieNeu-TTS SDK")
    parser.add_argument("--payload", required=True, help="Path to JSON payload")
    args = parser.parse_args()

    with open(args.payload, "r", encoding="utf-8") as file:
        payload: Dict[str, Any] = json.load(file)

    text = str(payload.get("text") or "").strip()
    output_path = Path(str(payload.get("outputPath") or "")).expanduser()
    if not text:
        raise ValueError("Payload text is empty.")
    if not str(output_path):
        raise ValueError("Payload outputPath is empty.")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from vieneu import Vieneu  # type: ignore
    except Exception as exc:  # pragma: no cover - runtime dependency check
        raise RuntimeError(
            "Không import được SDK vieneu. VieNeu source hiện nên nằm ở libs/VieNeu-TTS. "
            "Chạy: npm run vieneu:install rồi thử lại."
        ) from exc

    mode = str(payload.get("mode") or "turbo").strip().lower()
    emotion = str(payload.get("emotion") or "natural").strip() or "natural"
    voice_id = str(payload.get("voiceId") or "").strip()
    reference_audio = str(payload.get("referenceAudioPath") or "").strip()
    reference_text = str(payload.get("referenceText") or "").strip()
    remote_api_base = str(payload.get("remoteApiBase") or "").strip()
    remote_model = str(payload.get("remoteModel") or "").strip()

    try:
        tts = create_tts(Vieneu, mode, emotion, remote_api_base, remote_model)
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            f"VieNeu-TTS thiếu Python dependency: {exc.name}. "
            "Chạy: npm run vieneu:install rồi thử lại."
        ) from exc

    audio = infer_audio(tts, text, voice_id, reference_audio, reference_text)
    tts.save(audio, str(output_path))

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError(f"VieNeu-TTS finished but did not create audio: {output_path}")

    print(json.dumps({
        "ok": True,
        "outputPath": str(output_path),
        "sizeBytes": output_path.stat().st_size,
        "mode": mode,
        "emotion": emotion,
        "voiceId": voice_id,
        "referenceAudioPath": reference_audio,
    }, ensure_ascii=False))
    return 0


def create_tts(Vieneu: Any, mode: str, emotion: str, remote_api_base: str, remote_model: str) -> Any:
    if mode == "remote":
        kwargs: Dict[str, Any] = {"mode": "remote", "emotion": emotion}
        if remote_api_base:
            kwargs["api_base"] = remote_api_base
        if remote_model:
            kwargs["model_name"] = remote_model
        return Vieneu(**kwargs)

    if mode == "standard":
        return Vieneu(emotion=emotion)

    kwargs = {"mode": mode}
    try:
        return Vieneu(**kwargs, emotion=emotion)
    except TypeError:
        return Vieneu(**kwargs)


def infer_audio(tts: Any, text: str, voice_id: str, reference_audio: str, reference_text: str) -> Any:
    if reference_audio:
        reference_path = Path(reference_audio).expanduser()
        if not reference_path.exists():
            raise FileNotFoundError(f"Reference audio not found: {reference_path}")
        return infer_with_reference(tts, text, str(reference_path), reference_text)

    if voice_id:
        voice_data = get_preset_voice(tts, voice_id)
        return tts.infer(text=text, voice=voice_data)

    return tts.infer(text=text)


def infer_with_reference(tts: Any, text: str, reference_audio: str, reference_text: str) -> Any:
    # VieNeu SDK variants expose either infer(ref_audio/ref_text) or encode_reference().
    if reference_text:
        try:
            return tts.infer(text=text, ref_audio=reference_audio, ref_text=reference_text)
        except TypeError:
            pass

    if hasattr(tts, "encode_reference"):
        voice = tts.encode_reference(reference_audio)
        return tts.infer(text=text, voice=voice)

    try:
        return tts.infer(text=text, ref_audio=reference_audio, ref_text=reference_text)
    except TypeError as exc:
        raise RuntimeError("VieNeu SDK hiện tại không hỗ trợ reference audio theo bridge này.") from exc


def get_preset_voice(tts: Any, voice_id: str) -> Any:
    if not hasattr(tts, "get_preset_voice"):
        raise RuntimeError("VieNeu SDK hiện tại không hỗ trợ get_preset_voice().")
    try:
        return tts.get_preset_voice(voice_id)
    except Exception as exc:
        voices = []
        if hasattr(tts, "list_preset_voices"):
            try:
                voices = tts.list_preset_voices()
            except Exception:
                voices = []
        raise RuntimeError(f"Không tìm thấy VieNeu preset voice '{voice_id}'. Voices: {voices}") from exc


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        raise
