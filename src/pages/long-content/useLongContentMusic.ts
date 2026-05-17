import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ASSET_MUSIC_OPTIONS, type BackgroundMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { MUSIC_PRESETS, type Lang } from "@/lib/i18n";
import { getMusicLibraryTracks } from "@/lib/musicLibrary";

const PAGE_SIZE = 12;

export type MusicCardTrack = {
  id: BackgroundMusicId;
  title: string;
  subtitle: string;
  licenseText?: string;
  loadUrl?: () => Promise<string>;
};

export function useLongContentMusic(lang: Lang, customUrl: string | null) {
  const [libraryTracks, setLibraryTracks] = useState<MusicCardTrack[]>([]);
  const [selectedIds, setSelectedIds] = useState<BackgroundMusicId[]>(["off"]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getMusicLibraryTracks()
      .then((tracks) => {
        if (!cancelled) setLibraryTracks(tracks.map((track) => ({
          id: track.id,
          title: track.title,
          subtitle: track.licenseText ? "Thư viện ngoài · có License" : "Thư viện ngoài",
          licenseText: track.licenseText,
          loadUrl: () => Promise.resolve(track.audioUrl),
        })));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không đọc được thư viện nhạc nền."));
    return () => { cancelled = true; };
  }, []);

  const tracks = useMemo<MusicCardTrack[]>(() => [
    ...MUSIC_PRESETS.filter((item) => item.id !== "custom").map((item) => ({
      id: item.id,
      title: item.label[lang],
      subtitle: item.id === "off" ? "Không dùng nhạc nền" : "Preset tạo sẵn",
    })),
    ...ASSET_MUSIC_OPTIONS.map((track) => ({
      id: track.id,
      title: track.label[lang],
      subtitle: "Track có sẵn",
      loadUrl: track.loadUrl,
    })),
    ...(customUrl ? [{ id: "custom" as BackgroundMusicId, title: "Nhạc đã upload", subtitle: "Custom upload", loadUrl: () => Promise.resolve(customUrl) }] : []),
    ...libraryTracks,
  ], [customUrl, lang, libraryTracks]);

  const selectedTracks = useMemo(() => selectedIds
    .map((id) => tracks.find((track) => track.id === id))
    .filter((track): track is MusicCardTrack => Boolean(track)), [selectedIds, tracks]);
  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? tracks.filter((track) => `${track.title} ${track.subtitle}`.toLowerCase().includes(query)) : tracks;
  }, [search, tracks]);
  const visibleTracks = filteredTracks.slice(0, visibleCount);
  const selectedLicenseText = selectedTracks.map((track) => track.licenseText).filter(Boolean).join("\n\n");

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(selectedTracks.filter((track) => track.loadUrl).map((track) => track.loadUrl!()))
      .then((urls) => { if (!cancelled) setSelectedUrls(urls); })
      .catch(() => { if (!cancelled) setSelectedUrls([]); });
    return () => { cancelled = true; };
  }, [selectedTracks]);

  function toggleTrack(id: BackgroundMusicId) {
    setSelectedIds((current) => {
      if (isProceduralMusicPreset(id)) return id === "off" ? ["off"] : [id];
      const withoutPreset = current.filter((item) => !isProceduralMusicPreset(item));
      const exists = withoutPreset.includes(id);
      const next = exists ? withoutPreset.filter((item) => item !== id) : [...withoutPreset, id];
      return next.length ? next : ["off"];
    });
  }

  return { tracks, visibleTracks, selectedIds, selectedTracks, selectedUrls, selectedLicenseText, search, setSearch, toggleTrack, setSelectedIds, canLoadMore: visibleCount < filteredTracks.length, loadMore: () => setVisibleCount((count) => count + PAGE_SIZE) };
}
