import { useEffect, useState } from "react";
import {
  generateVideoFromAudio,
  getGeneratedVideos,
  type GeneratedVideo,
  type GenerateVideoResponse,
  type VideoAspectRatio,
  type VideoBackgroundType,
  type VideoFitMode,
} from "../api/videoApi";
import {
  getResourceOverview,
  uploadBackgroundMusicResource,
  type GeneratedResource,
} from "../api/resourceApi";
import { EMPTY_YOUTUBE_UPLOAD } from "../constants/youtubeDefaults";
import { useI18n } from "../i18n";
import { readPersistedDraft, readStringDraft, savePersistedDraft } from "../utils/persistedDrafts";
import { studioSessionResources, videoStudioSessionFiles } from "../utils/sessionFileMemory";
import { renderBrowserVideo } from "../utils/browserVideoRenderer";
import { isCanvasVideoRecorderSupported, PUBLIC_WEB_BUILD } from "../utils/publicRuntime";

export type VideoAudioSourceMode = "existing" | "upload";
export type VideoRenderEngine = "local-ffmpeg" | "browser-recorder";

type VideoStudioPersistedDraft = {
  audioSourceMode: VideoAudioSourceMode;
  selectedAudioPath: string;
  renderEngine: VideoRenderEngine;
  backgroundType: VideoBackgroundType;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  videoFileName: string;
  selectedBackgroundMusicPath: string;
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  backgroundMusicLoop: boolean;
  backgroundMusicFadeIn: number;
  backgroundMusicFadeOut: number;
  youtubeForm: typeof EMPTY_YOUTUBE_UPLOAD;
};

export function useVideoStudio() {
  const { t } = useI18n();
  const draft = readPersistedDraft<VideoStudioPersistedDraft>("videoStudio");
  const [audioSourceMode, setAudioSourceMode] = useState<VideoAudioSourceMode>(() =>
    draft.audioSourceMode === "upload" ? "upload" : "existing"
  );
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedResource[]>(() =>
    studioSessionResources.lastTtsAudio ? [toGeneratedAudioResource(studioSessionResources.lastTtsAudio)] : []
  );
  const [selectedAudioPath, setSelectedAudioPath] = useState(() =>
    readStringDraft(draft.selectedAudioPath, studioSessionResources.lastTtsAudio?.relativePath || "")
  );
  const [uploadedAudioFile, setUploadedAudioFileState] = useState<File | null>(() => videoStudioSessionFiles.uploadedAudioFile);
  const [renderEngine, setRenderEngine] = useState<VideoRenderEngine>(() =>
    PUBLIC_WEB_BUILD || draft.renderEngine === "browser-recorder" ? "browser-recorder" : "local-ffmpeg"
  );
  const [backgroundMusic, setBackgroundMusic] = useState<GeneratedResource[]>([]);
  const [selectedBackgroundMusicPath, setSelectedBackgroundMusicPath] = useState(() => readStringDraft(draft.selectedBackgroundMusicPath, ""));
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(() => draft.backgroundMusicEnabled === true);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(() => normalizePercentDraft(draft.backgroundMusicVolume, 12));
  const [backgroundMusicLoop, setBackgroundMusicLoop] = useState(() => draft.backgroundMusicLoop !== false);
  const [backgroundMusicFadeIn, setBackgroundMusicFadeIn] = useState(() => normalizeSecondsDraft(draft.backgroundMusicFadeIn, 1.5));
  const [backgroundMusicFadeOut, setBackgroundMusicFadeOut] = useState(() => normalizeSecondsDraft(draft.backgroundMusicFadeOut, 2));
  const [backgroundMusicUploading, setBackgroundMusicUploading] = useState(false);
  const [uploadedAudioPreviewUrl, setUploadedAudioPreviewUrl] = useState("");
  const [backgroundFile, setBackgroundFileState] = useState<File | null>(() => videoStudioSessionFiles.backgroundFile);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState("");
  const [backgroundType, setBackgroundType] = useState<VideoBackgroundType>(() =>
    draft.backgroundType === "video" || draft.backgroundType === "gif" ? draft.backgroundType : "image"
  );
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(() => (draft.aspectRatio === "9:16" ? "9:16" : "16:9"));
  const [fitMode, setFitMode] = useState<VideoFitMode>(() => (draft.fitMode === "contain" ? "contain" : "cover"));
  const [videoFileName, setVideoFileName] = useState(() => readStringDraft(draft.videoFileName, "truyen-audio-video"));
  const [videoLoading, setVideoLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<GenerateVideoResponse | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>(() =>
    studioSessionResources.lastGeneratedVideo ? [toGeneratedVideo(studioSessionResources.lastGeneratedVideo)] : []
  );
  const [previewVideo, setPreviewVideoState] = useState<GeneratedVideo | null>(() =>
    studioSessionResources.lastGeneratedVideo ? toGeneratedVideo(studioSessionResources.lastGeneratedVideo) : null
  );
  const [videosLoading, setVideosLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const browserVideoSupported = isCanvasVideoRecorderSupported();
  const localVideoAvailable = !PUBLIC_WEB_BUILD;
  const voiceReady = audioSourceMode === "upload" ? Boolean(uploadedAudioFile) : Boolean(selectedAudioPath);
  const renderEngineReady = renderEngine === "browser-recorder" ? browserVideoSupported : localVideoAvailable;
  const canGenerateVideo = Boolean(backgroundFile) && !videoLoading && voiceReady && renderEngineReady;

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    savePersistedDraft("videoStudio", {
      audioSourceMode,
      selectedAudioPath,
      renderEngine,
      backgroundType,
      aspectRatio,
      fitMode,
      videoFileName,
      selectedBackgroundMusicPath,
      backgroundMusicEnabled,
      backgroundMusicVolume,
      backgroundMusicLoop,
      backgroundMusicFadeIn,
      backgroundMusicFadeOut,
      youtubeForm: draft.youtubeForm || EMPTY_YOUTUBE_UPLOAD,
    });
  }, [
    audioSourceMode,
    selectedAudioPath,
    renderEngine,
    backgroundType,
    aspectRatio,
    fitMode,
    videoFileName,
    selectedBackgroundMusicPath,
    backgroundMusicEnabled,
    backgroundMusicVolume,
    backgroundMusicLoop,
    backgroundMusicFadeIn,
    backgroundMusicFadeOut,
  ]);

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
    if (!uploadedAudioFile) {
      setUploadedAudioPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(uploadedAudioFile);
    setUploadedAudioPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadedAudioFile]);

  async function requestGenerateVideo() {
    await generateVideo();
  }

  async function loadInitialData() {
    setIsInitializing(true);

    try {
      await Promise.allSettled([loadGeneratedVideos(), loadGeneratedAudio()]);
    } finally {
      setIsInitializing(false);
    }
  }

  async function generateVideo() {
    if (!voiceReady) {
      setMessage(t("voiceStepRequired"));
      return;
    }

    if (!backgroundFile) {
      setMessage(t("videoMissingImage"));
      return;
    }

    setVideoLoading(true);
    setMessage("");
    setResult(null);

    try {
      const selectedAudio = generatedAudio.find((audio) => audio.relativePath === selectedAudioPath) || null;
      const selectedMusic = backgroundMusic.find((music) => music.relativePath === selectedBackgroundMusicPath) || null;

      if (renderEngine === "browser-recorder" && audioSourceMode === "existing" && !selectedAudio?.url) {
        setMessage(t("videoBrowserMissingAudioUrl"));
        return;
      }

      const nextResult = renderEngine === "browser-recorder"
        ? await renderBrowserVideo({
            audioFile: audioSourceMode === "upload" ? uploadedAudioFile || undefined : undefined,
            audioUrl: audioSourceMode === "upload" ? undefined : selectedAudio?.url,
            videoFileName,
            aspectRatio,
            backgroundType,
            fitMode,
            backgroundFile,
            backgroundMusicUrl: backgroundMusicEnabled ? selectedMusic?.url : undefined,
            backgroundMusicVolume: backgroundMusicVolume / 100,
            backgroundMusicLoop,
            backgroundMusicFadeIn,
            backgroundMusicFadeOut,
          })
        : await generateVideoFromAudio({
            audioFile: audioSourceMode === "upload" ? uploadedAudioFile || undefined : undefined,
            audioRelativePath: audioSourceMode === "upload" ? undefined : selectedAudioPath,
            videoFileName,
            aspectRatio,
            backgroundType,
            fitMode,
            backgroundFile,
            backgroundMusicRelativePath: backgroundMusicEnabled ? selectedBackgroundMusicPath : undefined,
            backgroundMusicVolume: backgroundMusicVolume / 100,
            backgroundMusicLoop,
            backgroundMusicFadeIn,
            backgroundMusicFadeOut,
          });

      setResult(nextResult);
      const nextPreviewVideo: GeneratedVideo = {
        fileName: nextResult.video.fileName,
        relativePath: nextResult.video.relativePath,
        videoUrl: nextResult.video.videoUrl,
        sizeBytes: 0,
        createdAtMs: Date.now(),
      };
      studioSessionResources.lastGeneratedVideo = {
        fileName: nextPreviewVideo.fileName,
        relativePath: nextPreviewVideo.relativePath,
        url: nextPreviewVideo.videoUrl,
        sizeBytes: nextPreviewVideo.sizeBytes,
        createdAtMs: nextPreviewVideo.createdAtMs,
      };
      setPreviewVideoState(nextPreviewVideo);
      setGeneratedVideos((current) => [
        nextPreviewVideo,
        ...current.filter((video) => video.relativePath !== nextPreviewVideo.relativePath),
      ]);
      setMessage(t("videoGenerateSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("videoGenerateFailure"));
    } finally {
      setVideoLoading(false);
    }
  }

  async function loadGeneratedVideos() {
    setVideosLoading(true);

    try {
      const videos = await getGeneratedVideos();
      const sessionVideo = studioSessionResources.lastGeneratedVideo ? toGeneratedVideo(studioSessionResources.lastGeneratedVideo) : null;
      const mergedVideos = sessionVideo
        ? [sessionVideo, ...videos.filter((video) => video.relativePath !== sessionVideo.relativePath)]
        : videos;
      setGeneratedVideos(mergedVideos);
      setPreviewVideoState((current) => current || sessionVideo || mergedVideos[0] || null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("videoGeneratedListFailure"));
    } finally {
      setVideosLoading(false);
    }
  }

  async function loadGeneratedAudio() {
    try {
      const overview = await getResourceOverview();
      const lastTtsAudio = studioSessionResources.lastTtsAudio ? toGeneratedAudioResource(studioSessionResources.lastTtsAudio) : null;
      const mergedAudio = lastTtsAudio
        ? [lastTtsAudio, ...overview.audio.filter((audio) => audio.relativePath !== lastTtsAudio.relativePath)]
        : overview.audio;
      setGeneratedAudio(mergedAudio);
      setBackgroundMusic(overview.music);
      setSelectedAudioPath((current) => current || lastTtsAudio?.relativePath || mergedAudio[0]?.relativePath || "");
      setSelectedBackgroundMusicPath((current) => current || overview.music[0]?.relativePath || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("resourceLoadFailure"));
    }
  }


  async function uploadBackgroundMusic(file: File) {
    setBackgroundMusicUploading(true);
    setMessage("");

    try {
      const resource = await uploadBackgroundMusicResource(file);
      setBackgroundMusic((current) => [resource, ...current.filter((item) => item.relativePath !== resource.relativePath)]);
      setSelectedBackgroundMusicPath(resource.relativePath);
      setBackgroundMusicEnabled(true);
      setMessage(t("backgroundMusicUploaded"));
      return resource;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("backgroundMusicUploadFailure"));
      throw error;
    } finally {
      setBackgroundMusicUploading(false);
    }
  }

  function updateBackgroundFile(nextFile: File | null) {
    videoStudioSessionFiles.backgroundFile = nextFile;
    setBackgroundFileState(nextFile);
  }

  function updateUploadedAudioFile(nextFile: File | null) {
    videoStudioSessionFiles.uploadedAudioFile = nextFile;
    setUploadedAudioFileState(nextFile);
  }

  function updateAudioSourceMode(nextMode: VideoAudioSourceMode) {
    setAudioSourceMode(nextMode);
    setMessage("");
  }

  function updatePreviewVideo(nextVideo: GeneratedVideo | null) {
    setPreviewVideoState(nextVideo);
    studioSessionResources.lastGeneratedVideo = nextVideo
      ? {
          fileName: nextVideo.fileName,
          relativePath: nextVideo.relativePath,
          url: nextVideo.videoUrl,
          sizeBytes: nextVideo.sizeBytes,
          createdAtMs: nextVideo.createdAtMs,
        }
      : null;
  }

  return {
    aspectRatio,
    audioSourceMode,
    backgroundFile,
    backgroundMusic,
    backgroundMusicEnabled,
    backgroundMusicFadeIn,
    backgroundMusicFadeOut,
    backgroundMusicLoop,
    backgroundMusicUploading,
    backgroundMusicVolume,
    backgroundPreviewUrl,
    backgroundType,
    canGenerateVideo,
    fitMode,
    browserVideoSupported,
    generateVideo,
    generatedAudio,
    generatedVideos,
    isInitializing,
    localVideoAvailable,
    loading: videoLoading,
    message,
    previewVideo,
    requestGenerateVideo,
    renderEngine,
    result,
    selectedAudioPath,
    selectedBackgroundMusicPath,
    setAspectRatio,
    setAudioSourceMode: updateAudioSourceMode,
    setBackgroundFile: updateBackgroundFile,
    setBackgroundMusicEnabled,
    setBackgroundMusicFadeIn,
    setBackgroundMusicFadeOut,
    setBackgroundMusicLoop,
    setBackgroundMusicVolume,
    setBackgroundType,
    setFitMode,
    setMessage,
    setRenderEngine,
    setPreviewVideo: updatePreviewVideo,
    setSelectedAudioPath,
    setSelectedBackgroundMusicPath,
    setUploadedAudioFile: updateUploadedAudioFile,
    setVideoFileName,
    uploadedAudioFile,
    uploadedAudioPreviewUrl,
    uploadBackgroundMusic,
    videoFileName,
    videoLoading,
    videosLoading,
    voiceReady,
    refreshGeneratedVideos: loadGeneratedVideos,
    refreshGeneratedAudio: loadGeneratedAudio,
  };
}


function normalizePercentDraft(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, parsed));
}

function normalizeSecondsDraft(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(30, Math.max(0, parsed));
}

function toGeneratedAudioResource(resource: NonNullable<typeof studioSessionResources.lastTtsAudio>): GeneratedResource {
  return {
    kind: "audio",
    fileName: resource.fileName,
    relativePath: resource.relativePath,
    url: resource.url,
    sizeBytes: resource.sizeBytes || 0,
    createdAtMs: resource.createdAtMs || Date.now(),
  };
}

function toGeneratedVideo(resource: NonNullable<typeof studioSessionResources.lastGeneratedVideo>): GeneratedVideo {
  return {
    fileName: resource.fileName,
    relativePath: resource.relativePath,
    videoUrl: resource.url,
    sizeBytes: resource.sizeBytes || 0,
    createdAtMs: resource.createdAtMs || Date.now(),
  };
}
