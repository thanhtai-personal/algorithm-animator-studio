import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ALGORITHMS, COMPLEXITY, parseGraph } from "@/lib/algorithms";
import type { ColumnVisualMode } from "@/lib/animalColumns";
import { preloadAnimalSprites } from "@/lib/animalColumns";
import { buildLongContentScenes, getSceneAtTime, getTotalDuration } from "@/lib/longContentTimeline";
import { renderLongContentFrame } from "@/lib/longContentRenderer";
import { THEMES } from "@/lib/renderer";
import { ExportFormat, getExportFormat } from "../studio/exportFormats";
import { demoAnimalArray, demoArrayForAlgorithm, demoSizeForAlgorithm } from "../studio/demoArrays";

const LONG_W = 1920;
const LONG_H = 1080;
const DEFAULT_GRAPH = "A-B:4, A-C:2, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-G:3, F-G:1";

export function useLongContentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const algo = ALGORITHMS[algoId];
  const theme = THEMES[themeName];
  const graph = useMemo(() => parseGraph(DEFAULT_GRAPH), []);
  const scenes = useMemo(() => buildLongContentScenes({
    algo,
    complexity: COMPLEXITY[algoId],
    animationSeconds,
    introSeconds,
  }), [algo, algoId, animationSeconds, introSeconds]);
  const totalDuration = useMemo(() => getTotalDuration(scenes), [scenes]);

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
    const { scene, progress } = timelineState;
    const multiplier = scene.animation ? progress : elapsedSec / Math.max(1, totalDuration);
    return Math.min(frames.length - 1, Math.floor(multiplier * (frames.length - 1)));
  }, [elapsedSec, frames.length, timelineState, totalDuration]);

  useEffect(() => { preloadAnimalSprites(); }, []);
  useEffect(() => { setElapsedSec(0); setPlaying(false); }, [algoId, animationSeconds, introSeconds]);
  useEffect(() => { drawFrame(elapsedSec); });

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

  function drawFrame(timeSec: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !frames.length) return;
    const state = getSceneAtTime(scenes, timeSec);
    const localFrameIdx = getFrameIndexForTime(timeSec, state.scene.animation);
    const frame = frames[localFrameIdx];
    const previousFrame = localFrameIdx > 0 ? frames[localFrameIdx - 1] : null;
    renderLongContentFrame(ctx, {
      frame,
      previousFrame,
      scene: state.scene,
      sceneProgress: state.progress,
      timelineProgress: timeSec / Math.max(1, totalDuration),
      algoId,
      algoName: algo.name,
      code: algo.code,
      theme,
      showCode,
      animalColumns: { mode: columnVisualMode, spriteScale: animalSpriteScale, jumpIntensity: animalJumpIntensity, highlightJump: animalHighlightJump },
      frameLabel: `Frame ${localFrameIdx + 1}/${frames.length} · ${formatTime(timeSec)} / ${formatTime(totalDuration)}`,
    });
  }

  function getFrameIndexForTime(timeSec: number, sceneAnimation?: boolean) {
    if (!frames.length) return 0;
    const state = getSceneAtTime(scenes, timeSec);
    const progress = sceneAnimation ? state.progress : timeSec / Math.max(1, totalDuration);
    return Math.min(frames.length - 1, Math.floor(progress * (frames.length - 1)));
  }

  async function exportVideo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const stream = canvas.captureStream(0) as MediaStream;
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const format = getExportFormat(exportFormat);
    const mimeType = format.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!mimeType) {
      toast.error(`${format.label}: trình duyệt chưa hỗ trợ xuất định dạng này.`);
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    setExporting(true);
    setExportProgress(0);
    setPlaying(false);
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
    const blob = await done;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${algo.id}-long-16x9-${Date.now()}.${format.id}`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success("Đã xuất long video 16:9!");
  }

  return {
    canvasRef, algoId, setAlgoId, algo, themeName, setThemeName, showCode, setShowCode,
    columnVisualMode, setColumnVisualMode, animalSpriteScale, setAnimalSpriteScale,
    animalJumpIntensity, setAnimalJumpIntensity, animalHighlightJump, setAnimalHighlightJump,
    fps, setFps, animationSeconds, setAnimationSeconds, introSeconds, setIntroSeconds,
    exportFormat, setExportFormat, elapsedSec, setElapsedSec, playing, setPlaying,
    exporting, exportProgress, scenes, totalDuration, timelineState, frameIdx, frames,
    W: LONG_W, H: LONG_H, exportVideo,
  };
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export type LongContentStudio = ReturnType<typeof useLongContentStudio>;
