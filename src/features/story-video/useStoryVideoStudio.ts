import { useEffect, useMemo, useState } from "react";
import {
  generateElevenLabsVoice,
  generatePiperVoice,
  getElevenLabsConfig,
  getPiperModels,
  type ElevenLabsConfig,
  type PiperModel,
  type VoiceGenerateResult,
} from "@/lib/voiceApi";
import {
  extractLinksFromPage,
  extractTextFromUrls,
  generateVideoFromAudio,
  getGeneratedResources,
  getGeneratedVideos,
} from "./storyVideoApi";
import { getStoryTopicPreset, STORY_TOPIC_PRESETS } from "./storyPresets";
import type {
  ExtractLinksResponse,
  ExtractTextResponse,
  GeneratedResource,
  GenerateVideoResponse,
  StoryTopicId,
  StoryVoiceProvider,
  VideoAspectRatio,
  VideoBackgroundType,
  VideoFitMode,
} from "./types";

const DRAFT_KEY = "algoshorts.story-video.v1";
const DEFAULT_TEXT = "Dán nội dung truyện tại đây, hoặc dùng phần lấy text từ web bên dưới để nhập danh sách URL chương.";

type UseStoryVideoStudioOptions = {
  requireVideoGenerationAccess?: () => boolean;
};

type StoryVideoDraft = {
  topicId: StoryTopicId;
  text: string;
  fileName: string;
  videoFileName: string;
  provider: StoryVoiceProvider;
  piperModelKey: string;
  elevenModelId: string;
  elevenVoiceId: string;
  sentenceSilence: number;
  speechRate: number;
  linkPageUrl: string;
  linkSelector: string;
  urlList: string;
  contentSelector: string;
  selectedAudioPath: string;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
};

function readDraft(): Partial<StoryVideoDraft> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "{}") as Partial<StoryVideoDraft>;
  } catch {
    return {};
  }
}

export function useStoryVideoStudio(options: UseStoryVideoStudioOptions = {}) {
  const draft = useMemo(readDraft, []);
  const initialTopic = getStoryTopicPreset(draft.topicId || "tien-hiep");
  const [topicId, setTopicId] = useState<StoryTopicId>(initialTopic.id);
  const topic = getStoryTopicPreset(topicId);
  const [text, setText] = useState(draft.text || DEFAULT_TEXT);
  const [fileName, setFileName] = useState(draft.fileName || initialTopic.filePrefix);
  const [videoFileName, setVideoFileName] = useState(draft.videoFileName || initialTopic.filePrefix);
  const [provider, setProvider] = useState<StoryVoiceProvider>(draft.provider || "piper");
  const [piperModels, setPiperModels] = useState<PiperModel[]>([]);
  const [elevenConfig, setElevenConfig] = useState<ElevenLabsConfig | null>(null);
  const [piperModelKey, setPiperModelKey] = useState(draft.piperModelKey || "vi_vais1000");
  const [elevenModelId, setElevenModelId] = useState(draft.elevenModelId || "");
  const [elevenVoiceId, setElevenVoiceId] = useState(draft.elevenVoiceId || "");
  const [sentenceSilence, setSentenceSilence] = useState(draft.sentenceSilence ?? 0.55);
  const [speechRate, setSpeechRate] = useState(draft.speechRate ?? 0.86);
  const [linkPageUrl, setLinkPageUrl] = useState(draft.linkPageUrl || "");
  const [linkSelector, setLinkSelector] = useState(draft.linkSelector || "a[href]");
  const [urlList, setUrlList] = useState(draft.urlList || "");
  const [contentSelector, setContentSelector] = useState(draft.contentSelector || initialTopic.defaultSelector);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedResource[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedResource[]>([]);
  const [selectedAudioPath, setSelectedAudioPath] = useState(draft.selectedAudioPath || "");
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(draft.aspectRatio || "16:9");
  const [backgroundType, setBackgroundType] = useState<VideoBackgroundType>(draft.backgroundType || "image");
  const [fitMode, setFitMode] = useState<VideoFitMode>(draft.fitMode || "cover");
  const [extractResult, setExtractResult] = useState<ExtractTextResponse | null>(null);
  const [linkResult, setLinkResult] = useState<ExtractLinksResponse | null>(null);
  const [audioResult, setAudioResult] = useState<VoiceGenerateResult | null>(null);
  const [videoResult, setVideoResult] = useState<GenerateVideoResponse | null>(null);
  const [loading, setLoading] = useState({ boot: true, links: false, extract: false, audio: false, video: false });
  const [message, setMessage] = useState("");

  const urls = useMemo(() => parseUrls(urlList), [urlList]);
  const selectedAudio = generatedAudio.find((item) => item.relativePath === selectedAudioPath) || null;
  const characterCount = text.trim().length;
  const canGenerateAudio = Boolean(text.trim()) && !loading.audio;
  const canGenerateVideo = Boolean(backgroundFile) && !loading.video && (Boolean(selectedAudioPath) || Boolean(uploadedAudioFile));

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    if (!backgroundFile) {
      setBackgroundPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(backgroundFile);
    setBackgroundPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [backgroundFile]);

  useEffect(() => {
    const payload: StoryVideoDraft = {
      topicId,
      text,
      fileName,
      videoFileName,
      provider,
      piperModelKey,
      elevenModelId,
      elevenVoiceId,
      sentenceSilence,
      speechRate,
      linkPageUrl,
      linkSelector,
      urlList,
      contentSelector,
      selectedAudioPath,
      aspectRatio,
      backgroundType,
      fitMode,
    };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }
  }, [topicId, text, fileName, videoFileName, provider, piperModelKey, elevenModelId, elevenVoiceId, sentenceSilence, speechRate, linkPageUrl, linkSelector, urlList, contentSelector, selectedAudioPath, aspectRatio, backgroundType, fitMode]);

  function changeTopic(nextTopicId: StoryTopicId) {
    const nextTopic = getStoryTopicPreset(nextTopicId);
    setTopicId(nextTopicId);
    setFileName(nextTopic.filePrefix);
    setVideoFileName(nextTopic.filePrefix);
    setContentSelector(nextTopic.defaultSelector);
    if (!text.trim() || text === DEFAULT_TEXT) setText(nextTopic.prompt);
  }

  async function loadBootstrap() {
    setLoading((state) => ({ ...state, boot: true }));
    try {
      const [models, proConfig, resources, videos] = await Promise.allSettled([
        getPiperModels(),
        getElevenLabsConfig(),
        getGeneratedResources(),
        getGeneratedVideos(),
      ]);
      if (models.status === "fulfilled") {
        setPiperModels(models.value);
        const fallback = models.value.find((model) => model.lang === "vi" && model.available) || models.value.find((model) => model.available);
        if (!draft.piperModelKey && fallback?.key) setPiperModelKey(fallback.key);
      }
      if (proConfig.status === "fulfilled") {
        setElevenConfig(proConfig.value);
        if (!draft.elevenModelId) setElevenModelId(proConfig.value.models[0]?.id || "");
        if (!draft.elevenVoiceId) setElevenVoiceId(proConfig.value.voices[0]?.id || "");
      }
      if (resources.status === "fulfilled") setGeneratedAudio(resources.value.audio);
      if (videos.status === "fulfilled") setGeneratedVideos(videos.value.videos);
    } finally {
      setLoading((state) => ({ ...state, boot: false }));
    }
  }

  async function discoverLinks() {
    setLoading((state) => ({ ...state, links: true }));
    setMessage("");
    try {
      const result = await extractLinksFromPage({ url: linkPageUrl, selector: linkSelector });
      setLinkResult(result);
      setUrlList(result.links.map((link) => link.href).join("\n"));
      setMessage(`Đã tìm thấy ${result.count} link.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lấy được danh sách link.");
    } finally {
      setLoading((state) => ({ ...state, links: false }));
    }
  }

  async function extractText() {
    setLoading((state) => ({ ...state, extract: true }));
    setMessage("");
    try {
      const result = await extractTextFromUrls({ urls, selector: contentSelector });
      setExtractResult(result);
      if (result.combinedText.trim()) setText(result.combinedText);
      setMessage(`Đã lấy ${result.characterCount.toLocaleString("vi-VN")} ký tự từ ${result.results.length} URL.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không trích xuất được text.");
    } finally {
      setLoading((state) => ({ ...state, extract: false }));
    }
  }

  async function generateAudio() {
    setLoading((state) => ({ ...state, audio: true }));
    setMessage("");
    try {
      const result = provider === "elevenlabs"
        ? await generateElevenLabsVoice({ text, modelId: elevenModelId, voiceId: elevenVoiceId, fileName })
        : await generatePiperVoice({ text, modelKey: piperModelKey, sentenceSilence, speechRate, fileName });
      setAudioResult(result);
      const resource: GeneratedResource = {
        kind: "audio",
        fileName: result.fileName,
        relativePath: result.relativePath,
        url: result.audioUrl,
        sizeBytes: 0,
        createdAtMs: Date.now(),
      };
      setGeneratedAudio((current) => [resource, ...current.filter((item) => item.relativePath !== resource.relativePath)]);
      setSelectedAudioPath(resource.relativePath);
      setMessage("Đã tạo audio đọc truyện.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tạo audio thất bại.");
    } finally {
      setLoading((state) => ({ ...state, audio: false }));
    }
  }

  async function generateVideo() {
    if (!requireVideoGenerationAccess()) return;
    if (!backgroundFile) return setMessage("Chưa chọn ảnh/GIF/video nền.");
    setLoading((state) => ({ ...state, video: true }));
    setMessage("");
    try {
      const result = await generateVideoFromAudio({
        audioRelativePath: uploadedAudioFile ? undefined : selectedAudioPath,
        audioFile: uploadedAudioFile,
        backgroundFile,
        videoFileName,
        aspectRatio,
        backgroundType,
        fitMode,
      });
      setVideoResult(result);
      const video = result.video;
      setGeneratedVideos((current) => [{
        kind: "video",
        fileName: video.fileName,
        relativePath: video.relativePath,
        url: video.videoUrl,
        sizeBytes: 0,
        createdAtMs: Date.now(),
      }, ...current]);
      setMessage("Đã tạo video đọc truyện.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tạo video thất bại.");
    } finally {
      setLoading((state) => ({ ...state, video: false }));
    }
  }

  function requireVideoGenerationAccess() {
    return options.requireVideoGenerationAccess?.() ?? true;
  }

  return {
    aspectRatio,
    audioResult,
    backgroundFile,
    backgroundPreviewUrl,
    backgroundType,
    canGenerateAudio,
    canGenerateVideo,
    characterCount,
    changeTopic,
    contentSelector,
    discoverLinks,
    elevenConfig,
    elevenModelId,
    elevenVoiceId,
    extractResult,
    extractText,
    fileName,
    fitMode,
    generatedAudio,
    generatedVideos,
    generateAudio,
    generateVideo,
    linkPageUrl,
    linkResult,
    linkSelector,
    loading,
    message,
    piperModelKey,
    piperModels,
    provider,
    selectedAudio,
    selectedAudioPath,
    sentenceSilence,
    setAspectRatio,
    setBackgroundFile,
    setBackgroundType,
    setContentSelector,
    setElevenModelId,
    setElevenVoiceId,
    setFileName,
    setFitMode,
    setLinkPageUrl,
    setLinkSelector,
    setPiperModelKey,
    setProvider,
    setSelectedAudioPath,
    setSentenceSilence,
    setSpeechRate,
    setText,
    setUploadedAudioFile,
    setUrlList,
    setVideoFileName,
    speechRate,
    text,
    topic,
    topicId,
    topics: STORY_TOPIC_PRESETS,
    uploadedAudioFile,
    urlCount: urls.length,
    urlList,
    videoFileName,
    videoResult,
  };
}

function parseUrls(value: string) {
  return Array.from(new Set(value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)));
}
