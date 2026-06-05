import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lang } from "@/lib/i18n";
import {
  getElevenLabsConfig,
  getPiperModels,
  getPiperRuntimeStatus,
  getRvcApplioConfig,
  getSupertonicConfig,
  getVoiceHealth,
  importSupertonicVoiceStyle,
  installPiperModel,
  type ElevenLabsConfig,
  type PiperModel,
  type PiperRuntimeStatus,
  type RvcApplioConfig,
  type SupertonicConfig,
  type VoiceHealth,
} from "@/lib/voiceApi";

export function useLongContentVoiceRuntime(lang: Lang) {
  const [voiceHealth, setVoiceHealth] = useState<VoiceHealth | null>(null);
  const [piperRuntime, setPiperRuntime] = useState<PiperRuntimeStatus | null>(null);
  const [piperInstalling, setPiperInstalling] = useState(false);
  const [piperModels, setPiperModels] = useState<PiperModel[]>([]);
  const [piperModelKey, setPiperModelKey] = useState("vi_vais1000");
  const [elevenConfig, setElevenConfig] = useState<ElevenLabsConfig | null>(null);
  const [elevenModelId, setElevenModelId] = useState("eleven_flash_v2_5");
  const [elevenVoiceId, setElevenVoiceId] = useState("");
  const [supertonicConfig, setSupertonicConfig] = useState<SupertonicConfig | null>(null);
  const [supertonicVoice, setSupertonicVoice] = useState("M1");
  const [supertonicTotalSteps, setSupertonicTotalSteps] = useState(8);
  const [supertonicImporting, setSupertonicImporting] = useState(false);
  const [rvcApplioConfig, setRvcApplioConfig] = useState<RvcApplioConfig | null>(null);

  useEffect(() => { void loadVoiceRuntime(); }, []);
  useEffect(() => {
    if (!piperModels.length) return;
    const current = piperModels.find((model) => model.key === piperModelKey);
    if (current?.lang === lang) return;
    const nextModel = piperModels.find((model) => model.lang === lang && model.available)
      ?? piperModels.find((model) => model.lang === lang)
      ?? current;
    if (nextModel && nextModel.key !== piperModelKey) setPiperModelKey(nextModel.key);
  }, [lang, piperModelKey, piperModels]);

  async function loadVoiceRuntime() {
    const [health, runtime, models, pro, supertonic, rvcApplio] = await Promise.allSettled([getVoiceHealth(), getPiperRuntimeStatus(), getPiperModels(), getElevenLabsConfig(), getSupertonicConfig(), getRvcApplioConfig()]);
    if (health.status === "fulfilled") setVoiceHealth(health.value);
    if (runtime.status === "fulfilled") setPiperRuntime(runtime.value);
    if (models.status === "fulfilled") {
      setPiperModels(models.value);
      const langModel = models.value.find((model) => model.lang === lang && model.available)
        ?? models.value.find((model) => model.lang === lang)
        ?? models.value.find((model) => model.available)
        ?? models.value[0];
      if (langModel) setPiperModelKey(langModel.key);
    }
    if (pro.status === "fulfilled") {
      setElevenConfig(pro.value);
      if (pro.value.models[0]) setElevenModelId(pro.value.models[0].id);
      if (pro.value.voices[0]) setElevenVoiceId(pro.value.voices[0].id);
    }
    if (supertonic.status === "fulfilled") {
      setSupertonicConfig(supertonic.value);
      setSupertonicVoice(supertonic.value.defaultVoice || supertonic.value.voices[0]?.id || "M1");
      setSupertonicTotalSteps(supertonic.value.defaultTotalSteps || 8);
    }
    if (rvcApplio.status === "fulfilled") setRvcApplioConfig(rvcApplio.value);
  }

  async function installSelectedPiperModel() {
    setPiperInstalling(true);
    try {
      const result = await installPiperModel(piperModelKey);
      setPiperRuntime(result.status);
      setPiperModels(result.status.models);
      toast.success(`Đã cài model: ${result.model.label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cài model Piper thất bại.");
    } finally {
      setPiperInstalling(false);
    }
  }

  async function importSupertonicVoiceJson(file: File) {
    setSupertonicImporting(true);
    try {
      const text = await file.text();
      const styleJson = JSON.parse(text);
      const result = await importSupertonicVoiceStyle(styleJson);
      setSupertonicConfig((current) => current ? { ...current, voices: result.voices, model: result.model } : current);
      const nextVoice = result.voices[0]?.id;
      if (nextVoice) setSupertonicVoice(nextVoice);
      toast.success(`Đã import voice Supertonic: ${file.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import Supertonic voice thất bại.");
    } finally {
      setSupertonicImporting(false);
    }
  }

  async function refreshPiperRuntime() {
    try {
      const [health, runtime, models, supertonic, rvcApplio] = await Promise.all([getVoiceHealth(), getPiperRuntimeStatus(), getPiperModels(), getSupertonicConfig(), getRvcApplioConfig()]);
      setVoiceHealth(health);
      setPiperRuntime(runtime);
      setPiperModels(models);
      setSupertonicConfig(supertonic);
      setRvcApplioConfig(rvcApplio);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không kiểm tra được Piper runtime.");
    }
  }

  return {
    voiceHealth, piperRuntime, piperInstalling, installSelectedPiperModel, refreshPiperRuntime,
    piperModels, piperModelKey, setPiperModelKey, elevenConfig, elevenModelId, setElevenModelId,
    elevenVoiceId, setElevenVoiceId, supertonicConfig, supertonicVoice, setSupertonicVoice,
    supertonicTotalSteps, setSupertonicTotalSteps, supertonicImporting, importSupertonicVoiceJson, rvcApplioConfig,
  };
}
