import { useEffect, useState } from "react";
import {
  exchangeYoutubeCode,
  getYoutubeAuthUrl,
  getYoutubeConfig,
  getYoutubePlaylists,
  type YoutubePlaylist,
  uploadGeneratedYoutubeVideo,
  uploadYoutubeVideo,
  type YoutubeConfigStatus,
  type YoutubeUploadResult,
} from "../api/youtubeApi";
import { EMPTY_YOUTUBE_UPLOAD } from "../constants/youtubeDefaults";
import { useI18n } from "../i18n";
import { buildYoutubeUploadFormData } from "../utils/youtubeFormData";
import { readPersistedDraft, savePersistedDraft } from "../utils/persistedDrafts";
import { studioSessionResources, youtubeUploadSessionFiles } from "../utils/sessionFileMemory";

const REFRESH_TOKEN_STORAGE_KEY = "piper.youtube.refreshToken";

type YoutubeUploadPersistedDraft = {
  uploadForm: typeof EMPTY_YOUTUBE_UPLOAD;
};

export function useYoutubeUpload() {
  const { t } = useI18n();
  const draft = readPersistedDraft<YoutubeUploadPersistedDraft>("youtubeUpload");
  const [configStatus, setConfigStatus] = useState<YoutubeConfigStatus | null>(null);
  const [uploadForm, setUploadForm] = useState(() => ({
    ...EMPTY_YOUTUBE_UPLOAD,
    ...(typeof draft.uploadForm === "object" && draft.uploadForm ? draft.uploadForm : {}),
  }));
  const [videoFile, setVideoFileState] = useState<File | null>(() => youtubeUploadSessionFiles.videoFile);
  const [generatedVideo, setGeneratedVideo] = useState(() => studioSessionResources.lastGeneratedVideo);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlists, setPlaylists] = useState<YoutubePlaylist[]>([]);
  const [uploadResult, setUploadResult] = useState<YoutubeUploadResult | null>(null);
  const [refreshToken, setRefreshToken] = useState("");

  useEffect(() => {
    void bootstrapYoutubePage();
  }, []);


  useEffect(() => {
    savePersistedDraft("youtubeUpload", { uploadForm });
  }, [uploadForm]);

  async function bootstrapYoutubePage() {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || "";
    setRefreshToken(storedRefreshToken);

    try {
      await Promise.allSettled([
        loadConfig(),
        storedRefreshToken ? loadPlaylists(storedRefreshToken) : Promise.resolve(),
        exchangeCodeFromRedirect(),
      ]);
    } finally {
      setIsInitializing(false);
    }
  }

  async function loadConfig() {
    try {
      const status = await getYoutubeConfig();
      applyConfigStatus(status);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("youtubeConfigError"));
    }
  }

  async function createAuthUrl() {
    setLoading(true);
    setMessage("");

    try {
      const url = await getYoutubeAuthUrl(getCurrentRedirectUri());
      window.location.href = url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("youtubeAuthUrlError"));
    } finally {
      setLoading(false);
    }
  }

  async function exchangeCodeFromRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      return;
    }

    setLoading(true);
    setMessage(t("youtubeCompletingAuth"));

    try {
      const result = await exchangeYoutubeCode(code, getCurrentRedirectUri());

      if (!result.refreshToken) {
        setMessage(t("youtubeMissingRefreshToken"));
        return;
      }

      setRefreshToken(result.refreshToken);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.refreshToken);
      await loadPlaylists(result.refreshToken);
      setMessage(t("youtubeAuthSuccess"));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("youtubeCodeExchangeError"));
    } finally {
      setLoading(false);
    }
  }

  async function upload() {
    if (!videoFile && !generatedVideo?.relativePath) {
      setMessage(t("youtubeMissingVideo"));
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadResult(null);

    try {
      const result = videoFile
        ? await uploadYoutubeVideo(buildYoutubeUploadFormData({ uploadForm, videoFile, refreshToken }))
        : await uploadGeneratedYoutubeVideo({
            ...uploadForm,
            fileName: generatedVideo?.fileName || "generated-video.mp4",
            publishAt: toUtcIsoString(uploadForm.publishAt),
            refreshToken,
            videoUrl: generatedVideo?.url || "",
          });
      setUploadResult(result);
      setMessage(
        result.playlistWarning ? t("youtubeUploadSuccessPlaylistWarning") : t("youtubeUploadSuccess")
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("youtubeUploadFailure"));
    } finally {
      setLoading(false);
    }
  }

  function disconnectYoutube() {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setRefreshToken("");
    setPlaylists([]);
    setUploadResult(null);
    setMessage(t("youtubeDisconnected"));
  }

  async function loadPlaylists(nextRefreshToken = refreshToken) {
    if (!nextRefreshToken) {
      setPlaylists([]);
      return;
    }

    setPlaylistsLoading(true);

    try {
      const nextPlaylists = await getYoutubePlaylists(nextRefreshToken);
      setPlaylists(nextPlaylists);
      setUploadForm((current) =>
        current.playlistId && !nextPlaylists.some((playlist) => playlist.id === current.playlistId)
          ? { ...current, playlistId: "" }
          : current
      );
    } catch (error) {
      setPlaylists([]);
      setMessage(error instanceof Error ? error.message : t("youtubePlaylistLoadFailure"));
    } finally {
      setPlaylistsLoading(false);
    }
  }

  function applyConfigStatus(status: YoutubeConfigStatus) {
    setConfigStatus(status);
    setUploadForm((current) => ({
      ...current,
      title: current.title || status.defaults.title,
      description: current.description || status.defaults.description,
      tags: current.tags || status.defaults.tags,
      categoryId: current.categoryId || status.defaults.categoryId,
      privacyStatus: current.privacyStatus || status.defaults.privacyStatus,
      madeForKids: status.defaults.madeForKids,
      notifySubscribers: status.defaults.notifySubscribers,
      containsSyntheticMedia: status.defaults.containsSyntheticMedia,
    }));
  }

  return {
    configStatus,
    createAuthUrl,
    disconnectYoutube,
    loading,
    isInitializing,
    message,
    hasRefreshToken: Boolean(refreshToken),
    playlists,
    playlistsLoading,
    refreshPlaylists: loadPlaylists,
    refreshToken,
    setUploadForm,
    setVideoFile: updateVideoFile,
    generatedVideo,
    clearGeneratedVideoSelection,
    upload,
    uploadForm,
    uploadResult,
    videoFile,
  };
  function updateVideoFile(nextFile: File | null) {
    youtubeUploadSessionFiles.videoFile = nextFile;
    setVideoFileState(nextFile);
    if (nextFile) {
      setGeneratedVideo(null);
    }
  }

  function clearGeneratedVideoSelection() {
    studioSessionResources.lastGeneratedVideo = null;
    setGeneratedVideo(null);
  }
}

function getCurrentRedirectUri(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/youtube`;
}

function toUtcIsoString(value: string): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}
