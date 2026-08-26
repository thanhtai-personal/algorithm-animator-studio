import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";

export type MarbleTowerPlaylistTrack = {
  id: string;
  name: string;
  url: string;
};

export function useMarbleTowerPlaylist(studio: RhythmicStudioController) {
  const [tracks, setTracks] = useState<MarbleTowerPlaylistTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const ownedUrlsRef = useRef<string[]>([]);
  const shouldAutoPlayRef = useRef(false);

  useEffect(() => {
    shouldAutoPlayRef.current = studio.playing && studio.settings.playOriginalSong;
  }, [studio.playing, studio.settings.playOriginalSong]);

  const revokeOwnedUrls = useCallback(() => {
    ownedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrlsRef.current = [];
  }, []);

  useEffect(() => () => revokeOwnedUrls(), [revokeOwnedUrls]);

  const clearTracks = useCallback(() => {
    revokeOwnedUrls();
    setTracks([]);
    setCurrentIndex(0);
  }, [revokeOwnedUrls]);

  const replaceTracks = useCallback(async (files: File[]) => {
    if (!files.length) return;
    revokeOwnedUrls();
    const nextTracks = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      ownedUrlsRef.current.push(url);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name,
        url,
      };
    });
    setTracks(nextTracks);
    setCurrentIndex(0);
    await studio.importAudio(files[0]);
  }, [revokeOwnedUrls, studio]);

  const currentTrack = tracks[currentIndex] ?? null;
  const audioSrc = currentTrack?.url ?? studio.audioUrl;

  useEffect(() => {
    const audio = studio.audioElementRef.current;
    if (!audio || !currentTrack) return;
    audio.currentTime = 0;
    audio.playbackRate = studio.settings.playbackSpeed;
    if (shouldAutoPlayRef.current) void audio.play().catch(() => undefined);
  }, [currentTrack, studio.audioElementRef, studio.settings.playbackSpeed]);

  useEffect(() => {
    const audio = studio.audioElementRef.current;
    if (audio) audio.playbackRate = studio.settings.playbackSpeed;
  }, [studio.audioElementRef, studio.settings.playbackSpeed]);

  const advance = useCallback(() => {
    if (!tracks.length || !studio.playing) return;
    setCurrentIndex((index) => (index + 1) % tracks.length);
  }, [studio.playing, tracks.length]);

  const selectTrack = useCallback((index: number) => {
    if (!tracks.length) return;
    setCurrentIndex(Math.max(0, Math.min(index, tracks.length - 1)));
  }, [tracks.length]);

  const resetToFirst = useCallback(() => {
    setCurrentIndex(0);
    const audio = studio.audioElementRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (tracks[0] && audio.src !== tracks[0].url) {
      audio.src = tracks[0].url;
      audio.load();
    }
  }, [studio.audioElementRef, tracks]);

  const names = useMemo(() => tracks.map((track) => track.name), [tracks]);

  return {
    tracks,
    names,
    currentIndex,
    currentTrack,
    audioSrc,
    replaceTracks,
    clearTracks,
    selectTrack,
    advance,
    resetToFirst,
  };
}
