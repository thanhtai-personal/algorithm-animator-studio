import { AlertTriangle, CheckCircle2, CircleGauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSystemLang } from "@/hooks/use-system-lang";
import { layoutText } from "../layoutI18n";
import { activeEventPosition, buildProductionReadiness, formatStudioTimecode } from "../lib/productionStatus";
import type { AudioSourceMeta, ExportFps, NoteEvent, RhythmicRendererMode } from "../types";
import type { RhythmicOutputPreset } from "../types";
import { rhythmicOutputSize } from "../lib/outputSize";

interface Props {
  events: NoteEvent[];
  timeMs: number;
  durationMs: number;
  sourceType: AudioSourceMeta["type"];
  rendererMode: RhythmicRendererMode;
  webglAvailable: boolean;
  exportFps: ExportFps;
  outputPreset: RhythmicOutputPreset;
}

export function RhythmicProductionStrip(props: Props) {
  const lang = useSystemLang();
  const readiness = buildProductionReadiness({
    sourceType: props.sourceType,
    requestedRenderer: props.rendererMode,
    webglAvailable: props.webglAvailable,
    exportFps: props.exportFps,
    eventCount: props.events.length,
  });
  const beat = activeEventPosition(props.events, props.timeMs);
  const outputSize = rhythmicOutputSize(props.outputPreset);
  const syncKey = readiness.timingFidelity === "midi-exact"
    ? "lab.midiExact"
    : readiness.timingFidelity === "audio-onset" ? "lab.audioOnset" : "lab.deterministic";
  const isThree = readiness.effectiveRenderer === "three";
  const readyKey = readiness.readyForExport
    ? (isThree ? "lab.threeDReady" : "lab.twoDReady")
    : "lab.waiting";

  return (
    <div className="rhythmic-production-strip grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b1015]/95 text-slate-100 2xl:grid-cols-[1.15fr_.8fr_1.2fr_1fr_auto]">
      <Metric label={layoutText(lang, "lab.timecode")} value={`${formatStudioTimecode(props.timeMs)} / ${formatStudioTimecode(props.durationMs)}`} mono />
      <Metric label={layoutText(lang, "lab.event")} value={`${beat} / ${props.events.length}`} mono />
      <Metric label={layoutText(lang, "lab.sync")} value={layoutText(lang, syncKey)} />
      <Metric label={layoutText(lang, "lab.output")} value={`${layoutText(lang, isThree ? "lab.threeD" : "lab.twoD")} · ${outputSize.aspectLabel} · ${outputSize.resolutionLabel}`} />
      <div className="col-span-2 flex min-w-[170px] items-center justify-between gap-2 border-t border-white/10 px-3 py-2.5 2xl:col-span-1 2xl:border-l 2xl:border-t-0">
        <div className="flex items-center gap-2">
          {readiness.fallbackActive
            ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
            : readiness.readyForExport
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              : <CircleGauge className="h-4 w-4 shrink-0 text-slate-500" />}
          <span className="text-[11px] font-semibold text-slate-300">
            {readiness.fallbackActive ? layoutText(lang, "lab.fallback") : layoutText(lang, readyKey)}
          </span>
        </div>
        {readiness.finalQuality && <Badge className="bg-emerald-400 text-[9px] text-slate-950 hover:bg-emerald-400">60 FPS</Badge>}
      </div>
    </div>
  );
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-b border-white/10 px-3 py-2.5 [&:nth-child(odd)]:border-r 2xl:border-b-0 2xl:border-r">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-[11px] font-semibold text-slate-200 ${mono ? "font-mono tabular-nums" : ""}`}>{value}</p>
    </div>
  );
}
