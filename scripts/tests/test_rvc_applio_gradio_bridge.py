"""Regression checks for Gradio responses that claim success with empty audio."""

import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path


BRIDGE_PATH = Path(__file__).resolve().parents[1] / "rvc-applio-gradio-bridge.py"
sys.modules.setdefault("gradio_client", types.SimpleNamespace(Client=object, handle_file=lambda value: value))
spec = importlib.util.spec_from_file_location("rvc_applio_gradio_bridge", BRIDGE_PATH)
bridge = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(bridge)


class FakeClient:
    def __init__(self, produce_rvc_on_attempt: int | None):
        self.calls = 0
        self.produce_rvc_on_attempt = produce_rvc_on_attempt

    def predict(self, rvc_path: str, tts_path: str, api_name: str):
        self.calls += 1
        Path(tts_path).write_bytes(b"t" * 120)
        if self.calls == self.produce_rvc_on_attempt:
            Path(rvc_path).write_bytes(b"r" * 240)
        return ("Text synthesized successfully.", rvc_path, tts_path)


class ApplioBridgeTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.original_make_temp = bridge.make_temp_audio_path
        self.original_sleep = bridge.time.sleep
        self.created = 0

        def make_temp(_output_path):
            self.created += 1
            path = self.root / f"stage-{self.created}.wav"
            path.write_bytes(b"")
            return str(path)

        bridge.make_temp_audio_path = make_temp
        bridge.time.sleep = lambda _seconds: None
        self.addCleanup(self.restore_bridge)

    def restore_bridge(self):
        bridge.make_temp_audio_path = self.original_make_temp
        bridge.time.sleep = self.original_sleep

    def test_retries_empty_rvc_output_and_uses_converted_audio(self):
        client = FakeClient(produce_rvc_on_attempt=2)
        output = self.root / "final.wav"
        payload = {"outputPath": str(output), "argTemplate": ["${output}", "${tts_output}"]}

        converted = bridge.predict_converted_audio(client, payload, output)

        self.assertEqual(client.calls, 2)
        self.assertEqual(Path(converted).read_bytes(), b"r" * 240)

    def test_rejects_plain_tts_audio_when_rvc_stays_empty(self):
        client = FakeClient(produce_rvc_on_attempt=None)
        output = self.root / "final.wav"
        payload = {"outputPath": str(output), "argTemplate": ["${output}", "${tts_output}"]}

        with self.assertRaisesRegex(RuntimeError, "Likely failed stage: RVC conversion"):
            bridge.predict_converted_audio(client, payload, output)

        self.assertEqual(client.calls, 2)


if __name__ == "__main__":
    unittest.main()
