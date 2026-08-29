import type { NoteEvent, StudioSettings } from '../types';

const ONSET_GROUP_MS = 14;

interface ChannelStats {
  channel: number;
  noteCount: number;
  midiTotal: number;
  onsets: Set<number>;
}

function leadChannelForTimeline(events: readonly NoteEvent[]) {
  const stats = new Map<number, ChannelStats>();
  const allOnsets = new Set<number>();
  for (const event of events) {
    allOnsets.add(event.timeMs);
    if (event.channel === undefined || event.isDrum) continue;
    const current = stats.get(event.channel) ?? {
      channel: event.channel,
      noteCount: 0,
      midiTotal: 0,
      onsets: new Set<number>(),
    };
    current.noteCount += 1;
    current.midiTotal += event.midi;
    current.onsets.add(event.timeMs);
    stats.set(event.channel, current);
  }
  let best: { channel: number; score: number } | null = null;
  for (const channel of stats.values()) {
    const averageMidi = channel.midiTotal / Math.max(1, channel.noteCount);
    const monophony = channel.onsets.size / Math.max(1, channel.noteCount);
    const coverage = channel.onsets.size / Math.max(1, allOnsets.size);
    const score = averageMidi
      + monophony * 12
      + Math.log2(channel.onsets.size + 1) * 2
      + coverage * 8
      + (channel.channel === 0 ? 4 : 0);
    if (!best || score > best.score) best = { channel: channel.channel, score };
  }
  return best?.channel ?? null;
}

function representativeForOnset(events: readonly NoteEvent[], leadChannel: number | null) {
  const lead = leadChannel === null ? [] : events.filter((event) => event.channel === leadChannel);
  const melodic = lead.length ? lead : events.filter((event) => !event.isDrum);
  const candidates = melodic.length ? melodic : events;
  return candidates.reduce((best, event) => (
    event.midi > best.midi || (event.midi === best.midi && event.velocity > best.velocity) ? event : best
  ));
}

function representativeMidiEvents(events: readonly NoteEvent[]) {
  const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs || a.midi - b.midi);
  const leadChannel = leadChannelForTimeline(sorted);
  const representatives: NoteEvent[] = [];
  let groupStart = 0;
  while (groupStart < sorted.length) {
    const anchorMs = sorted[groupStart].timeMs;
    let groupEnd = groupStart + 1;
    while (groupEnd < sorted.length && sorted[groupEnd].timeMs - anchorMs <= ONSET_GROUP_MS) groupEnd += 1;
    representatives.push(representativeForOnset(sorted.slice(groupStart, groupEnd), leadChannel));
    groupStart = groupEnd;
  }
  return representatives;
}

export function buildRhythmicTimeline(events: NoteEvent[], settings: StudioSettings): NoteEvent[] {
  const sorted = representativeMidiEvents(events);
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
