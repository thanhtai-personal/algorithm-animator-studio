import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  importPresetVideoSource,
  importPresetVideoSources,
  preparePresetVideoMedia,
  type PresetVideoImportSource,
} from "../lib/presetVideoApi";
import type {
  PresetVideoDefinition,
  PresetVideoSourceClip,
  PresetVideoTimelineClip,
} from "../types";

const MAX_EAGER_PRELOAD_SOURCES = 8;
const MAX_SINGLE_PRELOAD_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_PRELOAD_BYTES = 256 * 1024 * 1024;

export function usePresetVideoMedia(
  preset: PresetVideoDefinition,
  timelineVideoClips: readonly PresetVideoTimelineClip[],
) {
  const [videoSourceUrls, setVideoSourceUrls] = useState<Record<string, string>>({});
  const [previewVideoSourceUrls, setPreviewVideoSourceUrls] = useState<Record<string, string>>({});
  const [missingSourceIds, setMissingSourceIds] = useState<string[]>([]);
  const [mediaPreparing, setMediaPreparing] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [uploadingSourceId, setUploadingSourceId] = useState("");
  const [preloadingCount, setPreloadingCount] = useState(0);
  const objectUrlsRef = useRef(new Map<string, { objectUrl: string; bytes: number }>());
  const totalPreloadedBytesRef = useRef(0);

  const sourceSignature = useMemo(
    () => JSON.stringify([
      ...(preset.videoSources || []).map((source) => [source.id, source.clipStartSeconds, source.clipEndSeconds]),
      ...timelineVideoClips.map((clip) => [clip.id, clip.clipStartSeconds, clip.clipEndSeconds]),
    ]),
    [preset.videoSources, timelineVideoClips],
  );

  useEffect(() => {
    setVideoSourceUrls({});
    setPreviewVideoSourceUrls({});
    setMissingSourceIds([]);
    setMediaError("");
    setUploadingSourceId("");
  }, [preset.id]);

  useEffect(() => {
    const hasSources = preset.id === "fashion-claw" || Boolean(preset.videoSources?.length || timelineVideoClips.length);
    if (!hasSources) {
      setVideoSourceUrls({});
      setMissingSourceIds([]);
      setMediaPreparing(false);
      setMediaError("");
      return;
    }

    let alive = true;
    setMediaPreparing(true);
    setMediaError("");
    preparePresetVideoMedia(preset, timelineVideoClips)
      .then((media) => {
        if (!alive) return;
        // Still-image source paths are stable across replacement uploads.
        // Bust browser caches when reordering or restoring a Fashion Claw draft.
        setVideoSourceUrls(preset.id === "fashion-claw"
          ? Object.fromEntries(Object.entries(media.videoSourceUrls).map(([id, url]) => [id, appendCacheBust(url)]))
          : media.videoSourceUrls);
        setMissingSourceIds(media.missingSourceIds);
      })
      .catch((error) => {
        if (!alive) return;
        const message = error instanceof Error ? error.message : "Không chuẩn bị được clip video nền.";
        setMediaError(message);
        toast.error(message);
      })
      .finally(() => {
        if (alive) setMediaPreparing(false);
      });

    return () => {
      alive = false;
    };
  }, [preset, sourceSignature]);

  const preloadIds = useMemo(() => {
    const fixedIds = (preset.videoSources || []).map((source) => source.id);
    const customIds = [...timelineVideoClips]
      .sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds)
      .map((clip) => clip.id);
    const demoIds = preset.id === "fashion-claw" ? ["fashion-default-1", "fashion-default-2", "fashion-default-3", "fashion-default-fan"] : [];
    return [...customIds, ...demoIds, ...fixedIds].slice(0, MAX_EAGER_PRELOAD_SOURCES);
  }, [preset.videoSources, timelineVideoClips]);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();
    const currentServerUrls = new Set(Object.values(videoSourceUrls));

    for (const [serverUrl, cached] of objectUrlsRef.current) {
      if (currentServerUrls.has(serverUrl)) continue;
      URL.revokeObjectURL(cached.objectUrl);
      totalPreloadedBytesRef.current -= cached.bytes;
      objectUrlsRef.current.delete(serverUrl);
    }

    const eagerIds = new Set(preloadIds);
    const initialPreviewUrls = Object.fromEntries(
      Object.entries(videoSourceUrls).flatMap(([id, serverUrl]) => {
        const cached = objectUrlsRef.current.get(serverUrl)?.objectUrl;
        if (cached) return [[id, cached]];
        return eagerIds.has(id) ? [] : [[id, serverUrl]];
      }),
    );
    setPreviewVideoSourceUrls(initialPreviewUrls);

    const pending = preloadIds.filter((id) => {
      const serverUrl = videoSourceUrls[id];
      return serverUrl && !objectUrlsRef.current.has(serverUrl);
    });
    setPreloadingCount(pending.length);

    const preload = async () => {
      for (const id of pending) {
        if (cancelled) return;
        const serverUrl = videoSourceUrls[id];
        if (!serverUrl || objectUrlsRef.current.has(serverUrl)) {
          setPreloadingCount((count) => Math.max(0, count - 1));
          continue;
        }

        try {
          const response = await fetch(serverUrl, {
            cache: "force-cache",
            signal: abortController.signal,
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const withinBudget = blob.size <= MAX_SINGLE_PRELOAD_BYTES
            && totalPreloadedBytesRef.current + blob.size <= MAX_TOTAL_PRELOAD_BYTES;
          if (!withinBudget) {
            if (!cancelled) {
              setPreviewVideoSourceUrls((current) => ({ ...current, [id]: serverUrl }));
            }
            continue;
          }
          if (cancelled) continue;

          const objectUrl = URL.createObjectURL(blob);
          objectUrlsRef.current.set(serverUrl, { objectUrl, bytes: blob.size });
          totalPreloadedBytesRef.current += blob.size;
          setPreviewVideoSourceUrls((current) => ({ ...current, [id]: objectUrl }));
        } catch (error) {
          if (!cancelled) {
            console.warn("Preset preview preload failed; using server URL", id, error);
            setPreviewVideoSourceUrls((current) => ({ ...current, [id]: serverUrl }));
          }
        } finally {
          if (!cancelled) setPreloadingCount((count) => Math.max(0, count - 1));
        }
      }
    };

    void preload();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [preloadIds, videoSourceUrls]);

  useEffect(() => () => {
    for (const cached of objectUrlsRef.current.values()) {
      URL.revokeObjectURL(cached.objectUrl);
    }
    objectUrlsRef.current.clear();
    totalPreloadedBytesRef.current = 0;
  }, []);

  function invalidateSource(sourceId: string) {
    setVideoSourceUrls((current) => {
      if (!current[sourceId]) return current;
      const next = { ...current };
      delete next[sourceId];
      return next;
    });
    setPreviewVideoSourceUrls((current) => {
      if (!current[sourceId]) return current;
      const next = { ...current };
      delete next[sourceId];
      return next;
    });
    setMissingSourceIds((current) => current.includes(sourceId) ? current : [...current, sourceId]);
  }

  async function importSource(source: PresetVideoImportSource, file: File) {
    setUploadingSourceId(source.id);
    setMediaError("");
    try {
      const imported = await importPresetVideoSource(preset.id, source, file);
      const videoUrl = appendCacheBust(imported.videoUrl);
      setVideoSourceUrls((current) => ({ ...current, [source.id]: videoUrl }));
      setMissingSourceIds((current) => current.filter((id) => id !== source.id));
      return videoUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Không xử lý được video ${source.id}.`;
      setMediaError(message);
      toast.error(message);
      throw error;
    } finally {
      setUploadingSourceId("");
    }
  }

  async function importSources(sources: readonly PresetVideoSourceClip[], file: File) {
    if (!sources.length) return {};
    setUploadingSourceId(sources[0].id);
    setMediaError("");
    try {
      const imported = await importPresetVideoSources(preset.id, sources, file);
      const urls = Object.fromEntries(
        imported.sources.map((source) => [source.sourceId, appendCacheBust(source.videoUrl)]),
      );
      setVideoSourceUrls((current) => ({ ...current, ...urls }));
      setMissingSourceIds((current) => current.filter((id) => !(id in urls)));
      return urls;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không xử lý được nhóm video nguồn.";
      setMediaError(message);
      toast.error(message);
      throw error;
    } finally {
      setUploadingSourceId("");
    }
  }

  return {
    videoSourceUrls,
    previewVideoSourceUrls,
    missingSourceIds,
    mediaPreparing,
    mediaError,
    uploadingSourceId,
    preloadingCount,
    importSource,
    importSources,
    invalidateSource,
  };
}

function appendCacheBust(url: string) {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}
