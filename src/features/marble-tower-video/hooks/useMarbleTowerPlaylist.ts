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

  const setElementTrack = useCallback((track: MarbleTowerPlaylistTrack | null) => {
    const audio = studio.audioElementRef.current;
    if (!audio || !track) return;
    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
    }
    audio.currentTime = 0;
    audio.playbackRate = studio.settings.playbackSpeed;
  }, [studio.audioElementRef, studio.settings.playbackSpeed]);

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
    await studio.importAudio(files[0]);
    // The race screen controls exactly when music begins; keep the audio source
    // ready but silent during 3-2-1 and the spoken "Let's go!" cue.
    studio.patch("playOriginalSong", false);
    setElementTrack(nextTracks[0]);
  }, [revokeOwnedUrls, setElementTrack, studio]);

  const currentTrack = tracks[currentIndex] ?? null;

  useEffect(() => {
    if (currentTrack) setElementTrack(currentTrack);
  }, [currentTrack, setElementTrack]);

  useEffect(() => {
    const audio = studio.audioElementRef.current;
    if (audio) audio.playbackRate = studio.settings.playbackSpeed;
  }, [studio.audioElementRef, studio.settings.playbackSpeed]);

  const advance = useCallback(() => {
    if (!tracks.length || !studio.playing || !studio.settings.playOriginalSong) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    setCurrentIndex(nextIndex);
    setElementTrack(nextTrack);
    const audio = studio.audioElementRef.current;
    if (audio) void audio.play().catch(() => undefined);
  }, [currentIndex, setElementTrack, studio.audioElementRef, studio.playing, studio.settings.playOriginalSong, tracks]);

  const selectTrack = useCallback((index: number) => {
    if (!tracks.length) return;
    const nextIndex = Math.max(0, Math.min(index, tracks.length - 1));
    setCurrentIndex(nextIndex);
    setElementTrack(tracks[nextIndex]);
  }, [setElementTrack, tracks]);

  const resetToFirst = useCallback(() => {
    setCurrentIndex(0);
    setElementTrack(tracks[0] ?? null);
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
