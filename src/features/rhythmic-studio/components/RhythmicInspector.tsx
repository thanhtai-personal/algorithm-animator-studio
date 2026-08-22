import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AudioSourceMeta, StudioSettings } from "../types";

export function RhythmicInspector({ source, sourceCount, usableCount, durationMs, settings, projectName, onProjectNameChange }: { source: AudioSourceMeta; sourceCount: number; usableCount: number; durationMs: number; settings: StudioSettings; projectName: string; onProjectNameChange: (value: string) => void }) {
  const truth = source.type === "midi" ? "MIDI note timings directly drive collisions. Highest precision mode." : source.type === "audio" ? "Audio energy/onsets are detected locally. Beat-sync only; this is not melody transcription." : "Built-in notes are deterministic and synthesized in-browser.";
  return <div className="space-y-3">
    <Card><CardHeader className="pb-2"><CardTitle className="text-base">Run inspector</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><p className="text-xs text-muted-foreground">Usable collisions</p><p className="text-4xl font-black tracking-tight">{usableCount}</p><p className="text-xs text-muted-foreground">of {sourceCount} source events</p></div>
      <div className="grid grid-cols-2 gap-2 text-sm"><Metric label="Duration" value={`${(durationMs / 1000).toFixed(1)}s`} /><Metric label="Playback" value={`${settings.playbackSpeed.toFixed(2)}×`} /><Metric label="Offset" value={`${settings.syncOffsetMs}ms`} /><Metric label="Source" value={source.type.toUpperCase()} /></div>
    </CardContent></Card>
    <Card><CardContent className="space-y-2 p-4"><p className="text-sm font-semibold">Source truth</p><p className="text-xs leading-5 text-muted-foreground">{truth}</p></CardContent></Card>
    <Card><CardContent className="space-y-2 p-4"><p className="text-sm font-semibold">Export path</p><p className="text-xs leading-5 text-muted-foreground">Canvas capture + Web Audio are muxed by MediaRecorder. Chrome/Edge normally export VP9/Opus or VP8/Opus WebM at 60fps.</p></CardContent></Card>
    <div className="flex gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground"><b className="text-foreground">Precision tip.</b> Use MIDI for “ball plays the melody”. Dense mixes cannot be reliably transcribed by the lightweight audio analyzer.</p></div>
    <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Project name</label><Input value={projectName} onChange={(event) => onProjectNameChange(event.target.value)} /></div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-muted/20 p-2"><p className="text-[11px] text-muted-foreground">{label}</p><p className="truncate font-semibold">{value}</p></div>; }
