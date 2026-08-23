import { useMemo } from "react";
import type { NoteEvent } from "../types";
import { timelineDuration } from "../lib/timeline";

interface Props {
  events: NoteEvent[];
  timeMs: number;
  durationMs?: number;
  trimStartMs?: number;
  trimEndMs?: number;
}

const clampPct = (value: number) => Math.min(100, Math.max(0, value));

export function RhythmicTimeline({ events, timeMs, durationMs, trimStartMs = 0, trimEndMs }: Props) {
  const duration = Math.max(durationMs ?? 0, timelineDuration(events), 1);
  const progress = clampPct(timeMs / duration * 100);
  const startPct = clampPct(trimStartMs / duration * 100);
  const endPct = clampPct(Math.max(startPct, (trimEndMs ?? duration) / duration * 100));
  const beatPath = useMemo(() => events.map((event) => {
    const x = Math.min(1000, Math.max(0, event.timeMs / duration * 1000));
    const height = 24 + event.velocity * 34;
    return `M${x.toFixed(2)} 64V${(64 - height).toFixed(2)}`;
  }).join(""), [duration, events]);
  return <div className="space-y-2 rounded-xl border bg-card/50 p-3">
    <div className="flex justify-between text-xs text-muted-foreground"><span>{(timeMs / 1000).toFixed(2)}s</span><span>{(duration / 1000).toFixed(2)}s</span></div>
    <div className="relative h-16 overflow-hidden rounded-lg bg-muted/50">
      <svg className="absolute inset-0 h-full w-full text-primary/80" viewBox="0 0 1000 64" preserveAspectRatio="none" aria-hidden="true">
        <path d={beatPath} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 left-0 bg-background/65 backdrop-blur-[1px]" style={{ width: `${startPct}%` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 bg-background/65 backdrop-blur-[1px]" style={{ width: `${100 - endPct}%` }} />
      <div className="pointer-events-none absolute inset-y-0 border-x border-primary/70 bg-primary/5" style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }} />
      <div className="absolute inset-y-0 w-0.5 bg-foreground shadow" style={{ left: `${progress}%` }} />
    </div>
  </div>;
}
