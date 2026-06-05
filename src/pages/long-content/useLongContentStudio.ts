import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ALGORITHMS, COMPLEXITY, DEFAULT_ALGORITHM_ID, makeSampleGraph, parseGraph } from "@/lib/algorithms";
import type { ColumnVisualMode } from "@/lib/animalColumns";
import { preloadAnimalSprites } from "@/lib/animalColumns";
import { audioEngine } from "@/lib/audio";
import { isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { buildVideoExportFileName } from "@/lib/exportFileName";
import { type Lang, readSystemLang, subscribeSystemLang } from "@/lib/i18n";
import { buildLongContentScenes, getSceneAtTime, getTotalDuration } from "@/lib/longContentTimeline";
import type { LongVideoType } from "@/lib/longVideoTypes";
import { buildLongVideoVoiceSegments } from "@/lib/longVideoVoice";
import { THEMES } from "@/lib/renderer";
import { convertRvcApplioVoice, generateElevenLabsVoice, generatePiperVoice, generateSupertonicVoice, type VoiceGenerateResult } from "@/lib/voiceApi";
import { setLastExportedVideo } from "@/lib/studioMediaRegistry";
import { buildYoutubeMetadata } from "@/lib/youtubeMetadata";
import { ExportFormat, getExportFormat } from "../studio/exportFormats";
import { demoAnimalArray, demoArrayForAlgorithm, demoSizeForAlgorithm } from "../studio/demoArrays";
import { applyScriptOverrides, buildSceneFrames, cancelNarration, clampFrameIndex, drawLongContentFrameAtTime, getLoadedVoiceDuration, ScriptSceneField, ScriptSceneOverride, speakNarration } from "./studioHelpers";
import { buildGeneratedVoiceScriptKey, type GeneratedVoiceProvider, useRestoreGeneratedVoiceCache, writeCachedGeneratedVoice } from "./voiceCache";
import { fitSceneDurationsToNarration } from "./voiceTiming";
import { useKineticSlideSfx } from "./useKineticSlideSfx";
import { useLongContentMusic } from "./useLongContentMusic";
import { useLongContentVoiceRuntime } from "./useLongContentVoiceRuntime";
import { useVideoBackgroundImages } from "./useVideoBackgroundImages";
const LONG_W = 1920, LONG_H = 1080, DEFAULT_GRAPH = "A-B:4, A-C:2, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-G:3, F-G:1";
export type VoiceProvider = "browser" | "piper" | "elevenlabs" | "supertonic";
export function useLongContentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSpokenSceneId = useRef<string | null>(null);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [algoId, setAlgoId] = useState(DEFAULT_ALGORITHM_ID);
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [longVideoType, setLongVideoType] = useState<LongVideoType>("classic");
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
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>("browser");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceRelativePath, setVoiceRelativePath] = useState("");
  const [voiceFileName, setVoiceFileName] = useState("");
  const [voiceDurationSec, setVoiceDurationSec] = useState(0);
  const [voiceSegmentDurationsSec, setVoiceSegmentDurationsSec] = useState<number[]>([]);
  const [voiceScriptKey, setVoiceScriptKey] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceConverting, setVoiceConverting] = useState(false);
  const [scriptOverrides, setScriptOverrides] = useState<Record<string, ScriptSceneOverride>>({});
  const voiceRuntime = useLongContentVoiceRuntime(lang);
  const {
    voiceHealth, piperRuntime, piperInstalling, installSelectedPiperModel, refreshPiperRuntime,
    piperModels, piperModelKey, setPiperModelKey, elevenConfig, elevenModelId, setElevenModelId,
    elevenVoiceId, setElevenVoiceId, supertonicConfig, supertonicVoice, setSupertonicVoice,
    supertonicTotalSteps, setSupertonicTotalSteps, supertonicImporting, importSupertonicVoiceJson, rvcApplioConfig,
  } = voiceRuntime;

  const algo = ALGORITHMS[algoId] ?? ALGORITHMS[DEFAULT_ALGORITHM_ID];
  const theme = THEMES[themeName] ?? THEMES.neon;
  const graph = useMemo(() => parseGraph(DEFAULT_GRAPH) ?? makeSampleGraph(), []);
  const rvcApplioKey = [rvcApplioConfig?.baseUrl, rvcApplioConfig?.apiName, rvcApplioConfig?.modelName, rvcApplioConfig?.indexPath].filter(Boolean).join("|");
  const music = useLongContentMusic(lang, musicUrl);
  const sceneParams = { algo, complexity: COMPLEXITY[algoId], animationSeconds, introSeconds };
  const baseScenes = useMemo(() => buildLongContentScenes({ ...sceneParams, lang }), [algo, algoId, animationSeconds, introSeconds, lang]);
  const editedScenes = useMemo(() => applyScriptOverrides(baseScenes, scriptOverrides), [baseScenes, scriptOverrides]);
  const scenes = useMemo(
    () => fitSceneDurationsToNarration(editedScenes, lang, narrationRate, voiceDurationSec, voiceSegmentDurationsSec),
    [editedScenes, lang, narrationRate, voiceDurationSec, voiceSegmentDurationsSec],
  );
  const totalDuration = useMemo(() => getTotalDuration(scenes), [scenes]);
  const backgrounds = useVideoBackgroundImages(totalDuration);
  const narrationSegments = useMemo(() => buildLongVideoVoiceSegments(editedScenes, longVideoType, algo.name, lang), [algo.name, editedScenes, lang, longVideoType]);
  const narrationScript = useMemo(() => narrationSegments.join(" "), [narrationSegments]);
  const baseFrames = useMemo(() => {
    if (algo.category === "graph") return algo.run([], { graph, start: 0, end: graph.nodes.length - 1 });
    const size = demoSizeForAlgorithm(algoId, algo.category === "search" ? 28 : 24);
    const arr = columnVisualMode === "animal" && algo.category === "sort"
      ? demoAnimalArray(Math.min(16, size))
      : demoArrayForAlgorithm(algoId, size);
    return algo.run(arr, {});
  }, [algo, algoId, columnVisualMode, graph]);
  const sceneFrames = useMemo(() => buildSceneFrames(scenes, algo), [algo, scenes]);
  const timelineState = useMemo(() => getSceneAtTime(scenes, elapsedSec), [scenes, elapsedSec]);
  const frames = useMemo(() => sceneFrames[timelineState.scene.id] ?? baseFrames, [baseFrames, sceneFrames, timelineState.scene.id]);
  const frameIdx = useMemo(() => {
    if (!frames.length) return 0;
    if (!timelineState.scene.animation) return 0;
    return clampFrameIndex(timelineState.progress, frames.length);
  }, [elapsedSec, frames.length, timelineState, totalDuration]);
  const kineticSfx = useKineticSlideSfx({ algoId, lang, scenes, elapsedSec, playing, exporting, longVideoType });
  useEffect(() => { preloadAnimalSprites(); }, []);
  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => { audioEngine.setMusicVolume(musicVol / 100); }, [musicVol]);
  useEffect(() => { audioEngine.setVoiceVolume(narrationVol / 100); }, [narrationVol]);
  useEffect(() => { audioEngine.setVoiceSource(voiceUrl || null); }, [voiceUrl]);
  useEffect(() => {
    if (longVideoType === "classic" && !narrationEnabled) setNarrationEnabled(true);
  }, [longVideoType, narrationEnabled]);
  useEffect(() => {
    setElapsedSec(0);
    setPlaying(false);
    cancelNarration();
    setVoiceUrl("");
    setVoiceRelativePath("");
    setVoiceFileName("");
    setVoiceDurationSec(0);
    setVoiceSegmentDurationsSec([]);
    setVoiceScriptKey("");
  }, [algoId, animationSeconds, introSeconds, lang, longVideoType, narrationRate, piperModelKey, elevenModelId, elevenVoiceId, supertonicVoice, supertonicTotalSteps, rvcApplioKey, narrationScript]);
  useRestoreGeneratedVoiceCache({
    algoId: algo.id, lang, piperModelKey, elevenModelId, elevenVoiceId, supertonicVoice, supertonicTotalSteps, rvcApplioKey, narrationRate, narrationScript,
    voiceUrl, voiceLoading, voiceProvider, setVoiceProvider, setVoiceUrl, setVoiceFileName, setVoiceDurationSec,
    setVoiceRelativePath, setVoiceSegmentDurationsSec, setVoiceScriptKey,
  });
  useEffect(() => { setScriptOverrides({}); }, [algoId, lang]);
  useEffect(() => {
    if (!exporting) drawFrame(elapsedSec);
  });
  useEffect(() => { audioEngine.setMusicSources(music.selectedUrls); }, [music.selectedUrls]);
  useEffect(() => {
    if (!playing) {
      lastSpokenSceneId.current = null;
      kineticSfx.resetKineticSlideSfx();
      cancelNarration();
      audioEngine.stopVoice(false);
      if (!exporting) audioEngine.stopMusic();
      return;
    }
    audioEngine.resume();
    startMusic();
    if (narrationEnabled && voiceProvider !== "browser" && voiceUrl) void audioEngine.playVoice(elapsedSec);
  }, [playing, exporting, music.selectedIds, voiceProvider, voiceUrl]);
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
        const currentState = getSceneAtTime(scenes, value);
        const next = Math.min(totalDuration, value + delta);
        if (
          narrationEnabled
          && voiceProvider === "browser"
          && window.speechSynthesis?.speaking
          && next >= currentState.end
          && currentState.end < totalDuration
        ) {
          return Math.max(currentState.start, currentState.end - 0.05);
        }
        if (next >= totalDuration) setPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, totalDuration, scenes, narrationEnabled, voiceProvider]);
  async function generateVoiceOver() {
    if (voiceProvider === "browser") {
      speakNarration(narrationScript, lang, narrationRate, narrationVol / 100);
      toast.info("Đang đọc thử bằng Browser TTS. Browser TTS chỉ dùng để preview; export có voice cần Piper, ElevenLabs hoặc Supertonic.");
      return;
    }
    setVoiceLoading(true);
    setPlaying(false);
    try {
      const result = await generateVoiceOverForProvider(voiceProvider);
      toast.success(`Đã tạo voice-over: ${result.fileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo voice-over thất bại.");
    } finally {
      setVoiceLoading(false);
    }
  }
  async function generateVoiceOverForProvider(provider: GeneratedVoiceProvider): Promise<VoiceGenerateResult> {
    const fileName = `${algo.id}-${longVideoType}-${lang}-long-voice`;
    const result = provider === "piper"
      ? await generatePiperVoice({ text: narrationScript, segments: narrationSegments, modelKey: piperModelKey, sentenceSilence: 0.08, speechRate: narrationRate, fileName })
      : provider === "supertonic"
        ? await generateSupertonicVoice({ text: narrationScript, segments: narrationSegments, voice: supertonicVoice, lang, speed: narrationRate, totalSteps: supertonicTotalSteps, fileName })
        : await generateElevenLabsVoice({ text: narrationScript, modelId: elevenModelId, voiceId: elevenVoiceId, fileName });
    const scriptKey = getVoiceScriptKeyForProvider(provider);
    setVoiceUrl(result.audioUrl);
    setVoiceRelativePath(result.relativePath);
    setVoiceFileName(result.fileName);
    setVoiceScriptKey(scriptKey);
    audioEngine.setVoiceSource(result.audioUrl);
    await audioEngine.waitForVoiceReady();
    const durationSec = getLoadedVoiceDuration();
    const segmentDurationsSec = result.segmentDurationsSec ?? [];
    setVoiceDurationSec(durationSec);
    setVoiceSegmentDurationsSec(segmentDurationsSec);
    writeCachedGeneratedVoice({ provider, scriptKey, audioUrl: result.audioUrl, relativePath: result.relativePath, fileName: result.fileName, durationSec, segmentDurationsSec, savedAt: Date.now() });
    return result;
  }
  async function convertVoiceWithApplio() {
    if (!voiceRelativePath) {
      toast.error("Chưa có file audio đã tạo để chuyển sang custom voice.");
      return;
    }
    setVoiceConverting(true);
    setPlaying(false);
    try {
      const baseFileName = voiceFileName.replace(/\.[^.]+$/, "") || `${algo.id}-${longVideoType}-${lang}-custom-voice`;
      const result = await convertRvcApplioVoice({ audioRelativePath: voiceRelativePath, fileName: `${baseFileName}-applio` });
      const provider = voiceProvider === "browser" ? "piper" : voiceProvider;
      const scriptKey = getVoiceScriptKeyForProvider(provider);
      setVoiceUrl(result.audioUrl);
      setVoiceRelativePath(result.relativePath);
      setVoiceFileName(result.fileName);
      setVoiceScriptKey(scriptKey);
      audioEngine.setVoiceSource(result.audioUrl);
      await audioEngine.waitForVoiceReady();
      const durationSec = getLoadedVoiceDuration();
      const segmentDurationsSec = result.segmentDurationsSec ?? [];
      setVoiceDurationSec(durationSec);
      setVoiceSegmentDurationsSec(segmentDurationsSec);
      writeCachedGeneratedVoice({ provider, scriptKey, audioUrl: result.audioUrl, relativePath: result.relativePath, fileName: result.fileName, durationSec, segmentDurationsSec, savedAt: Date.now() });
      toast.success(`Đã chuyển voice sang custom voice: ${result.fileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chuyển voice bằng Applio thất bại.");
    } finally {
      setVoiceConverting(false);
    }
  }
  async function ensureVoiceForExport() {
    if (!narrationEnabled || voiceProvider === "browser") return false;
    if (voiceUrl && voiceScriptKey === getVoiceScriptKeyForProvider(voiceProvider) && audioEngine.hasVoiceSource()) {
      await audioEngine.waitForVoiceReady();
      return true;
    }
    toast.info("Đang tự tạo voice-over theo kịch bản trước khi export video...");
    await generateVoiceOverForProvider(voiceProvider);
    return true;
  }
  function drawFrame(timeSec: number, targetCanvas: HTMLCanvasElement | null = canvasRef.current) {
    drawLongContentFrameAtTime({
      canvas: targetCanvas,
      timeSec,
      scenes,
      sceneFrames,
      baseFrames,
      algoId,
      algoName: algo.name,
      code: algo.code,
      lang,
      theme,
      showCode,
      longVideoType,
      backgroundImage: backgrounds.getBackgroundImageAt(timeSec),
      animalColumns: { mode: columnVisualMode, spriteScale: animalSpriteScale, jumpIntensity: animalJumpIntensity, highlightJump: animalHighlightJump },
    });
  }
  async function exportVideo() {
    if (!canvasRef.current || !frames.length) return;
    cancelNarration();
    audioEngine.resume();
    let shouldPlayVoice = false;
    try {
      if (narrationEnabled && voiceProvider === "browser") {
        toast.error("Browser TTS chỉ dùng để preview. Để export có voice, hãy chọn Piper, ElevenLabs hoặc Supertonic rồi tạo voice-over.");
        return;
      }
      shouldPlayVoice = await ensureVoiceForExport();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không chuẩn bị được voice-over để export.");
      return;
    }
    const format = getExportFormat(exportFormat);
    const mimeType = format.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!mimeType) {
      return toast.error(`${format.label}: trình duyệt chưa hỗ trợ xuất định dạng này.`);
    }
    setExporting(true); setExportProgress(0); setPlaying(false);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = LONG_W; exportCanvas.height = LONG_H;
    drawFrame(0, exportCanvas);

    const videoStream = exportCanvas.captureStream(0) as MediaStream;
    const track = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const audioTracks = audioEngine.getRecordStream().getAudioTracks();
    const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
    const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 10_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const done = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    let blob: Blob;
    try {
      startMusic();
      recorder.start();
      track.requestFrame();
      if (shouldPlayVoice) await audioEngine.playVoice(0);
      const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));
      let lastProgress = -1;
      kineticSfx.resetKineticSlideSfx();
      for (let i = 0; i <= totalFrames; i++) {
        const time = Math.min(totalDuration, i / fps);
        drawFrame(time, exportCanvas);
        if (longVideoType === "kinetic-typography") kineticSfx.playKineticSlideSfxAt(time);
        track.requestFrame();
        const progress = Math.round((i / totalFrames) * 100);
        if (progress !== lastProgress) {
          lastProgress = progress;
          setExportProgress(progress);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 / Math.max(1, fps)));
      }
      recorder.stop();
      blob = await done;
    } finally {
      audioEngine.stopMusic();
      audioEngine.stopVoice(true);
      cancelNarration();
      videoStream.getTracks().forEach((streamTrack) => streamTrack.stop());
      if (recorder.state !== "inactive") recorder.stop();
      setExporting(false);
      drawFrame(elapsedSec);
    }
    const youtubeMetadata = buildYoutubeMetadata(algo.id, lang, "long", longVideoType);
    const fileName = buildVideoExportFileName({ youtubeTitle: youtubeMetadata.title, fallbackTitle: `${algo.name} ${longVideoType}`, lang, extension: format.id });
    const file = new File([blob], fileName, { type: mimeType });
    const url = URL.createObjectURL(file);
    setLastExportedVideo(file, url, { youtubeDescriptionAppend: music.selectedLicenseText, youtubeMetadata });
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    toast.success("Đã xuất video và lưu vào danh sách đăng YouTube tạm thời.");
  }
  function startMusic() {
    audioEngine.setMusicVolume(musicVol / 100);
    const preset = music.selectedIds[0] ?? "off";
    if (isProceduralMusicPreset(preset)) audioEngine.setMusicPreset(preset);
    else { audioEngine.setMusicPreset("custom"); audioEngine.startMusic(); }
  }
  function onMusicUpload(file: File) {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicUrl(URL.createObjectURL(file));
    music.setSelectedIds(["custom"]);
  }
  function updateScriptScene(sceneId: string, field: ScriptSceneField, value: string) {
    setScriptOverrides((current) => ({ ...current, [sceneId]: { ...current[sceneId], [field]: value } }));
  }
  function resetScriptScene(sceneId: string) {
    setScriptOverrides((current) => {
      const next = { ...current };
      delete next[sceneId];
      return next;
    });
  }
  function getVoiceScriptKeyForProvider(provider: GeneratedVoiceProvider) {
    return buildGeneratedVoiceScriptKey({
    provider, algoId: `${algo.id}-${longVideoType}`, lang, piperModelKey, elevenModelId, elevenVoiceId, supertonicVoice, supertonicTotalSteps, rvcApplioKey, narrationRate, narrationScript,
    });
  }
  return {
    canvasRef, lang, algoId, setAlgoId, algo, themeName, setThemeName, longVideoType, setLongVideoType, showCode, setShowCode, columnVisualMode, setColumnVisualMode, animalSpriteScale, setAnimalSpriteScale,
    animalJumpIntensity, setAnimalJumpIntensity, animalHighlightJump, setAnimalHighlightJump, fps, setFps, animationSeconds, setAnimationSeconds, introSeconds, setIntroSeconds, exportFormat, setExportFormat,
    elapsedSec, setElapsedSec, playing, setPlaying, exporting, exportProgress, scenes, totalDuration, timelineState, frameIdx, frames, narrationEnabled, setNarrationEnabled, narrationRate, setNarrationRate,
    narrationVol, setNarrationVol, music, musicVol, setMusicVol, ...backgrounds, ...kineticSfx, onMusicUpload, voiceProvider, setVoiceProvider, voiceUrl, voiceRelativePath, voiceFileName, voiceDurationSec, voiceLoading, voiceConverting,
    generateVoiceOver, voiceHealth, piperRuntime, piperInstalling, installSelectedPiperModel, refreshPiperRuntime, piperModels, piperModelKey, setPiperModelKey, elevenConfig, elevenModelId, setElevenModelId,
    elevenVoiceId, setElevenVoiceId, supertonicConfig, supertonicVoice, setSupertonicVoice, supertonicTotalSteps, setSupertonicTotalSteps, supertonicImporting, importSupertonicVoiceJson, rvcApplioConfig, convertVoiceWithApplio, narrationScript, updateScriptScene, resetScriptScene, resetAllScriptScenes: () => setScriptOverrides({}), W: LONG_W, H: LONG_H, exportVideo,
  };
}
export type LongContentStudio = ReturnType<typeof useLongContentStudio>;
