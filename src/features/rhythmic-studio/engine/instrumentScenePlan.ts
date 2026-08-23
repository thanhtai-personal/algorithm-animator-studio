import type { PlatformStyle } from "../types";

export interface InstrumentScenePlan {
  sceneId: "keys" | "pads" | "cymbals" | "bars" | "wires" | "finale";
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
    length: 12,
    pattern: ["instrument-key"],
    widthScale: 1.12,
    verticalScale: 0.68,
    horizontalScale: 0.62,
  },
  {
    id: "pads",
    length: 9,
    pattern: ["instrument-pad", "instrument-pad", "instrument-rail", "instrument-pad"],
    widthScale: 0.88,
    verticalScale: 1.06,
    horizontalScale: 0.94,
  },
  {
    id: "cymbals",
    length: 7,
    pattern: ["instrument-cymbal", "instrument-rail", "instrument-cymbal"],
    widthScale: 0.68,
    verticalScale: 1.28,
    horizontalScale: 1.08,
  },
  {
    id: "bars",
    length: 9,
    pattern: ["instrument-pad", "instrument-rail", "instrument-pad", "instrument-rail"],
    widthScale: 0.9,
    verticalScale: 1.08,
    horizontalScale: 1.02,
  },
  {
    id: "wires",
    length: 10,
    pattern: ["instrument-wire", "instrument-wire", "instrument-rail", "instrument-wire"],
    widthScale: 1.18,
    verticalScale: 1.36,
    horizontalScale: 1.18,
  },
  {
    id: "finale",
    length: 12,
    pattern: ["instrument-rail", "instrument-key", "instrument-wire", "instrument-cymbal", "instrument-pad"],
    widthScale: 1,
    verticalScale: 1.18,
    horizontalScale: 1.08,
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
