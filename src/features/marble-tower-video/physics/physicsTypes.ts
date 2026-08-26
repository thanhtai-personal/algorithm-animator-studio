import type * as CANNON from 'cannon-es';
import type { MarbleId } from '../marble/marbleCatalog';

export type MarbleRuntime = {
  id: MarbleId;
  body: CANNON.Body;
  alive: boolean;
  finalPosition: number | null;
  lastProgress: number;
  stuckFor: number;
  pianoHits: number;
  hitJump: boolean;
  hitTurbo: boolean;
};

export type ObstacleBodies = {
  startGate: CANNON.Body;
  spinnerA: CANNON.Body;
  spinnerB: CANNON.Body;
  beatGate: CANNON.Body;
  finalCross: CANNON.Body;
};

export type PianoBody = { body: CANNON.Body; index: number };
