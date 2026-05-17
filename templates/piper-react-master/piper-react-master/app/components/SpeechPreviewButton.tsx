import { useEffect, useRef, useState } from "react";
import { previewAudio } from "../api/ttsApi";
import { useI18n } from "../i18n";
import { AppIcon } from "./AppHeader";

type SpeechPreviewButtonProps = {
  text: string;
  modelKey?: string;
  sentenceSilence: number;
  speechRate?: number;
  disabled?: boolean;
  disabledMessage?: string;
};

const PREVIEW_WORD_LIMIT = 350;

export function SpeechPreviewButton({
  text,
  modelKey,
  sentenceSilence,
  speechRate = 0.85,
  disabled = false,
  disabledMessage,
}: SpeechPreviewButtonProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onEnded = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  async function preview() {
    setMessage("");

    if (disabled) {
      setMessage(disabledMessage || t("piperPreviewUnavailable"));
      return;
    }

    const previewText = limitTextWords(text, PREVIEW_WORD_LIMIT);
    if (!previewText) {
      setMessage(t("speechPreviewEmpty"));
      return;
    }

    if (!modelKey) {
      setMessage(t("piperPreviewModelRequired"));
      return;
    }

    setLoading(true);
    setPlaying(false);

    try {
      const data = await previewAudio({
        text: previewText,
        modelKey,
        sentenceSilence,
        speechRate,
        fileName: "piper-preview",
      });
      setAudioUrl(`${data.audioUrl}?t=${Date.now()}`);
      setWordCount(data.wordCount || countWords(previewText));
      setMessage(t("piperPreviewReady", { count: data.wordCount || countWords(previewText) }));
      window.setTimeout(() => {
        void audioRef.current?.play().catch(() => undefined);
      }, 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("speechPreviewFailure"));
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
  }

  return (
    <div className="speechPreviewActions">
      <button type="button" className="btn-ghost" onClick={preview} disabled={loading || playing}>
        <AppIcon name="play" className="size-4" />
        {loading ? t("piperPreviewGenerating") : playing ? t("speechPreviewPlaying") : t("speechPreviewButton")}
      </button>
      <button type="button" className="btn-ghost" onClick={stop} disabled={!playing && !audioUrl}>
        {t("speechPreviewStop")}
      </button>
      {audioUrl ? (
        <audio ref={audioRef} src={audioUrl} controls preload="metadata" />
      ) : null}
      {message ? <small>{message}</small> : null}
      {wordCount >= PREVIEW_WORD_LIMIT ? <small>{t("piperPreviewLimitNote")}</small> : null}
    </div>
  );
}

function limitTextWords(text: string, maxWords: number): string {
  const lines: string[] = [];
  let remaining = maxWords;

  for (const line of text.split(/\r?\n/)) {
    if (remaining <= 0) {
      break;
    }

    const words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      continue;
    }

    lines.push(words.slice(0, remaining).join(" "));
    remaining -= words.length;
  }

  return lines.join("\n");
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}
