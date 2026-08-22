import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { getExportFormat, type ExportFormat } from "@/pages/studio/exportFormats";
import { BUILTIN_MELODIES, DEFAULT_SETTINGS } from "./defaults";
import { melodyLabel, rhythmicText, type RhythmicTextKey } from "./i18n";
import { analyzeAudioFile } from "./lib/audioAnalysis";
import { AudioEngine } from "./lib/audioEngine";
import { parseMidi } from "./lib/midiParser";
import { deleteRhythmicProject, listRhythmicProjects, saveRhythmicProject } from "./lib/projectStorage";
import { buildRhythmicTimeline, timelineDuration } from "./lib/timeline";
import type { AudioSourceMeta, NoteEvent, StoredProject, StudioSettings } from "./types";

type MessageToken = { key: RhythmicTextKey; values?: Record<string, string | number> };

function prettyBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "rhythmic-run";
}

export function useRhythmicStudio() {
  const lang = useSystemLang();
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [sourceEvents, setSourceEvents] = useState<NoteEvent[]>(BUILTIN_MELODIES["Neon Scale"]);
  const [source, setSource] = useState<AudioSourceMeta>({ type: "builtin", name: "Neon Scale", durationMs: 5040, eventCount: 15 });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioInfoToken, setAudioInfoToken] = useState<MessageToken>({ key: "info.builtin" });
  const [playing, setPlaying] = useState(false);
  const [playbackToken, setPlaybackToken] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingFormat, setRecordingFormat] = useState<ExportFormat | null>(null);
  const [statusToken, setStatusToken] = useState<MessageToken>({ key: "status.ready" });
  const [projectName, setProjectName] = useState(() => rhythmicText(lang, "default.projectName"));
  const [projects, setProjects] = useState<StoredProject[]>(() => listRhythmicProjects());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioEngine = useRef(new AudioEngine());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const timeline = useMemo(() => buildRhythmicTimeline(sourceEvents, settings), [sourceEvents, settings]);
  const durationMs = useMemo(() => {
    const sourceEnd = source.durationMs / Math.max(0.1, settings.playbackSpeed) + settings.syncOffsetMs;
    return Math.max(timelineDuration(timeline), sourceEnd, 1000);
  }, [settings.playbackSpeed, settings.syncOffsetMs, source.durationMs, timeline]);
  const status = useMemo(() => {
    const values = statusToken.key === "status.loaded" && statusToken.values?.name
      ? { ...statusToken.values, name: melodyLabel(lang, String(statusToken.values.name)) }
      : statusToken.values;
    return rhythmicText(lang, statusToken.key, values);
  }, [lang, statusToken]);
  const audioFileInfo = useMemo(() => rhythmicText(lang, audioInfoToken.key, audioInfoToken.values), [audioInfoToken, lang]);

  useEffect(() => audioEngine.current.setVolume(settings.synthVolume), [settings.synthVolume]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const patch = useCallback(<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const stopOriginalAudio = useCallback(() => audioElementRef.current?.pause(), []);
  const startOriginalAudio = useCallback(async (resumeMs = 0) => {
    const audio = audioElementRef.current;
    if (!audio || !audioUrl || !settings.playOriginalSong) return;
    audio.currentTime = Math.max(0, ((resumeMs - settings.syncOffsetMs) * settings.playbackSpeed) / 1000);
    audio.playbackRate = settings.playbackSpeed;
    await audioEngine.current.attachOriginalAudio(audio);
    await audio.play();
  }, [audioUrl, settings.playOriginalSong, settings.playbackSpeed, settings.syncOffsetMs]);

  const resetAndPlay = useCallback(async () => {
    await audioEngine.current.ensure();
    audioEngine.current.setVolume(settings.synthVolume);
    setPlaybackToken((value) => value + 1);
    setTimeMs(0);
    setPlaying(true);
    setStatusToken({ key: "status.playing" });
    try { await startOriginalAudio(0); } catch { setStatusToken({ key: "status.playingBlocked" }); }
  }, [settings.synthVolume, startOriginalAudio]);

  const togglePlayback = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      stopOriginalAudio();
      setStatusToken({ key: "status.paused" });
      return;
    }
    await audioEngine.current.ensure();
    if (timeMs > 0 && timeMs < durationMs - 120) {
      setPlaying(true);
      setStatusToken({ key: "status.playing" });
      await startOriginalAudio(timeMs).catch(() => undefined);
      return;
    }
    await resetAndPlay();
  }, [durationMs, playing, resetAndPlay, startOriginalAudio, stopOriginalAudio, timeMs]);

  const resetPlayback = useCallback(() => {
    setPlaying(false);
    stopOriginalAudio();
    setPlaybackToken((value) => value + 1);
    setTimeMs(0);
    setStatusToken({ key: "status.reset" });
  }, [stopOriginalAudio]);

  const onNote = useCallback((event: NoteEvent) => {
    void audioEngine.current.playNote(event.midi, event.velocity, event.durationMs, settings.synthPreset);
  }, [settings.synthPreset]);

  const finishRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const onEnded = useCallback(() => {
    setPlaying(false);
    stopOriginalAudio();
    setStatusToken({ key: recording ? "status.finalizing" : "status.finished" });
    if (recording) finishRecording();
  }, [finishRecording, recording, stopOriginalAudio]);

  const loadBuiltin = useCallback((name: string) => {
    const events = BUILTIN_MELODIES[name];
    if (!events) return;
    stopOriginalAudio();
    setAudioUrl(null);
    setSourceEvents(events);
    setPlaybackToken((value) => value + 1);
    setTimeMs(0);
    setPlaying(false);
    setSource({ type: "builtin", name, durationMs: events.at(-1)?.timeMs ?? 0, eventCount: events.length });
    setAudioInfoToken({ key: "info.builtin" });
    setStatusToken({ key: "status.loaded", values: { name } });
  }, [stopOriginalAudio]);

  const importMidi = useCallback(async (file: File) => {
    try {
      const events = parseMidi(await file.arrayBuffer());
      if (!events.length) throw new Error("NO_NOTE_EVENTS");
      stopOriginalAudio();
      setAudioUrl(null);
      setSourceEvents(events);
      setPlaying(false);
      setTimeMs(0);
      setPlaybackToken((value) => value + 1);
      setSource({ type: "midi", name: file.name, durationMs: events.at(-1)?.timeMs ?? 0, eventCount: events.length });
      setAudioInfoToken({ key: "info.midi", values: { name: file.name, size: prettyBytes(file.size), count: events.length } });
      setStatusToken({ key: "status.midiParsed" });
      toast.success(rhythmicText(lang, "toast.midiImported"));
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const message = raw === "NO_NOTE_EVENTS" ? rhythmicText(lang, "error.noMidiNotes") : raw || rhythmicText(lang, "error.unknownMidi");
      setStatusToken({ key: "status.midiError", values: { message } });
      toast.error(message);
    }
  }, [lang, stopOriginalAudio]);

  const importAudio = useCallback(async (file: File) => {
    setStatusToken({ key: "status.analyzing" });
    try {
      const { buffer, events } = await analyzeAudioFile(file);
      stopOriginalAudio();
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setSourceEvents(events);
      setPlaying(false);
      setTimeMs(0);
      setPlaybackToken((value) => value + 1);
      setSource({ type: "audio", name: file.name, durationMs: buffer.duration * 1000, eventCount: events.length });
      setAudioInfoToken({ key: "info.audio", values: { name: file.name, size: prettyBytes(file.size), count: events.length } });
      setStatusToken({ key: "status.audioAnalyzed" });
      toast.success(rhythmicText(lang, "toast.detectedHits", { count: events.length }));
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : rhythmicText(lang, "error.unknownAudio");
      setStatusToken({ key: "status.audioError", values: { message } });
      toast.error(message);
    }
  }, [lang, stopOriginalAudio]);

  const randomize = useCallback(() => {
    setSettings((current) => ({
      ...current,
      curveIntensity: +(0.18 + Math.random() * 0.78).toFixed(2),
      curvePathLength: +(0.35 + Math.random() * 0.6).toFixed(2),
      platformGap: Math.round(115 + Math.random() * 90),
      platformWidth: Math.round(180 + Math.random() * 120),
      platformTilt: Math.round(2 + Math.random() * 12),
      laneSpread: Math.round(330 + Math.random() * 190),
      bounceHeight: Math.round(90 + Math.random() * 105),
      cameraAnchor: +(0.28 + Math.random() * 0.14).toFixed(2),
      platformGlow: +(0.5 + Math.random() * 0.75).toFixed(2),
      trailLength: Math.round(10 + Math.random() * 28),
      particleCount: Math.round(10 + Math.random() * 30),
    }));
    setStatusToken({ key: "status.randomized" });
  }, []);

  const saveProject = useCallback(() => {
    const saved = saveRhythmicProject(projectName.trim() || rhythmicText(lang, "default.untitled"), settings, source);
    setProjects((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
    setStatusToken({ key: "status.projectSaved" });
    toast.success(rhythmicText(lang, "toast.presetSaved"));
  }, [lang, projectName, settings, source]);

  const removeProject = useCallback((id: string) => setProjects(deleteRhythmicProject(id)), []);
  const loadProject = useCallback((project: StoredProject) => {
    setSettings({ ...DEFAULT_SETTINGS, ...project.settings });
    setProjectName(project.name);
    if (project.source?.type === "builtin" && BUILTIN_MELODIES[project.source.name]) loadBuiltin(project.source.name);
    else setStatusToken({ key: project.source ? "status.presetReimport" : "status.presetLoaded" });
  }, [loadBuiltin]);

  const recordVideo = useCallback(async (format: ExportFormat = "webm") => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      toast.error(rhythmicText(lang, "error.recordingUnsupported"));
      return;
    }
    const exportFormat = getExportFormat(format);
    const mimeType = exportFormat.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!mimeType) {
      const message = rhythmicText(lang, "status.exportUnsupported", { format: exportFormat.label });
      setStatusToken({ key: "status.exportUnsupported", values: { format: exportFormat.label } });
      toast.error(message);
      return;
    }

    await audioEngine.current.ensure();
    const stream = canvas.captureStream(60);
    audioEngine.current.getRecordStream()?.getAudioTracks().forEach((track) => stream.addTrack(track));
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 9_000_000 });
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName(projectName)}.${exportFormat.id}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setRecordingFormat(null);
      setStatusToken({ key: "status.exported", values: { format: exportFormat.label, size: (blob.size / (1024 * 1024)).toFixed(1) } });
      toast.success(rhythmicText(lang, "toast.exported", { format: exportFormat.label }));
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setRecordingFormat(null);
      setStatusToken({ key: "status.exportFailed", values: { format: exportFormat.label } });
      toast.error(rhythmicText(lang, "status.exportFailed", { format: exportFormat.label }));
    };
    recorder.start(1000);
    setRecording(true);
    setRecordingFormat(format);
    setStatusToken({ key: "status.recording", values: { format: exportFormat.label } });
    await resetAndPlay();
  }, [lang, projectName, resetAndPlay]);

  return { settings, patch, sourceEvents, source, audioUrl, audioFileInfo, playing, playbackToken, timeMs, setTimeMs, recording, recordingFormat, status, projectName, setProjectName, projects, canvasRef, audioElementRef, timeline, durationMs, onNote, onEnded, togglePlayback, resetPlayback, loadBuiltin, importMidi, importAudio, randomize, saveProject, removeProject, loadProject, recordVideo };
}
