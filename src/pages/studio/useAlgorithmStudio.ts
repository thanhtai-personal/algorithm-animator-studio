import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ALGORITHMS, COMPLEXITY, DEFAULT_ALGORITHM_ID, Frame, parseGraph } from "@/lib/algorithms";
import { ColumnVisualMode, preloadAnimalSprites } from "@/lib/animalColumns";
import { audioEngine, SfxKind } from "@/lib/audio";
import { BackgroundMusicId, getAssetMusicOption, isAssetMusicId, isLibraryMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { Lang, PLATFORMS, readSystemLang, subscribeSystemLang, t, writeSystemLang } from "@/lib/i18n";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";
import { renderFrame, THEMES, Theme } from "@/lib/renderer";
import { buildYoutubeMetadata } from "@/lib/youtubeMetadata";
import { ExportFormat } from "./exportFormats";
import { demoAnimalArray, demoArrayForAlgorithm, demoSizeForAlgorithm, maxDemoSizeForAlgorithm, normalizeAnimalArray, parseInputArray, shouldUseAlgorithmDemo } from "./demoArrays";
import { exportAlgorithmVideo, preloadExportSfx } from "./videoExport";

const SWAP_TRANSITION_MULTIPLIER = 1.8;
const TREE_SORT_FRAME_MULTIPLIER = 2.4;
const DEFAULT_ANIMAL_ARRAY_SIZE = 14;

type UseAlgorithmStudioOptions = {
  requireConfigAccess?: () => boolean;
};

export function useAlgorithmStudio(options: UseAlgorithmStudioOptions = {}) {
  const [lang, setLangState] = useState<Lang>(() => readSystemLang("en"));
  const setLang = (nextLang: Lang) => {
    setLangState(nextLang);
    writeSystemLang(nextLang);
  };
  const tr = (k: Parameters<typeof t>[1]) => t(lang, k);

  const [algoId, setAlgoId] = useState(DEFAULT_ALGORITHM_ID);
  const [size, setSizeState] = useState(20);
  const initialArr = useMemo(() => demoArrayForAlgorithm(DEFAULT_ALGORITHM_ID, 20), []);
  const [input, setInput] = useState(initialArr.join(", "));
  const [target, setTarget] = useState("");
  const [arr, setArr] = useState<number[]>(initialArr);
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [theme, setTheme] = useState<Theme>(THEMES.neon);
  const [title, setTitle] = useState(ALGORITHMS[DEFAULT_ALGORITHM_ID].name);
  const [subtitle, setSubtitle] = useState("");
  const [showCode, setShowCode] = useState(true);
  const [columnVisualMode, setColumnVisualMode] = useState<ColumnVisualMode>("bar");
  const [animalSpriteScale, setAnimalSpriteScale] = useState(1);
  const [animalJumpIntensity, setAnimalJumpIntensity] = useState(1);
  const [animalHighlightJump, setAnimalHighlightJump] = useState(false);
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
  const [musicPreset, setMusicPreset] = useState<BackgroundMusicId>("off");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [libraryMusicTracks, setLibraryMusicTracks] = useState<MusicLibraryTrack[]>([]);
  const [customCode, setCustomCode] = useState(ALGORITHMS.custom.code);
  const [graphInput, setGraphInput] = useState(
    "A-B:4, A-C:2, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-G:3, F-G:1, F-H:7, G-I:4, H-I:2, H-J:5, I-K:6, J-K:3, J-L:8, K-L:2"
  );
  const [startLabel, setStartLabel] = useState("A");
  const [endLabel, setEndLabel] = useState("L");

  useEffect(() => subscribeSystemLang(setLangState), []);

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
  const randomSizeMax = maxDemoSizeForAlgorithm(algoId);
  const codeForPanel = isCustom ? customCode : algo.code;
  const animalColumns = useMemo(() => ({
    mode: columnVisualMode,
    spriteScale: animalSpriteScale,
    jumpIntensity: animalJumpIntensity,
    highlightJump: animalHighlightJump,
  }), [columnVisualMode, animalSpriteScale, animalJumpIntensity, animalHighlightJump]);

  useEffect(() => { setTitle(algo.name); }, [algo]);
  useEffect(() => { preloadAnimalSprites(); }, []);
  useEffect(() => {
    if (!shouldUseAlgorithmDemo(algoId, arr)) return;
    const nextSize = demoSizeForAlgorithm(algoId, size);
    const next = columnVisualMode === "animal" ? demoAnimalArray(nextSize) : demoArrayForAlgorithm(algoId, nextSize);
    if (nextSize !== size) setSizeState(nextSize);
    setArr(next);
    setInput(next.join(", "));
    setFrameIdx(0);
    setTransitionProgress(1);
    setPlaying(false);
  }, [algoId]);
  useEffect(() => { setTheme(THEMES[themeName]); }, [themeName]);
  useEffect(() => {
    let cancelled = false;
    const loadTracks = () => getMusicLibraryTracks()
      .then((tracks) => { if (!cancelled) setLibraryMusicTracks(tracks); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không đọc được MUSIC_LIBRARY_DIR."));
    void loadTracks();
    window.addEventListener("algo:runtime-settings-change", loadTracks);
    return () => {
      cancelled = true;
      window.removeEventListener("algo:runtime-settings-change", loadTracks);
    };
  }, []);
  useEffect(() => { audioEngine.setSfxVolume(sfxVol / 100); }, [sfxVol]);
  useEffect(() => { audioEngine.setMusicVolume(musicVol / 100); }, [musicVol]);
  useEffect(() => {
    void preloadExportSfx(sfxCompare);
  }, [sfxCompare]);
  useEffect(() => {
    void preloadExportSfx(sfxSwap);
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
    } else if (isLibraryMusicId(musicPreset)) {
      const track = libraryMusicTracks.find((item) => item.id === musicPreset);
      audioEngine.setMusicSource(track?.audioUrl ?? null);
      if (track && playing) {
        audioEngine.setMusicPreset("custom");
        audioEngine.startMusic();
      }
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
  }, [musicPreset, musicUrl, playing, libraryMusicTracks]);
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
      animalColumns,
    }, W, H);
  }, [frames, frameIdx, transitionProgress, title, subtitle, theme, algo.code, showCode, algoId, customCode, animalColumns, W, H]);

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
      const algorithmMultiplier = algoId === "tree_sort" ? TREE_SORT_FRAME_MULTIPLIER : 1;
      const interval = shouldAnimateSwap(currentFrame, previousFrame)
        ? baseInterval * SWAP_TRANSITION_MULTIPLIER * algorithmMultiplier
        : baseInterval * algorithmMultiplier;
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
  }, [playing, fps, speed, frames, frameIdx, algoId]);

  const newArray = () => {
    if (!requireConfigAccess()) return;
    const trimmed = input.trim();
    const inputMatchesCurrentArray = trimmed === arr.join(", ");
    let next = columnVisualMode === "animal" ? demoAnimalArray(size) : trimmed && !inputMatchesCurrentArray
      ? parseInputArray(input)
      : demoArrayForAlgorithm(algoId, size);
    if (columnVisualMode === "animal") next = normalizeAnimalArray(next);
    if (!next.length) next = columnVisualMode === "animal" ? demoAnimalArray(size) : demoArrayForAlgorithm(algoId, size);
    setSizeState(next.length);
    setArr(next);
    setInput(next.join(", "));
    setFrameIdx(0);
    setTransitionProgress(1);
    setPlaying(false);
  };

  const setSize = (nextSize: number) => {
    if (!requireConfigAccess()) return;
    const effectiveSize = demoSizeForAlgorithm(algoId, nextSize);
    setSizeState(effectiveSize);
    const next = columnVisualMode === "animal" ? demoAnimalArray(effectiveSize) : demoArrayForAlgorithm(algoId, effectiveSize);
    setArr(next);
    setInput(next.join(", "));
    setFrameIdx(0);
    setTransitionProgress(1);
    setPlaying(false);
  };

  const setColumnVisualModeWithDefaults = (value: ColumnVisualMode) => {
    if (!requireConfigAccess()) return;
    setColumnVisualMode(value);
    if (value !== "animal") return;
    const next = demoAnimalArray(DEFAULT_ANIMAL_ARRAY_SIZE);
    setSizeState(DEFAULT_ANIMAL_ARRAY_SIZE);
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
    setExporting(true);
    setExportProgress(0);
    setPlaying(false);

    const code = algoId === "custom" ? customCode : algo.code;
    const musicLicenseText = libraryMusicTracks.find((track) => track.id === musicPreset)?.licenseText;
    try {
      const exported = await exportAlgorithmVideo({
        frames,
        fps,
        width: W,
        height: H,
        title,
        subtitle,
        theme,
        code,
        showCode,
        complexity: COMPLEXITY[algoId],
        algorithmId: algo.id,
        platformId: platform.id,
        exportFormat,
        animalColumns,
        musicPreset,
        youtubeMetadata: buildYoutubeMetadata(algo.id, lang, "short"),
        youtubeDescriptionAppend: musicLicenseText,
        sfxCompare,
        sfxSwap,
        onProgress: setExportProgress,
        onUnsupportedFormat: (label) => toast.error(`${label}: ${tr("unsupportedExport")}`),
        playEvent,
      });
      if (exported) toast.success(tr("exportDone"));
    } finally {
      setExporting(false);
    }
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
  const setInputWithSize = (value: string) => runConfigAction(() => {
    if (columnVisualMode === "animal") return;
    setInput(value);
    const parsed = parseInputArray(value);
    if (parsed.length) setSizeState(parsed.length);
  });

  return {
    lang, setLang, tr, algoId, setAlgoId, size, setSize,
    input, setInput: setInputWithSize,
    target, setTarget: (value: string) => runConfigAction(() => setTarget(value)),
    themeName, setThemeName: (value: keyof typeof THEMES) => runConfigAction(() => setThemeName(value)),
    theme, setTheme: (value: Theme) => runConfigAction(() => setTheme(value)),
    title, setTitle: (value: string) => runConfigAction(() => setTitle(value)),
    subtitle, setSubtitle: (value: string) => runConfigAction(() => setSubtitle(value)),
    showCode, setShowCode: (value: boolean) => runConfigAction(() => setShowCode(value)),
    columnVisualMode, setColumnVisualMode: setColumnVisualModeWithDefaults,
    animalSpriteScale, setAnimalSpriteScale: (value: number) => runConfigAction(() => setAnimalSpriteScale(value)),
    animalJumpIntensity, setAnimalJumpIntensity: (value: number) => runConfigAction(() => setAnimalJumpIntensity(value)),
    animalHighlightJump, setAnimalHighlightJump: (value: boolean) => runConfigAction(() => setAnimalHighlightJump(value)),
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
    libraryMusicTracks,
    customCode, setCustomCode: (value: string) => runConfigAction(() => setCustomCode(value)),
    graphInput, setGraphInput: (value: string) => runConfigAction(() => setGraphInput(value)),
    startLabel, setStartLabel: (value: string) => runConfigAction(() => setStartLabel(value)),
    endLabel, setEndLabel: (value: string) => runConfigAction(() => setEndLabel(value)),
    algo, isGraph, graphLabels, frames, canvasRef, randomSizeMax,
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
