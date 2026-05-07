import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ALGORITHMS, COMPLEXITY, Frame, parseGraph } from "@/lib/algorithms";
import { audioEngine, SfxKind } from "@/lib/audio";
import { BackgroundMusicId, getAssetMusicOption, isAssetMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { Lang, PLATFORMS, t } from "@/lib/i18n";
import { renderFrame, THEMES, Theme } from "@/lib/renderer";
import { getAssetSfxOption } from "@/lib/selectSounds";
import { ExportFormat, getExportFormat } from "./exportFormats";
import { demoArrayForAlgorithm, demoSizeForAlgorithm, parseInputArray, shouldUseAlgorithmDemo } from "./demoArrays";

const SWAP_TRANSITION_MULTIPLIER = 1.8;
const SWAP_EXPORT_SECONDS = 0.35;

type UseAlgorithmStudioOptions = {
  requireConfigAccess?: () => boolean;
};

export function useAlgorithmStudio(options: UseAlgorithmStudioOptions = {}) {
  const [lang, setLang] = useState<Lang>("en");
  const tr = (k: Parameters<typeof t>[1]) => t(lang, k);

  const [algoId, setAlgoId] = useState("bubble");
  const [size, setSizeState] = useState(20);
  const initialArr = useMemo(() => demoArrayForAlgorithm("bubble", 20), []);
  const [input, setInput] = useState(initialArr.join(", "));
  const [target, setTarget] = useState("");
  const [arr, setArr] = useState<number[]>(initialArr);
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [theme, setTheme] = useState<Theme>(THEMES.neon);
  const [title, setTitle] = useState("Bubble Sort");
  const [subtitle, setSubtitle] = useState("");
  const [showCode, setShowCode] = useState(true);
  const [fps, setFps] = useState(30);
  const [speed, setSpeed] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("webm");

  const [platformId, setPlatformId] = useState<(typeof PLATFORMS)[number]["id"]>("tiktok");
  const platform = PLATFORMS.find((p) => p.id === platformId)!;
  const W = platform.w;
  const H = platform.h;

  const [sfxCompare, setSfxCompare] = useState<SfxKind>("blip");
  const [sfxSwap, setSfxSwap] = useState<SfxKind>("marimba");
  const [sfxVol, setSfxVol] = useState(60);
  const [musicVol, setMusicVol] = useState(30);
  const [musicPreset, setMusicPreset] = useState<BackgroundMusicId>("lofi");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState(ALGORITHMS.custom.code);
  const [graphInput, setGraphInput] = useState(
    "A-B:4, A-C:2, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-G:3, F-G:1, F-H:7, G-I:4, H-I:2, H-J:5, I-K:6, J-K:3, J-L:8, K-L:2"
  );
  const [startLabel, setStartLabel] = useState("A");
  const [endLabel, setEndLabel] = useState("L");

  const algo = ALGORITHMS[algoId];
  const isGraph = algo.category === "graph";
  const parsedGraph = useMemo(() => isGraph ? parseGraph(graphInput) : null, [isGraph, graphInput]);
  const graphLabels = parsedGraph?.nodes.map((n) => n.label ?? String(n.id)) ?? [];
  const startId = graphLabels.indexOf(startLabel);
  const endId = graphLabels.indexOf(endLabel);

  const frames: Frame[] = useMemo(() => {
    const targetNum = target.trim() ? parseInt(target, 10) : undefined;
    return algo.run(arr, {
      target: Number.isNaN(targetNum as number) ? undefined : targetNum,
      customCode,
      graph: parsedGraph ?? undefined,
      start: startId >= 0 ? startId : undefined,
      end: endId >= 0 ? endId : undefined,
    });
  }, [algo, arr, target, customCode, parsedGraph, startId, endId]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = frames[Math.min(frameIdx, frames.length - 1)];
  const isSearch = algo.category === "search";
  const isCustom = algoId === "custom";
  const codeForPanel = isCustom ? customCode : algo.code;

  useEffect(() => { setTitle(algo.name); }, [algo]);
  useEffect(() => {
    if (!shouldUseAlgorithmDemo(algoId, arr)) return;
    const nextSize = demoSizeForAlgorithm(algoId, size);
    const next = demoArrayForAlgorithm(algoId, nextSize);
    if (nextSize !== size) setSizeState(nextSize);
    setArr(next);
    setInput(next.join(", "));
    setFrameIdx(0);
    setTransitionProgress(1);
    setPlaying(false);
  }, [algoId]);
  useEffect(() => { setTheme(THEMES[themeName]); }, [themeName]);
  useEffect(() => { audioEngine.setSfxVolume(sfxVol / 100); }, [sfxVol]);
  useEffect(() => { audioEngine.setMusicVolume(musicVol / 100); }, [musicVol]);
  useEffect(() => {
    void preloadAssetSfx(sfxCompare);
  }, [sfxCompare]);
  useEffect(() => {
    void preloadAssetSfx(sfxSwap);
  }, [sfxSwap]);
  useEffect(() => {
    let cancelled = false;
    if (isAssetMusicId(musicPreset)) {
      const option = getAssetMusicOption(musicPreset);
      if (!option) return;
      void option.loadUrl().then((url) => {
        if (cancelled) return;
        audioEngine.setMusicSource(url);
        if (playing) {
          audioEngine.setMusicPreset("custom");
          audioEngine.startMusic();
        }
      });
    } else if (musicPreset === "custom") {
      audioEngine.setMusicSource(musicUrl);
      if (playing) {
        audioEngine.setMusicPreset("custom");
        audioEngine.startMusic();
      }
    } else {
      audioEngine.setMusicSource(null);
    }
    return () => { cancelled = true; };
  }, [musicPreset, musicUrl, playing]);
  useEffect(() => {
    if (!playing) {
      audioEngine.stopMusic();
      return;
    }
    audioEngine.resume();
    audioEngine.setMusicPreset(isProceduralMusicPreset(musicPreset) ? musicPreset : "custom");
    audioEngine.startMusic();
  }, [musicPreset, playing]);
  useEffect(() => { if (!playing) setTransitionProgress(1); }, [playing, frameIdx]);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    const f = frames[Math.min(frameIdx, frames.length - 1)];
    if (!c || !ctx || !f) return;
    const code = algoId === "custom" ? customCode : algo.code;
    const previousFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
    renderFrame(ctx, f, {
      title,
      subtitle,
      theme,
      code,
      showCode,
      complexity: COMPLEXITY[algoId],
      previousFrame,
      transitionProgress,
      algorithmId: algoId,
    }, W, H);
  }, [frames, frameIdx, transitionProgress, title, subtitle, theme, algo.code, showCode, algoId, customCode, W, H]);

  const playEvent = (f: Frame | null | undefined) => {
    if (!f) return;
    const ev = f.event;
    let pitch = 0.5;
    const idx = f.swap[0] ?? f.highlight[0];
    if (idx != null && f.arr[idx] != null) {
      pitch = f.arr[idx] / Math.max(...f.arr, 1);
    }
    if (ev === "compare") audioEngine.playSfx(sfxCompare, pitch);
    else if (ev === "swap" || ev === "found" || ev === "visit") audioEngine.playSfx(sfxSwap, pitch);
  };

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  useEffect(() => {
    if (!playing) return;
    audioEngine.resume();
    lastRef.current = performance.now();
    const tick = (time: number) => {
      const baseInterval = 1000 / (fps * speed);
      const currentFrame = frames[Math.min(frameIdx, frames.length - 1)];
      const previousFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
      const interval = shouldAnimateSwap(currentFrame, previousFrame)
        ? baseInterval * SWAP_TRANSITION_MULTIPLIER
        : baseInterval;
      const elapsed = time - lastRef.current;
      setTransitionProgress(Math.min(1, elapsed / interval));
      if (elapsed >= interval) {
        lastRef.current = time;
        setFrameIdx((i) => {
          const next = i + 1;
          if (next >= frames.length) { setPlaying(false); return i; }
          playEvent(frames[next]);
          setTransitionProgress(0);
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, fps, speed, frames, frameIdx]);

  const newArray = () => {
    if (!requireConfigAccess()) return;
    const trimmed = input.trim();
    const inputMatchesCurrentArray = trimmed === arr.join(", ");
    let next = trimmed && !inputMatchesCurrentArray
      ? parseInputArray(input)
      : demoArrayForAlgorithm(algoId, size);
    if (!next.length) next = demoArrayForAlgorithm(algoId, size);
    setArr(next);
    setInput(next.join(", "));
    setFrameIdx(0);
    setTransitionProgress(1);
    setPlaying(false);
  };

  const setSize = (nextSize: number) => {
    if (!requireConfigAccess()) return;
    setSizeState(nextSize);
    const next = demoArrayForAlgorithm(algoId, nextSize);
    setArr(next);
    setInput(next.join(", "));
    setFrameIdx(0);
    setTransitionProgress(1);
    setPlaying(false);
  };

  const onMusicUpload = (file: File) => {
    if (!requireConfigAccess()) return;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicUrl(URL.createObjectURL(file));
  };

  const exportVideo = async () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;

    audioEngine.resume();
    const videoStream = c.captureStream(0) as MediaStream;
    const track = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const audioStream = audioEngine.getRecordStream();
    const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
    const format = getExportFormat(exportFormat);
    const mimeType = format.mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      toast.error(`${format.label}: ${tr("unsupportedExport")}`);
      return;
    }
    await Promise.all([preloadAssetSfx(sfxCompare), preloadAssetSfx(sfxSwap)]);

    const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    setExporting(true);
    setExportProgress(0);
    setPlaying(false);
    if (isProceduralMusicPreset(musicPreset)) audioEngine.setMusicPreset(musicPreset);
    else {
      audioEngine.setMusicPreset("custom");
      audioEngine.startMusic();
    }
    recorder.start();

    const code = algoId === "custom" ? customCode : algo.code;
    const opts = { title, subtitle, theme, code, showCode, complexity: COMPLEXITY[algoId], algorithmId: algoId };
    for (let i = 0; i < frames.length; i++) {
      playEvent(frames[i]);
      const previousFrame = i > 0 ? frames[i - 1] : null;
      const transitionFrames = shouldAnimateSwap(frames[i], previousFrame)
        ? Math.max(6, Math.round(fps * SWAP_EXPORT_SECONDS))
        : 1;
      for (let step = 1; step <= transitionFrames; step++) {
        renderFrame(ctx, frames[i], {
          ...opts,
          previousFrame,
          transitionProgress: step / transitionFrames,
        }, W, H);
        track.requestFrame();
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }
      setExportProgress(Math.round(((i + 1) / frames.length) * 100));
    }
    for (let i = 0; i < fps * 3; i++) {
      track.requestFrame();
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
    recorder.stop();
    audioEngine.stopMusic();
    audioEngine.setMusicPreset("off");
    const blob = await done;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${algo.id}-${platform.id}-${Date.now()}.${format.id}`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success(tr("exportDone"));
  };

  const requestExport = () => {
    if (!requireConfigAccess()) return;
    void exportVideo();
  };

  const requireConfigAccess = () => options.requireConfigAccess?.() ?? true;
  const runConfigAction = (action: () => void) => {
    if (!requireConfigAccess()) return;
    action();
  };

  return {
    lang, setLang, tr, algoId, setAlgoId, size, setSize,
    input, setInput: (value: string) => runConfigAction(() => setInput(value)),
    target, setTarget: (value: string) => runConfigAction(() => setTarget(value)),
    themeName, setThemeName: (value: keyof typeof THEMES) => runConfigAction(() => setThemeName(value)),
    theme, setTheme: (value: Theme) => runConfigAction(() => setTheme(value)),
    title, setTitle: (value: string) => runConfigAction(() => setTitle(value)),
    subtitle, setSubtitle: (value: string) => runConfigAction(() => setSubtitle(value)),
    showCode, setShowCode: (value: boolean) => runConfigAction(() => setShowCode(value)),
    fps, setFps: (value: number) => runConfigAction(() => setFps(value)),
    speed, setSpeed: (value: number) => runConfigAction(() => setSpeed(value)),
    playing, setPlaying, frameIdx, setFrameIdx,
    exporting, exportProgress, exportFormat, setExportFormat: (value: ExportFormat) => runConfigAction(() => setExportFormat(value)),
    platformId, setPlatformId: (value: typeof platformId) => runConfigAction(() => setPlatformId(value)), platform,
    W, H, sfxCompare, setSfxCompare: (value: SfxKind) => runConfigAction(() => setSfxCompare(value)),
    sfxSwap, setSfxSwap: (value: SfxKind) => runConfigAction(() => setSfxSwap(value)),
    sfxVol, setSfxVol: (value: number) => runConfigAction(() => setSfxVol(value)),
    musicVol, setMusicVol: (value: number) => runConfigAction(() => setMusicVol(value)),
    musicPreset, setMusicPreset: (value: BackgroundMusicId) => runConfigAction(() => setMusicPreset(value)),
    customCode, setCustomCode: (value: string) => runConfigAction(() => setCustomCode(value)),
    graphInput, setGraphInput: (value: string) => runConfigAction(() => setGraphInput(value)),
    startLabel, setStartLabel: (value: string) => runConfigAction(() => setStartLabel(value)),
    endLabel, setEndLabel: (value: string) => runConfigAction(() => setEndLabel(value)),
    algo, isGraph, graphLabels, frames, canvasRef,
    current, isSearch, isCustom, codeForPanel, newArray, onMusicUpload, requestExport,
  };
}

export type AlgorithmStudio = ReturnType<typeof useAlgorithmStudio>;

function shouldAnimateSwap(frame: Frame, previousFrame: Frame | null) {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return false;
  const [a, b] = frame.swap;
  return previousFrame.arr.length === frame.arr.length
    && previousFrame.arr[a] === frame.arr[b]
    && previousFrame.arr[b] === frame.arr[a];
}

async function preloadAssetSfx(kind: SfxKind) {
  const option = getAssetSfxOption(kind);
  if (!option) return;
  try {
    const url = await option.loadUrl();
    await audioEngine.loadAssetSfx(option.id, url);
  } catch {
    // Export/playback should keep running even if one optional SFX asset fails.
  }
}
