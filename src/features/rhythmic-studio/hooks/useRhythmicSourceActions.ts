import { useCallback } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "../defaults";
import { rhythmicText } from "../i18n";
import { analyzeAudioFile } from "../lib/audioAnalysis";
import { parseMidi } from "../lib/midiParser";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";

function prettyBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useRhythmicSourceActions(store: RhythmicStudioStore, stopPlaybackAudio: () => void) {
  const lang = useSystemLang();

  const replaceAudioUrl = useCallback((next: string | null) => {
    if (store.audioUrl) URL.revokeObjectURL(store.audioUrl);
    store.setAudioUrl(next);
  }, [store]);

  const loadBuiltin = useCallback((name: string) => {
    const events = BUILTIN_MELODIES[name];
    if (!events) return;
    stopPlaybackAudio();
    replaceAudioUrl(null);
    const durationMs = events.at(-1)?.timeMs ?? 0;
    store.setSource(events, { type: "builtin", name, durationMs, eventCount: events.length }, { key: "info.builtin" });
    store.setStatus({ key: "status.loaded", values: { name } });
  }, [replaceAudioUrl, stopPlaybackAudio, store]);

  const importMidi = useCallback(async (file: File) => {
    try {
      const events = parseMidi(await file.arrayBuffer());
      if (!events.length) throw new Error("NO_NOTE_EVENTS");
      stopPlaybackAudio();
      replaceAudioUrl(null);
      const durationMs = events.at(-1)?.timeMs ?? 0;
      store.setSource(events, { type: "midi", name: file.name, durationMs, eventCount: events.length }, {
        key: "info.midi", values: { name: file.name, size: prettyBytes(file.size), count: events.length },
      });
      store.setStatus({ key: "status.midiParsed" });
      toast.success(rhythmicText(lang, "toast.midiImported"));
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const message = raw === "NO_NOTE_EVENTS" ? rhythmicText(lang, "error.noMidiNotes") : raw || rhythmicText(lang, "error.unknownMidi");
      store.setStatus({ key: "status.midiError", values: { message } });
      toast.error(message);
    }
  }, [lang, replaceAudioUrl, stopPlaybackAudio, store]);

  const importAudio = useCallback(async (file: File) => {
    store.setStatus({ key: "status.analyzing" });
    try {
      const { buffer, events } = await analyzeAudioFile(file);
      stopPlaybackAudio();
      const url = URL.createObjectURL(file);
      replaceAudioUrl(url);
      const durationMs = buffer.duration * 1000;
      store.setSource(events, { type: "audio", name: file.name, durationMs, eventCount: events.length }, {
        key: "info.audio", values: { name: file.name, size: prettyBytes(file.size), count: events.length },
      }, url);
      store.setStatus({ key: "status.audioAnalyzed" });
      toast.success(rhythmicText(lang, "toast.detectedHits", { count: events.length }));
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : rhythmicText(lang, "error.unknownAudio");
      store.setStatus({ key: "status.audioError", values: { message } });
      toast.error(message);
    }
  }, [lang, replaceAudioUrl, stopPlaybackAudio, store]);

  return { loadBuiltin, importMidi, importAudio };
}
