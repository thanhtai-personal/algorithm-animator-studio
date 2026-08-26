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

  const revokeOwnedUrls = useCallback(() => {
    ownedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrlsRef.current = [];
  }, []);

  useEffect(() => () => revokeOwnedUrls(), [revokeOwnedUrls]);

  const setElementTrack = useCallback((track: MarbleTowerPlaylistTrack | null, autoPlay: boolean) => {
    const audio = studio.audioElementRef.current;
    if (!audio || !track) return;
    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
    }
    audio.currentTime = 0;
    audio.playbackRate = studio.settings.playbackSpeed;
    if (autoPlay && studio.playing) void audio.play().catch(() => undefined);
  }, [studio.audioElementRef, studio.playing, studio.settings.playbackSpeed]);

  const clearTracks = useCallback(() => {
    const audio = studio.audioElementRef.current;
    audio?.pause();
    if (audio) audio.removeAttribute("src");
    revokeOwnedUrls();
    setTracks([]);
    setCurrentIndex(0);
  }, [revokeOwnedUrls, studio.audioElementRef]);

  const replaceTracks = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const audio = studio.audioElementRef.current;
    audio?.pause();
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
    // This screen no longer exposes the original-song toggle, so make audio
    // playback explicit whenever the user selects a playlist.
    studio.patch("playOriginalSong", true);
    await studio.importAudio(files[0]);
    studio.patch("playOriginalSong", true);
    setElementTrack(nextTracks[0], false);
  }, [revokeOwnedUrls, setElementTrack, studio]);

  const currentTrack = tracks[currentIndex] ?? null;

  useEffect(() => {
    if (!currentTrack) return;
    setElementTrack(currentTrack, studio.playing);
  }, [currentTrack, setElementTrack, studio.playing]);

  useEffect(() => {
    const audio = studio.audioElementRef.current;
    if (audio) audio.playbackRate = studio.settings.playbackSpeed;
  }, [studio.audioElementRef, studio.settings.playbackSpeed]);

  const advance = useCallback(() => {
    if (!tracks.length || !studio.playing) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentIndex(nextIndex);
    setElementTrack(tracks[nextIndex], true);
  }, [currentIndex, setElementTrack, studio.playing, tracks]);

  const selectTrack = useCallback((index: number) => {
    if (!tracks.length) return;
    const nextIndex = Math.max(0, Math.min(index, tracks.length - 1));
    setCurrentIndex(nextIndex);
    setElementTrack(tracks[nextIndex], false);
  }, [setElementTrack, tracks]);

  const resetToFirst = useCallback(() => {
    setCurrentIndex(0);
    setElementTrack(tracks[0] ?? null, false);
  }, [setElementTrack, tracks]);

  const names = useMemo(() => tracks.map((track) => track.name), [tracks]);

  return {
    tracks,
    names,
    currentIndex,
    currentTrack,
    replaceTracks,
    clearTracks,
    selectTrack,
    advance,
    resetToFirst,
  };
}
