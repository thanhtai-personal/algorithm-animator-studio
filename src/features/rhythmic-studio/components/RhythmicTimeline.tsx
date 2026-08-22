import type { NoteEvent } from "../types";
import { midiName, timelineDuration } from "../lib/timeline";

interface Props {
  events: NoteEvent[];
  timeMs: number;
  durationMs?: number;
  trimStartMs?: number;
  trimEndMs?: number;
}

export function RhythmicTimeline({ events, timeMs, durationMs, trimStartMs = 0, trimEndMs }: Props) {
  const duration = Math.max(durationMs ?? 0, timelineDuration(events), 1);
  const progress = Math.min(100, Math.max(0, timeMs / duration * 100));
  const startPct = Math.min(100, Math.max(0, trimStartMs / duration * 100));
  const endPct = Math.min(100, Math.max(startPct, (trimEndMs ?? duration) / duration * 100));
  return <div className="space-y-2 rounded-xl border bg-card/50 p-3">
    <div className="flex justify-between text-xs text-muted-foreground"><span>{(timeMs / 1000).toFixed(2)}s</span><span>{(duration / 1000).toFixed(2)}s</span></div>
    <div className="relative h-16 overflow-hidden rounded-lg bg-muted/50">
      {events.slice(0, 220).map((event) => <div key={event.id} title={`${midiName(event.midi)} · ${(event.timeMs / 1000).toFixed(2)}s`} className="absolute bottom-0 w-px bg-primary/80" style={{ left: `${event.timeMs / duration * 100}%`, height: `${24 + event.velocity * 34}px` }} />)}
      <div className="pointer-events-none absolute inset-y-0 left-0 bg-background/65 backdrop-blur-[1px]" style={{ width: `${startPct}%` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 bg-background/65 backdrop-blur-[1px]" style={{ width: `${100 - endPct}%` }} />
      <div className="pointer-events-none absolute inset-y-0 border-x border-primary/70 bg-primary/5" style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }} />
      <div className="absolute inset-y-0 w-0.5 bg-foreground shadow" style={{ left: `${progress}%` }} />
    </div>
  </div>;
}
