import { useEffect, useState } from "react";
import { toast } from "sonner";
import { audioEngine, type SfxKind } from "@/lib/audio";
import { type BackgroundMusicId, getAssetMusicOption, isAssetMusicId, isLibraryMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";
import { preloadExportSfx } from "./videoExport";

type MusicParams = {
  activeMusicPreset: BackgroundMusicId;
  playing: boolean;
  sfxCompare: SfxKind;
  sfxSwap: SfxKind;
  sfxVol: number;
  musicVol: number;
  requireConfigAccess: () => boolean;
};

export function useAlgorithmStudioMusic(params: MusicParams) {
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [libraryMusicTracks, setLibraryMusicTracks] = useState<MusicLibraryTrack[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadTracks = () => getMusicLibraryTracks()
      .then((tracks) => { if (!cancelled) setLibraryMusicTracks(tracks); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không đọc được MUSIC_LIBRARY_DIR."));
    void loadTracks();
    window.addEventListener("algo:runtime-settings-change", loadTracks);
    return () => {
      cancelled = true;
      window.removeEventListener("algo:runtime-settings-change", loadTracks);
    };
  }, []);

  useEffect(() => { audioEngine.setSfxVolume(params.sfxVol / 100); }, [params.sfxVol]);
  useEffect(() => { audioEngine.setMusicVolume(params.musicVol / 100); }, [params.musicVol]);
  useEffect(() => { void preloadExportSfx(params.sfxCompare); }, [params.sfxCompare]);
  useEffect(() => { void preloadExportSfx(params.sfxSwap); }, [params.sfxSwap]);
  useEffect(() => {
    let cancelled = false;
    if (isAssetMusicId(params.activeMusicPreset)) {
      const option = getAssetMusicOption(params.activeMusicPreset);
      if (!option) return;
      void option.loadUrl().then((url) => {
        if (cancelled) return;
        audioEngine.setMusicSource(url);
        if (params.playing) {
          audioEngine.setMusicPreset("custom");
          audioEngine.startMusic();
        }
      });
    } else if (isLibraryMusicId(params.activeMusicPreset)) {
      const track = libraryMusicTracks.find((item) => item.id === params.activeMusicPreset);
      audioEngine.setMusicSource(track?.audioUrl ?? null);
      if (track && params.playing) {
        audioEngine.setMusicPreset("custom");
        audioEngine.startMusic();
      }
    } else if (params.activeMusicPreset === "custom") {
      audioEngine.setMusicSource(musicUrl);
      if (params.playing) {
        audioEngine.setMusicPreset("custom");
        audioEngine.startMusic();
      }
    } else {
      audioEngine.setMusicSource(null);
    }
    return () => { cancelled = true; };
  }, [params.activeMusicPreset, musicUrl, params.playing, libraryMusicTracks]);
  useEffect(() => {
    if (!params.playing) {
      audioEngine.stopMusic();
      return;
    }
    audioEngine.resume();
    audioEngine.setMusicPreset(isProceduralMusicPreset(params.activeMusicPreset) ? params.activeMusicPreset : "custom");
    audioEngine.startMusic();
  }, [params.activeMusicPreset, params.playing]);

  const onMusicUpload = (file: File) => {
    if (!params.requireConfigAccess()) return;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicUrl(URL.createObjectURL(file));
  };

  async function resolveMusicUrl(preset: BackgroundMusicId) {
    if (isAssetMusicId(preset)) return getAssetMusicOption(preset)?.loadUrl();
    if (isLibraryMusicId(preset)) return libraryMusicTracks.find((track) => track.id === preset)?.audioUrl ?? null;
    if (preset === "custom") return musicUrl;
    return null;
  }

  return { libraryMusicTracks, onMusicUpload, resolveMusicUrl };
}
