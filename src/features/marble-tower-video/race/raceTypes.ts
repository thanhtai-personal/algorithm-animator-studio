import type { MarbleId } from "../marble/marbleCatalog";

export type EliminationReason = "cut" | "out-of-bounds" | "finish";

export type RaceStanding = {
  id: MarbleId;
  position: number;
  alive: boolean;
  progress: number;
};

export type RaceSnapshot = {
  phase: "countdown" | "racing" | "finished";
  countdown: number;
  elapsedMs: number;
  leaderId: MarbleId | null;
  alive: number;
  speed: number;
  nextCut: string;
  pianoCombo: number;
  standings: RaceStanding[];
};

export type RaceEvent =
  | { type: "cut"; label: string }
  | { type: "eliminated"; id: MarbleId; reason: EliminationReason }
  | { type: "recovery" }
  | { type: "piano"; combo: number }
  | { type: "finish"; id: MarbleId; position: number };

export type RaceResult = {
  position: number;
  winnerId: MarbleId;
  timeMs: number;
  eliminated: boolean;
  points: number;
};
