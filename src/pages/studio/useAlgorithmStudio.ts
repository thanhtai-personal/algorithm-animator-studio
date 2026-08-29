import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ALGORITHMS,
  COMPLEXITY,
  DEFAULT_ALGORITHM_ID,
  Frame,
  parseGraph,
  type AlgorithmWorldAlgorithmId,
  type AlgorithmWorldMazeId,
  type AlgorithmWorldPresentationMode,
  type AlgorithmWorldProblemType,
  type AlgorithmWorldTournamentResults,
  type AlgorithmWorldTournamentRound,
  type AlgorithmWorldVideoMode,
} from "@/lib/algorithms";
import { ColumnVisualMode, preloadAnimalSprites } from "@/lib/animalColumns";
import { audioEngine, SfxKind } from "@/lib/audio";
import type { BackgroundMusicId } from "@/lib/backgroundMusic";
import { Lang, PLATFORMS, readSystemLang, subscribeSystemLang, t, writeSystemLang } from "@/lib/i18n";
import { THEMES, Theme } from "@/lib/renderer";
import type { ShortVideoType } from "@/lib/shortVideoTypes";
import { isAlgorithm3DStoryMode, type AlgorithmVideoRenderMode } from "@/lib/algorithmVideoRenderMode";
import { createDefaultAlgorithmVideoAds, type AlgorithmVideoAdId, type AlgorithmVideoAdSlotId } from "@/lib/algorithmVideoAds";
import { buildMazeTournamentSeriesYoutubeMetadata, buildMazeTournamentYoutubeMetadata, buildYoutubeMetadata } from "@/lib/youtubeMetadata";
import { ExportFormat } from "./exportFormats";
import { demoAnimalArray, demoArrayForAlgorithm, demoSizeForAlgorithm, maxDemoSizeForAlgorithm, shouldUseAlgorithmDemo } from "./demoArrays";
import { exportAlgorithmVideo } from "./videoExport";
import { renderStudioPreview } from "./renderStudioPreview";
import { buildWorldTournamentTimeline, findTournamentWinner } from "./tournamentTimeline";
import { getWorldVehicle } from "@/lib/algorithmWorldVehicles";
import { nextTournamentEntrants, normalizeTournamentEntrants, normalizeTournamentMatch, normalizeTournamentRound, tournamentResultKey } from "@/lib/algorithmWorldTournament";
import { createWorldRandomSeed, readTournamentResults, readTournamentSettings, tournamentMusicForFrame, tournamentMusicLicenseText, writeTournamentResults, writeTournamentSettings, type StoredTournamentSettings } from "./studioTournamentStorage";
import { useAlgorithmStudioPlayback } from "./useAlgorithmStudioPlayback";
import { useAlgorithmStudioMusic } from "./useAlgorithmStudioMusic";
import { useAlgorithmStudioArrayControls } from "./useAlgorithmStudioArrayControls";


type UseAlgorithmStudioOptions = {
  requireConfigAccess?: () => boolean;
  requireExportAccess?: () => boolean;
  exportLocked?: boolean;
  initialAlgorithmId?: string;
  initialTitle?: string;
  initialSubtitle?: string;
  initialPlatformId?: (typeof PLATFORMS)[number]["id"];
  initialShowCode?: boolean;
  initialWorldVideoMode?: AlgorithmWorldVideoMode;
  initialWorldCompareEnabled?: boolean;
  initialWorldPresentationMode?: AlgorithmWorldPresentationMode;
  initialWorldProblemType?: AlgorithmWorldProblemType;
  initialWorldMazeId?: AlgorithmWorldMazeId;
  initialWorldPrimaryAlgorithm?: AlgorithmWorldAlgorithmId;
  initialWorldSecondaryAlgorithm?: AlgorithmWorldAlgorithmId;
  initialWorldTournamentEnabled?: boolean;
  enableWorldTournamentIntegration?: boolean;
  enableMazePathfinding?: boolean;
  enableWorldSceneMusic?: boolean;
  initialWorldTournamentRound?: AlgorithmWorldTournamentRound;
  initialWorldTournamentMatch?: number;
};

export function useAlgorithmStudio(options: UseAlgorithmStudioOptions = {}) {
  const [lang, setLangState] = useState<Lang>(() => readSystemLang("en"));
  const setLang = (nextLang: Lang) => {
    setLangState(nextLang);
    writeSystemLang(nextLang);
  };
  const tr = (k: Parameters<typeof t>[1]) => t(lang, k);

  const initialAlgoId = options.initialAlgorithmId && ALGORITHMS[options.initialAlgorithmId]
    ? options.initialAlgorithmId
    : DEFAULT_ALGORITHM_ID;
  const [algoId, setAlgoId] = useState(initialAlgoId);
  const [size, setSizeState] = useState(20);
  const initialArr = useMemo(() => demoArrayForAlgorithm(initialAlgoId, 20), [initialAlgoId]);
  const [input, setInput] = useState(initialArr.join(", "));
  const [target, setTarget] = useState("");
  const [arr, setArr] = useState<number[]>(initialArr);
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [theme, setTheme] = useState<Theme>(THEMES.neon);
  const [title, setTitle] = useState(options.initialTitle ?? ALGORITHMS[initialAlgoId].name);
  const [subtitle, setSubtitle] = useState(options.initialSubtitle ?? "");
  const [showCode, setShowCode] = useState(options.initialShowCode ?? true);
  const [shortVideoType, setShortVideoType] = useState<ShortVideoType>("classic");
  const [videoRenderMode, setVideoRenderMode] = useState<AlgorithmVideoRenderMode>("2d");
  const [algorithmVideoAds, setAlgorithmVideoAds] = useState(createDefaultAlgorithmVideoAds);
  const [worldVideoMode, setWorldVideoModeState] = useState<AlgorithmWorldVideoMode>(options.initialWorldVideoMode ?? "short");
  const [worldCompareEnabled, setWorldCompareEnabledState] = useState(options.initialWorldCompareEnabled ?? (options.initialWorldVideoMode === "long"));
  const [worldPresentationMode, setWorldPresentationModeState] = useState<AlgorithmWorldPresentationMode>(options.initialWorldPresentationMode ?? "vehicle_race");
  const [worldProblemType, setWorldProblemTypeState] = useState<AlgorithmWorldProblemType>(options.initialWorldProblemType ?? "escape");
  const [worldMazeId, setWorldMazeIdState] = useState<AlgorithmWorldMazeId>(options.initialWorldMazeId ?? "astar_labyrinth");
  const [worldPrimaryAlgorithm, setWorldPrimaryAlgorithmState] = useState<AlgorithmWorldAlgorithmId>(options.initialWorldPrimaryAlgorithm ?? "astar");
  const [worldSecondaryAlgorithm, setWorldSecondaryAlgorithmState] = useState<AlgorithmWorldAlgorithmId>(options.initialWorldSecondaryAlgorithm ?? "dijkstra");
  const initialTournamentSettings = useMemo(() => readTournamentSettings(), []);
  const [worldTournamentEnabled, setWorldTournamentEnabledState] = useState(options.initialWorldTournamentEnabled ?? initialTournamentSettings.enabled);
  const worldTournamentActive = options.enableWorldTournamentIntegration !== false && worldTournamentEnabled;
  const mazePathfindingEnabled = options.enableMazePathfinding !== false;
  const worldSceneMusicActive = options.enableWorldSceneMusic ?? mazePathfindingEnabled;
  const requireConfigAccess = () => options.requireConfigAccess?.() ?? true;
  const [worldTournamentRound, setWorldTournamentRoundState] = useState<AlgorithmWorldTournamentRound>(options.initialWorldTournamentRound ?? initialTournamentSettings.round);
  const [worldTournamentMatch, setWorldTournamentMatchState] = useState(options.initialWorldTournamentMatch ?? initialTournamentSettings.match);
  const [worldTournamentEntrants, setWorldTournamentEntrants] = useState<AlgorithmWorldAlgorithmId[]>(initialTournamentSettings.entrants);
  const [worldTournamentPlaylistUrl, setWorldTournamentPlaylistUrlState] = useState(initialTournamentSettings.playlistUrl);
  const [worldTournamentResults, setWorldTournamentResultsState] = useState<AlgorithmWorldTournamentResults>(() => readTournamentResults());
  const [worldRandomSeed, setWorldRandomSeed] = useState(initialTournamentSettings.worldRandomSeed);
  const [worldPrimaryVehicleId, setWorldPrimaryVehicleIdState] = useState("bolt");
  const [worldSecondaryVehicleId, setWorldSecondaryVehicleIdState] = useState("comet");
  const [worldPrimaryVehicleColor, setWorldPrimaryVehicleColorState] = useState("#34d399");
  const [worldSecondaryVehicleColor, setWorldSecondaryVehicleColorState] = useState("#facc15");
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

  const [platformId, setPlatformId] = useState<(typeof PLATFORMS)[number]["id"]>(options.initialPlatformId ?? "tiktok");
  const platform = PLATFORMS.find((p) => p.id === platformId)!;
  const W = platform.w;
  const H = platform.h;

  const [sfxCompare, setSfxCompare] = useState<SfxKind>("blip");
  const [sfxSwap, setSfxSwap] = useState<SfxKind>("marimba");
  const [sfxVol, setSfxVol] = useState(60);
  const [musicVol, setMusicVol] = useState(30);
  const [musicPreset, setMusicPreset] = useState<BackgroundMusicId>("off");
  const [worldTournamentStartMusic, setWorldTournamentStartMusic] = useState<BackgroundMusicId>(initialTournamentSettings.startMusic);
  const [worldTournamentRaceMusic, setWorldTournamentRaceMusic] = useState<BackgroundMusicId>(initialTournamentSettings.raceMusic);
  const [worldTournamentResultMusic, setWorldTournamentResultMusic] = useState<BackgroundMusicId>(initialTournamentSettings.resultMusic);
  const [musicSearch, setMusicSearch] = useState("");
  const [customCode, setCustomCode] = useState(ALGORITHMS.custom.code);
  const [graphInput, setGraphInput] = useState(
    "A-B:4, A-C:2, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-G:3, F-G:1, F-H:7, G-I:4, H-I:2, H-J:5, I-K:6, J-K:3, J-L:8, K-L:2"
  );
  const [startLabel, setStartLabel] = useState("A");
  const [endLabel, setEndLabel] = useState("L");

  useEffect(() => subscribeSystemLang(setLangState), []);

  const algo = ALGORITHMS[algoId];
  useEffect(() => {
    if (!mazePathfindingEnabled && algoId === "astar") setAlgoId("bubble");
  }, [algoId, mazePathfindingEnabled]);
  const isGraph = algo.category === "graph";
  useEffect(() => {
    if (algo.category !== "sort" && isAlgorithm3DStoryMode(videoRenderMode)) setVideoRenderMode("3d");
  }, [algo.category, videoRenderMode]);
  const parsedGraph = useMemo(() => isGraph ? parseGraph(graphInput) : null, [isGraph, graphInput]);
  const graphLabels = parsedGraph?.nodes.map((n) => n.label ?? String(n.id)) ?? [];
  const startId = graphLabels.indexOf(startLabel);
  const endId = graphLabels.indexOf(endLabel);

  const generatedTimeline = useMemo(() => {
    const targetNum = target.trim() ? parseInt(target, 10) : undefined;
    const runOptions = {
      target: Number.isNaN(targetNum as number) ? undefined : targetNum,
      customCode,
      graph: parsedGraph ?? undefined,
      start: startId >= 0 ? startId : undefined,
      end: endId >= 0 ? endId : undefined,
    };
    const worldScenario = {
      videoMode: worldVideoMode,
      compareEnabled: mazePathfindingEnabled && (worldCompareEnabled || worldPresentationMode === "vehicle_race"),
      presentationMode: worldPresentationMode,
      problemType: worldProblemType,
      mazeId: worldMazeId,
      primaryAlgorithm: worldPrimaryAlgorithm,
      secondaryAlgorithm: worldSecondaryAlgorithm,
      primaryVehicleColor: worldPrimaryVehicleColor,
      secondaryVehicleColor: worldSecondaryVehicleColor,
      primaryVehicleId: worldPrimaryVehicleId,
      secondaryVehicleId: worldSecondaryVehicleId,
      tournamentEnabled: worldTournamentActive,
      tournamentRound: worldTournamentRound,
      tournamentMatch: worldTournamentMatch,
      tournamentResults: worldTournamentResults,
      tournamentEntrants: worldTournamentEntrants,
      randomSeed: worldRandomSeed,
    };
    if (worldTournamentActive && worldVideoMode === "long") {
      return buildWorldTournamentTimeline({ run: algo.run, arr, runOptions, worldScenario });
    }
    return {
      frames: algo.run(arr, { ...runOptions, worldScenario }),
      results: {},
    };
  }, [algo, arr, target, customCode, parsedGraph, startId, endId, worldVideoMode, worldCompareEnabled, worldPresentationMode, worldProblemType, worldMazeId, worldPrimaryAlgorithm, worldSecondaryAlgorithm, worldPrimaryVehicleColor, worldSecondaryVehicleColor, worldPrimaryVehicleId, worldSecondaryVehicleId, worldTournamentActive, worldTournamentRound, worldTournamentMatch, worldTournamentResults, worldTournamentEntrants, worldRandomSeed, mazePathfindingEnabled]);
  const frames: Frame[] = generatedTimeline.frames;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = frames[Math.min(frameIdx, frames.length - 1)];
  const activeMusicPreset = useMemo(() => {
    if (!worldSceneMusicActive) return musicPreset;
    const scenePreset = tournamentMusicForFrame(current, {
      start: worldTournamentStartMusic,
      race: worldTournamentRaceMusic,
      result: worldTournamentResultMusic,
    });
    return scenePreset === "off" ? musicPreset : scenePreset;
  }, [current, musicPreset, worldSceneMusicActive, worldTournamentStartMusic, worldTournamentRaceMusic, worldTournamentResultMusic]);
  const { libraryMusicTracks, onMusicUpload, resolveMusicUrl } = useAlgorithmStudioMusic({
    activeMusicPreset,
    playing,
    sfxCompare,
    sfxSwap,
    sfxVol,
    musicVol,
    requireConfigAccess,
  });
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

  useEffect(() => {
    setTitle(options.initialTitle && algo.id === initialAlgoId ? options.initialTitle : algo.name);
  }, [algo, initialAlgoId, options.initialTitle]);
  useEffect(() => { preloadAnimalSprites(); }, []);
  useEffect(() => {
    if (!mazePathfindingEnabled || algoId !== "astar") return;
    setPlatformId(worldVideoMode === "long" ? "landscape" : "shorts");
  }, [algoId, mazePathfindingEnabled, worldVideoMode]);
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
  useEffect(() => { if (!playing) setTransitionProgress(1); }, [playing, frameIdx]);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    const f = frames[Math.min(frameIdx, frames.length - 1)];
    if (!c || !ctx || !f) return;
    const code = algoId === "custom" ? customCode : algo.code;
    const previousFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
    renderStudioPreview({ ctx, frame: f, previousFrame, frameIndex: frameIdx, frameCount: frames.length, transitionProgress, width: W, height: H, shortVideoType, algorithmId: algoId, algoName: algo.name, lang, title, subtitle, theme, code, showCode, animalColumns });
  }, [frames, frameIdx, transitionProgress, title, subtitle, theme, algo.code, showCode, algoId, customCode, animalColumns, W, H, shortVideoType, algo.name, lang]);

  useEffect(() => {
    const intro = current?.worldCompare?.raceIntro;
    if (!worldTournamentActive || intro?.stage !== "bracket" || !intro.winnerAlgorithm) return;
    if (intro.tick < Math.max(0, intro.duration - 2)) return;
    persistTournamentResult(worldTournamentRound, worldTournamentMatch, intro.winnerAlgorithm);
  }, [current, worldTournamentActive, worldTournamentRound, worldTournamentMatch]);

  function persistTournamentResult(round: AlgorithmWorldTournamentRound, match: number, winner: AlgorithmWorldAlgorithmId) {
    const key = tournamentResultKey(round, normalizeTournamentMatch(round, match));
    setWorldTournamentResultsState((prev) => {
      if (prev[key] === winner) return prev;
      const next = { ...prev, [key]: winner };
      writeTournamentResults(next);
      return next;
    });
  }

  function resetWorldTournamentResults() {
    const nextEntrants = nextTournamentEntrants(worldTournamentEntrants, worldTournamentResults);
    setWorldTournamentResultsState({});
    writeTournamentResults({});
    setWorldTournamentEntrants(nextEntrants);
    setWorldTournamentRoundState(0);
    setWorldTournamentMatchState(0);
    writeTournamentSettings({
      enabled: worldTournamentEnabled,
      round: 0,
      match: 0,
      entrants: nextEntrants,
      playlistUrl: worldTournamentPlaylistUrl,
      startMusic: worldTournamentStartMusic,
      raceMusic: worldTournamentRaceMusic,
      resultMusic: worldTournamentResultMusic,
    });
    setFrameIdx(0);
    setPlaying(false);
  }

  const playEvent = useAlgorithmStudioPlayback({
    playing,
    setPlaying,
    fps,
    speed,
    frames,
    frameIdx,
    setFrameIdx,
    setTransitionProgress,
    algoId,
    shortVideoType,
    videoRenderMode,
    sfxCompare,
    sfxSwap,
  });

  const { newArray, setSize, setColumnVisualModeWithDefaults } = useAlgorithmStudioArrayControls({
    requireConfigAccess,
    input,
    arr,
    size,
    columnVisualMode,
    algoId,
    setSizeState,
    setArr,
    setInput,
    setFrameIdx,
    setTransitionProgress,
    setPlaying,
    setColumnVisualMode,
  });

  const exportVideo = async () => {
    setExporting(true);
    setExportProgress(0);
    setPlaying(false);

    const code = algoId === "custom" ? customCode : algo.code;
    const musicLicenseText = tournamentMusicLicenseText(
      worldSceneMusicActive
        ? [musicPreset, worldTournamentStartMusic, worldTournamentRaceMusic, worldTournamentResultMusic]
        : [musicPreset],
      libraryMusicTracks,
    );
    const youtubeMetadata = worldTournamentActive && worldVideoMode === "long"
      ? buildMazeTournamentSeriesYoutubeMetadata({
        lang,
        entrants: worldTournamentEntrants,
        playlistUrl: worldTournamentPlaylistUrl,
      })
      : worldTournamentActive
      ? buildMazeTournamentYoutubeMetadata({
        lang,
        round: worldTournamentRound,
        match: worldTournamentMatch,
        results: worldTournamentResults,
        entrants: worldTournamentEntrants,
        variant: worldVideoMode === "long" ? "long" : "short",
        playlistUrl: worldTournamentPlaylistUrl,
      })
      : buildYoutubeMetadata(algo.id, lang, "short");
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
        algoName: algo.name,
        lang,
        shortVideoType,
        videoRenderMode,
        algorithmVideoAds,
        platformId: platform.id,
        exportFormat,
        animalColumns,
        musicPreset,
        resolveMusicPreset: worldSceneMusicActive
          ? (frame) => {
            const scenePreset = tournamentMusicForFrame(frame, {
              start: worldTournamentStartMusic,
              race: worldTournamentRaceMusic,
              result: worldTournamentResultMusic,
            });
            return scenePreset === "off" ? musicPreset : scenePreset;
          }
          : undefined,
        resolveMusicUrl,
        youtubeMetadata,
        youtubeDescriptionAppend: musicLicenseText,
        sfxCompare,
        sfxSwap,
        onProgress: setExportProgress,
        onUnsupportedFormat: (label) => toast.error(`${label}: ${tr("unsupportedExport")}`),
        playEvent,
      });
      if (exported) {
        if (worldTournamentActive && worldVideoMode === "long" && Object.keys(generatedTimeline.results).length) {
          setWorldTournamentResultsState((prev) => {
            const next = { ...prev, ...generatedTimeline.results };
            writeTournamentResults(next);
            return next;
          });
        } else {
          const winner = findTournamentWinner(frames);
          if (worldTournamentActive && winner) persistTournamentResult(worldTournamentRound, worldTournamentMatch, winner);
        }
        toast.success(tr("exportDone"));
      }
    } finally {
      setExporting(false);
    }
  };

  const requestExport = () => {
    const canExport = options.requireExportAccess ? options.requireExportAccess() : requireConfigAccess();
    if (!canExport) return;
    void exportVideo();
  };

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
    lang, setLang, tr, algoId, setAlgoId: (value: string) => runConfigAction(() => setAlgoId(!mazePathfindingEnabled && value === "astar" ? "bubble" : value)), size, setSize,
    input, setInput: setInputWithSize,
    target, setTarget: (value: string) => runConfigAction(() => setTarget(value)),
    themeName, setThemeName: (value: keyof typeof THEMES) => runConfigAction(() => setThemeName(value)),
    theme, setTheme: (value: Theme) => runConfigAction(() => setTheme(value)),
    title, setTitle: (value: string) => runConfigAction(() => setTitle(value)),
    subtitle, setSubtitle: (value: string) => runConfigAction(() => setSubtitle(value)),
    shortVideoType, setShortVideoType: (value: ShortVideoType) => runConfigAction(() => setShortVideoType(value)),
    videoRenderMode, setVideoRenderMode: (value: AlgorithmVideoRenderMode) => runConfigAction(() => setVideoRenderMode(value)),
    algorithmVideoAds, setAlgorithmVideoAdForSlot: (slotId: AlgorithmVideoAdSlotId, value: AlgorithmVideoAdId) => runConfigAction(() => setAlgorithmVideoAds((current) => ({ ...current, [slotId]: value }))),
    worldVideoMode,
    worldCompareEnabled,
    setWorldVideoMode: (value: AlgorithmWorldVideoMode) => runConfigAction(() => { setWorldVideoModeState(value); setPlatformId(value === "long" ? "landscape" : "shorts"); if (value === "long") { setWorldCompareEnabledState(true); setShowCode(false); } setFrameIdx(0); setPlaying(false); }),
    setWorldCompareEnabled: (value: boolean) => runConfigAction(() => { setWorldCompareEnabledState(value); if (value) setShowCode(false); setFrameIdx(0); setPlaying(false); }),
    worldPresentationMode,
    setWorldPresentationMode: (value: AlgorithmWorldPresentationMode) => runConfigAction(() => { setWorldPresentationModeState(value); if (value === "vehicle_race") { setWorldCompareEnabledState(true); setShowCode(false); } setFrameIdx(0); setPlaying(false); }),
    worldProblemType,
    setWorldProblemType: (value: AlgorithmWorldProblemType) => runConfigAction(() => { setWorldProblemTypeState(value); setFrameIdx(0); setPlaying(false); }),
    worldMazeId,
    setWorldMazeId: (value: AlgorithmWorldMazeId) => runConfigAction(() => { if (value === "random" && worldMazeId !== "random") { const seed = createWorldRandomSeed(); setWorldRandomSeed(seed); writeCurrentTournamentSettings({ worldRandomSeed: seed }); } setWorldMazeIdState(value); setFrameIdx(0); setPlaying(false); }),
    worldPrimaryAlgorithm,
    setWorldPrimaryAlgorithm: (value: AlgorithmWorldAlgorithmId) => runConfigAction(() => { setWorldPrimaryAlgorithmState(value); setFrameIdx(0); setPlaying(false); }),
    worldSecondaryAlgorithm,
    setWorldSecondaryAlgorithm: (value: AlgorithmWorldAlgorithmId) => runConfigAction(() => { setWorldSecondaryAlgorithmState(value); setFrameIdx(0); setPlaying(false); }),
    worldTournamentEnabled: worldTournamentActive,
    worldSceneMusicEnabled: worldSceneMusicActive,
    setWorldTournamentEnabled: (value: boolean) => runConfigAction(() => { setWorldTournamentEnabledState(value); writeCurrentTournamentSettings({ enabled: value }); if (value) { setWorldPresentationModeState("vehicle_race"); setWorldCompareEnabledState(true); setShowCode(false); setWorldMazeIdState("random"); } setFrameIdx(0); setPlaying(false); }),
    worldTournamentRound,
    setWorldTournamentRound: (value: AlgorithmWorldTournamentRound) => runConfigAction(() => { const round = normalizeTournamentRound(value); setWorldTournamentRoundState(round); setWorldTournamentMatchState((m) => { const match = normalizeTournamentMatch(round, m); writeCurrentTournamentSettings({ round, match }); return match; }); setFrameIdx(0); setPlaying(false); }),
    worldTournamentMatch,
    setWorldTournamentMatch: (value: number) => runConfigAction(() => { const match = normalizeTournamentMatch(worldTournamentRound, value); setWorldTournamentMatchState(match); writeCurrentTournamentSettings({ match }); setFrameIdx(0); setPlaying(false); }),
    worldTournamentResults,
    worldTournamentEntrants,
    worldTournamentPlaylistUrl,
    setWorldTournamentPlaylistUrl: (value: string) => runConfigAction(() => { setWorldTournamentPlaylistUrlState(value); writeCurrentTournamentSettings({ playlistUrl: value }); }),
    resetWorldTournamentResults: () => runConfigAction(resetWorldTournamentResults),
    worldPrimaryVehicleColor,
    setWorldPrimaryVehicleColor: (value: string) => runConfigAction(() => { setWorldPrimaryVehicleColorState(value); setFrameIdx(0); setPlaying(false); }),
    worldSecondaryVehicleColor,
    setWorldSecondaryVehicleColor: (value: string) => runConfigAction(() => { setWorldSecondaryVehicleColorState(value); setFrameIdx(0); setPlaying(false); }),
    worldPrimaryVehicleId,
    setWorldPrimaryVehicleId: (value: string) => runConfigAction(() => { const vehicle = getWorldVehicle(value); setWorldPrimaryVehicleIdState(vehicle.id); setWorldPrimaryVehicleColorState(vehicle.color); setFrameIdx(0); setPlaying(false); }),
    worldSecondaryVehicleId,
    setWorldSecondaryVehicleId: (value: string) => runConfigAction(() => { const vehicle = getWorldVehicle(value); setWorldSecondaryVehicleIdState(vehicle.id); setWorldSecondaryVehicleColorState(vehicle.color); setFrameIdx(0); setPlaying(false); }),
    showCode, setShowCode: (value: boolean) => runConfigAction(() => { if (mazePathfindingEnabled && (worldCompareEnabled || worldPresentationMode === "vehicle_race") && value) return; setShowCode(value); }),
    columnVisualMode, setColumnVisualMode: setColumnVisualModeWithDefaults,
    animalSpriteScale, setAnimalSpriteScale: (value: number) => runConfigAction(() => setAnimalSpriteScale(value)),
    animalJumpIntensity, setAnimalJumpIntensity: (value: number) => runConfigAction(() => setAnimalJumpIntensity(value)),
    animalHighlightJump, setAnimalHighlightJump: (value: boolean) => runConfigAction(() => setAnimalHighlightJump(value)),
    fps, setFps: (value: number) => runConfigAction(() => setFps(value)),
    speed, setSpeed: (value: number) => runConfigAction(() => setSpeed(value)),
    playing, setPlaying, frameIdx, setFrameIdx, transitionProgress,
    exporting, exportProgress, exportFormat, setExportFormat: (value: ExportFormat) => runConfigAction(() => setExportFormat(value)),
    platformId, setPlatformId: (value: typeof platformId) => runConfigAction(() => setPlatformId(value)), platform,
    W, H, sfxCompare, setSfxCompare: (value: SfxKind) => runConfigAction(() => setSfxCompare(value)),
    sfxSwap, setSfxSwap: (value: SfxKind) => runConfigAction(() => setSfxSwap(value)),
    sfxVol, setSfxVol: (value: number) => runConfigAction(() => setSfxVol(value)),
    musicVol, setMusicVol: (value: number) => runConfigAction(() => setMusicVol(value)),
    musicPreset, setMusicPreset: (value: BackgroundMusicId) => runConfigAction(() => setMusicPreset(value)),
    worldTournamentStartMusic, setWorldTournamentStartMusic: (value: BackgroundMusicId) => runConfigAction(() => { setWorldTournamentStartMusic(value); writeCurrentTournamentSettings({ startMusic: value }); }),
    worldTournamentRaceMusic, setWorldTournamentRaceMusic: (value: BackgroundMusicId) => runConfigAction(() => { setWorldTournamentRaceMusic(value); writeCurrentTournamentSettings({ raceMusic: value }); }),
    worldTournamentResultMusic, setWorldTournamentResultMusic: (value: BackgroundMusicId) => runConfigAction(() => { setWorldTournamentResultMusic(value); writeCurrentTournamentSettings({ resultMusic: value }); }),
    musicSearch, setMusicSearch: (value: string) => runConfigAction(() => setMusicSearch(value)),
    libraryMusicTracks,
    customCode, setCustomCode: (value: string) => runConfigAction(() => setCustomCode(value)),
    graphInput, setGraphInput: (value: string) => runConfigAction(() => setGraphInput(value)),
    startLabel, setStartLabel: (value: string) => runConfigAction(() => setStartLabel(value)),
    endLabel, setEndLabel: (value: string) => runConfigAction(() => setEndLabel(value)),
    algo, isGraph, graphLabels, frames, canvasRef, randomSizeMax, mazePathfindingEnabled,
    current, isSearch, isCustom, codeForPanel, newArray, onMusicUpload, requestExport, exportLocked: options.exportLocked ?? false,
  };


  function writeCurrentTournamentSettings(overrides: Partial<StoredTournamentSettings>) {
    writeTournamentSettings({
      enabled: worldTournamentEnabled,
      round: worldTournamentRound,
      match: worldTournamentMatch,
      entrants: worldTournamentEntrants,
      playlistUrl: worldTournamentPlaylistUrl,
      worldRandomSeed,
      startMusic: worldTournamentStartMusic,
      raceMusic: worldTournamentRaceMusic,
      resultMusic: worldTournamentResultMusic,
      ...overrides,
    });
  }
}


export type AlgorithmStudio = ReturnType<typeof useAlgorithmStudio>;
