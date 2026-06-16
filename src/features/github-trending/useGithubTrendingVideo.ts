import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ASSET_MUSIC_OPTIONS, getAssetMusicOption, isAssetMusicId, type BackgroundMusicId } from "@/lib/backgroundMusic";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";
import {
  generateElevenLabsVoice,
  generatePiperVoice,
  generateRvcApplioVoice,
  generateSupertonicVoice,
  generateVieneuVoice,
  getElevenLabsConfig,
  getPiperModels,
  getRvcApplioConfig,
  getSupertonicConfig,
  getVieneuConfig,
  type ElevenLabsConfig,
  type PiperModel,
  type RvcApplioConfig,
  type SupertonicConfig,
  type VieneuConfig,
  type VoiceGenerateResult,
} from "@/lib/voiceApi";
import { fetchGithubTrendingRepos } from "./githubTrendingApi";
import { createVideoPlan } from "./githubTrendingPlan";
import type {
  GithubTrendingFilter,
  GithubTrendingGeneratedMedia,
  GithubTrendingOutputLanguage,
  GithubTrendingProductionSettings,
  GithubTrendingRepo,
  GithubTrendingVideoPlan,
} from "./types";

const STORAGE_KEY = "kai-studio.github-trending-video";

const DEFAULT_FILTER: GithubTrendingFilter = {
  topic: "ai",
  language: "TypeScript",
  days: 30,
  minStars: 50,
  limit: 12,
};

const DEFAULT_PRODUCTION: GithubTrendingProductionSettings = {
  outputLanguage: "en",
  voiceProvider: "piper",
  piperModelKey: "",
  supertonicVoice: "",
  supertonicTotalSteps: 8,
  elevenModelId: "",
  elevenVoiceId: "",
  vieneuMode: "turbo",
  vieneuEmotion: "natural",
  vieneuVoiceId: "",
  applioTtsTemplateId: "",
  externalVoiceUrl: "",
  musicMode: "procedural",
  musicPreset: "chill",
  customMusicUrl: "",
  voiceVolume: 0.9,
  musicVolume: 0.22,
};

export function useGithubTrendingVideo() {
  const draft = useMemo(readDraft, []);
  const [filter, setFilter] = useState<GithubTrendingFilter>(() => draft?.filter || DEFAULT_FILTER);
  const [repos, setRepos] = useState<GithubTrendingRepo[]>(() => draft?.repos || []);
  const [selectedIds, setSelectedIds] = useState<number[]>(() => draft?.selectedIds || []);
  const [production, setProduction] = useState<GithubTrendingProductionSettings>(() => ({ ...DEFAULT_PRODUCTION, ...draft?.production }));
  const [generatedVoice, setGeneratedVoice] = useState<VoiceGenerateResult | null>(() => draft?.generatedVoice || null);
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [piperModels, setPiperModels] = useState<PiperModel[]>([]);
  const [elevenLabsConfig, setElevenLabsConfig] = useState<ElevenLabsConfig | null>(null);
  const [supertonicConfig, setSupertonicConfig] = useState<SupertonicConfig | null>(null);
  const [rvcApplioConfig, setRvcApplioConfig] = useState<RvcApplioConfig | null>(null);
  const [vieneuConfig, setVieneuConfig] = useState<VieneuConfig | null>(null);
  const [musicTracks, setMusicTracks] = useState<MusicLibraryTrack[]>([]);
  const [musicUrl, setMusicUrl] = useState("");
  const [musicLabel, setMusicLabel] = useState("Built-in procedural music");

  const selectedRepos = useMemo(() => repos.filter((repo) => selectedIds.includes(repo.id)).slice(0, 6), [repos, selectedIds]);
  const plan = useMemo(() => createVideoPlan(selectedRepos, production.outputLanguage), [selectedRepos, production.outputLanguage]);
  const generatedMedia: GithubTrendingGeneratedMedia = useMemo(() => ({
    voice: generatedVoice,
    voiceUrl: toAbsoluteMediaUrl(production.externalVoiceUrl.trim() || generatedVoice?.audioUrl || ""),
    musicUrl: toAbsoluteMediaUrl(musicUrl),
    musicLabel,
  }), [generatedVoice, production.externalVoiceUrl, musicLabel, musicUrl]);

  useEffect(() => {
    void loadProductionCatalogs();
  }, []);

  useEffect(() => {
    void resolveMusicSelection(production, musicTracks).then(({ url, label }) => {
      setMusicUrl(url);
      setMusicLabel(label);
    });
  }, [musicTracks, production.musicMode, production.musicPreset, production.customMusicUrl]);

  async function loadTrending() {
    setLoading(true);
    try {
      const nextRepos = await fetchGithubTrendingRepos(filter);
      const nextSelectedIds = nextRepos.slice(0, 5).map((repo) => repo.id);
      setRepos(nextRepos);
      setSelectedIds(nextSelectedIds);
      persist({ filter, repos: nextRepos, selectedIds: nextSelectedIds, production, generatedVoice });
      toast.success(`Đã tải ${nextRepos.length} repo trending GitHub`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được GitHub trending");
    } finally {
      setLoading(false);
    }
  }

  async function loadProductionCatalogs() {
    setCatalogLoading(true);
    try {
      const [models, eleven, supertonic, applio, vieneu, tracks] = await Promise.allSettled([
        getPiperModels(),
        getElevenLabsConfig(),
        getSupertonicConfig(),
        getRvcApplioConfig(),
        getVieneuConfig(),
        getMusicLibraryTracks(),
      ]);
      const nextModels = models.status === "fulfilled" ? models.value : [];
      setPiperModels(nextModels);
      setElevenLabsConfig(eleven.status === "fulfilled" ? eleven.value : null);
      setSupertonicConfig(supertonic.status === "fulfilled" ? supertonic.value : null);
      setRvcApplioConfig(applio.status === "fulfilled" ? applio.value : null);
      setVieneuConfig(vieneu.status === "fulfilled" ? vieneu.value : null);
      setMusicTracks(tracks.status === "fulfilled" ? tracks.value : []);
      hydrateDefaults(nextModels, eleven.status === "fulfilled" ? eleven.value : null, supertonic.status === "fulfilled" ? supertonic.value : null, applio.status === "fulfilled" ? applio.value : null, vieneu.status === "fulfilled" ? vieneu.value : null);
    } finally {
      setCatalogLoading(false);
    }
  }

  function hydrateDefaults(models: PiperModel[], eleven: ElevenLabsConfig | null, supertonic: SupertonicConfig | null, applio: RvcApplioConfig | null, vieneu: VieneuConfig | null) {
    setProduction((current) => {
      const lang = current.outputLanguage === "vi" ? "vi" : "en";
      const piperModel = current.piperModelKey || models.find((model) => model.available && model.lang === lang)?.key || models.find((model) => model.available)?.key || models[0]?.key || "";
      const next = {
        ...current,
        piperModelKey: piperModel,
        elevenModelId: current.elevenModelId || eleven?.models[0]?.id || "",
        elevenVoiceId: current.elevenVoiceId || eleven?.voices[0]?.id || "",
        supertonicVoice: current.supertonicVoice || supertonic?.defaultVoice || supertonic?.voices[0]?.id || "",
        applioTtsTemplateId: current.applioTtsTemplateId || applio?.ttsTemplates[0]?.id || "",
        vieneuMode: current.vieneuMode || vieneu?.mode || "turbo",
        vieneuEmotion: current.vieneuEmotion || vieneu?.emotion || "natural",
        vieneuVoiceId: current.vieneuVoiceId || vieneu?.defaultVoiceId || "",
      };
      persist({ filter, repos, selectedIds, production: next, generatedVoice });
      return next;
    });
  }

  function updateFilter(patch: Partial<GithubTrendingFilter>) {
    setFilter((current) => {
      const next = { ...current, ...patch };
      persist({ filter: next, repos, selectedIds, production, generatedVoice });
      return next;
    });
  }

  function updateProduction(patch: Partial<GithubTrendingProductionSettings>) {
    setProduction((current) => {
      const next = { ...current, ...patch };
      persist({ filter, repos, selectedIds, production: next, generatedVoice });
      return next;
    });
  }

  function toggleRepo(id: number) {
    setSelectedIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((item) => item !== id) : [...current, id].slice(0, 6);
      persist({ filter, repos, selectedIds: next, production, generatedVoice });
      return next;
    });
  }

  async function generateVoiceOver() {
    if (!plan.narration.trim()) {
      toast.error("Chưa có script để tạo voice.");
      return;
    }
    setVoiceLoading(true);
    try {
      const result = await runVoiceGeneration(plan.narration, production, piperModels);
      setGeneratedVoice(result);
      persist({ filter, repos, selectedIds, production, generatedVoice: result });
      toast.success("Đã tạo voice cho video GitHub trending");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tạo được voice");
    } finally {
      setVoiceLoading(false);
    }
  }

  function clearGeneratedVoice() {
    setGeneratedVoice(null);
    persist({ filter, repos, selectedIds, production, generatedVoice: null });
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    setFilter(DEFAULT_FILTER);
    setRepos([]);
    setSelectedIds([]);
    setProduction(DEFAULT_PRODUCTION);
    setGeneratedVoice(null);
  }

  return {
    filter,
    repos,
    selectedIds,
    selectedRepos,
    plan,
    loading,
    production,
    generatedMedia,
    generatedVoice,
    voiceLoading,
    catalogLoading,
    piperModels,
    elevenLabsConfig,
    supertonicConfig,
    rvcApplioConfig,
    vieneuConfig,
    musicTracks,
    assetMusicOptions: ASSET_MUSIC_OPTIONS,
    updateFilter,
    updateProduction,
    loadTrending,
    loadProductionCatalogs,
    generateVoiceOver,
    clearGeneratedVoice,
    toggleRepo,
    clearDraft,
  };
}

async function runVoiceGeneration(text: string, settings: GithubTrendingProductionSettings, piperModels: PiperModel[]) {
  const fileName = `github-trending-${settings.outputLanguage}-${Date.now()}`;
  switch (settings.voiceProvider) {
    case "supertonic":
      if (!settings.supertonicVoice) throw new Error("Chưa chọn Supertonic voice/style.");
      return generateSupertonicVoice({ text, voice: settings.supertonicVoice, lang: toTtsLang(settings.outputLanguage), speed: 1, totalSteps: settings.supertonicTotalSteps, fileName });
    case "vieneu":
      return generateVieneuVoice({ text, fileName, mode: settings.vieneuMode, emotion: settings.vieneuEmotion, voiceId: settings.vieneuVoiceId });
    case "elevenlabs":
      if (!settings.elevenModelId || !settings.elevenVoiceId) throw new Error("Chưa chọn ElevenLabs model/voice.");
      return generateElevenLabsVoice({ text, modelId: settings.elevenModelId, voiceId: settings.elevenVoiceId, fileName });
    case "applio":
      if (!settings.applioTtsTemplateId) throw new Error("Chưa chọn Applio TTS template.");
      return generateRvcApplioVoice({ text, fileName, templateId: settings.applioTtsTemplateId });
    case "piper":
    default: {
      const modelKey = settings.piperModelKey || piperModels.find((model) => model.available)?.key || "";
      if (!modelKey) throw new Error("Chưa chọn Piper model hoặc model chưa được cài.");
      return generatePiperVoice({ text, modelKey, sentenceSilence: 0.25, speechRate: 1, fileName });
    }
  }
}

function toTtsLang(lang: GithubTrendingOutputLanguage) {
  return lang === "vi" ? "vi" : "en";
}

async function resolveMusicSelection(settings: GithubTrendingProductionSettings, tracks: MusicLibraryTrack[]) {
  if (settings.musicMode === "custom") return { url: settings.customMusicUrl.trim(), label: "Custom URL" };
  if (settings.musicMode === "library") {
    const track = tracks.find((item) => item.id === settings.musicPreset);
    return { url: track?.audioUrl || "", label: track?.title || "Music library" };
  }
  if (settings.musicMode === "asset" && isAssetMusicId(settings.musicPreset)) {
    const option = getAssetMusicOption(settings.musicPreset);
    return { url: option ? await option.loadUrl() : "", label: option?.label.en || "Bundled music" };
  }
  return { url: "", label: `Procedural: ${settings.musicPreset}` };
}


type Draft = {
  filter: GithubTrendingFilter;
  repos: GithubTrendingRepo[];
  selectedIds: number[];
  production?: Partial<GithubTrendingProductionSettings>;
  generatedVoice?: VoiceGenerateResult | null;
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Draft | null;
    return parsed && Array.isArray(parsed.repos) && Array.isArray(parsed.selectedIds) ? parsed : null;
  } catch {
    return null;
  }
}

function persist(draft: Required<Draft>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function toAbsoluteMediaUrl(url: string) {
  if (!url.trim()) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).href;
}
