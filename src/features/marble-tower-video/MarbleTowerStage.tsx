import { FileVideo2, Pause, Play, RefreshCcw, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import { RhythmicTimeline } from "@/features/rhythmic-studio/components/RhythmicTimeline";
import { RhythmicTrimPanel } from "@/features/rhythmic-studio/components/RhythmicTrimPanel";
import { rhythmicOutputSize } from "@/features/rhythmic-studio/lib/outputSize";
import type { RhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";
import { MarbleTowerScene3D } from "./MarbleTowerScene3D";

export function MarbleTowerStage({ studio, drive }: { studio: RhythmicStudioController; drive: number }) {
  const lang = useSystemLang();
  const vi = lang === "vi";
  const output = rhythmicOutputSize(studio.settings.outputPreset);
  return <section className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/60 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${studio.recording ? "animate-pulse bg-red-500" : studio.playing ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40"}`} /><span className="truncate text-sm font-medium">{studio.recording ? (vi ? "Đang ghi video" : "Recording video") : studio.status}</span></div>
      <div className="flex flex-wrap gap-2"><Badge variant="secondary">{output.aspectLabel}</Badge><Badge variant="outline">{output.resolutionLabel}</Badge><Badge variant="outline">{studio.settings.exportFps} FPS</Badge><Badge variant="secondary">Drive {drive.toFixed(2)}×</Badge></div>
    </div>

    <div className="relative mx-auto flex max-h-[72vh] justify-center overflow-hidden rounded-2xl border bg-black p-2 shadow-2xl" style={{ aspectRatio: `${output.width} / ${output.height}`, width: `min(100%, calc(72vh * ${output.width / output.height}))` }}>
      <MarbleTowerScene3D events={studio.timeline} settings={studio.settings} durationMs={studio.durationMs} timeMs={studio.timeMs} playing={studio.playing} recording={studio.recording} playbackToken={studio.playbackToken} playbackStartMs={studio.playbackStartMs} playbackEndMs={studio.playbackEndMs || studio.durationMs} drive={drive} frameWidth={output.width} frameHeight={output.height} canvasRef={studio.threeCanvasRef} onNote={studio.onNote} onTime={studio.setTimeMs} onEnded={studio.onEnded} />
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="icon" disabled={studio.recording} onClick={studio.resetPlayback}><RefreshCcw className="h-4 w-4" /></Button>
      <Button size="lg" className="min-w-36" disabled={studio.recording} onClick={() => void studio.togglePlayback()}>{studio.playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{studio.playing ? (vi ? "Tạm dừng" : "Pause") : (vi ? "Chạy thử" : "Preview")}</Button>
      <Button variant="secondary" size="lg" disabled={studio.recording} onClick={() => void studio.recordVideo("webm")}><Video className="mr-2 h-4 w-4" />{vi ? "Xuất WebM" : "Export WebM"}</Button>
      <Button size="lg" disabled={studio.recording} onClick={() => void studio.recordVideo("mp4")}><FileVideo2 className="mr-2 h-4 w-4" />{vi ? "Xuất MP4" : "Export MP4"}</Button>
    </div>

    <RhythmicTimeline events={studio.timeline} timeMs={studio.timeMs} durationMs={studio.durationMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} onSeek={studio.recording ? undefined : (timeMs) => void studio.seekPlayback(timeMs)} />
    <RhythmicTrimPanel durationMs={studio.durationMs} timeMs={studio.timeMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} playingClip={studio.playingClip} recording={studio.recording} outputLocked={studio.playing} exportFps={studio.settings.exportFps} outputPreset={output.preset} onFpsChange={(fps) => studio.patch("exportFps", fps)} onOutputPresetChange={(preset) => studio.patch("outputPreset", preset)} onRangeChange={studio.setTrimRange} onPreview={() => void studio.previewTrim()} onExport={(format) => void studio.recordVideo(format, true)} />
  </section>;
}
