import type { MarbleMode, NoteEvent } from "../types";
import { CHORD_GAP_MS } from "./denseInstrumentTypes";

export type ChaseOwner = "A" | "B";

export interface ChaseStrike {
  id: string;
  index: number;
  owner: ChaseOwner;
  startIndex: number;
  endIndex: number;
  timeMs: number;
  eventIds: string[];
}

export interface ChaseStrikeOwnershipPlan {
  strikes: ChaseStrike[];
  ownerByEventIndex: ChaseOwner[];
  strikeIndexByEventIndex: number[];
}

function appendStrike(
  plan: ChaseStrikeOwnershipPlan,
  events: NoteEvent[],
  startIndex: number,
  endIndex: number,
  owner: ChaseOwner,
) {
  const index = plan.strikes.length;
  const eventIds = events.slice(startIndex, endIndex + 1).map((event) => event.id);
  plan.strikes.push({
    id: `strike-${index}-${eventIds[0]}`,
    index,
    owner,
    startIndex,
    endIndex,
    timeMs: events[startIndex].timeMs,
    eventIds,
  });
  for (let eventIndex = startIndex; eventIndex <= endIndex; eventIndex += 1) {
    plan.ownerByEventIndex[eventIndex] = owner;
    plan.strikeIndexByEventIndex[eventIndex] = index;
  }
}

export function assignChaseStrikeOwnership(
  events: NoteEvent[],
  mode: MarbleMode,
): ChaseStrikeOwnershipPlan {
  const plan: ChaseStrikeOwnershipPlan = {
    strikes: [],
    ownerByEventIndex: [],
    strikeIndexByEventIndex: [],
  };
  if (mode === "single") {
    events.forEach((_event, index) => appendStrike(plan, events, index, index, "A"));
    return plan;
  }

  let startIndex = 0;
  while (startIndex < events.length) {
    const anchorMs = events[startIndex].timeMs;
    let endIndex = startIndex;
    while (
      endIndex + 1 < events.length
      && events[endIndex + 1].timeMs - anchorMs <= CHORD_GAP_MS
    ) {
      endIndex += 1;
    }
    const owner: ChaseOwner = plan.strikes.length % 2 === 0 ? "A" : "B";
    appendStrike(plan, events, startIndex, endIndex, owner);
    startIndex = endIndex + 1;
  }
  return plan;
}
