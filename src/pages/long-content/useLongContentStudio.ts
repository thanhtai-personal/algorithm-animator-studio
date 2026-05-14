import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ALGORITHMS, COMPLEXITY, makeSampleGraph, parseGraph } from "@/lib/algorithms";
import type { ColumnVisualMode } from "@/lib/animalColumns";
import { preloadAnimalSprites } from "@/lib/animalColumns";
import { audioEngine } from "@/lib/audio";
import { BackgroundMusicId, getAssetMusicOption, isAssetMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { type Lang, readSystemLang, subscribeSystemLang } from "@/lib/i18n";
import { buildLongContentScenes, getSceneAtTime, getTotalDuration } from "@/lib/longContentTimeline";
import { renderLongContentFrame } from "@/lib/longContentRenderer";
import { THEMES } from "@/lib/renderer";
import { generateElevenLabsVoice, generatePiperVoice, getElevenLabsConfig, getPiperModels, getVoiceHealth, type ElevenLabsConfig, type PiperModel, type VoiceHealth } from "@/lib/voiceApi";
import { setLastExportedVideo } from "@/lib/studioMediaRegistry";
import { ExportFormat, getExportFormat } from "../studio/exportFormats";
import { demoAnimalArray, demoArrayForAlgorithm, demoSizeForAlgorithm } from "../studio/demoArrays";

const LONG_W = 1920;
const LONG_H = 1080;
const DEFAULT_GRAPH = "A-B:4, A-C:2, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-G:3, F-G:1";

export type VoiceProvider = "browser" | "piper" | "elevenlabs";

export function useLongContentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSpokenSceneId = useRef<string | null>(null);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [algoId, setAlgoId] = useState("bubble");
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [showCode, setShowCode] = useState(true);
  const [columnVisualMode, setColumnVisualMode] = useState<ColumnVisualMode>("bar");
  const [animalSpriteScale, setAnimalSpriteScale] = useState(1);
  const [animalJumpIntensity, setAnimalJumpIntensity] = useState(1);
  const [animalHighlightJump, setAnimalHighlightJump] = useState(true);
  const [fps, setFps] = useState(30);
  const [animationSeconds, setAnimationSeconds] = useState(28);
  const [introSeconds, setIntroSeconds] = useState(5);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("webm");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [narrationRate, setNarrationRate] = useState(0.96);
  const [narrationVol, setNarrationVol] = useState(85);
  const [musicVol, setMusicVol] = useState(28);
  const [musicPreset, setMusicPreset] = useState<BackgroundMusicId>("lofi");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>("browser");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceFileName, setVoiceFileName] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceHealth, setVoiceHealth] = useState<VoiceHealth | null>(null);
  const [piperModels, setPiperModels] = useState<PiperModel[]>([]);
  const [piperModelKey, setPiperModelKey] = useState("vi_vais1000");
  const [elevenConfig, setElevenConfig] = useState<ElevenLabsConfig | null>(null);
  const [elevenModelId, setElevenModelId] = useState("eleven_flash_v2_5");
  const [elevenVoiceId, setElevenVoiceId] = useState("");

  const algo = ALGORITHMS[algoId] ?? ALGORITHMS.bubble;
  const theme = THEMES[themeName] ?? THEMES.neon;
  const graph = useMemo(() => parseGraph(DEFAULT_GRAPH) ?? makeSampleGraph(), []);
  const sceneParams = { algo, complexity: COMPLEXITY[algoId], animationSeconds, introSeconds };
  const scenes = useMemo(() => buildLongContentScenes({ ...sceneParams, lang }), [algo, algoId, animationSeconds, introSeconds, lang]);
  const viScenes = useMemo(() => buildLongContentScenes({ ...sceneParams, lang: "vi" }), [algo, algoId, animationSeconds, introSeconds]);
  const enScenes = useMemo(() => buildLongContentScenes({ ...sceneParams, lang: "en" }), [algo, algoId, animationSeconds, introSeconds]);
  const totalDuration = useMemo(() => getTotalDuration(scenes), [scenes]);
  const narrationScript = useMemo(() => scenes.map((scene) => scene.narration).join("\n\n"), [scenes]);

  const frames = useMemo(() => {
    if (algo.category === "graph") return algo.run([], { graph, start: 0, end: graph.nodes.length - 1 });
    const size = demoSizeForAlgorithm(algoId, algo.category === "search" ? 28 : 24);
    const arr = columnVisualMode === "animal" && algo.category === "sort"
      ? demoAnimalArray(Math.min(16, size))
      : demoArrayForAlgorithm(algoId, size);
    return algo.run(arr, {});
  }, [algo, algoId, columnVisualMode, graph]);

  const timelineState = useMemo(() => getSceneAtTime(scenes, elapsedSec), [scenes, elapsedSec]);
  const frameIdx = useMemo(() => {
    if (!frames.length) return 0;
    const multiplier = timelineState.scene.animation ? timelineState.progress : elapsedSec / Math.max(1, totalDuration);
    return clampFrameIndex(multiplier, frames.length);
  }, [elapsedSec, frames.length, timelineState, totalDuration]);

  useEffect(() => { preloadAnimalSprites(); void loadVoiceRuntime(); }, []);
  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => { audioEngine.setMusicVolume(musicVol / 100); }, [musicVol]);
  useEffect(() => { audioEngine.setVoiceVolume(narrationVol / 100); }, [narrationVol]);
  useEffect(() => { audioEngine.setVoiceSource(voiceUrl || null); }, [voiceUrl]);
  useEffect(() => {
    const langModel = piperModels.find((model) => model.lang === lang && model.available);
    if (langModel && piperModelKey !== langModel.key) setPiperModelKey(langModel.key);
  }, [lang, piperModelKey, piperModels]);
  useEffect(() => { setElapsedSec(0); setPlaying(false); cancelNarration(); }, [algoId, animationSeconds, introSeconds, lang]);
  useEffect(() => { drawFrame(elapsedSec); });

  useEffect(() => {
    let cancelled = false;
    if (isAssetMusicId(musicPreset)) {
      const option = getAssetMusicOption(musicPreset);
      if (!option) return;
      void option.loadUrl().then((url) => { if (!cancelled) audioEngine.setMusicSource(url); }).catch(() => {});
    } else if (musicPreset === "custom") audioEngine.setMusicSource(musicUrl);
    else audioEngine.setMusicSource(null);
    return () => { cancelled = true; };
  }, [musicPreset, musicUrl]);

  useEffect(() => {
    if (!playing) {
      lastSpokenSceneId.current = null;
      cancelNarration();
      audioEngine.stopVoice(false);
      if (!exporting) audioEngine.stopMusic();
      return;
    }
    audioEngine.resume();
    startMusic();
    if (narrationEnabled && voiceProvider !== "browser" && voiceUrl) audioEngine.playVoice(elapsedSec);
  }, [playing, exporting, musicPreset, voiceProvider, voiceUrl]);

  useEffect(() => {
    if (!playing || !narrationEnabled || voiceProvider !== "browser") return;
    const scene = timelineState.scene;
    if (!scene || lastSpokenSceneId.current === scene.id) return;
    lastSpokenSceneId.current = scene.id;
    speakNarration(scene.narration, lang, narrationRate, narrationVol / 100);
  }, [playing, narrationEnabled, voiceProvider, timelineState.scene.id, timelineState.scene.narration, lang, narrationRate, narrationVol]);

  useEffect(() => () => { cancelNarration(); audioEngine.stopVoice(true); audioEngine.stopMusic(); }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) / 1000;
      previous = now;
      setElapsedSec((value) => {
        const next = Math.min(totalDuration, value + delta);
        if (next >= totalDuration) setPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, totalDuration]);

  async function loadVoiceRuntime() {
    const [health, models, pro] = await Promise.allSettled([getVoiceHealth(), getPiperModels(), getElevenLabsConfig()]);
    if (health.status === "fulfilled") setVoiceHealth(health.value);
    if (models.status === "fulfilled") {
      setPiperModels(models.value);
      const langModel = models.value.find((model) => model.lang === lang && model.available) ?? models.value.find((model) => model.available);
      if (langModel) setPiperModelKey(langModel.key);
    }
    if (pro.status === "fulfilled") {
      setElevenConfig(pro.value);
      if (pro.value.models[0]) setElevenModelId(pro.value.models[0].id);
      if (pro.value.voices[0]) setElevenVoiceId(pro.value.voices[0].id);
    }
  }

  async function generateVoiceOver() {
    if (voiceProvider === "browser") {
      toast.info("Browser TTS dùng để preview. Muốn nhúng voice vào file video, hãy chọn Piper hoặc ElevenLabs.");
      return;
    }
    setVoiceLoading(true);
    setPlaying(false);
    try {
      const fileName = `${algo.id}-${lang}-long-voice`;
      const result = voiceProvider === "piper"
        ? await generatePiperVoice({ text: narrationScript, modelKey: piperModelKey, sentenceSilence: 0.7, speechRate: narrationRate, fileName })
        : await generateElevenLabsVoice({ text: narrationScript, modelId: elevenModelId, voiceId: elevenVoiceId, fileName });
      setVoiceUrl(result.audioUrl);
      setVoiceFileName(result.fileName);
      toast.success(`Đã tạo voice-over: ${result.fileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo voice-over thất bại.");
    } finally {
      setVoiceLoading(false);
    }
  }

  function drawFrame(timeSec: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !frames.length) return;
    const safeTime = clampNumber(timeSec, 0, totalDuration);
    const state = getSceneAtTime(scenes, safeTime);
    const localFrameIdx = getFrameIndexForTime(safeTime, state.scene.animation);
    const frame = frames[localFrameIdx] ?? frames[0];
    const previousFrame = localFrameIdx > 0 ? frames[localFrameIdx - 1] ?? null : null;
    if (!frame) return;
    renderLongContentFrame(ctx, {
      frame,
      previousFrame,
      scene: state.scene,
      sceneProgress: state.progress,
      timelineProgress: clamp01(safeTime / Math.max(1, totalDuration)),
      algoId,
      algoName: algo.name,
      code: algo.code,
      theme,
      showCode,
      animalColumns: { mode: columnVisualMode, spriteScale: animalSpriteScale, jumpIntensity: animalJumpIntensity, highlightJump: animalHighlightJump },
      frameLabel: `Frame ${localFrameIdx + 1}/${frames.length} · ${formatTime(safeTime)} / ${formatTime(totalDuration)}`,
    });
  }

  function getFrameIndexForTime(timeSec: number, sceneAnimation?: boolean) {
    if (!frames.length) return 0;
    const safeTime = clampNumber(timeSec, 0, totalDuration);
    const state = getSceneAtTime(scenes, safeTime);
    const progress = sceneAnimation ? state.progress : safeTime / Math.max(1, totalDuration);
    return clampFrameIndex(progress, frames.length);
  }

  async function exportVideo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !frames.length) return;
    if (voiceProvider === "browser" && narrationEnabled) {
      toast.warning("Browser TTS không thể nhúng trực tiếp vào MediaRecorder. Video sẽ có nhạc nền; hãy dùng Piper/ElevenLabs nếu cần voice-over trong file.");
    }
    cancelNarration();
    audioEngine.resume();
    const videoStream = canvas.captureStream(0) as MediaStream;
    const track = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const audioStream = audioEngine.getRecordStream();
    const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
    const format = getExportFormat(exportFormat);
    const mimeType = format.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!mimeType) return toast.error(`${format.label}: trình duyệt chưa hỗ trợ xuất định dạng này.`);

    const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 10_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const done = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });

    setExporting(true);
    setExportProgress(0);
    setPlaying(false);
    startMusic();
    if (voiceProvider !== "browser" && voiceUrl && narrationEnabled) audioEngine.playVoice(0);
    recorder.start();
    const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));
    for (let i = 0; i <= totalFrames; i++) {
      const time = Math.min(totalDuration, i / fps);
      drawFrame(time);
      track.requestFrame();
      setExportProgress(Math.round((i / totalFrames) * 100));
      await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
    }
    recorder.stop();
    audioEngine.stopMusic();
    audioEngine.stopVoice(true);
    const blob = await done;
    const fileName = `${algo.id}-${lang}-long-16x9-${Date.now()}.${format.id}`;
    const file = new File([blob], fileName, { type: mimeType });
    const url = URL.createObjectURL(file);
    setLastExportedVideo(file, url);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setExporting(false);
    toast.success("Đã xuất video và lưu vào danh sách đăng YouTube tạm thời.");
  }

  function startMusic() {
    audioEngine.setMusicVolume(musicVol / 100);
    if (isProceduralMusicPreset(musicPreset)) audioEngine.setMusicPreset(musicPreset);
    else { audioEngine.setMusicPreset("custom"); audioEngine.startMusic(); }
  }

  function onMusicUpload(file: File) {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicUrl(URL.createObjectURL(file));
  }

  return {
    canvasRef, lang, algoId, setAlgoId, algo, themeName, setThemeName, showCode, setShowCode,
    columnVisualMode, setColumnVisualMode, animalSpriteScale, setAnimalSpriteScale,
    animalJumpIntensity, setAnimalJumpIntensity, animalHighlightJump, setAnimalHighlightJump,
    fps, setFps, animationSeconds, setAnimationSeconds, introSeconds, setIntroSeconds,
    exportFormat, setExportFormat, elapsedSec, setElapsedSec, playing, setPlaying,
    exporting, exportProgress, scenes, viScenes, enScenes, totalDuration, timelineState, frameIdx, frames,
    narrationEnabled, setNarrationEnabled, narrationRate, setNarrationRate, narrationVol, setNarrationVol,
    musicPreset, setMusicPreset, musicVol, setMusicVol, onMusicUpload,
    voiceProvider, setVoiceProvider, voiceUrl, voiceFileName, voiceLoading, generateVoiceOver,
    voiceHealth, piperModels, piperModelKey, setPiperModelKey, elevenConfig, elevenModelId, setElevenModelId,
    elevenVoiceId, setElevenVoiceId, narrationScript,
    W: LONG_W, H: LONG_H, exportVideo,
  };
}

function speakNarration(text: string, lang: Lang, rate: number, volume: number) {
  const synth = window.speechSynthesis;
  if (!synth || !text.trim()) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "vi" ? "vi-VN" : "en-US";
  utterance.rate = clampNumber(rate, 0.6, 1.3);
  utterance.volume = clampNumber(volume, 0, 1);
  const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(lang === "vi" ? "vi" : "en"));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

function cancelNarration() { window.speechSynthesis?.cancel(); }

function formatTime(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function clampFrameIndex(progress: number, frameCount: number) {
  if (!frameCount) return 0;
  const safeProgress = Number.isFinite(progress) ? clamp01(progress) : 0;
  return clampNumber(Math.floor(safeProgress * (frameCount - 1)), 0, frameCount - 1);
}
function clampNumber(value: number, min: number, max: number) { return !Number.isFinite(value) ? min : Math.max(min, Math.min(max, value)); }
function clamp01(value: number) { return clampNumber(value, 0, 1); }

export type LongContentStudio = ReturnType<typeof useLongContentStudio>;
