import type { PlatformStyle } from "../types";

export interface InstrumentScenePlan {
  sceneId: "keys" | "runway" | "pads" | "cymbals" | "melody" | "finale";
  sceneIndex: number;
  localIndex: number;
  sceneStart: boolean;
  style: PlatformStyle;
  widthScale: number;
  verticalScale: number;
  horizontalScale: number;
}

interface SceneDefinition {
  id: InstrumentScenePlan["sceneId"];
  length: number;
  pattern: readonly PlatformStyle[];
  widthScale: number;
  verticalScale: number;
  horizontalScale: number;
}

const SCENES: readonly SceneDefinition[] = [
  {
    id: "keys",
    length: 18,
    pattern: ["instrument-key", "instrument-key", "instrument-key", "instrument-key", "instrument-key", "instrument-pad"],
    widthScale: 1.16,
    verticalScale: 0.66,
    horizontalScale: 0.58,
  },
  {
    id: "runway",
    length: 12,
    pattern: ["instrument-key", "instrument-key", "instrument-rail", "instrument-key", "instrument-key", "instrument-key"],
    widthScale: 1.04,
    verticalScale: 0.74,
    horizontalScale: 0.62,
  },
  {
    id: "pads",
    length: 8,
    pattern: ["instrument-pad", "instrument-key", "instrument-key", "instrument-key", "instrument-pad", "instrument-key"],
    widthScale: 0.96,
    verticalScale: 0.78,
    horizontalScale: 0.66,
  },
  {
    id: "cymbals",
    length: 6,
    pattern: ["instrument-key", "instrument-key", "instrument-cymbal", "instrument-key", "instrument-key", "instrument-key"],
    widthScale: 0.82,
    verticalScale: 0.84,
    horizontalScale: 0.68,
  },
  {
    id: "melody",
    length: 12,
    pattern: ["instrument-key", "instrument-key", "instrument-key", "instrument-pad", "instrument-key", "instrument-key"],
    widthScale: 1.02,
    verticalScale: 0.76,
    horizontalScale: 0.64,
  },
  {
    id: "finale",
    length: 12,
    pattern: ["instrument-key", "instrument-key", "instrument-pad", "instrument-key", "instrument-key", "instrument-cymbal", "instrument-key"],
    widthScale: 1,
    verticalScale: 0.82,
    horizontalScale: 0.66,
  },
] as const;

const CYCLE_LENGTH = SCENES.reduce((total, scene) => total + scene.length, 0);

export function instrumentScenePlan(index: number): InstrumentScenePlan {
  const cycleIndex = ((index % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
  let offset = 0;
  for (let sceneIndex = 0; sceneIndex < SCENES.length; sceneIndex += 1) {
    const scene = SCENES[sceneIndex];
    const end = offset + scene.length;
    if (cycleIndex < end) {
      const localIndex = cycleIndex - offset;
      const style = scene.pattern[localIndex % scene.pattern.length];
      return {
        sceneId: scene.id,
        sceneIndex,
        localIndex,
        sceneStart: localIndex === 0,
        style,
        widthScale: scene.widthScale,
        verticalScale: scene.verticalScale,
        horizontalScale: scene.horizontalScale,
      };
    }
    offset = end;
  }
  return {
    sceneId: "keys",
    sceneIndex: 0,
    localIndex: 0,
    sceneStart: true,
    style: "instrument-key",
    widthScale: 1,
    verticalScale: 1,
    horizontalScale: 1,
  };
}
