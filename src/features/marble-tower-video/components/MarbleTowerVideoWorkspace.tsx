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
import { useMarbleTowerPlaylist } from "../hooks/useMarbleTowerPlaylist";
import { raceSessionStore } from "../store/RaceSessionStore";
import { MarbleTowerControls } from "./MarbleTowerControls";
import { MarbleTowerTransportBar } from "./MarbleTowerTransportBar";
import { RaceHudPanel } from "./RaceHudPanel";

export const MarbleTowerVideoWorkspace = observer(function MarbleTowerVideoWorkspace() {
  const studio = useRhythmicStudioController();
  const [driveMultiplier, setDriveMultiplier] = useState(6);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [seekRevision, setSeekRevision] = useState(0);
  const playlist = useMarbleTowerPlaylist(studio);
  const output = rhythmicOutputSize(studio.settings.outputPreset);
  const racePlaybackToken = studio.playbackToken * 1000 + seekRevision;

  useEffect(() => {
    studio.setRendererMode("three");
    if (studio.settings.outputPreset !== "landscape-720p") studio.patch("outputPreset", "landscape-720p");
    if (studio.settings.titleText === "MARBLE MUSIC") studio.patch("titleText", "MARBLE TOWER RACE");
  }, []);

  const handleEnded = useCallback(() => studio.onEnded(), [studio.onEnded]);
  const handleComplete = useCallback((result: RaceResult) => {
    setRaceResult(result);
    studio.onEnded();
  }, [studio.onEnded]);

  const resetRace = useCallback(() => {
    studio.resetPlayback();
    playlist.resetToFirst();
    setRaceResult(null);
    setSeekRevision((value) => value + 1);
  }, [playlist.resetToFirst, studio.resetPlayback]);

  const seekRace = useCallback((timeMs: number) => {
    const wasPlaying = studio.playing;
    void studio.seekPlayback(timeMs);
    if (!wasPlaying) setSeekRevision((value) => value + 1);
  }, [studio.playing, studio.seekPlayback]);

  const toggleRace = useCallback(() => {
    if (!studio.playing && raceResult) {
      playlist.resetToFirst();
      setRaceResult(null);
    }
    void studio.togglePlayback();
  }, [playlist.resetToFirst, raceResult, studio.playing, studio.togglePlayback]);

  const recordRace = useCallback((format: "webm" | "mp4") => {
    playlist.resetToFirst();
    setRaceResult(null);
    void studio.recordVideo(format);
  }, [playlist.resetToFirst, studio.recordVideo]);

  const sourceTimeMs = Math.min(studio.timeMs, studio.durationMs);
  const aspectRatio = `${output.width} / ${output.height}`;
  return <main className="min-h-[calc(100dvh-65px)] bg-background/70 p-3 pb-24 md:p-5">
    <div className="mx-auto max-w-[1920px] space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Marble Tower Video</h1>
          <p className="text-xs text-muted-foreground">Decorated warehouse tower · rainbow track preserved · 3-2-1 start · leader-follow camera · audio playlist loop</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={studio.recording} onClick={() => recordRace("webm")}><Video className="mr-2 h-4 w-4" />WebM</Button>
          <Button type="button" disabled={studio.recording} onClick={() => recordRace("mp4")}><FileVideo2 className="mr-2 h-4 w-4" />MP4</Button>
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
                stopAtPlaybackEnd={studio.playingClip}
                canvasRef={studio.threeCanvasRef}
              />
              <CountdownOverlay active={studio.playing || studio.recording || studio.timeMs > 0} />
              {studio.recording ? <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow">● REC</div> : null}
            </div>
            <MarbleTowerTransportBar
              playing={studio.playing}
              recording={studio.recording}
              timeMs={studio.timeMs}
              durationMs={studio.durationMs}
              onToggle={toggleRace}
              onReset={resetRace}
              onSeek={seekRace}
            />
          </div>
          <RaceHudPanel result={raceResult} />
          <RhythmicTimeline events={studio.timeline} timeMs={sourceTimeMs} durationMs={studio.durationMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} onSeek={seekRace} />
          <RhythmicTrimPanel
            durationMs={studio.durationMs}
            timeMs={sourceTimeMs}
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
        <MarbleTowerControls
          studio={studio}
          driveMultiplier={driveMultiplier}
          onDriveChange={setDriveMultiplier}
          playlist={playlist.tracks}
          currentTrackIndex={playlist.currentIndex}
          onAudioFiles={(files) => void playlist.replaceTracks(files)}
          onSelectTrack={playlist.selectTrack}
        />
      </div>
    </div>
    <audio
      ref={studio.audioElementRef}
      preload="auto"
      onEnded={playlist.advance}
      className="hidden"
    />
  </main>;
});

const CountdownOverlay = observer(function CountdownOverlay({ active }: { active: boolean }) {
  const showCount = active && raceSessionStore.phase === "countdown" && raceSessionStore.countdown > 0;
  const showGo = active && raceSessionStore.phase === "racing" && raceSessionStore.elapsedMs < 550;
  if (!showCount && !showGo) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="rounded-full border border-white/35 bg-black/28 px-8 py-5 text-[clamp(64px,13vw,150px)] font-black italic leading-none text-white shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        {showCount ? raceSessionStore.countdown : "GO!"}
      </div>
    </div>
  );
});
