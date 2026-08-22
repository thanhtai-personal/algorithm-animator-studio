import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { mediaText } from "./mediaI18n";
import { parseLyrics, type LyricFormat } from "./lib/lyrics";
import type { LyricCue, StudioSettings } from "./types";

type Patch = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;

async function validateImage(url: string) {
  const image = new Image();
  image.src = url;
  if (typeof image.decode === "function") await image.decode();
  else await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("IMAGE_DECODE_FAILED")); });
}

export function useRhythmicMedia(durationMs: number, patch: Patch) {
  const lang = useSystemLang();
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundName, setBackgroundName] = useState<string | null>(null);
  const backgroundUrlRef = useRef<string | null>(null);
  const [lyricRaw, setLyricRaw] = useState("");
  const [lyrics, setLyrics] = useState<LyricCue[]>([]);
  const [lyricFormat, setLyricFormat] = useState<LyricFormat | null>(null);

  const replaceBackgroundUrl = useCallback((next: string | null) => {
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    backgroundUrlRef.current = next;
    setBackgroundUrl(next);
  }, []);

  useEffect(() => () => {
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
  }, []);

  useEffect(() => {
    if (lyricFormat !== "plain" || !lyricRaw.trim()) return;
    setLyrics(parseLyrics(lyricRaw, durationMs).cues);
  }, [durationMs, lyricFormat, lyricRaw]);

  const importBackground = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      await validateImage(url);
      replaceBackgroundUrl(url);
      setBackgroundName(file.name);
      toast.success(mediaText(lang, "background.imported"));
    } catch {
      URL.revokeObjectURL(url);
      toast.error(mediaText(lang, "background.readError"));
    }
  }, [lang, replaceBackgroundUrl]);

  const clearBackground = useCallback(() => {
    replaceBackgroundUrl(null);
    setBackgroundName(null);
  }, [replaceBackgroundUrl]);

  const applyLyricsFromText = useCallback((raw: string) => {
    const parsed = parseLyrics(raw, durationMs);
    setLyrics(parsed.cues);
    setLyricFormat(parsed.cues.length ? parsed.format : null);
    if (parsed.cues.length) patch("lyricsEnabled", true);
    return parsed;
  }, [durationMs, patch]);

  const applyLyrics = useCallback(() => {
    const parsed = applyLyricsFromText(lyricRaw);
    if (parsed.cues.length) toast.success(mediaText(lang, "lyrics.applied"));
  }, [applyLyricsFromText, lang, lyricRaw]);

  const importLyrics = useCallback(async (file: File) => {
    try {
      const raw = await file.text();
      setLyricRaw(raw);
      const parsed = applyLyricsFromText(raw);
      if (!parsed.cues.length) throw new Error("EMPTY_LYRICS");
      toast.success(mediaText(lang, "lyrics.imported"));
    } catch {
      toast.error(mediaText(lang, "lyrics.readError"));
    }
  }, [applyLyricsFromText, lang]);

  const clearLyrics = useCallback(() => {
    setLyricRaw("");
    setLyrics([]);
    setLyricFormat(null);
    patch("lyricsEnabled", false);
  }, [patch]);

  return {
    backgroundUrl,
    backgroundName,
    importBackground,
    clearBackground,
    lyricRaw,
    setLyricRaw,
    lyrics,
    lyricFormat,
    importLyrics,
    applyLyrics,
    clearLyrics,
  };
}
