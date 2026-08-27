import type { NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform } from "../engine/marblePhysicsTypes";

export const KOROBEINIKI_BRIDGE_GAP_MS = 620;
export const KOROBEINIKI_PHRASE_STARTS = [15, 21, 27] as const;
export const KOROBEINIKI_REFERENCE_SCENE_STARTS = [0, ...KOROBEINIKI_PHRASE_STARTS] as const;

const REFERENCE_WIDTH = 720;
const REFERENCE_GRAVITY = 780;
const MARBLE_STRIKE_OFFSET = { x: 42, y: -70 } as const;

// Measured from the supplied 720x1280 reference. Each long musical rest starts
// a new wall cluster; within a cluster the tubes use the same alternating score
// pattern as the source instead of an unconstrained procedural fall.
const REFERENCE_HITS = [
  [326, 220], [455, 266], [292, 318], [455, 372], [286, 430],
  [450, 492], [280, 558], [446, 626], [275, 698], [440, 772],
  [270, 848], [434, 926], [266, 1004], [428, 1084], [262, 1166],
  [330, 1500], [470, 1560], [240, 1630], [450, 1710], [260, 1795], [410, 1885],
  [350, 2240], [500, 2310], [270, 2390], [465, 2480], [245, 2570], [410, 2660],
  [340, 3040], [500, 3110], [260, 3190], [470, 3280], [230, 3380], [430, 3480],
  [520, 3400], [550, 3280], [480, 3160], [390, 3070], [300, 3020], [250, 3040],
] as const;

const REFERENCE_COLOR_BY_PITCH_CLASS = [
  "#f5a6bf", "#efb49d", "#f2d18f", "#b9dda0",
  "#5ffbf8", "#72a2e3", "#879ee8", "#aaf0e7",
  "#9edec2", "#93d395", "#b6b0ef", "#e29de1",
] as const;

const ENTRY_DECOR_OFFSETS = [
  [-160, -310, "#f5a6bf"],
  [-173, -210, "#72a2e3"],
  [-300, -175, "#e29de1"],
  [-214, -112, "#93d395"],
  [-161, -80, "#b6b0ef"],
] as const;

const LABEL_OFFSETS = [
  [64, 16],
  [72, 16],
  [70, 14],
  [66, 14],
] as const;

const BRIDGE_DECOR = [
  { sceneIndex: 1, x: 386, y: 1320, width: 106, rise: 22, rotationRad: 0.08, pins: 4 },
  { sceneIndex: 2, x: 404, y: 2058, width: 124, rise: 24, rotationRad: -0.08, pins: 5 },
  { sceneIndex: 3, x: 430, y: 2850, width: 148, rise: 28, rotationRad: 0.1, pins: 5 },
] as const;

export interface KorobeinikiReferenceBridgeDecor {
  sceneIndex: number;
  x: number;
  y: number;
  width: number;
  rise: number;
  rotationRad: number;
  pins: number;
}

export function korobeinikiReferenceTubeDepth(index: number) {
  // The supplied reference uses long pipes that reach from the playing plane
  // almost back to the wall; the old ~2.2 depth left the bases visibly floating.
  return 4.08 + (Math.max(0, index) % 4) * 0.055;
}

export function korobeinikiColorForMidi(midi: number) {
  const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
  return REFERENCE_COLOR_BY_PITCH_CLASS[pitchClass];
}

export function korobeinikiReferenceDecorForScene(sceneIndex: number) {
  const eventIndex = KOROBEINIKI_REFERENCE_SCENE_STARTS[sceneIndex];
  if (eventIndex === undefined) return [];
  const origin = REFERENCE_HITS[eventIndex];
  return ENTRY_DECOR_OFFSETS.map(([dx, dy, color], index) => ({
    index,
    x: origin[0] + dx,
    y: origin[1] + dy,
    color,
  }));
}

export function korobeinikiReferenceLabelForScene(sceneIndex: number) {
  const eventIndex = KOROBEINIKI_REFERENCE_SCENE_STARTS[sceneIndex];
  if (eventIndex === undefined) return null;
  const origin = REFERENCE_HITS[eventIndex];
  const [dx, dy] = LABEL_OFFSETS[sceneIndex] ?? LABEL_OFFSETS.at(-1)!;
  return { x: origin[0] + dx, y: origin[1] + dy };
}

export function korobeinikiReferenceSceneHit(sceneIndex: number) {
  const eventIndex = KOROBEINIKI_REFERENCE_SCENE_STARTS[sceneIndex];
  if (eventIndex === undefined) return null;
  const hit = REFERENCE_HITS[eventIndex];
  return { x: hit[0] + MARBLE_STRIKE_OFFSET.x, y: hit[1] + MARBLE_STRIKE_OFFSET.y };
}

export function korobeinikiReferenceBridgeDecor() {
  return BRIDGE_DECOR.map((bridge) => ({ ...bridge } satisfies KorobeinikiReferenceBridgeDecor));
}

export function isKorobeinikiWallLayout(settings: StudioSettings) {
  return settings.instrumentFamily === "boomwhacker"
    && settings.instrumentLayout === "wall-score";
}

export function korobeinikiBridgeAfterIndices(
  events: readonly NoteEvent[],
  minimumGapMs = KOROBEINIKI_BRIDGE_GAP_MS,
) {
  const boundaries: number[] = [];
  for (let index = 0; index < events.length - 1; index += 1) {
    if (events[index + 1].timeMs - events[index].timeMs >= minimumGapMs) {
      boundaries.push(index);
    }
  }
  return boundaries;
}

export function korobeinikiSceneForIndex(index: number) {
  const sceneIndex = KOROBEINIKI_PHRASE_STARTS.filter((start) => index >= start).length;
  return {
    sceneIndex,
    sceneStart: KOROBEINIKI_PHRASE_STARTS.includes(index as 15 | 21 | 27),
  };
}

function referenceHit(index: number, width: number) {
  const lap = Math.floor(index / REFERENCE_HITS.length);
  const point = REFERENCE_HITS[index % REFERENCE_HITS.length];
  return {
    x: point[0] * width / REFERENCE_WIDTH,
    y: point[1] + lap * 3_300,
  };
}

export function buildKorobeinikiReferenceCourse(
  events: readonly NoteEvent[],
  settings: StudioSettings,
  width: number,
  onProgress?: (progress: number) => void,
): MarblePlatform[] {
  const platforms = events.map((event, index) => {
    const visualHit = referenceHit(index, width);
    const hit = {
      x: visualHit.x + MARBLE_STRIKE_OFFSET.x * width / REFERENCE_WIDTH,
      y: visualHit.y + MARBLE_STRIKE_OFFSET.y,
    };
    const nextVisualHit = index + 1 < events.length ? referenceHit(index + 1, width) : null;
    const next = nextVisualHit ? {
      x: nextVisualHit.x + MARBLE_STRIKE_OFFSET.x * width / REFERENCE_WIDTH,
      y: nextVisualHit.y + MARBLE_STRIKE_OFFSET.y,
    } : null;
    const spanSeconds = next
      ? Math.max(0.08, (events[index + 1].timeMs - event.timeMs) / 1000)
      : 0.42;
    const outVX = next ? (next.x - hit.x) / spanSeconds : -150;
    const outVY = next
      ? (next.y - hit.y - 0.5 * REFERENCE_GRAVITY * spanSeconds ** 2) / spanSeconds
      : -260;
    const centerInset = settings.ballSize * 0.92;
    const scene = korobeinikiSceneForIndex(index);
    const platform: MarblePlatform = {
      index,
      x: hit.x,
      y: hit.y + centerInset,
      visualX: visualHit.x,
      visualY: visualHit.y,
      width: settings.platformWidth * 0.58,
      thickness: settings.platformThickness,
      tiltRad: ((index % 5) - 2) * 0.012,
      color: korobeinikiColorForMidi(event.midi),
      contactX: hit.x,
      contactY: hit.y,
      hitX: hit.x,
      hitY: hit.y,
      normalX: 0,
      normalY: -1,
      outVX,
      outVY,
      gravity: REFERENCE_GRAVITY,
      contactMode: "cap",
      motionMode: "ballistic",
      event,
      visualStyle: "wall-boomwhacker-tube",
      visualThickness: Math.max(40, settings.platformThickness),
    };
    if (scene.sceneStart) platform.visualTiltRad = 0;
    onProgress?.(Math.min(1, (index + 1) / Math.max(1, events.length)));
    return platform;
  });
  return platforms;
}
