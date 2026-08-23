import { CircleStop, FileVideo2, Pause, Play, RefreshCcw, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText } from "../i18n";
import { RhythmicCanvas } from "./RhythmicCanvas";
import { RhythmicTimeline } from "./RhythmicTimeline";
import { RhythmicTrimPanel } from "./RhythmicTrimPanel";
import type { useRhythmicStudio } from "../useRhythmicStudio";

type Studio = ReturnType<typeof useRhythmicStudio>;

export function RhythmicStage({ studio }: { studio: Studio }) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof rhythmicText>[1]) => rhythmicText(lang, key);
  return <section className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/60 px-3 py-2">
      <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${studio.playing ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40"}`} /><span className="text-sm font-medium">{studio.status}</span></div>
      <div className="flex gap-2"><Badge variant="secondary">9:16</Badge><Badge variant="outline">720×1280</Badge><Badge variant="outline">{studio.settings.exportFps} FPS</Badge></div>
    </div>

    <div className="mx-auto flex max-h-[68vh] justify-center overflow-hidden rounded-2xl border bg-black p-2 shadow-2xl">
      <RhythmicCanvas events={studio.timeline} settings={studio.settings} durationMs={studio.durationMs} playing={studio.playing} playbackToken={studio.playbackToken} playbackStartMs={studio.playbackStartMs} playbackEndMs={studio.playbackEndMs || studio.durationMs} backgroundUrl={studio.backgroundUrl} lyrics={studio.lyrics} recording={studio.recording} targetFps={studio.settings.exportFps} onNote={studio.onNote} onTime={studio.setTimeMs} onEnded={studio.onEnded} canvasRef={studio.canvasRef} />
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={studio.resetPlayback} aria-label={t("stage.reset")} title={t("stage.reset")}><RefreshCcw className="h-4 w-4" /></Button>
      <Button size="lg" className="min-w-36" onClick={() => void studio.togglePlayback()}>{studio.playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{studio.playing ? t("stage.pause") : t("stage.play")}</Button>
      <Button variant="secondary" size="lg" disabled={studio.recording} onClick={() => void studio.recordVideo("webm")}>
        {studio.recording && studio.recordingFormat === "webm" ? <CircleStop className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
        {studio.recording && studio.recordingFormat === "webm" ? t("stage.recordingWebm") : t("stage.exportWebm")}
      </Button>
      <Button size="lg" disabled={studio.recording} onClick={() => void studio.recordVideo("mp4")}>
        {studio.recording && studio.recordingFormat === "mp4" ? <CircleStop className="mr-2 h-4 w-4" /> : <FileVideo2 className="mr-2 h-4 w-4" />}
        {studio.recording && studio.recordingFormat === "mp4" ? t("stage.recordingMp4") : t("stage.exportMp4")}
      </Button>
    </div>
    <RhythmicTimeline events={studio.timeline} timeMs={studio.timeMs} durationMs={studio.durationMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} />
    <RhythmicTrimPanel durationMs={studio.durationMs} timeMs={studio.timeMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} playingClip={studio.playingClip} recording={studio.recording} exportFps={studio.settings.exportFps} onFpsChange={(fps) => studio.patch("exportFps", fps)} onRangeChange={studio.setTrimRange} onPreview={() => void studio.previewTrim()} onExport={(format) => void studio.recordVideo(format, true)} />
  </section>;
}
