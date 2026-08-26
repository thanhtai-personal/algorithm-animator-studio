import type * as CANNON from "cannon-es";
import type { MarbleId } from "../marble/marbleCatalog";

export type MarbleRuntime = {
  id: MarbleId;
  body: CANNON.Body;
  alive: boolean;
  progressIndex: number;
  previousProgress: number;
  stuckFor: number;
  finalPosition: number | null;
  crossedCuts: Set<number>;
  hitJump: boolean;
};
