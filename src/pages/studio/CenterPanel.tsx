import { lazy, Suspense } from "react";
import { Download, Lock, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audio";
import { AlgorithmStudio } from "./useAlgorithmStudio";
import { COMPLEXITY } from "@/lib/algorithms";
import { canUseAlgorithm3DVideo, hasWebGLVideoSupport, isAlgorithm3DHyperMode, isAlgorithm3DRenderMode, isAlgorithm3DStoryMode } from "@/lib/algorithmVideoRenderMode";
import { uiText } from "@/lib/i18n";
import { videoPreviewViewportStyle } from "@/lib/videoPreviewViewport";

const PhaserMazePreview = lazy(() => import("../algorithm-world/PhaserMazePreview").then((module) => ({ default: module.PhaserMazePreview })));
const Algorithm3DPreview = lazy(() => import("@/features/algorithm-video-3d/Algorithm3DPreview").then((module) => ({ default: module.Algorithm3DPreview })));

type Props = { studio: AlgorithmStudio };

export function CenterPanel({ studio: s }: Props) {
  const showPhaserMaze = Boolean(s.current?.world || s.current?.worldCompare);
  const showAlgorithm3D = Boolean(
    isAlgorithm3DRenderMode(s.videoRenderMode)
    && s.current
    && hasWebGLVideoSupport()
    && canUseAlgorithm3DVideo({
      shortVideoType: s.shortVideoType,
      columnVisualMode: s.columnVisualMode,
      hasWorldScene: showPhaserMaze,
    }),
  );
  const previousFrame = s.frameIdx > 0 ? s.frames[s.frameIdx - 1] : null;
  const previewStyle = videoPreviewViewportStyle(s.W, s.H);

  return (
    <div className="flex min-w-0 flex-col items-center gap-4">
      <Card className="w-full min-w-0 overflow-hidden bg-card/50 p-3">
        {showPhaserMaze ? (
          <>
            <Suspense fallback={<div className="mx-auto grid place-items-center rounded-lg bg-slate-950 text-sm text-cyan-200" style={previewStyle}>{uiText("Loading Phaser scene...")}</div>}>
              <PhaserMazePreview key={`${s.W}x${s.H}`} frame={s.current} width={s.W} height={s.H} title={s.title} subtitle={s.subtitle} theme={s.theme} lang={s.lang} />
            </Suspense>
            <canvas ref={s.canvasRef} width={s.W} height={s.H} className="hidden" />
          </>
        ) : showAlgorithm3D && s.current ? (
          <>
            <Suspense fallback={<div className="mx-auto grid place-items-center rounded-lg bg-slate-950 text-sm text-cyan-200" style={previewStyle}>{s.lang === "vi" ? "Đang tải scene 3D..." : "Loading 3D scene..."}</div>}>
              <Algorithm3DPreview
                key={`${s.W}x${s.H}`}
                frame={s.current}
                previousFrame={previousFrame}
                frameIndex={s.frameIdx}
                transitionProgress={s.transitionProgress}
                width={s.W}
                height={s.H}
                theme={s.theme}
                title={s.title}
                subtitle={s.subtitle}
                code={s.codeForPanel}
                showCode={s.showCode}
                complexity={COMPLEXITY[s.algoId]}
                lang={s.lang}
                ads={s.algorithmVideoAds}
                storyMode={isAlgorithm3DStoryMode(s.videoRenderMode)}
                hyperMode={isAlgorithm3DHyperMode(s.videoRenderMode)}
                frameCount={s.frames.length}
              />
            </Suspense>
            <canvas ref={s.canvasRef} width={s.W} height={s.H} className="hidden" />
          </>
        ) : (
          <canvas
            ref={s.canvasRef}
            width={s.W}
            height={s.H}
            className="mx-auto block h-auto rounded-lg"
            style={previewStyle}
          />
        )}
      </Card>
      <Card className="w-full max-w-2xl space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => { audioEngine.resume(); s.setPlaying((p) => !p); }} disabled={s.exporting}>
            {s.playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {s.playing ? s.tr("pause") : s.tr("play")}
          </Button>
          <Button variant="outline" size="icon" onClick={() => { s.setPlaying(false); s.setFrameIdx(0); }}>
            <Square className="w-4 h-4" />
          </Button>
          <Button onClick={s.requestExport} disabled={s.exporting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900">
            {s.exportLocked ? <Lock className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {s.exporting ? `${s.tr("exporting")} ${s.exportProgress}%` : s.exportLocked ? (s.lang === "vi" ? "Đăng nhập để xuất" : "Login to export") : s.tr("exportVideo")}
          </Button>
        </div>
        <Slider
          value={[s.frameIdx]}
          min={0}
          max={Math.max(0, s.frames.length - 1)}
          step={1}
          onValueChange={([v]) => { s.setFrameIdx(v); s.setPlaying(false); }}
        />
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>Frame {s.frameIdx + 1} / {s.frames.length}</span>
          <span>{s.W}×{s.H}</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs whitespace-nowrap">{s.tr("speed")}</Label>
          <Slider value={[s.speed]} min={0.1} max={3} step={0.1} onValueChange={([v]) => s.setSpeed(v)} />
          <span className="font-mono text-xs w-10 text-right">{s.speed}x</span>
        </div>
      </Card>
    </div>
  );
}
