import { useMemo } from "react";
import { Box, CircleStop, FileVideo2, Image, Pause, Play, RefreshCcw, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText } from "../i18n";
import { RhythmicCanvas } from "./RhythmicCanvas";
import { hasRhythmicWebGLSupport, RhythmicScene3D } from "./RhythmicScene3D";
import { RhythmicTimeline } from "./RhythmicTimeline";
import { RhythmicTrimPanel } from "./RhythmicTrimPanel";
import type { useRhythmicStudio } from "../useRhythmicStudio";

type Studio = ReturnType<typeof useRhythmicStudio>;

export function RhythmicStage({ studio }: { studio: Studio }) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof rhythmicText>[1]) => rhythmicText(lang, key);
  const webglAvailable = useMemo(() => hasRhythmicWebGLSupport(), []);
  const useThreeRenderer = studio.rendererMode === "three" && webglAvailable;
  const rendererLocked = studio.playing || studio.recording;

  const exportThroughLegacy = async (format: "webm" | "mp4", clipOnly = false) => {
    if (studio.rendererMode === "three") {
      studio.setRendererMode("legacy");
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    await studio.recordVideo(format, clipOnly);
  };

  return <section className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/60 px-3 py-2">
      <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${studio.playing ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40"}`} /><span className="text-sm font-medium">{studio.status}</span></div>
      <div className="flex gap-2"><Badge variant="secondary">9:16</Badge><Badge variant="outline">720×1280</Badge><Badge variant="outline">{studio.settings.exportFps} FPS</Badge></div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/45 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("renderer.label")}</span>
        <Badge variant={useThreeRenderer ? "secondary" : "outline"}>{useThreeRenderer ? "WebGL" : "Canvas 2D"}</Badge>
      </div>
      <div className="inline-flex rounded-lg border bg-muted/30 p-1">
        <Button
          type="button"
          size="sm"
          variant={studio.rendererMode === "legacy" ? "secondary" : "ghost"}
          disabled={rendererLocked}
          aria-pressed={studio.rendererMode === "legacy"}
          onClick={() => studio.setRendererMode("legacy")}
          className="h-8"
        >
          <Image className="mr-1.5 h-3.5 w-3.5" />{t("renderer.legacy")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={studio.rendererMode === "three" ? "secondary" : "ghost"}
          disabled={rendererLocked || !webglAvailable}
          aria-pressed={studio.rendererMode === "three"}
          onClick={() => studio.setRendererMode("three")}
          className="h-8"
          title={webglAvailable ? undefined : t("renderer.unavailable")}
        >
          <Box className="mr-1.5 h-3.5 w-3.5" />{t("renderer.three")}
        </Button>
      </div>
    </div>

    {!webglAvailable && studio.rendererMode === "three" ? <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">{t("renderer.unavailable")}</p> : null}

    <div className="mx-auto flex max-h-[68vh] justify-center overflow-hidden rounded-2xl border bg-black p-2 shadow-2xl">
      {useThreeRenderer ? (
        <RhythmicScene3D
          events={studio.timeline}
          settings={studio.settings}
          durationMs={studio.durationMs}
          timeMs={studio.timeMs}
          playing={studio.playing}
          playbackToken={studio.playbackToken}
          playbackStartMs={studio.playbackStartMs}
          playbackEndMs={studio.playbackEndMs || studio.durationMs}
          courseOverrides={studio.courseOverrides}
          selectedNodeIndex={studio.selectedNodeIndex}
          onSelectNode={studio.selectCourseNode}
          onNote={studio.onNote}
          onTime={studio.setTimeMs}
          onEnded={studio.onEnded}
        />
      ) : (
        <RhythmicCanvas events={studio.timeline} settings={studio.settings} durationMs={studio.durationMs} playing={studio.playing} playbackToken={studio.playbackToken} playbackStartMs={studio.playbackStartMs} playbackEndMs={studio.playbackEndMs || studio.durationMs} backgroundUrl={studio.backgroundUrl} lyrics={studio.lyrics} courseOverrides={studio.courseOverrides} selectedNodeIndex={studio.selectedNodeIndex} onSelectNode={studio.selectCourseNode} recording={studio.recording} targetFps={studio.settings.exportFps} onNote={studio.onNote} onTime={studio.setTimeMs} onEnded={studio.onEnded} canvasRef={studio.canvasRef} />
      )}
    </div>

    {studio.rendererMode === "three" ? <p className="text-center text-xs text-muted-foreground">{t("renderer.exportLegacy")}</p> : null}

    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={studio.resetPlayback} aria-label={t("stage.reset")} title={t("stage.reset")}><RefreshCcw className="h-4 w-4" /></Button>
      <Button size="lg" className="min-w-36" onClick={() => void studio.togglePlayback()}>{studio.playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{studio.playing ? t("stage.pause") : t("stage.play")}</Button>
      <Button variant="secondary" size="lg" disabled={studio.recording} onClick={() => void exportThroughLegacy("webm")}>
        {studio.recording && studio.recordingFormat === "webm" ? <CircleStop className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
        {studio.recording && studio.recordingFormat === "webm" ? t("stage.recordingWebm") : t("stage.exportWebm")}
      </Button>
      <Button size="lg" disabled={studio.recording} onClick={() => void exportThroughLegacy("mp4")}>
        {studio.recording && studio.recordingFormat === "mp4" ? <CircleStop className="mr-2 h-4 w-4" /> : <FileVideo2 className="mr-2 h-4 w-4" />}
        {studio.recording && studio.recordingFormat === "mp4" ? t("stage.recordingMp4") : t("stage.exportMp4")}
      </Button>
    </div>
    <RhythmicTimeline events={studio.timeline} timeMs={studio.timeMs} durationMs={studio.durationMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} />
    <RhythmicTrimPanel durationMs={studio.durationMs} timeMs={studio.timeMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} playingClip={studio.playingClip} recording={studio.recording} exportFps={studio.settings.exportFps} onFpsChange={(fps) => studio.patch("exportFps", fps)} onRangeChange={studio.setTrimRange} onPreview={() => void studio.previewTrim()} onExport={(format) => void exportThroughLegacy(format, true)} />
  </section>;
}
