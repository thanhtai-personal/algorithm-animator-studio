import type { NoteEvent } from "../types";
import { midiName, timelineDuration } from "../lib/timeline";

export function RhythmicTimeline({ events, timeMs }: { events: NoteEvent[]; timeMs: number }) {
  const duration = timelineDuration(events);
  const progress = Math.min(100, Math.max(0, timeMs / duration * 100));
  return <div className="space-y-2 rounded-xl border bg-card/50 p-3">
    <div className="flex justify-between text-xs text-muted-foreground"><span>{(timeMs / 1000).toFixed(2)}s</span><span>{(duration / 1000).toFixed(2)}s</span></div>
    <div className="relative h-16 overflow-hidden rounded-lg bg-muted/50">
      {events.slice(0, 220).map((event) => <div key={event.id} title={`${midiName(event.midi)} · ${(event.timeMs / 1000).toFixed(2)}s`} className="absolute bottom-0 w-px bg-primary/80" style={{ left: `${event.timeMs / duration * 100}%`, height: `${24 + event.velocity * 34}px` }} />)}
      <div className="absolute inset-y-0 w-0.5 bg-foreground shadow" style={{ left: `${progress}%` }} />
    </div>
  </div>;
}
