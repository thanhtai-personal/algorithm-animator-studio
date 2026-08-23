import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { mediaText } from "../mediaI18n";
import { parseLyrics } from "../lib/lyrics";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";

async function validateImage(url: string) {
  const image = new Image();
  image.src = url;
  if (typeof image.decode === "function") await image.decode();
  else await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
  });
}

export function useRhythmicMediaActions(store: RhythmicStudioStore) {
  const lang = useSystemLang();
  const backgroundRef = useRef<string | null>(store.backgroundUrl);

  const replaceBackground = useCallback((url: string | null, name: string | null) => {
    if (backgroundRef.current) URL.revokeObjectURL(backgroundRef.current);
    backgroundRef.current = url;
    store.setBackground(url, name);
  }, [store]);

  useEffect(() => () => {
    if (backgroundRef.current) URL.revokeObjectURL(backgroundRef.current);
  }, []);

  useEffect(() => {
    if (store.lyricFormat !== "plain" || !store.lyricRaw.trim()) return;
    const parsed = parseLyrics(store.lyricRaw, store.durationMs);
    store.setLyrics(store.lyricRaw, parsed.cues, parsed.format);
  }, [store, store.durationMs, store.lyricFormat, store.lyricRaw]);

  const importBackground = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      await validateImage(url);
      replaceBackground(url, file.name);
      toast.success(mediaText(lang, "background.imported"));
    } catch {
      URL.revokeObjectURL(url);
      toast.error(mediaText(lang, "background.readError"));
    }
  }, [lang, replaceBackground]);

  const clearBackground = useCallback(() => replaceBackground(null, null), [replaceBackground]);

  const applyLyricsFromText = useCallback((raw: string) => {
    const parsed = parseLyrics(raw, store.durationMs);
    store.setLyrics(raw, parsed.cues, parsed.cues.length ? parsed.format : null);
    if (parsed.cues.length) store.patch("lyricsEnabled", true);
    return parsed;
  }, [store]);

  const applyLyrics = useCallback(() => {
    const parsed = applyLyricsFromText(store.lyricRaw);
    if (parsed.cues.length) toast.success(mediaText(lang, "lyrics.applied"));
  }, [applyLyricsFromText, lang, store.lyricRaw]);

  const importLyrics = useCallback(async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = applyLyricsFromText(raw);
      if (!parsed.cues.length) throw new Error("EMPTY_LYRICS");
      toast.success(mediaText(lang, "lyrics.imported"));
    } catch {
      toast.error(mediaText(lang, "lyrics.readError"));
    }
  }, [applyLyricsFromText, lang]);

  const clearLyrics = useCallback(() => {
    store.setLyrics("", [], null);
    store.patch("lyricsEnabled", false);
  }, [store]);

  return { importBackground, clearBackground, importLyrics, applyLyrics, clearLyrics };
}
