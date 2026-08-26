import type { MarbleId } from '../marble/marbleCatalog';

export type EliminationReason = 'cut' | 'out-of-bounds' | 'finish';

export type RaceStanding = {
  id: MarbleId;
  position: number;
  alive: boolean;
  progress: number;
};

export type RaceSnapshot = {
  phase: 'countdown' | 'racing' | 'finished';
  countdown: number;
  elapsedMs: number;
  position: number;
  alive: number;
  speed: number;
  boostAvailable: boolean;
  nextCut: string;
  pianoCombo: number;
  standings: RaceStanding[];
};

export type RaceEvent =
  | { type: 'cut'; label: string }
  | { type: 'eliminated'; id: MarbleId; reason: EliminationReason }
  | { type: 'boost' }
  | { type: 'recovery' }
  | { type: 'piano'; combo: number }
  | { type: 'finish'; id: MarbleId; position: number };

export type RaceResult = {
  position: number;
  timeMs: number;
  eliminated: boolean;
  points: number;
};
