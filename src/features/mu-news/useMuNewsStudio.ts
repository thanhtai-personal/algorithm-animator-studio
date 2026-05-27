import { useEffect, useMemo, useState } from "react";
import type { GenerateVideoResponse, VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "@/features/story-video/types";
import { generatePiperVoice, getPiperModels, type PiperModel, type VoiceGenerateResult } from "@/lib/voiceApi";
import { fetchMuNews, generateMuNewsScript, generateVideoFromMuAudio, getMuNewsSources } from "./muNewsApi";
import { createDefaultFileName, parseSourcesText, sourcesToText } from "./muNewsUtils";
import type { MuNewsDraft, MuNewsFetchResponse, MuNewsItem, MuNewsScriptResponse } from "./types";

const DRAFT_KEY = "kata.mu-news-studio.v1";

const DEFAULT_DRAFT: MuNewsDraft = {
  sourcesText: "",
  query: "Manchester United OR Man Utd OR MUFC",
  selectedIds: [],
  channelName: "Bản Tin Quỷ Đỏ",
  angle: "Tin thật, tin đồn và góc nhìn fan MU Việt. Không giật tít sai sự thật.",
  durationMinutes: 6,
  voiceStyle: "Nam tính, gần gũi, tỉnh táo, nói như một fan MU hiểu bóng đá.",
  script: "",
  fileName: createDefaultFileName("mu-news-audio"),
  videoFileName: createDefaultFileName("mu-news-video"),
  piperModelKey: "vi_vais1000",
  sentenceSilence: 0.5,
  speechRate: 0.9,
  aspectRatio: "16:9",
  backgroundType: "image",
  fitMode: "cover",
};

function readDraft(): MuNewsDraft {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    return { ...DEFAULT_DRAFT, ...JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "{}") };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function useMuNewsStudio() {
  const draft = useMemo(readDraft, []);
  const [sourcesText, setSourcesText] = useState(draft.sourcesText);
  const [query, setQuery] = useState(draft.query);
  const [selectedIds, setSelectedIds] = useState<string[]>(draft.selectedIds || []);
  const [channelName, setChannelName] = useState(draft.channelName);
  const [angle, setAngle] = useState(draft.angle);
  const [durationMinutes, setDurationMinutes] = useState(draft.durationMinutes);
  const [voiceStyle, setVoiceStyle] = useState(draft.voiceStyle);
  const [script, setScript] = useState(draft.script);
  const [fileName, setFileName] = useState(draft.fileName);
  const [videoFileName, setVideoFileName] = useState(draft.videoFileName);
  const [piperModelKey, setPiperModelKey] = useState(draft.piperModelKey);
  const [sentenceSilence, setSentenceSilence] = useState(draft.sentenceSilence);
  const [speechRate, setSpeechRate] = useState(draft.speechRate);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(draft.aspectRatio);
  const [backgroundType, setBackgroundType] = useState<VideoBackgroundType>(draft.backgroundType);
  const [fitMode, setFitMode] = useState<VideoFitMode>(draft.fitMode);
  const [piperModels, setPiperModels] = useState<PiperModel[]>([]);
  const [newsResult, setNewsResult] = useState<MuNewsFetchResponse | null>(null);
  const [scriptResult, setScriptResult] = useState<MuNewsScriptResponse | null>(null);
  const [audioResult, setAudioResult] = useState<VoiceGenerateResult | null>(null);
  const [videoResult, setVideoResult] = useState<GenerateVideoResponse | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState({ boot: true, news: false, script: false, audio: false, video: false });

  const sources = useMemo(() => parseSourcesText(sourcesText), [sourcesText]);
  const selectedItems = useMemo(
    () => (newsResult?.items || []).filter((item) => selectedIds.includes(item.id)),
    [newsResult, selectedIds]
  );
  const canFetchNews = sources.length > 0 && !loading.news;
  const canGenerateScript = selectedItems.length > 0 && !loading.script;
  const canGenerateAudio = script.trim().length > 0 && !loading.audio;
  const canGenerateVideo = Boolean(audioResult?.relativePath && backgroundFile) && !loading.video;

  useEffect(() => { void boot(); }, []);

  useEffect(() => {
    const payload: MuNewsDraft = {
      sourcesText,
      query,
      selectedIds,
      channelName,
      angle,
      durationMinutes,
      voiceStyle,
      script,
      fileName,
      videoFileName,
      piperModelKey,
      sentenceSilence,
      speechRate,
      aspectRatio,
      backgroundType,
      fitMode,
    };
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
  }, [sourcesText, query, selectedIds, channelName, angle, durationMinutes, voiceStyle, script, fileName, videoFileName, piperModelKey, sentenceSilence, speechRate, aspectRatio, backgroundType, fitMode]);

  useEffect(() => {
    if (!backgroundFile) {
      setBackgroundPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(backgroundFile);
    setBackgroundPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [backgroundFile]);

  async function boot() {
    setLoading((value) => ({ ...value, boot: true }));
    try {
      const [sourceData, models] = await Promise.all([getMuNewsSources(), getPiperModels().catch(() => [])]);
      if (!sourcesText.trim()) setSourcesText(sourcesToText(sourceData.sources));
      setPiperModels(models);
      if (models.length && !models.some((model) => model.key === piperModelKey)) {
        setPiperModelKey(models.find((model) => model.lang === "vi")?.key || models[0].key);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được cấu hình MU News.");
    } finally {
      setLoading((value) => ({ ...value, boot: false }));
    }
  }

  async function loadNews() {
    if (!canFetchNews) return;
    setLoading((value) => ({ ...value, news: true }));
    setMessage("");
    try {
      const result = await fetchMuNews({ sources, query, maxItems: 18 });
      setNewsResult(result);
      setSelectedIds(result.items.slice(0, 6).map((item) => item.id));
      if (!result.items.length) setMessage("Chưa tìm thấy tin phù hợp. Thử đổi RSS hoặc từ khóa lọc.");
      else if (result.warnings?.length) setMessage(result.warnings.join("\n"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được tin.");
    } finally {
      setLoading((value) => ({ ...value, news: false }));
    }
  }

  async function createScript() {
    if (!canGenerateScript) return;
    setLoading((value) => ({ ...value, script: true }));
    setMessage("");
    try {
      const result = await generateMuNewsScript({ items: selectedItems, channelName, angle, durationMinutes, voiceStyle });
      setScriptResult(result);
      setScript(result.script);
      if (result.warning) setMessage(result.warning);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được kịch bản.");
    } finally {
      setLoading((value) => ({ ...value, script: false }));
    }
  }

  async function createAudio() {
    if (!canGenerateAudio) return;
    setLoading((value) => ({ ...value, audio: true }));
    setMessage("");
    try {
      const result = await generatePiperVoice({
        text: script,
        modelKey: piperModelKey,
        sentenceSilence,
        speechRate,
        fileName,
      });
      setAudioResult(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được voice Piper.");
    } finally {
      setLoading((value) => ({ ...value, audio: false }));
    }
  }

  async function createVideo() {
    if (!canGenerateVideo || !audioResult?.relativePath || !backgroundFile) return;
    setLoading((value) => ({ ...value, video: true }));
    setMessage("");
    try {
      const result = await generateVideoFromMuAudio({
        audioRelativePath: audioResult.relativePath,
        backgroundFile,
        videoFileName,
        aspectRatio,
        backgroundType,
        fitMode,
      });
      setVideoResult(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không render được video.");
    } finally {
      setLoading((value) => ({ ...value, video: false }));
    }
  }

  function toggleItem(item: MuNewsItem, checked: boolean) {
    setSelectedIds((ids) => checked ? Array.from(new Set([...ids, item.id])) : ids.filter((id) => id !== item.id));
  }

  function selectTopNews(count = 6) {
    setSelectedIds((newsResult?.items || []).slice(0, count).map((item) => item.id));
  }

  function resetDraft() {
    const next = { ...DEFAULT_DRAFT, sourcesText };
    setSelectedIds([]);
    setChannelName(next.channelName);
    setAngle(next.angle);
    setDurationMinutes(next.durationMinutes);
    setVoiceStyle(next.voiceStyle);
    setScript("");
    setFileName(createDefaultFileName("mu-news-audio"));
    setVideoFileName(createDefaultFileName("mu-news-video"));
    setScriptResult(null);
    setAudioResult(null);
    setVideoResult(null);
    setMessage("");
  }

  return {
    sourcesText, setSourcesText, sources, query, setQuery, selectedIds, selectedItems, channelName, setChannelName,
    angle, setAngle, durationMinutes, setDurationMinutes, voiceStyle, setVoiceStyle, script, setScript,
    fileName, setFileName, videoFileName, setVideoFileName, piperModelKey, setPiperModelKey,
    sentenceSilence, setSentenceSilence, speechRate, setSpeechRate, aspectRatio, setAspectRatio,
    backgroundType, setBackgroundType, fitMode, setFitMode, piperModels, newsResult, scriptResult,
    audioResult, videoResult, backgroundFile, setBackgroundFile, backgroundPreviewUrl, message, loading,
    canFetchNews, canGenerateScript, canGenerateAudio, canGenerateVideo, loadNews, createScript, createAudio,
    createVideo, toggleItem, selectTopNews, resetDraft,
  };
}
