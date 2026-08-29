import { lazy, Suspense, useEffect, useState } from "react";
import { Download, Lock, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audio";
import { AlgorithmStudio } from "./useAlgorithmStudio";
import { COMPLEXITY } from "@/lib/algorithms";
import { canUseAlgorithm3DVideo, hasWebGLVideoSupport } from "@/lib/algorithmVideoRenderMode";
import { uiText } from "@/lib/i18n";

const PhaserMazePreview = lazy(() => import("../algorithm-world/PhaserMazePreview").then((module) => ({ default: module.PhaserMazePreview })));
const Algorithm3DPreview = lazy(() => import("@/features/algorithm-video-3d/Algorithm3DPreview").then((module) => ({ default: module.Algorithm3DPreview })));
const PHASER_FALLBACK_HEIGHT = "min(70vh, 1920px)";

type Props = { studio: AlgorithmStudio };

export function CenterPanel({ studio: s }: Props) {
  const [algorithm3DPreviewActivated, setAlgorithm3DPreviewActivated] = useState(false);
  const showPhaserMaze = Boolean(s.current?.world || s.current?.worldCompare);
  const algorithm3DAvailable = Boolean(
    s.videoRenderMode === "3d"
    && s.current
    && hasWebGLVideoSupport()
    && canUseAlgorithm3DVideo({
      shortVideoType: s.shortVideoType,
      columnVisualMode: s.columnVisualMode,
      hasWorldScene: showPhaserMaze,
    }),
  );
  const showAlgorithm3D = algorithm3DAvailable && algorithm3DPreviewActivated;
  const previousFrame = s.frameIdx > 0 ? s.frames[s.frameIdx - 1] : null;

  useEffect(() => {
    if (s.videoRenderMode !== "3d") setAlgorithm3DPreviewActivated(false);
  }, [s.videoRenderMode]);

  return (
    <div className="flex min-w-0 flex-col items-center gap-4">
      <Card className="w-full min-w-0 overflow-hidden bg-card/50 p-3">
        {showPhaserMaze ? (
          <>
            <Suspense fallback={<div className="grid w-full place-items-center rounded-lg bg-slate-950 text-sm text-cyan-200" style={{ maxHeight: PHASER_FALLBACK_HEIGHT, aspectRatio: `${s.W}/${s.H}` }}>{uiText("Loading Phaser scene...")}</div>}>
              <PhaserMazePreview key={`${s.W}x${s.H}`} frame={s.current} width={s.W} height={s.H} title={s.title} subtitle={s.subtitle} theme={s.theme} lang={s.lang} />
            </Suspense>
            <canvas ref={s.canvasRef} width={s.W} height={s.H} className="hidden" />
          </>
        ) : algorithm3DAvailable && !algorithm3DPreviewActivated ? (
          <div
            className="mx-auto grid w-full place-items-center rounded-lg border border-cyan-400/15 bg-[#0b1217] text-center"
            style={{ maxHeight: PHASER_FALLBACK_HEIGHT, aspectRatio: `${s.W}/${s.H}` }}
          >
            <div className="max-w-xs px-5">
              <div className="text-sm font-semibold text-cyan-100">{s.lang === "vi" ? "3D preview đang nghỉ" : "3D preview is idle"}</div>
              <p className="mt-1 text-xs leading-relaxed text-cyan-100/55">
                {s.lang === "vi"
                  ? "WebGL chưa được khởi tạo để tránh dùng GPU khi chưa xem preview. Bấm Play hoặc kéo timeline để bắt đầu."
                  : "WebGL is not initialized until you preview the video, keeping GPU usage idle. Press Play or scrub the timeline to start."}
              </p>
            </div>
          </div>
        ) : showAlgorithm3D && s.current ? (
          <>
            <Suspense fallback={<div className="grid w-full place-items-center rounded-lg bg-slate-950 text-sm text-cyan-200" style={{ maxHeight: PHASER_FALLBACK_HEIGHT, aspectRatio: `${s.W}/${s.H}` }}>{s.lang === "vi" ? "Đang tải scene 3D..." : "Loading 3D scene..."}</div>}>
              <Algorithm3DPreview
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
              />
            </Suspense>
            <canvas ref={s.canvasRef} width={s.W} height={s.H} className="hidden" />
          </>
        ) : (
          <canvas
            ref={s.canvasRef}
            width={s.W}
            height={s.H}
            className="mx-auto block h-auto max-w-full rounded-lg"
            style={{ maxHeight: "70vh", aspectRatio: `${s.W}/${s.H}` }}
          />
        )}
      </Card>
      <Card className="w-full max-w-2xl space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => {
            if (algorithm3DAvailable) setAlgorithm3DPreviewActivated(true);
            audioEngine.resume();
            s.setPlaying((p) => !p);
          }} disabled={s.exporting}>
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
          onValueChange={([v]) => {
            if (algorithm3DAvailable) setAlgorithm3DPreviewActivated(true);
            s.setFrameIdx(v);
            s.setPlaying(false);
          }}
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
