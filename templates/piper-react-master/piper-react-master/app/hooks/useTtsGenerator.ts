import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import {
  generateElevenLabsAudio,
  getElevenLabsConfig,
  type ElevenLabsConfig,
} from "../api/elevenLabsApi";
import { generateAudio, getHealth, getModels } from "../api/ttsApi";
import {
  localizePiperModelLabel,
  localizeProModel,
  localizeVoiceLabel,
  useI18n,
} from "../i18n";
import type { GenerateResponse, HealthResponse, TtsModel } from "../types";
import {
  DEFAULT_MODEL_KEY,
  DEFAULT_SENTENCE_SILENCE,
  getFirstAvailableModel,
  getSuggestedFileName,
} from "../utils/modelDefaults";
import {
  readNumberDraft,
  readPersistedDraft,
  readStringDraft,
  savePersistedDraft,
} from "../utils/persistedDrafts";
import {
  readTtsDraftText,
  writeTtsDraftText,
} from "../utils/ttsDraftTextStorage";
import {
  studioSessionResources,
  ttsSessionDraft,
} from "../utils/sessionFileMemory";
import { PUBLIC_WEB_BUILD } from "../utils/publicRuntime";
import {
  hasLocalRuntimeAccess,
  LOCAL_RUNTIME_ACCESS_CHANGED_EVENT,
} from "../utils/localRuntimeAccess";

export type TtsProvider = "piper" | "pro";

type UnifiedModel = {
  available: boolean;
  key: string;
  label: string;
  provider: TtsProvider;
  piperModel?: TtsModel;
  voiceId?: string;
};

type TtsPersistedDraft = {
  modelKey: string;
  proModeId: string;
  text: string;
  fileName: string;
  sentenceSilence: number;
  speechRate: number;
  generatedFileName: string;
  generatedRelativePath: string;
  audioUrl: string;
};

const DEFAULT_SPEECH_RATE = 0.85;
const PIPER_UNAVAILABLE_MODEL_KEY = "piper:unavailable";
const TTS_BOOTSTRAP_CACHE_KEY = "piper.tts.bootstrap.v1";
const MAX_AUTO_RESTORE_TTS_TEXT_CHARS = 80_000;

type TtsBootstrapCache = {
  savedAt: number;
  health?: HealthResponse | null;
  models?: TtsModel[];
  proConfig?: ElevenLabsConfig | null;
};

function readTtsBootstrapCache(): TtsBootstrapCache | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TTS_BOOTSTRAP_CACHE_KEY);
    return raw ? (JSON.parse(raw) as TtsBootstrapCache) : null;
  } catch {
    return null;
  }
}

function writeTtsBootstrapCache(patch: Omit<TtsBootstrapCache, "savedAt">) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = readTtsBootstrapCache() || { savedAt: Date.now() };
    window.localStorage.setItem(
      TTS_BOOTSTRAP_CACHE_KEY,
      JSON.stringify({ ...current, ...patch, savedAt: Date.now() }),
    );
  } catch {
    // localStorage can be unavailable in private mode. Ignore and keep runtime state only.
  }
}

function createUnavailableHealth(): HealthResponse {
  return {
    ok: false,
    piperExe: "",
    piperExists: false,
    modelDir: "",
    generatedDir: "",
  };
}

async function withSoftTimeout<T>(
  task: Promise<T>,
  timeoutMs = 2_500,
): Promise<T> {
  return Promise.race([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
    }),
  ]);
}

export function useTtsGenerator() {
  const { t } = useI18n();
  const [cachedBootstrap] = useState(() => readTtsBootstrapCache());
  const draftRef = useRef<Partial<TtsPersistedDraft>>({});
  const deferredTextDraftRef = useRef("");
  const textSaveVersionRef = useRef(0);
  const localRuntimeAccessPreviousRef = useRef(hasLocalRuntimeAccess());
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [hasDeferredTextDraft, setHasDeferredTextDraft] = useState(
    () => ttsSessionDraft.text.length > MAX_AUTO_RESTORE_TTS_TEXT_CHARS,
  );
  const [piperModels, setPiperModels] = useState<TtsModel[]>(
    () => cachedBootstrap?.models || [],
  );
  const [proConfig, setProConfig] = useState<ElevenLabsConfig | null>(
    () => cachedBootstrap?.proConfig || null,
  );
  const [modelKey, setModelKey] = useState(DEFAULT_MODEL_KEY);
  const [proModeId, setProModeId] = useState("");
  const [text, setTextState] = useState(() => {
    if (ttsSessionDraft.text.length > MAX_AUTO_RESTORE_TTS_TEXT_CHARS) {
      deferredTextDraftRef.current = ttsSessionDraft.text;
      return "";
    }

    return ttsSessionDraft.text;
  });
  const [fileName, setFileName] = useState("than-mo-tap-1");
  const [sentenceSilence, setSentenceSilence] = useState(
    DEFAULT_SENTENCE_SILENCE,
  );
  const [speechRate, setSpeechRate] = useState(DEFAULT_SPEECH_RATE);
  const [localRuntimeAccessGranted, setLocalRuntimeAccessGranted] = useState(
    () => hasLocalRuntimeAccess(),
  );
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(
    studioSessionResources.lastTtsAudio?.url || "",
  );
  const [generatedFileName, setGeneratedFileName] = useState(
    studioSessionResources.lastTtsAudio?.fileName || "",
  );
  const [generatedRelativePath, setGeneratedRelativePath] = useState(
    studioSessionResources.lastTtsAudio?.relativePath || "",
  );
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(
    () => cachedBootstrap?.health || null,
  );
  const [loadingHealth, setLoadingHealth] = useState(!cachedBootstrap?.health);
  const [loadingModels, setLoadingModels] = useState(
    !cachedBootstrap?.models?.length,
  );
  const [loadingProConfig, setLoadingProConfig] = useState(
    !cachedBootstrap?.proConfig,
  );
  const [showProConfirm, setShowProConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      const draft = readPersistedDraft<TtsPersistedDraft>("tts");
      const hasDraftValue = Object.keys(draft).length > 0;
      draftRef.current = draft;

      if (hasDraftValue) {
        const restoredModelKey = readStringDraft(
          draft.modelKey,
          DEFAULT_MODEL_KEY,
        );
        setModelKey(restoredModelKey);
        setProModeId(readStringDraft(draft.proModeId, ""));
        setFileName(readStringDraft(draft.fileName, "than-mo-tap-1"));
        setSentenceSilence(
          readNumberDraft(draft.sentenceSilence, DEFAULT_SENTENCE_SILENCE),
        );
        setSpeechRate(readNumberDraft(draft.speechRate, DEFAULT_SPEECH_RATE));
        setAudioUrl(
          readStringDraft(
            draft.audioUrl,
            studioSessionResources.lastTtsAudio?.url || "",
          ),
        );
        setGeneratedFileName(
          readStringDraft(
            draft.generatedFileName,
            studioSessionResources.lastTtsAudio?.fileName || "",
          ),
        );
        setGeneratedRelativePath(
          readStringDraft(
            draft.generatedRelativePath,
            studioSessionResources.lastTtsAudio?.relativePath || "",
          ),
        );
      }

      const legacyText = readStringDraft(draft.text, "");
      if (legacyText) {
        applyRestoredTextDraft(legacyText);
        void writeTtsDraftText(legacyText);
        setHasRestoredDraft(true);
        return;
      }

      void readTtsDraftText()
        .then((savedText) => {
          if (cancelled || !savedText || ttsSessionDraft.text) {
            return;
          }

          applyRestoredTextDraft(savedText);
        })
        .finally(() => {
          if (!cancelled) {
            setHasRestoredDraft(true);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    const refreshLocalRuntimeAccess = () =>
      setLocalRuntimeAccessGranted(hasLocalRuntimeAccess());

    refreshLocalRuntimeAccess();
    window.addEventListener(
      LOCAL_RUNTIME_ACCESS_CHANGED_EVENT,
      refreshLocalRuntimeAccess,
    );

    return () =>
      window.removeEventListener(
        LOCAL_RUNTIME_ACCESS_CHANGED_EVENT,
        refreshLocalRuntimeAccess,
      );
  }, []);

  useEffect(() => {
    if (localRuntimeAccessGranted && !localRuntimeAccessPreviousRef.current) {
      void loadInitialData();
    }

    if (!localRuntimeAccessGranted) {
      setHealth(createUnavailableHealth());
      setPiperModels([]);
      setLoadingHealth(false);
      setLoadingModels(false);
    }

    localRuntimeAccessPreviousRef.current = localRuntimeAccessGranted;
  }, [localRuntimeAccessGranted]);

  useEffect(() => {
    if (!hasRestoredDraft) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      savePersistedDraft("tts", {
        modelKey,
        proModeId,
        fileName,
        sentenceSilence,
        speechRate,
        generatedFileName,
        generatedRelativePath,
        audioUrl,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    hasRestoredDraft,
    modelKey,
    proModeId,
    fileName,
    sentenceSilence,
    speechRate,
    generatedFileName,
    generatedRelativePath,
    audioUrl,
  ]);

  useEffect(() => {
    ttsSessionDraft.text = text;

    if (!hasRestoredDraft) {
      return;
    }

    const saveVersion = textSaveVersionRef.current + 1;
    textSaveVersionRef.current = saveVersion;

    const timeoutId = window.setTimeout(() => {
      void writeTtsDraftText(text).then(() => {
        if (textSaveVersionRef.current !== saveVersion) {
          return;
        }
      });
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [hasRestoredDraft, text]);

  useEffect(() => {
    if (!generatedRelativePath || !audioUrl) {
      return;
    }

    studioSessionResources.lastTtsAudio = {
      fileName:
        generatedFileName || generatedRelativePath.split("/").pop() || "audio",
      relativePath: generatedRelativePath,
      url: audioUrl,
      createdAtMs: Date.now(),
    };
  }, [generatedFileName, generatedRelativePath, audioUrl]);

  const models = useMemo<UnifiedModel[]>(() => {
    const isPiperRuntimeReady =
      localRuntimeAccessGranted && Boolean(health?.piperExists);
    const piperModelOptions = piperModels.map((model) => ({
      available: isPiperRuntimeReady && model.available,
      key: model.key,
      label: localizePiperModelLabel(model.label, t),
      provider: "piper" as const,
      piperModel: model,
    }));
    const piperPlaceholder: UnifiedModel[] = piperModelOptions.length
      ? []
      : [
          {
            available: false,
            key: PIPER_UNAVAILABLE_MODEL_KEY,
            label: localRuntimeAccessGranted
              ? t("piperUnavailableModel")
              : t("piperLocalAccessRequiredModel"),
            provider: "piper" as const,
          },
        ];
    const proModelOptions =
      proConfig?.voices.map((voice) => ({
        available: proConfig.hasApiKey,
        key: `pro:${voice.id}`,
        label: `${localizeVoiceLabel(voice.label, t)} PRO`,
        provider: "pro" as const,
        voiceId: voice.id,
      })) || [];

    return [...piperModelOptions, ...piperPlaceholder, ...proModelOptions];
  }, [
    health?.piperExists,
    localRuntimeAccessGranted,
    piperModels,
    proConfig,
    t,
  ]);

  const localizedProConfig = useMemo<ElevenLabsConfig | null>(() => {
    if (!proConfig) {
      return null;
    }

    return {
      ...proConfig,
      models: proConfig.models.map((model) => ({
        ...model,
        ...localizeProModel(model.id, t),
      })),
      voices: proConfig.voices.map((voice) => ({
        ...voice,
        label: localizeVoiceLabel(voice.label, t),
      })),
    };
  }, [proConfig, t]);

  const selectedModel = useMemo(() => {
    return models.find((model) => model.key === modelKey) || null;
  }, [models, modelKey]);

  useEffect(() => {
    if (!models.length || loadingModels) {
      return;
    }

    const currentModel = models.find((model) => model.key === modelKey);
    if (currentModel?.available) {
      return;
    }

    const fallbackModel =
      models.find((model) => model.provider === "piper" && model.available) ||
      models.find((model) => model.available);
    if (fallbackModel) {
      setModelKey(fallbackModel.key);
    }
  }, [loadingModels, modelKey, models]);

  const selectedProMode = useMemo(() => {
    return (
      localizedProConfig?.models.find((model) => model.id === proModeId) || null
    );
  }, [localizedProConfig, proModeId]);

  const isPro = selectedModel?.provider === "pro";
  const canUseSelectedModel = isPro
    ? Boolean(proConfig?.hasApiKey) &&
      Boolean(selectedModel?.voiceId) &&
      Boolean(selectedProMode)
    : Boolean(selectedModel?.available);
  const characterCount = text.length;
  const proEstimatedUsd = selectedProMode
    ? (characterCount / 1000) * selectedProMode.priceUsdPerThousandCharacters
    : 0;
  const exceedsProLimit = Boolean(
    selectedProMode && characterCount > selectedProMode.characterLimit,
  );
  const canGenerate =
    Boolean(text.trim()) && canUseSelectedModel && !exceedsProLimit && !loading;

  function setText(nextText: SetStateAction<string>) {
    setTextState((currentText) => {
      const resolvedText =
        typeof nextText === "function" ? nextText(currentText) : nextText;
      ttsSessionDraft.text = resolvedText;
      return resolvedText;
    });
  }

  function applyRestoredTextDraft(restoredText: string) {
    ttsSessionDraft.text = restoredText;

    if (restoredText.length > MAX_AUTO_RESTORE_TTS_TEXT_CHARS) {
      deferredTextDraftRef.current = restoredText;
      setHasDeferredTextDraft(true);
      return;
    }

    setTextState(restoredText);
    setHasDeferredTextDraft(false);
    deferredTextDraftRef.current = "";
  }

  function restoreDeferredTextDraft() {
    const restoredText = deferredTextDraftRef.current;
    if (!restoredText) {
      setHasDeferredTextDraft(false);
      return;
    }

    setText(restoredText);
    setHasDeferredTextDraft(false);
    deferredTextDraftRef.current = "";
  }

  async function loadInitialData() {
    const canUseLocalRuntime = hasLocalRuntimeAccess();
    setLocalRuntimeAccessGranted(canUseLocalRuntime);
    setLoadingHealth(canUseLocalRuntime);
    setLoadingModels(canUseLocalRuntime);
    setLoadingProConfig(true);

    const healthTask = canUseLocalRuntime
      ? withSoftTimeout(getHealth())
          .then((healthData) => {
            setHealth(healthData);
            writeTtsBootstrapCache({ health: healthData });
          })
          .catch((error) => {
            setHealth(createUnavailableHealth());
            if (!PUBLIC_WEB_BUILD) {
              setMessage(
                (current) =>
                  current ||
                  (error instanceof Error
                    ? error.message
                    : t("ttsServerConnectionError")),
              );
            }
          })
          .finally(() => setLoadingHealth(false))
      : Promise.resolve().then(() => {
          setHealth(createUnavailableHealth());
          setLoadingHealth(false);
        });

    const modelsTask = canUseLocalRuntime
      ? withSoftTimeout(getModels())
          .then((modelsData) => {
            const firstAvailable = getFirstAvailableModel(modelsData.models);

            setPiperModels(modelsData.models);
            writeTtsBootstrapCache({ models: modelsData.models });

            const draft = draftRef.current;

            if (
              firstAvailable &&
              !draft.modelKey &&
              !draft.text &&
              !draft.fileName
            ) {
              applyPiperDefaults(firstAvailable);
            }
          })
          .catch((error) => {
            setPiperModels([]);
            if (!PUBLIC_WEB_BUILD) {
              setMessage(
                (current) =>
                  current ||
                  (error instanceof Error
                    ? error.message
                    : t("ttsServerConnectionError")),
              );
            }
          })
          .finally(() => setLoadingModels(false))
      : Promise.resolve().then(() => {
          setPiperModels([]);
          setLoadingModels(false);
        });

    const proConfigTask = getElevenLabsConfig()
      .then((nextProConfig) => {
        setProConfig(nextProConfig);
        writeTtsBootstrapCache({ proConfig: nextProConfig });
        setProModeId((current) => current || nextProConfig.models[0]?.id || "");
      })
      .catch(() => {
        // PRO config is optional for local voice. Do not block the main screen when this endpoint is slow/unavailable.
        setProConfig((current) => current);
      })
      .finally(() => setLoadingProConfig(false));

    await Promise.allSettled([healthTask, modelsTask, proConfigTask]);
  }

  function changeModel(nextModelKey: string) {
    const nextModel =
      models.find((model) => model.key === nextModelKey) || null;

    setModelKey(nextModelKey);
    resetGeneratedAudio();
    setMessage("");

    if (nextModel?.provider === "pro") {
      setFileName("am-thanh-pro");
      return;
    }

    applyPiperEditableDefaults(nextModel?.piperModel || null);
  }

  function requestGenerate() {
    if (isPro) {
      setShowProConfirm(true);
      return;
    }

    void generatePiper();
  }

  async function confirmProGenerate() {
    setShowProConfirm(false);
    await generatePro();
  }

  async function generatePiper() {
    await runGenerate(async () => {
      const data = await generateAudio({
        text,
        modelKey,
        sentenceSilence,
        speechRate,
        fileName,
      });
      applyGenerateResult(data);
      setMessage(
        data.warning ? t("piperSuccessWithWarning") : t("piperSuccess"),
      );
    }, t("piperFailure"));
  }

  async function generatePro() {
    if (!selectedModel?.voiceId || !selectedProMode) {
      setMessage(t("proInvalidSelection"));
      return;
    }

    await runGenerate(async () => {
      const data = await generateElevenLabsAudio({
        text,
        modelId: selectedProMode.id,
        voiceId: selectedModel.voiceId || "",
        fileName,
      });
      applyGenerateResult(data);
      setMessage(t("proSuccess"));
    }, t("proFailure"));
  }

  async function runGenerate(
    action: () => Promise<void>,
    fallbackMessage: string,
  ) {
    setLoading(true);
    setMessage("");
    resetGeneratedAudio();

    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setLoading(false);
    }
  }

  function applyGenerateResult(
    data: Pick<GenerateResponse, "audioUrl" | "fileName" | "relativePath">,
  ) {
    setAudioUrl(data.audioUrl);
    setGeneratedFileName(data.fileName);
    setGeneratedRelativePath(data.relativePath);
    studioSessionResources.lastTtsAudio = {
      fileName: data.fileName,
      relativePath: data.relativePath,
      url: data.audioUrl,
      createdAtMs: Date.now(),
    };
  }

  function clearText() {
    setText("");
    deferredTextDraftRef.current = "";
    setHasDeferredTextDraft(false);
    setMessage("");
    resetGeneratedAudio();
  }

  function resetGeneratedAudio() {
    setAudioUrl("");
    setGeneratedFileName("");
    setGeneratedRelativePath("");
    studioSessionResources.lastTtsAudio = null;
  }

  function applyPiperDefaults(model: TtsModel) {
    setModelKey(model.key);
    applyPiperEditableDefaults(model);
  }

  function applyPiperEditableDefaults(model: TtsModel | null) {
    setFileName(getSuggestedFileName(model));
    setSentenceSilence(DEFAULT_SENTENCE_SILENCE);
    setSpeechRate(DEFAULT_SPEECH_RATE);
  }

  return {
    audioUrl,
    canGenerate,
    canUseSelectedModel,
    characterCount,
    changeModel,
    clearText,
    confirmProGenerate,
    exceedsProLimit,
    fileName,
    generatedFileName,
    generatedRelativePath,
    hasDeferredTextDraft,
    health,
    loadingHealth,
    loadingModels,
    loadingProConfig,
    localRuntimeAccessGranted,
    isInitializing: loadingHealth || loadingModels,
    isPro,
    loading,
    message,
    modelKey,
    models,
    proConfig: localizedProConfig,
    proEstimatedUsd,
    proModeId,
    requestGenerate,
    restoreDeferredTextDraft,
    selectedModel,
    selectedProMode,
    sentenceSilence,
    speechRate,
    setFileName,
    setProModeId,
    setSentenceSilence,
    setSpeechRate,
    setShowProConfirm,
    setText,
    showProConfirm,
    text,
  };
}
