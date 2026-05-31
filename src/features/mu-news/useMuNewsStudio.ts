import { useEffect, useMemo, useState } from "react";
import type { GenerateVideoResponse, VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "@/features/story-video/types";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";
import { generatePiperVoice, getPiperModels, type PiperModel } from "@/lib/voiceApi";
import { fetchMuNews, generateMuNewsTimelineVideo, getMuNewsSources } from "./muNewsApi";
import { buildMuNewsScriptPrompt } from "./muNewsPrompt";
import { applyDefaultSources, createDefaultFileName, normalizeVietnameseText, parseSourcesText, sourcesToText } from "./muNewsUtils";
import type { MuNewsDraft, MuNewsFetchResponse, MuNewsItem, MuNewsStepId, MuNewsVoiceSegment } from "./types";
import { useMuNewsValidation } from "./useMuNewsValidation";

const DRAFT_KEY = "kata.mu-news-studio.v2";

const DEFAULT_DRAFT: MuNewsDraft = {
  activeStep: "sources",
  sourcesText: "",
  query: "Manchester United OR Man Utd OR MUFC",
  selectedIds: [],
  channelName: "Bản Tin Quỷ Đỏ",
  angle: "Tin thật, tin đồn và góc nhìn fan MU Việt. Không giật tít sai sự thật.",
  durationMinutes: 6,
  voiceStyle: "Nam tính, gần gũi, tỉnh táo, nói như một fan MU hiểu bóng đá.",
  scriptLanguage: "Tiếng Việt",
  script: "",
  fileName: createDefaultFileName("mu-news-audio"),
  videoFileName: createDefaultFileName("mu-news-video"),
  piperModelKey: "vi_vais1000",
  sentenceSilence: 0.5,
  speechRate: 0.9,
  aspectRatio: "16:9",
  backgroundType: "image",
  fitMode: "cover",
  voiceSegments: [],
  backgroundMusicRelativePath: "",
  backgroundMusicVolume: 0.12,
  backgroundMusicLoop: true,
  backgroundMusicFadeIn: 1.5,
  backgroundMusicFadeOut: 2,
};

type BackgroundDraft = {
  id: string;
  file: File;
  previewUrl: string;
  durationSeconds: number;
};

type UploadedVoiceDraft = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  selected: boolean;
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
  const [activeStep, setActiveStep] = useState<MuNewsStepId>(draft.activeStep);
  const [sourcesText, setSourcesText] = useState(draft.sourcesText);
  const [query, setQuery] = useState(draft.query);
  const [selectedIds, setSelectedIds] = useState<string[]>(draft.selectedIds || []);
  const [channelName, setChannelName] = useState(draft.channelName);
  const [angle, setAngle] = useState(draft.angle);
  const [durationMinutes, setDurationMinutes] = useState(draft.durationMinutes);
  const [voiceStyle, setVoiceStyle] = useState(draft.voiceStyle);
  const [scriptLanguage, setScriptLanguage] = useState(draft.scriptLanguage);
  const [script, setScript] = useState(draft.script);
  const [fileName, setFileName] = useState(draft.fileName);
  const [videoFileName, setVideoFileName] = useState(draft.videoFileName);
  const [piperModelKey, setPiperModelKey] = useState(draft.piperModelKey);
  const [sentenceSilence, setSentenceSilence] = useState(draft.sentenceSilence);
  const [speechRate, setSpeechRate] = useState(draft.speechRate);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(draft.aspectRatio);
  const [backgroundType, setBackgroundType] = useState<VideoBackgroundType>(draft.backgroundType);
  const [fitMode, setFitMode] = useState<VideoFitMode>(draft.fitMode);
  const [voiceSegments, setVoiceSegments] = useState<MuNewsVoiceSegment[]>(draft.voiceSegments || []);
  const [backgroundMusicRelativePath, setBackgroundMusicRelativePath] = useState(draft.backgroundMusicRelativePath);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(draft.backgroundMusicVolume);
  const [backgroundMusicLoop, setBackgroundMusicLoop] = useState(draft.backgroundMusicLoop);
  const [backgroundMusicFadeIn, setBackgroundMusicFadeIn] = useState(draft.backgroundMusicFadeIn);
  const [backgroundMusicFadeOut, setBackgroundMusicFadeOut] = useState(draft.backgroundMusicFadeOut);
  const [piperModels, setPiperModels] = useState<PiperModel[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicLibraryTrack[]>([]);
  const [newsResult, setNewsResult] = useState<MuNewsFetchResponse | null>(null);
  const [videoResult, setVideoResult] = useState<GenerateVideoResponse | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundDraft[]>([]);
  const [uploadedVoices, setUploadedVoices] = useState<UploadedVoiceDraft[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState({ boot: true, news: false, script: false, audio: false, video: false });

  const sources = useMemo(() => parseSourcesText(sourcesText), [sourcesText]);
  const selectedItems = useMemo(
    () => (newsResult?.items || []).filter((item) => selectedIds.includes(item.id)),
    [newsResult, selectedIds]
  );
  const generatedVoiceCount = voiceSegments.filter((item) => item.result?.relativePath).length;
  const selectedGeneratedVoices = voiceSegments.filter((item) => item.selected && item.result?.relativePath);
  const selectedUploadedVoices = uploadedVoices.filter((item) => item.selected);
  const selectedVoiceFileCount = selectedGeneratedVoices.length + selectedUploadedVoices.length;
  const canFetchNews = sources.length > 0 && !loading.news;
  const newsValidation = useMuNewsValidation({ selectedItems, setSelectedIds, setActiveStep, setMessage });
  const canGenerateScript = newsValidation.selectedNewsValidated && !loading.script;
  const scriptPrompt = useMemo(
    () => buildMuNewsScriptPrompt({
      items: selectedItems,
      channelName,
      angle,
      durationMinutes,
      voiceStyle,
      scriptLanguage,
      validationById: newsValidation.newsValidationById,
    }),
    [selectedItems, channelName, angle, durationMinutes, voiceStyle, scriptLanguage, newsValidation.newsValidationById]
  );
  const canGenerateAudio = voiceSegments.some((item) => item.text.trim()) && !loading.audio;
  const canGenerateVideo = selectedVoiceFileCount > 0 && backgrounds.length > 0 && !loading.video;
  const audioResult = [...voiceSegments].reverse().find((item) => item.result)?.result || null;

  useEffect(() => { void boot(); }, []);


  useEffect(() => {
    const payload: MuNewsDraft = {
      activeStep, sourcesText, query, selectedIds, channelName, angle, durationMinutes, voiceStyle,
      scriptLanguage, script, fileName, videoFileName, piperModelKey, sentenceSilence, speechRate,
      aspectRatio, backgroundType, fitMode, voiceSegments, backgroundMusicRelativePath,
      backgroundMusicVolume, backgroundMusicLoop, backgroundMusicFadeIn, backgroundMusicFadeOut,
    };
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
  }, [activeStep, sourcesText, query, selectedIds, channelName, angle, durationMinutes, voiceStyle, scriptLanguage, script, fileName, videoFileName, piperModelKey, sentenceSilence, speechRate, aspectRatio, backgroundType, fitMode, voiceSegments, backgroundMusicRelativePath, backgroundMusicVolume, backgroundMusicLoop, backgroundMusicFadeIn, backgroundMusicFadeOut]);

  async function boot() {
    setLoading((value) => ({ ...value, boot: true }));
    try {
      const [sourceData, models, tracks] = await Promise.all([
        getMuNewsSources(),
        getPiperModels().catch(() => []),
        getMusicLibraryTracks().catch(() => []),
      ]);
      if (!sourcesText.trim()) setSourcesText(sourcesToText(sourceData.sources));
      else setSourcesText(applyDefaultSources(sourcesText, sourceData.sources));
      setPiperModels(models);
      setMusicTracks(tracks);
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
      const result = await fetchMuNews({ sources, query, maxItems: 24 });
      setNewsResult(result);
      setSelectedIds([]);
      newsValidation.resetNewsValidation();
      setActiveStep("preview");
      if (!result.items.length) setMessage("Chưa tìm thấy tin phù hợp. Thử đổi RSS hoặc từ khóa lọc.");
      else if (result.warnings?.length) setMessage(result.warnings.join("\n"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được tin.");
    } finally {
      setLoading((value) => ({ ...value, news: false }));
    }
  }

  function createScript() {
    if (!canGenerateScript) return;
    setMessage("");
    setActiveStep("script");
  }

  function rebuildVoiceSegments() {
    const normalizedScript = normalizeVietnameseText(script);
    if (normalizedScript !== script) setScript(normalizedScript);
    setVoiceSegments(splitScriptIntoVoiceSegments(normalizedScript, fileName, piperModelKey));
    setActiveStep("voice");
  }

  function updateScript(value: string) {
    setScript(normalizeVietnameseText(value));
  }

  async function createAudioSegment(segmentId: string) {
    const segment = voiceSegments.find((item) => item.id === segmentId);
    if (!segment?.text.trim()) return;
    setLoading((value) => ({ ...value, audio: true }));
    setMessage("");
    try {
      const result = await generatePiperVoice({
        text: segment.text,
        modelKey: segment.modelKey || piperModelKey,
        sentenceSilence,
        speechRate,
        fileName: segment.fileName,
      });
      setVoiceSegments((items) => items.map((item) => item.id === segmentId ? { ...item, selected: true, result } : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được voice Piper.");
    } finally {
      setLoading((value) => ({ ...value, audio: false }));
    }
  }

  async function createAllAudioSegments() {
    if (!canGenerateAudio) return;
    for (const segment of voiceSegments) {
      if (!segment.result?.relativePath && segment.text.trim()) {
        await createAudioSegment(segment.id);
      }
    }
    setActiveStep("video");
  }

  async function createVideo() {
    if (!canGenerateVideo) return;
    setLoading((value) => ({ ...value, video: true }));
    setMessage("");
    try {
      const result = await generateMuNewsTimelineVideo({
        audioRelativePaths: selectedGeneratedVoices.map((item) => item.result!.relativePath),
        uploadedAudioFiles: selectedUploadedVoices.map((item) => item.file),
        backgrounds: backgrounds.map((item) => ({ file: item.file, durationSeconds: item.durationSeconds })),
        videoFileName,
        aspectRatio,
        fitMode,
        backgroundMusicRelativePath,
        backgroundMusicVolume,
        backgroundMusicLoop,
        backgroundMusicFadeIn,
        backgroundMusicFadeOut,
      });
      setVideoResult(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không render được video.");
    } finally {
      setLoading((value) => ({ ...value, video: false }));
    }
  }

  function toggleItem(item: MuNewsItem, checked: boolean) {
    newsValidation.clearNewsValidationForItem(item.id);
    setSelectedIds((ids) => checked ? Array.from(new Set([...ids, item.id])) : ids.filter((id) => id !== item.id));
  }

  function clearSelectedNews() {
    setSelectedIds([]);
    newsValidation.resetNewsValidation();
  }

  function selectAllNews() {
    setSelectedIds((newsResult?.items || []).map((item) => item.id));
    newsValidation.resetNewsValidation();
  }

  function updateVoiceSegment(id: string, patch: Partial<MuNewsVoiceSegment>) {
    setVoiceSegments((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function addBackgroundFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!nextFiles.length) return;
    setBackgrounds((items) => [
      ...items,
      ...nextFiles.map((file, index) => ({
        id: createId("bg"),
        file,
        previewUrl: URL.createObjectURL(file),
        durationSeconds: index === 0 && !items.length ? 8 : 6,
      })),
    ]);
  }

  function updateBackground(id: string, durationSeconds: number) {
    setBackgrounds((items) => items.map((item) => item.id === id ? { ...item, durationSeconds: clamp(durationSeconds, 1, 120) } : item));
  }

  function removeBackground(id: string) {
    setBackgrounds((items) => {
      const removed = items.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return items.filter((item) => item.id !== id);
    });
  }

  function addUploadedVoiceFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList).filter((file) => file.type.startsWith("audio/") || /\.(wav|mp3|m4a|aac|ogg|opus)$/i.test(file.name));
    setUploadedVoices((items) => [
      ...items,
      ...nextFiles.map((file) => ({ id: createId("voice-file"), file, previewUrl: URL.createObjectURL(file), title: file.name, selected: true })),
    ]);
  }

  function updateUploadedVoice(id: string, selected: boolean) {
    setUploadedVoices((items) => items.map((item) => item.id === id ? { ...item, selected } : item));
  }

  function removeUploadedVoice(id: string) {
    setUploadedVoices((items) => {
      const removed = items.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return items.filter((item) => item.id !== id);
    });
  }

  function resetDraft() {
    setActiveStep("sources");
    setSelectedIds([]);
    newsValidation.resetNewsValidation();
    setChannelName(DEFAULT_DRAFT.channelName);
    setAngle(DEFAULT_DRAFT.angle);
    setDurationMinutes(DEFAULT_DRAFT.durationMinutes);
    setVoiceStyle(DEFAULT_DRAFT.voiceStyle);
    setScriptLanguage(DEFAULT_DRAFT.scriptLanguage);
    setScript("");
    setFileName(createDefaultFileName("mu-news-audio"));
    setVideoFileName(createDefaultFileName("mu-news-video"));
    setVoiceSegments([]);
    setVideoResult(null);
    setMessage("");
  }

  return {
    activeStep, setActiveStep, sourcesText, setSourcesText, sources, query, setQuery, selectedIds, selectedItems,
    channelName, setChannelName, angle, setAngle, durationMinutes, setDurationMinutes, voiceStyle, setVoiceStyle,
    scriptLanguage, setScriptLanguage, script, setScript: updateScript, fileName, setFileName, videoFileName, setVideoFileName,
    piperModelKey, setPiperModelKey, sentenceSilence, setSentenceSilence, speechRate, setSpeechRate,
    aspectRatio, setAspectRatio, backgroundType, setBackgroundType, fitMode, setFitMode, piperModels, musicTracks,
    newsResult, audioResult, videoResult, voiceSegments, backgrounds, uploadedVoices, scriptPrompt,
    backgroundMusicRelativePath, setBackgroundMusicRelativePath, backgroundMusicVolume, setBackgroundMusicVolume,
    backgroundMusicLoop, setBackgroundMusicLoop, backgroundMusicFadeIn, setBackgroundMusicFadeIn,
    backgroundMusicFadeOut, setBackgroundMusicFadeOut, message, loading, generatedVoiceCount, selectedVoiceFileCount,
    canFetchNews, canGenerateScript, canGenerateAudio, canGenerateVideo, loadNews, createScript, rebuildVoiceSegments,
    createAudioSegment, createAllAudioSegments, createVideo, toggleItem, selectAllNews, clearSelectedNews, updateVoiceSegment,
    addBackgroundFiles, updateBackground, removeBackground, addUploadedVoiceFiles, updateUploadedVoice,
    removeUploadedVoice, resetDraft, ...newsValidation,
  };
}

function splitScriptIntoVoiceSegments(text: string, filePrefix: string, modelKey?: string): MuNewsVoiceSegment[] {
  const blocks = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const segments: string[] = [];
  let current = "";

  for (const block of blocks.length ? blocks : [text]) {
    if ((current + "\n\n" + block).trim().length > 900 && current.trim()) {
      segments.push(current.trim());
      current = block;
    } else {
      current = [current, block].filter(Boolean).join("\n\n");
    }
  }
  if (current.trim()) segments.push(current.trim());

  return segments.map((segment, index) => ({
    id: createId(`voice-${index + 1}`),
    title: `Voice đoạn ${index + 1}`,
    text: segment,
    fileName: `${filePrefix || createDefaultFileName("mu-news-audio")}-${String(index + 1).padStart(2, "0")}`,
    modelKey,
    selected: true,
    result: null,
  }));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
