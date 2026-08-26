import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { FileVideo2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RhythmicTimeline } from "@/features/rhythmic-studio/components/RhythmicTimeline";
import { RhythmicTrimPanel } from "@/features/rhythmic-studio/components/RhythmicTrimPanel";
import { useRhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";
import { rhythmicOutputSize } from "@/features/rhythmic-studio/lib/outputSize";
import type { RacePhysics } from "../physics/RacePhysics";
import { RaceScene3D } from "../race/RaceScene3D";
import type { RaceResult } from "../race/raceTypes";
import { useMarbleTowerPlaylist } from "../hooks/useMarbleTowerPlaylist";
import { raceSessionStore } from "../store/RaceSessionStore";
import { MarbleTowerControls } from "./MarbleTowerControls";
import { MarbleTowerTransportBar } from "./MarbleTowerTransportBar";
import { RaceHudPanel } from "./RaceHudPanel";
import { RaceStartSequence } from "./RaceStartSequence";
import { WinnerCelebrationOverlay } from "./WinnerCelebrationOverlay";

function isMidiFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".mid") || name.endsWith(".midi") || file.type.includes("midi");
}

export const MarbleTowerVideoWorkspace = observer(function MarbleTowerVideoWorkspace() {
  const studio = useRhythmicStudioController();
  const [driveMultiplier, setDriveMultiplier] = useState(6);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [racePhysics, setRacePhysics] = useState<RacePhysics | null>(null);
  const [seekRevision, setSeekRevision] = useState(0);
  const finishTimerRef = useRef<number | null>(null);
  const playlist = useMarbleTowerPlaylist(studio);
  const output = rhythmicOutputSize(studio.settings.outputPreset);
  const racePlaybackToken = studio.playbackToken * 1000 + seekRevision;

  useEffect(() => {
    studio.setRendererMode("three");
    if (studio.settings.outputPreset !== "landscape-720p") studio.patch("outputPreset", "landscape-720p");
    if (studio.settings.titleText === "MARBLE MUSIC") studio.patch("titleText", "MARBLE TOWER RACE");
  }, []);

  const silenceSourceForCountdown = useCallback(() => {
    studio.stopPlaybackAudio();
    if (studio.source.type === "midi") studio.patch("midiPlaybackEnabled", false);
    if (studio.source.type === "audio") studio.patch("playOriginalSong", false);
  }, [studio.patch, studio.source.type, studio.stopPlaybackAudio]);

  const handleEnded = useCallback(() => studio.onEnded(), [studio.onEnded]);
  const handleComplete = useCallback((result: RaceResult) => {
    setRaceResult(result);
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
    // Keep the canvas/recorder alive long enough to capture the champion card
    // and confetti instead of stopping on the exact winning frame.
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;
      studio.onEnded();
    }, 2800);
  }, [studio.onEnded]);

  useEffect(() => () => {
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
  }, []);

  const resetRace = useCallback(() => {
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    studio.resetPlayback();
    silenceSourceForCountdown();
    playlist.resetToFirst();
    setRaceResult(null);
    setSeekRevision((value) => value + 1);
  }, [playlist.resetToFirst, silenceSourceForCountdown, studio.resetPlayback]);

  const seekRace = useCallback((timeMs: number) => {
    const wasPlaying = studio.playing;
    void studio.seekPlayback(timeMs);
    if (!wasPlaying) setSeekRevision((value) => value + 1);
  }, [studio.playing, studio.seekPlayback]);

  const toggleRace = useCallback(() => {
    if (studio.playing) {
      void studio.togglePlayback();
      return;
    }
    silenceSourceForCountdown();
    if (raceResult) {
      playlist.resetToFirst();
      setRaceResult(null);
    }
    void studio.togglePlayback();
  }, [playlist.resetToFirst, raceResult, silenceSourceForCountdown, studio.playing, studio.togglePlayback]);

  const recordRace = useCallback((format: "webm" | "mp4", trimOnly = false) => {
    silenceSourceForCountdown();
    playlist.resetToFirst();
    setRaceResult(null);
    void studio.recordVideo(format, trimOnly);
  }, [playlist.resetToFirst, silenceSourceForCountdown, studio.recordVideo]);

  const importMusicFiles = useCallback((files: File[]) => {
    const midi = files.find(isMidiFile);
    if (midi) {
      playlist.clearTracks();
      void studio.importMidi(midi).then(() => {
        studio.patch("midiPlaybackEnabled", false);
      });
      return;
    }
    const audioFiles = files.filter((file) => !isMidiFile(file));
    if (audioFiles.length) void playlist.replaceTracks(audioFiles);
  }, [playlist.clearTracks, playlist.replaceTracks, studio.importMidi, studio.patch]);

  const sourceTimeMs = Math.min(studio.timeMs, studio.durationMs);
  const aspectRatio = `${output.width} / ${output.height}`;
  return <main className="min-h-[calc(100dvh-65px)] bg-background/70 p-3 pb-24 md:p-5">
    <div className="mx-auto max-w-[1920px] space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Marble Tower Video</h1>
          <p className="text-xs text-muted-foreground">3-2-1 → Let&apos;s go! → music + marbles together · g = 9.81 m/s² · champion celebration</p>
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
                onReady={setRacePhysics}
                stopAtPlaybackEnd={studio.playingClip}
                canvasRef={studio.threeCanvasRef}
              />
              <RaceStartSequence
                active={studio.playing || studio.recording}
                physics={racePhysics}
                sourceType={studio.source.type}
                patch={studio.patch}
                playCue={studio.playCue}
                startPlaybackAudio={studio.startPlaybackAudio}
              />
              <CountdownOverlay active={studio.playing || studio.recording || studio.timeMs > 0} />
              <WinnerCelebrationOverlay result={raceResult} />
              {studio.recording ? <div className="pointer-events-none absolute right-3 top-3 z-30 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow">● REC</div> : null}
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
            onExport={(format) => recordRace(format, true)}
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
          onMusicFiles={importMusicFiles}
          onSelectTrack={playlist.selectTrack}
        />
      </div>
    </div>
    <audio ref={studio.audioElementRef} preload="auto" onEnded={playlist.advance} className="hidden" />
  </main>;
});

const CountdownOverlay = observer(function CountdownOverlay({ active }: { active: boolean }) {
  if (!active || raceSessionStore.phase !== "countdown") return null;
  const label = raceSessionStore.countdown > 0 ? String(raceSessionStore.countdown) : "LET'S GO!";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="rounded-full border border-white/35 bg-black/30 px-8 py-5 text-[clamp(60px,12vw,142px)] font-black italic leading-none text-white shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
});
