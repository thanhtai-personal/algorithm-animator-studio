import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_RUNTIME_ENV_VALUES } from "../../server/config/runtimeDefaults";
import { validateGenerateRequest } from "../../server/services/TtsGenerationService";
import { getPiperRuntimeStatus } from "../../server/services/PiperModelInstallService";
import { getSupertonicConfigStatus } from "../../server/services/SupertonicService";
import { getVieneuConfigStatus } from "../../server/services/VieneuService";
import { getGptSoVitsConfigStatus } from "../../server/services/GptSoVitsService";
import { getRvcApplioConfigStatus } from "../../server/services/RvcApplioService";
import { getElevenLabsConfigStatus } from "../../server/services/ElevenLabsService";

describe("Optional TTS providers without bundled model assets", () => {
  let modelDir = "";
  afterEach(() => {
    vi.unstubAllGlobals();
    if (modelDir) fs.rmSync(modelDir, { recursive: true, force: true });
    modelDir = "";
  });

  it("defaults heavyweight external providers off so missing runtimes are not auto-started", () => {
    for (const key of [
      "KAI_PROVIDER_SUPERTONIC_ENABLED",
      "KAI_PROVIDER_APPLIO_ENABLED",
      "KAI_PROVIDER_VIENEU_ENABLED",
      "KAI_PROVIDER_GPT_SOVITS_ENABLED",
    ]) {
      expect(DEFAULT_RUNTIME_ENV_VALUES[key]).toBe("false");
    }
    expect(DEFAULT_RUNTIME_ENV_VALUES.VIENEU_AUTO_START).toBe("false");
    expect(DEFAULT_RUNTIME_ENV_VALUES.VIENEU_SOURCE_DIR).toBe("../VieNeu-TTS");
    expect(DEFAULT_RUNTIME_ENV_VALUES.GPT_SOVITS_SOURCE_DIR).toBe("../GPT-SoVITS");
  });

  it("keeps Piper model discovery usable when no model files have been downloaded", async () => {
    modelDir = fs.mkdtempSync(path.join(os.tmpdir(), "aas-tts-no-models-"));
    const status = await getPiperRuntimeStatus({
      MODEL_DIR: modelDir,
      PIPER_EXE: process.execPath,
    });

    expect(status.piperExists).toBe(true);
    expect(status.availableCount).toBe(0);
    expect(status.ok).toBe(false);
    expect(status.models.length).toBeGreaterThan(0);
    expect(status.models.every((model) => model.available === false && model.canInstall)).toBe(true);
  });

  it("returns an actionable Piper error instead of synthesizing with a missing model", () => {
    modelDir = fs.mkdtempSync(path.join(os.tmpdir(), "aas-tts-no-model-"));
    const result = validateGenerateRequest(
      { text: "Hello from a clean checkout", modelKey: "en_lessac" },
      { MODEL_DIR: modelDir, PIPER_EXE: process.execPath },
    );

    expect("status" in result).toBe(true);
    if ("status" in result) {
      expect(result.status).toBe(500);
      expect(result.body.error).toContain("tệp mẫu giọng .onnx");
      expect(result.body.modelPath).toBe(path.join(modelDir, "en_US-lessac-medium.onnx"));
    }
  });

  it("does not treat a partial Piper download without its JSON sidecar as installed", () => {
    modelDir = fs.mkdtempSync(path.join(os.tmpdir(), "aas-tts-partial-model-"));
    fs.writeFileSync(path.join(modelDir, "en_US-lessac-medium.onnx"), "test fixture only");
    const result = validateGenerateRequest(
      { text: "Hello", modelKey: "en_lessac" },
      { MODEL_DIR: modelDir, PIPER_EXE: process.execPath },
    );

    expect("status" in result).toBe(true);
    if ("status" in result) {
      expect(result.status).toBe(500);
      expect(result.body.error).toContain(".onnx.json");
      expect(result.body.jsonPath).toBe(path.join(modelDir, "en_US-lessac-medium.onnx.json"));
    }
  });

  it("returns provider-specific unavailable status when optional external engines are not installed", async () => {
    modelDir = fs.mkdtempSync(path.join(os.tmpdir(), "aas-tts-no-runtime-"));
    const missingPython = path.join(modelDir, "python-not-installed.exe");

    const supertonic = await getSupertonicConfigStatus({ KAI_PROVIDER_SUPERTONIC_ENABLED: "false" });
    expect(supertonic.enabled).toBe(false);
    expect(supertonic.error).toMatch(/đang tắt/i);

    const vieneu = await getVieneuConfigStatus({
      KAI_PROVIDER_VIENEU_ENABLED: "true",
      VIENEU_SOURCE_DIR: path.join(modelDir, "VieNeu-TTS"),
      VIENEU_PYTHON: missingPython,
    });
    expect(vieneu.enabled).toBe(false);
    expect(vieneu.sdkInstalled).toBe(false);
    expect(vieneu.pythonExists).toBe(false);
    expect(vieneu.error).toMatch(/Python/i);

    const gptSoVits = await getGptSoVitsConfigStatus({ KAI_PROVIDER_GPT_SOVITS_ENABLED: "false" });
    expect(gptSoVits.enabled).toBe(false);
    expect(gptSoVits.error).toMatch(/đang tắt/i);

    const applio = await getRvcApplioConfigStatus({
      KAI_PROVIDER_APPLIO_ENABLED: "false",
      RVC_APPLIO_PYTHON: missingPython,
    });
    expect(applio.enabled).toBe(false);
    expect(applio.serverOk).toBe(false);

    const elevenLabs = await getElevenLabsConfigStatus({ ELEVENLABS_API_KEY: "" });
    expect(elevenLabs.hasApiKey).toBe(false);
    expect(elevenLabs.endpointChecks).toEqual([]);
  });

  it("reports an external Supertonic outage without crashing its status endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED fixture"); }));
    const status = await getSupertonicConfigStatus({
      KAI_PROVIDER_SUPERTONIC_ENABLED: "true",
      SUPERTONIC_BASE_URL: "http://127.0.0.1:6688",
    });
    expect(status.enabled).toBe(false);
    expect(status.serverOk).toBe(false);
    expect(status.error).toContain("ECONNREFUSED fixture");
  });

  it("reports an external GPT-SoVITS outage without crashing its status endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED fixture"); }));
    const status = await getGptSoVitsConfigStatus({
      KAI_PROVIDER_GPT_SOVITS_ENABLED: "true",
      GPT_SOVITS_BASE_URL: "http://127.0.0.1:9880",
    });
    // GPT-SoVITS "enabled" represents the saved provider toggle, not a healthy server.
    // Keep it true while separately reporting the connection failure.
    expect(status.enabled).toBe(true);
    expect(status.serverOk).toBe(false);
    expect(status.error).toContain("ECONNREFUSED fixture");
  });
});
