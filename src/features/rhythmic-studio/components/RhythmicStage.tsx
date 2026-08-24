import { useMemo } from "react";
import { Box, CircleStop, FileVideo2, Image, LoaderCircle, Pause, Play, RefreshCcw, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText } from "../i18n";
import { layoutText } from "../layoutI18n";
import { RhythmicProductionStrip } from "../presentation/RhythmicProductionStrip";
import { RhythmicCanvas } from "./RhythmicCanvas";
import { hasRhythmicWebGLSupport, RhythmicScene3D } from "./RhythmicScene3D";
import { RhythmicTimeline } from "./RhythmicTimeline";
import { RhythmicTrimPanel } from "./RhythmicTrimPanel";
import type { useRhythmicStudio } from "../useRhythmicStudio";
import { buildPresetMixPlan, createPresetMixSettingsResolver } from "../lib/presetMix";
import { usePreparedMarbleCourse, type PreparedMarbleCourse } from "../hooks/usePreparedMarbleCourse";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import { RHYTHMIC_COURSE_WIDTH } from "./RhythmicMotion3D";

type Studio = ReturnType<typeof useRhythmicStudio>;

function CoursePreparationOverlay({ progress, label }: { progress: number; label: string }) {
  const percent = Math.max(1, Math.min(100, Math.round(progress * 100)));
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-background/78 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{percent}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

type Translate = (key: Parameters<typeof rhythmicText>[1]) => string;

function StageStatus({ studio, preparing, statusLabel, useThreeRenderer }: {
  studio: Studio;
  preparing: boolean;
  statusLabel: string;
  useThreeRenderer: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${studio.playing ? "animate-pulse bg-emerald-500" : preparing ? "animate-pulse bg-amber-500" : "bg-muted-foreground/40"}`} />
        <span className="text-sm font-medium">{preparing ? statusLabel : studio.status}</span>
      </div>
      <div className="flex gap-2">
        <Badge variant="secondary">9:16</Badge>
        <Badge variant="outline">720×1280</Badge>
        <Badge variant="outline">{studio.settings.exportFps} FPS</Badge>
        {studio.presetMixEnabled ? <Badge variant="secondary">Preset Mix</Badge> : null}
        {useThreeRenderer ? <Badge variant="secondary">3D WebGL</Badge> : null}
      </div>
    </div>
  );
}

function RendererSelector({ studio, webglAvailable, useThreeRenderer, locked, t, twoDLabel, threeDLabel, twoDHint, threeDHint }: {
  studio: Studio;
  webglAvailable: boolean;
  useThreeRenderer: boolean;
  locked: boolean;
  t: Translate;
  twoDLabel: string;
  threeDLabel: string;
  twoDHint: string;
  threeDHint: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/45 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("renderer.label")}</span>
        <Badge variant={useThreeRenderer ? "secondary" : "outline"}>{useThreeRenderer ? "WebGL" : "Canvas 2D"}</Badge>
      </div>
      <div className="inline-flex rounded-lg border bg-muted/30 p-1">
        <Button type="button" size="sm" variant={studio.rendererMode === "legacy" ? "secondary" : "ghost"} disabled={locked} aria-pressed={studio.rendererMode === "legacy"} onClick={() => studio.setRendererMode("legacy")} className="h-8" title={twoDHint}>
          <Image className="mr-1.5 h-3.5 w-3.5" />{twoDLabel}
        </Button>
        <Button type="button" size="sm" variant={studio.rendererMode === "three" ? "secondary" : "ghost"} disabled={locked || !webglAvailable} aria-pressed={studio.rendererMode === "three"} onClick={() => studio.setRendererMode("three")} className="h-8" title={webglAvailable ? threeDHint : t("renderer.unavailable")}>
          <Box className="mr-1.5 h-3.5 w-3.5" />{threeDLabel}
        </Button>
      </div>
    </div>
  );
}

function PreparedScene({ studio, course, courseReady, useThreeRenderer, resolveSettings, preparingLabel }: {
  studio: Studio;
  course: PreparedMarbleCourse;
  courseReady: boolean;
  useThreeRenderer: boolean;
  resolveSettings: StudioSettingsResolver;
  preparingLabel: string;
}) {
  if (!courseReady) {
    return (
      <div className="grid aspect-[9/16] h-[66vh] max-h-[1280px] max-w-full place-items-center rounded-xl bg-slate-950 px-6 text-center text-sm text-white/70">
        {course.error ?? preparingLabel}
      </div>
    );
  }
  if (useThreeRenderer) {
    return (
      <RhythmicScene3D
        events={studio.timeline}
        settings={studio.settings}
        durationMs={studio.durationMs}
        timeMs={studio.timeMs}
        playing={studio.playing}
        recording={studio.recording}
        playbackToken={studio.playbackToken}
        playbackStartMs={studio.playbackStartMs}
        playbackEndMs={studio.playbackEndMs || studio.durationMs}
        courseOverrides={studio.courseOverrides}
        backgroundUrl={studio.backgroundUrl}
        selectedNodeIndex={studio.selectedNodeIndex}
        onSelectNode={studio.selectCourseNode}
        onNote={studio.onNote}
        onTime={studio.setTimeMs}
        onEnded={studio.onEnded}
        canvasRef={studio.threeCanvasRef}
        platforms={course.platforms}
        resolveSettings={resolveSettings}
      />
    );
  }
  return (
    <RhythmicCanvas
      events={studio.timeline}
      settings={studio.settings}
      durationMs={studio.durationMs}
      playing={studio.playing}
      playbackToken={studio.playbackToken}
      playbackStartMs={studio.playbackStartMs}
      playbackEndMs={studio.playbackEndMs || studio.durationMs}
      backgroundUrl={studio.backgroundUrl}
      lyrics={studio.lyrics}
      courseOverrides={studio.courseOverrides}
      selectedNodeIndex={studio.selectedNodeIndex}
      onSelectNode={studio.selectCourseNode}
      recording={studio.recording}
      targetFps={studio.settings.exportFps}
      onNote={studio.onNote}
      onTime={studio.setTimeMs}
      onEnded={studio.onEnded}
      canvasRef={studio.canvasRef}
      platforms={course.platforms}
      resolveSettings={resolveSettings}
    />
  );
}

function TransportControls({ studio, courseReady, t }: { studio: Studio; courseReady: boolean; t: Translate }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="icon" disabled={!courseReady} onClick={studio.resetPlayback} aria-label={t("stage.reset")} title={t("stage.reset")}><RefreshCcw className="h-4 w-4" /></Button>
      <Button size="lg" className="min-w-36" disabled={!courseReady} onClick={() => void studio.togglePlayback()}>{studio.playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{studio.playing ? t("stage.pause") : t("stage.play")}</Button>
      <Button variant="secondary" size="lg" disabled={studio.recording || !courseReady} onClick={() => void studio.recordVideo("webm")}>
        {studio.recording && studio.recordingFormat === "webm" ? <CircleStop className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
        {studio.recording && studio.recordingFormat === "webm" ? t("stage.recordingWebm") : t("stage.exportWebm")}
      </Button>
      <Button size="lg" disabled={studio.recording || !courseReady} onClick={() => void studio.recordVideo("mp4")}>
        {studio.recording && studio.recordingFormat === "mp4" ? <CircleStop className="mr-2 h-4 w-4" /> : <FileVideo2 className="mr-2 h-4 w-4" />}
        {studio.recording && studio.recordingFormat === "mp4" ? t("stage.recordingMp4") : t("stage.exportMp4")}
      </Button>
    </div>
  );
}

export function RhythmicStage({ studio }: { studio: Studio }) {
  const lang = useSystemLang();
  const t: Translate = (key) => rhythmicText(lang, key);
  const webglAvailable = useMemo(() => hasRhythmicWebGLSupport(), []);
  const useThreeRenderer = studio.rendererMode === "three" && webglAvailable;
  const mixPlan = useMemo(() => buildPresetMixPlan(studio.timeline, studio.presetMixEnabled, studio.presetMixSeed), [studio.presetMixEnabled, studio.presetMixSeed, studio.timeline]);
  const resolveSettings = useMemo(() => createPresetMixSettingsResolver(studio.settings, mixPlan), [mixPlan, studio.settings]);
  const course = usePreparedMarbleCourse(studio.timeline, studio.settings, RHYTHMIC_COURSE_WIDTH, studio.presetMixEnabled, studio.presetMixSeed);
  const courseReady = !course.isPreparing && !course.error && course.platforms.length === studio.timeline.length;
  const rendererLocked = studio.playing || studio.recording || course.isPreparing;
  const preparingLabel = t("status.preparingCourse");

  return <section className="rhythmic-stage min-w-0 space-y-3">
    <StageStatus studio={studio} preparing={course.isPreparing} statusLabel={preparingLabel} useThreeRenderer={useThreeRenderer} />
    <RhythmicProductionStrip events={studio.timeline} timeMs={studio.timeMs} durationMs={studio.durationMs} sourceType={studio.source.type} rendererMode={studio.rendererMode} webglAvailable={webglAvailable} exportFps={studio.settings.exportFps} />
    <RendererSelector
      studio={studio}
      webglAvailable={webglAvailable}
      useThreeRenderer={useThreeRenderer}
      locked={rendererLocked}
      t={t}
      twoDLabel={layoutText(lang, "lab.twoD")}
      threeDLabel={layoutText(lang, "lab.threeD")}
      twoDHint={layoutText(lang, "lab.twoDHint")}
      threeDHint={layoutText(lang, "lab.threeDHint")}
    />
    {!webglAvailable && studio.rendererMode === "three" ? <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">{t("renderer.unavailable")}</p> : null}
    <div className="mx-auto flex max-h-[68vh] justify-center overflow-hidden rounded-2xl border bg-black p-2 shadow-2xl">
      <PreparedScene studio={studio} course={course} courseReady={courseReady} useThreeRenderer={useThreeRenderer} resolveSettings={resolveSettings} preparingLabel={preparingLabel} />
    </div>
    <TransportControls studio={studio} courseReady={courseReady} t={t} />
    <RhythmicTimeline events={studio.timeline} timeMs={studio.timeMs} durationMs={studio.durationMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} onSeek={studio.recording ? undefined : (timeMs) => void studio.seekPlayback(timeMs)} />
    <RhythmicTrimPanel durationMs={studio.durationMs} timeMs={studio.timeMs} trimStartMs={studio.trimStartMs} trimEndMs={studio.trimEndMs} playingClip={studio.playingClip} recording={studio.recording} exportFps={studio.settings.exportFps} onFpsChange={(fps) => studio.patch("exportFps", fps)} onRangeChange={studio.setTrimRange} onPreview={() => void studio.previewTrim()} onExport={(format) => void studio.recordVideo(format, true)} />
    {course.isPreparing ? <CoursePreparationOverlay progress={course.progress} label={preparingLabel} /> : null}
  </section>;
}
