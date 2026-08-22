import type { NoteEvent, StudioSettings } from '../types';

export function buildRhythmicTimeline(events: NoteEvent[], settings: StudioSettings): NoteEvent[] {
  const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs);
  const filtered: NoteEvent[] = [];
  let last = -Infinity;
  for (const event of sorted) {
    const scaled = event.timeMs / Math.max(0.1, settings.playbackSpeed) + settings.syncOffsetMs;
    if (scaled - last < settings.minBounceSpacingMs) continue;
    filtered.push({ ...event, timeMs: Math.max(0, scaled), durationMs: event.durationMs / settings.playbackSpeed });
    last = scaled;
  }
  return filtered;
}

export function timelineDuration(events: NoteEvent[]) {
  if (!events.length) return 1000;
  const last = events[events.length - 1];
  return last.timeMs + Math.max(600, last.durationMs + 350);
}

export function midiName(midi: number) {
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
