import type { NoteEvent } from "../types";
import { assignChaseStrikeOwnership, type ChaseStrike } from "./chaseStrikeOwnership";

export type RhythmicPhraseLayout = "arc" | "parallel-lanes" | "connected-keys";

export interface RhythmicPhrase {
  id: number;
  startIndex: number;
  endIndex: number;
  startMs: number;
  endMs: number;
  strikeCount: number;
  layout: RhythmicPhraseLayout;
}

const LONG_REST_MS = 720;
const MAX_PHRASE_STRIKES = 16;

function median(values: number[]) {
  if (!values.length) return Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function layoutFor(strikes: ChaseStrike[]): RhythmicPhraseLayout {
  const gaps = strikes.slice(1).map((strike, index) => strike.timeMs - strikes[index].timeMs);
  const typicalGap = median(gaps);
  if (typicalGap <= 140) return "connected-keys";
  if (typicalGap <= 300) return "parallel-lanes";
  return "arc";
}

function phraseFrom(strikes: ChaseStrike[], id: number): RhythmicPhrase {
  const first = strikes[0];
  const last = strikes[strikes.length - 1];
  return {
    id,
    startIndex: first.startIndex,
    endIndex: last.endIndex,
    startMs: first.timeMs,
    endMs: last.timeMs,
    strikeCount: strikes.length,
    layout: layoutFor(strikes),
  };
}

export function planRhythmicPhrases(events: NoteEvent[]): RhythmicPhrase[] {
  const strikes = assignChaseStrikeOwnership(events, "chase").strikes;
  if (!strikes.length) return [];
  const groups: ChaseStrike[][] = [];
  let current: ChaseStrike[] = [];
  for (const strike of strikes) {
    const previous = current[current.length - 1];
    if (
      current.length >= MAX_PHRASE_STRIKES
      || (previous && strike.timeMs - previous.timeMs >= LONG_REST_MS)
    ) {
      groups.push(current);
      current = [];
    }
    current.push(strike);
  }
  if (current.length) groups.push(current);
  return groups.map(phraseFrom);
}
