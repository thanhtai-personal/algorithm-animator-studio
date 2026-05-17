import { useEffect, useState } from "react";
import {
  deleteResource,
  getResourceOverview,
  uploadBackgroundMusicResource,
  openResourceFolder,
  type GeneratedResource,
  type GeneratedResourceKind,
  type YoutubeUploadHistoryItem,
} from "../api/resourceApi";
import { useI18n } from "../i18n";

export type ResourceTab = "audio" | "video" | "music" | "uploads";

export function useResources() {
  const { t } = useI18n();
  const [audio, setAudio] = useState<GeneratedResource[]>([]);
  const [video, setVideo] = useState<GeneratedResource[]>([]);
  const [music, setMusic] = useState<GeneratedResource[]>([]);
  const [uploads, setUploads] = useState<YoutubeUploadHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<ResourceTab>("audio");
  const [activeAudioPath, setActiveAudioPath] = useState("");
  const [activeVideoPath, setActiveVideoPath] = useState("");
  const [activeMusicPath, setActiveMusicPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);
    setMessage("");

    try {
      const overview = await getResourceOverview();
      setAudio(overview.audio);
      setVideo(overview.video);
      setMusic(overview.music);
      setUploads(overview.uploads);
      setActiveAudioPath((current) => current || overview.audio[0]?.relativePath || "");
      setActiveVideoPath((current) => current || overview.video[0]?.relativePath || "");
      setActiveMusicPath((current) => current || overview.music[0]?.relativePath || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("resourceLoadFailure"));
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  }

  async function openFolder(kind: GeneratedResourceKind, relativePath: string) {
    setMessage("");

    try {
      await openResourceFolder({ kind, relativePath });
      setMessage(t("resourceFolderOpened"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("resourceOpenFolderFailure"));
    }
  }

  async function removeResources(kind: GeneratedResourceKind, relativePaths: string[]) {
    setMessage("");

    try {
      await Promise.all(relativePaths.map((relativePath) => deleteResource({ kind, relativePath })));
      setMessage(t("resourceDeleteSuccess"));
      if (kind === "audio") {
        setActiveAudioPath("");
      } else if (kind === "video") {
        setActiveVideoPath("");
      } else {
        setActiveMusicPath("");
      }
      await loadResources();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("resourceDeleteFailure"));
    }
  }


  async function uploadBackgroundMusic(file: File) {
    setMessage("");

    try {
      const resource = await uploadBackgroundMusicResource(file);
      setMusic((current) => [resource, ...current.filter((item) => item.relativePath !== resource.relativePath)]);
      setActiveMusicPath(resource.relativePath);
      setActiveTab("music");
      setMessage(t("backgroundMusicUploaded"));
      await loadResources();
      return resource;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("backgroundMusicUploadFailure"));
      throw error;
    }
  }

  return {
    activeAudioPath,
    activeTab,
    activeVideoPath,
    activeMusicPath,
    audio,
    loading,
    isInitializing,
    message,
    music,
    openFolder,
    refresh: loadResources,
    removeResources,
    setActiveAudioPath,
    setActiveTab,
    setActiveVideoPath,
    setActiveMusicPath,
    uploads,
    uploadBackgroundMusic,
    video,
  };
}
