import { Clapperboard, FileVideo2, Play, Scissors, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSystemLang } from "@/hooks/use-system-lang";
import { formatClipTime, trimText } from "../trimI18n";
import type { ExportFormat } from "@/pages/studio/exportFormats";
import { EXPORT_FPS_OPTIONS, type ExportFps, type RhythmicOutputPreset } from "../types";

interface Props {
  durationMs: number;
  timeMs: number;
  trimStartMs: number;
  trimEndMs: number;
  playingClip: boolean;
  recording: boolean;
  outputLocked?: boolean;
  exportFps: ExportFps;
  outputPreset: RhythmicOutputPreset;
  onRangeChange: (startMs: number, endMs: number) => void;
  onPreview: () => void;
  onExport: (format: ExportFormat) => void;
  onFpsChange: (fps: ExportFps) => void;
  onOutputPresetChange: (preset: RhythmicOutputPreset) => void;
}

const MIN_CLIP_MS = 1000;

export function RhythmicTrimPanel(props: Props) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof trimText>[1]) => trimText(lang, key);
  const max = Math.max(MIN_CLIP_MS, props.durationMs);
  const clipLength = Math.max(0, props.trimEndMs - props.trimStartMs);

  const setStart = (value: number) => props.onRangeChange(
    Math.min(value, props.trimEndMs - MIN_CLIP_MS),
    props.trimEndMs,
  );
  const setEnd = (value: number) => props.onRangeChange(
    props.trimStartMs,
    Math.max(value, props.trimStartMs + MIN_CLIP_MS),
  );
  const fromPlayhead = (seconds: number) => {
    const wanted = seconds * 1000;
    const start = Math.min(Math.max(0, props.timeMs), Math.max(0, max - MIN_CLIP_MS));
    const end = Math.min(max, start + wanted);
    props.onRangeChange(Math.max(0, end - wanted), end);
  };

  return <div className="space-y-4 rounded-xl border bg-card/55 p-4">
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Scissors className="h-4 w-4" /></div>
      <div><h3 className="text-sm font-semibold">{t("title")}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("hint")}</p></div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <TrimSlider label={t("start")} value={props.trimStartMs} min={0} max={Math.max(0, props.trimEndMs - MIN_CLIP_MS)} durationMax={max} onChange={setStart} />
      <TrimSlider label={t("end")} value={props.trimEndMs} min={Math.min(max, props.trimStartMs + MIN_CLIP_MS)} max={max} durationMax={max} onChange={setEnd} />
    </div>

    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-md bg-muted px-2.5 py-1.5 font-medium tabular-nums">{t("duration")}: {formatClipTime(clipLength)}</span>
      {[15, 30, 60].map((seconds) => <Button key={seconds} type="button" size="sm" variant="outline" onClick={() => fromPlayhead(seconds)}>{seconds}s</Button>)}
      <Button type="button" size="sm" variant="ghost" onClick={() => setStart(props.timeMs)}>{t("setStart")}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEnd(props.timeMs)}>{t("setEnd")}</Button>
    </div>

    <div className="flex flex-wrap items-end gap-3">
      <div className="w-36 space-y-1.5">
        <span className="text-xs text-muted-foreground">{t("fps")}</span>
        <Select value={String(props.exportFps)} onValueChange={(value) => props.onFpsChange(Number(value) as ExportFps)}>
          <SelectTrigger className="h-9" disabled={props.recording} aria-label={t("fps")}><SelectValue /></SelectTrigger>
          <SelectContent>{EXPORT_FPS_OPTIONS.map((fps) => <SelectItem key={fps} value={String(fps)}>{fps} FPS</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="w-64 max-w-full space-y-1.5">
        <span className="text-xs text-muted-foreground">{t("outputSize")}</span>
        <Select value={props.outputPreset} onValueChange={(value) => props.onOutputPresetChange(value as RhythmicOutputPreset)}>
          <SelectTrigger className="h-9" disabled={props.recording || props.outputLocked} aria-label={t("outputSize")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait-720p">{t("portrait720p")}</SelectItem>
            <SelectItem value="landscape-720p">{t("landscape720p")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="outline" disabled={props.recording} onClick={props.onPreview}>
        {props.playingClip ? <Clapperboard className="mr-2 h-4 w-4 animate-pulse" /> : <Play className="mr-2 h-4 w-4" />}{props.playingClip ? t("previewing") : t("preview")}
      </Button>
      <Button type="button" variant="secondary" disabled={props.recording} onClick={() => props.onExport("webm")}><Video className="mr-2 h-4 w-4" />{t("exportWebm")}</Button>
      <Button type="button" disabled={props.recording} onClick={() => props.onExport("mp4")}><FileVideo2 className="mr-2 h-4 w-4" />{t("exportMp4")}</Button>
    </div>
  </div>;
}

function TrimSlider({ label, value, min, max, durationMax, onChange }: { label: string; value: number; min: number; max: number; durationMax: number; onChange: (value: number) => void }) {
  const safeMax = Math.max(min, max);
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{formatClipTime(value)}</span></div>
    <Slider value={[Math.min(safeMax, Math.max(min, value))]} min={min} max={safeMax || durationMax} step={100} onValueChange={([next]) => onChange(next)} />
  </div>;
}
