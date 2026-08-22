import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { analyzeAudioFile } from "./lib/audioAnalysis";
import { AudioEngine } from "./lib/audioEngine";
import { parseMidi } from "./lib/midiParser";
import { deleteRhythmicProject, listRhythmicProjects, saveRhythmicProject } from "./lib/projectStorage";
import { buildRhythmicTimeline, timelineDuration } from "./lib/timeline";
import { BUILTIN_MELODIES, DEFAULT_SETTINGS } from "./defaults";
import type { AudioSourceMeta, NoteEvent, StoredProject, StudioSettings } from "./types";

function prettyBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "rhythmic-run";
}

export function useRhythmicStudio() {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [sourceEvents, setSourceEvents] = useState<NoteEvent[]>(BUILTIN_MELODIES["Neon Scale"]);
  const [source, setSource] = useState<AudioSourceMeta>({ type: "builtin", name: "Neon Scale", durationMs: 5040, eventCount: 15 });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileInfo, setAudioFileInfo] = useState("Built-in synthesized sequence");
  const [playing, setPlaying] = useState(false);
  const [playbackToken, setPlaybackToken] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [projectName, setProjectName] = useState("My rhythmic run");
  const [projects, setProjects] = useState<StoredProject[]>(() => listRhythmicProjects());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioEngine = useRef(new AudioEngine());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeline = useMemo(() => buildRhythmicTimeline(sourceEvents, settings), [sourceEvents, settings]);
  const durationMs = useMemo(() => timelineDuration(timeline), [timeline]);

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
    setStatus("Playing");
    try { await startOriginalAudio(0); } catch { setStatus("Playing · original audio blocked"); }
  }, [settings.synthVolume, startOriginalAudio]);

  const togglePlayback = useCallback(async () => {
    if (playing) { setPlaying(false); stopOriginalAudio(); setStatus("Paused"); return; }
    await audioEngine.current.ensure();
    if (timeMs > 0 && timeMs < durationMs - 120) {
      setPlaying(true); setStatus("Playing");
      await startOriginalAudio(timeMs).catch(() => undefined);
      return;
    }
    await resetAndPlay();
  }, [durationMs, playing, resetAndPlay, startOriginalAudio, stopOriginalAudio, timeMs]);

  const resetPlayback = useCallback(() => {
    setPlaying(false); stopOriginalAudio(); setPlaybackToken((value) => value + 1); setTimeMs(0); setStatus("Reset");
  }, [stopOriginalAudio]);

  const onNote = useCallback((event: NoteEvent) => {
    void audioEngine.current.playNote(event.midi, event.velocity, event.durationMs, settings.synthPreset);
  }, [settings.synthPreset]);

  const finishRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const onEnded = useCallback(() => {
    setPlaying(false); stopOriginalAudio(); setStatus(recording ? "Finalizing video…" : "Finished");
    if (recording) finishRecording();
  }, [finishRecording, recording, stopOriginalAudio]);

  const loadBuiltin = useCallback((name: string) => {
    const events = BUILTIN_MELODIES[name];
    if (!events) return;
    stopOriginalAudio(); setAudioUrl(null); setSourceEvents(events); setPlaybackToken((value) => value + 1); setTimeMs(0); setPlaying(false);
    setSource({ type: "builtin", name, durationMs: events.at(-1)?.timeMs ?? 0, eventCount: events.length });
    setAudioFileInfo("Built-in synthesized sequence"); setStatus(`Loaded ${name}`);
  }, [stopOriginalAudio]);

  const importMidi = useCallback(async (file: File) => {
    try {
      const events = parseMidi(await file.arrayBuffer());
      if (!events.length) throw new Error("No note-on events found");
      stopOriginalAudio(); setAudioUrl(null); setSourceEvents(events); setPlaying(false); setTimeMs(0); setPlaybackToken((value) => value + 1);
      setSource({ type: "midi", name: file.name, durationMs: events.at(-1)?.timeMs ?? 0, eventCount: events.length });
      setAudioFileInfo(`${file.name} · ${prettyBytes(file.size)} · ${events.length} notes`); setStatus("MIDI parsed successfully");
      toast.success("MIDI imported");
    } catch (error) { const message = error instanceof Error ? error.message : "Unknown MIDI error"; setStatus(`MIDI error: ${message}`); toast.error(message); }
  }, [stopOriginalAudio]);

  const importAudio = useCallback(async (file: File) => {
    setStatus("Analyzing audio onsets…");
    try {
      const { buffer, events } = await analyzeAudioFile(file);
      stopOriginalAudio();
      const url = URL.createObjectURL(file);
      setAudioUrl(url); setSourceEvents(events); setPlaying(false); setTimeMs(0); setPlaybackToken((value) => value + 1);
      setSource({ type: "audio", name: file.name, durationMs: buffer.duration * 1000, eventCount: events.length });
      setAudioFileInfo(`${file.name} · ${prettyBytes(file.size)} · ${events.length} detected hits`); setStatus("Audio analyzed · beat/onset mode");
      toast.success(`Detected ${events.length} rhythmic hits`);
    } catch (error) { const message = error instanceof Error ? error.message : "Unknown audio error"; setStatus(`Audio error: ${message}`); toast.error(message); }
  }, [stopOriginalAudio]);

  const randomize = useCallback(() => {
    setSettings((current) => ({ ...current, curveIntensity: +(0.2 + Math.random() * 0.75).toFixed(2), curvePathLength: +(0.35 + Math.random() * 0.6).toFixed(2), shieldRadius: +(0.62 + Math.random() * 0.2).toFixed(2), ringPulseSensitivity: +(0.45 + Math.random() * 0.55).toFixed(2), trailLength: Math.round(8 + Math.random() * 28), particleCount: Math.round(8 + Math.random() * 28) }));
    setStatus("Visual motion randomized");
  }, []);

  const saveProject = useCallback(() => {
    const saved = saveRhythmicProject(projectName.trim() || "Untitled run", settings, source);
    setProjects((items) => [saved, ...items.filter((item) => item.id !== saved.id)]); setStatus("Project preset saved"); toast.success("Rhythmic preset saved");
  }, [projectName, settings, source]);

  const removeProject = useCallback((id: string) => setProjects(deleteRhythmicProject(id)), []);
  const loadProject = useCallback((project: StoredProject) => {
    setSettings({ ...DEFAULT_SETTINGS, ...project.settings }); setProjectName(project.name);
    if (project.source?.type === "builtin" && BUILTIN_MELODIES[project.source.name]) loadBuiltin(project.source.name);
    else setStatus(project.source ? "Preset loaded · re-import source MIDI/audio" : "Preset loaded");
  }, [loadBuiltin]);

  const recordVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") { toast.error("Canvas video recording is not supported by this browser"); return; }
    await audioEngine.current.ensure();
    const stream = canvas.captureStream(60);
    audioEngine.current.getRecordStream()?.getAudioTracks().forEach((track) => stream.addTrack(track));
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 9_000_000 } : undefined);
    recorderRef.current = recorder; chunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `${safeFileName(projectName)}.webm`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500); stream.getTracks().forEach((track) => track.stop());
      setRecording(false); setStatus(`Video exported · ${(blob.size / (1024 * 1024)).toFixed(1)} MB`); toast.success("Rhythmic WebM exported");
    };
    recorder.start(1000); setRecording(true); setStatus("Recording 9:16 · 60fps"); await resetAndPlay();
  }, [projectName, resetAndPlay]);

  return { settings, patch, sourceEvents, source, audioUrl, audioFileInfo, playing, playbackToken, timeMs, setTimeMs, recording, status, projectName, setProjectName, projects, canvasRef, audioElementRef, timeline, durationMs, onNote, onEnded, togglePlayback, resetPlayback, loadBuiltin, importMidi, importAudio, randomize, saveProject, removeProject, loadProject, recordVideo };
}
