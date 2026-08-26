import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { FileVideo2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RhythmicTimeline } from "@/features/rhythmic-studio/components/RhythmicTimeline";
import { RhythmicTrimPanel } from "@/features/rhythmic-studio/components/RhythmicTrimPanel";
import { useRhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";
import { rhythmicOutputSize } from "@/features/rhythmic-studio/lib/outputSize";
import { RaceScene3D } from "../race/RaceScene3D";
import type { RaceResult } from "../race/raceTypes";
import { MarbleTowerControls } from "./MarbleTowerControls";
import { RaceHudPanel } from "./RaceHudPanel";
import { MarbleTowerTransportBar } from "./MarbleTowerTransportBar";

export const MarbleTowerVideoWorkspace = observer(function MarbleTowerVideoWorkspace() {
  const studio = useRhythmicStudioController();
  const [driveMultiplier, setDriveMultiplier] = useState(1.8);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [seekRevision, setSeekRevision] = useState(0);
  const output = rhythmicOutputSize(studio.settings.outputPreset);
  const racePlaybackToken = studio.playbackToken * 1000 + seekRevision;

  useEffect(() => {
    studio.setRendererMode("three");
    if (studio.settings.outputPreset !== "landscape-720p") studio.patch("outputPreset", "landscape-720p");
    if (studio.settings.titleText === "MARBLE MUSIC") studio.patch("titleText", "MARBLE TOWER RACE");
  }, []); // This screen owns the Three.js export surface for its lifetime.

  const handleEnded = useCallback(() => studio.onEnded(), [studio.onEnded]);
  const handleComplete = useCallback((result: RaceResult) => setRaceResult(result), []);

  const resetRace = useCallback(() => {
    studio.resetPlayback();
    setRaceResult(null);
    setSeekRevision((value) => value + 1);
  }, [studio.resetPlayback]);

  const seekRace = useCallback((timeMs: number) => {
    const wasPlaying = studio.playing;
    void studio.seekPlayback(timeMs);
    if (!wasPlaying) setSeekRevision((value) => value + 1);
  }, [studio.playing, studio.seekPlayback]);

  const aspectRatio = `${output.width} / ${output.height}`;
  return <main className="min-h-[calc(100dvh-65px)] bg-background/70 p-3 pb-24 md:p-5">
    <div className="mx-auto max-w-[1920px] space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Marble Tower Video</h1>
          <p className="text-xs text-muted-foreground">Original tower map · Cannon physics · leader-follow camera · Kai Studio audio &amp; export</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={studio.recording} onClick={() => void studio.recordVideo("webm")}><Video className="mr-2 h-4 w-4" />WebM</Button>
          <Button type="button" disabled={studio.recording} onClick={() => void studio.recordVideo("mp4")}><FileVideo2 className="mr-2 h-4 w-4" />MP4</Button>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border bg-black shadow-xl">
            <div className="relative mx-auto w-full overflow-hidden bg-black" style={{ aspectRatio }}>
              <RaceScene3D
                driveMultiplier={driveMultiplier}
                playing={studio.playing}
                recording={studio.recording}
                playbackToken={racePlaybackToken}
                playbackStartMs={studio.playbackStartMs}
                playbackEndMs={studio.playbackEndMs}
                durationMs={studio.durationMs}
                onTime={studio.setTimeMs}
                onEnded={handleEnded}
                onComplete={handleComplete}
                canvasRef={studio.threeCanvasRef}
              />
              {studio.recording ? <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow">● REC</div> : null}
            </div>
            <MarbleTowerTransportBar
              playing={studio.playing}
              recording={studio.recording}
              timeMs={studio.timeMs}
              durationMs={studio.durationMs}
              onToggle={() => void studio.togglePlayback()}
              onReset={resetRace}
              onSeek={seekRace}
            />
          </div>
          <RaceHudPanel result={raceResult} />
          <RhythmicTimeline events={studio.timeline} timeMs={studio.timeMs} durationMs={studio.durationMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} onSeek={seekRace} />
          <RhythmicTrimPanel
            durationMs={studio.durationMs}
            timeMs={studio.timeMs}
            trimStartMs={studio.trimStartMs}
            trimEndMs={studio.trimEndMs}
            playingClip={studio.playingClip}
            recording={studio.recording}
            outputLocked={studio.playing}
            exportFps={studio.settings.exportFps}
            outputPreset={output.preset}
            onRangeChange={studio.setTrimRange}
            onPreview={() => void studio.previewTrim()}
            onExport={(format) => void studio.recordVideo(format, true)}
            onFpsChange={(fps) => studio.patch("exportFps", fps)}
            onOutputPresetChange={(preset) => studio.patch("outputPreset", preset)}
          />
        </section>
        <MarbleTowerControls studio={studio} driveMultiplier={driveMultiplier} onDriveChange={setDriveMultiplier} />
      </div>
    </div>
    <audio ref={studio.audioElementRef} src={studio.audioUrl ?? undefined} preload="metadata" className="hidden" />
  </main>;
});
