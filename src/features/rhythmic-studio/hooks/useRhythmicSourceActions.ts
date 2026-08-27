import { useCallback } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "../defaults";
import { rhythmicText } from "../i18n";
import { analyzeAudioFile } from "../lib/audioAnalysis";
import { parseMidi } from "../lib/midiParser";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";
import { referenceEventsForImportedAudio } from "../lib/referenceAudio";
import type { LoadBuiltinOptions } from "./useRhythmicPresetActions";

function prettyBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useRhythmicSourceActions(store: RhythmicStudioStore, stopPlaybackAudio: () => void) {
  const lang = useSystemLang();

  const replaceAudioUrl = useCallback((next: string | null) => {
    if (store.audioUrl) URL.revokeObjectURL(store.audioUrl);
    store.setAudioUrl(next);
  }, [store]);

  const loadBuiltin = useCallback((name: string, options: LoadBuiltinOptions = {}) => {
    const events = BUILTIN_MELODIES[name];
    if (!events) return;
    stopPlaybackAudio();
    const preserveAudio = options.preserveAudio && store.source.type === "audio" && store.audioUrl;
    if (!preserveAudio) replaceAudioUrl(null);
    const lastEvent = events.at(-1);
    const durationMs = lastEvent ? lastEvent.timeMs + lastEvent.durationMs : 0;
    const source = preserveAudio
      ? { ...store.source, eventCount: events.length }
      : { type: "builtin" as const, name, durationMs, eventCount: events.length };
    const info = preserveAudio ? store.audioInfoToken : { key: "info.builtin" as const };
    store.setSource(events, source, info, preserveAudio || null);
    store.setStatus({ key: "status.loaded", values: { name } });
  }, [replaceAudioUrl, stopPlaybackAudio, store]);

  const importMidi = useCallback(async (file: File) => {
    try {
      const events = parseMidi(await file.arrayBuffer());
      if (!events.length) throw new Error("NO_NOTE_EVENTS");
      stopPlaybackAudio();
      replaceAudioUrl(null);
      const lastEvent = events.at(-1);
      const durationMs = lastEvent ? lastEvent.timeMs + lastEvent.durationMs : 0;
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
      const { buffer, events: detectedEvents } = await analyzeAudioFile(file);
      stopPlaybackAudio();
      const url = URL.createObjectURL(file);
      replaceAudioUrl(url);
      const durationMs = buffer.duration * 1000;
      const events = referenceEventsForImportedAudio({
        activePresetId: store.activePresetId,
        fileName: file.name,
        durationMs,
      }) ?? detectedEvents;
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
