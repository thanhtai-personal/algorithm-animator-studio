import type { NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform } from "../engine/marblePhysicsTypes";

export const KOROBEINIKI_BRIDGE_GAP_MS = 620;
export const KOROBEINIKI_PHRASE_STARTS = [15, 21, 27] as const;
export const KOROBEINIKI_REFERENCE_SCENE_STARTS = [0, ...KOROBEINIKI_PHRASE_STARTS] as const;

const REFERENCE_WIDTH = 720;
const REFERENCE_GRAVITY = 780;
const REFERENCE_WORLD_SCALE = 0.012;
const REFERENCE_TUBE_THICKNESS = 40;
const REFERENCE_STEP_MS = 230;
const REFERENCE_MIN_ARC_HEIGHT = 18;

type ReferencePoint = readonly [x: number, y: number];

// Measured wall-score phrases from the supplied 720x1280 reference. Coordinates
// are local to a phrase so the same construction can be applied to any imported
// MIDI instead of replaying one hard-coded 39-note path. The final phrase keeps
// descending; the old last six points folded back upward to fake a loop.
const REFERENCE_SCENE_POINTS: readonly (readonly ReferencePoint[])[] = [
  [
    [326, 0], [455, 46], [292, 98], [455, 152], [286, 210],
    [450, 272], [280, 338], [446, 406], [275, 478], [440, 552],
    [270, 628], [434, 706], [266, 784], [428, 864], [262, 946],
  ],
  [[430, 0], [470, 60], [240, 130], [450, 210], [260, 295], [410, 385]],
  [[240, 0], [500, 70], [270, 150], [465, 240], [245, 330], [410, 420]],
  [
    [520, 0], [500, 70], [260, 150], [470, 240], [230, 340], [430, 440],
    [520, 520], [550, 600], [480, 680], [390, 760], [300, 840], [250, 920],
  ],
] as const;

// Keep the two short bridge phrases close in Y so their ballistic apexes form
// the shallow, side-running wire bridges visible in the reference.
const REFERENCE_SCENE_GAPS = [60, 150, 60, 100] as const;
const REFERENCE_HITS: readonly ReferencePoint[] = REFERENCE_SCENE_POINTS.flatMap((scene, sceneIndex) => {
  const starts = [220, 1226, 1761, 2241] as const;
  return scene.map(([x, y]) => [x, y + starts[sceneIndex]] as const);
});

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

export function korobeinikiReferenceTubeDepth(index: number) {
  // The supplied reference uses long pipes that reach from the playing plane
  // almost back to the wall; the old ~2.2 depth left the bases visibly floating.
  return 4.08 + (Math.max(0, index) % 4) * 0.055;
}

export function wallScoreTubeHitPoint(
  visual: { x: number; y: number },
  settings: StudioSettings,
) {
  const tubeDiameter = Math.max(REFERENCE_TUBE_THICKNESS, settings.platformThickness);
  const tubeRadius = Math.max(0.135 / REFERENCE_WORLD_SCALE, tubeDiameter * 0.52);
  return {
    x: visual.x,
    y: visual.y - tubeRadius - settings.ballSize,
  };
}

export function wallScoreTubeContactDepth3D(_index: number, settings: StudioSettings) {
  const ballRadius = settings.ballSize * REFERENCE_WORLD_SCALE;
  // Keep the contact on the upper front rim. The old point sat halfway down the
  // long tube, so crossings were rendered inside solid plastic.
  return Math.max(0, ballRadius - 0.001);
}

export function korobeinikiColorForMidi(midi: number) {
  const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
  return REFERENCE_COLOR_BY_PITCH_CLASS[pitchClass];
}

export function wallScoreEntryDecor(origin: { x: number; y: number }) {
  return ENTRY_DECOR_OFFSETS.map(([dx, dy, color], index) => ({
    index,
    x: origin.x + dx,
    y: origin.y + dy,
    color,
  }));
}

export function korobeinikiReferenceDecorForScene(sceneIndex: number) {
  if (sceneIndex !== 0) return [];
  const eventIndex = KOROBEINIKI_REFERENCE_SCENE_STARTS[sceneIndex];
  if (eventIndex === undefined) return [];
  const origin = REFERENCE_HITS[eventIndex];
  return wallScoreEntryDecor({ x: origin[0], y: origin[1] });
}

export function wallScoreLabelPosition(origin: { x: number; y: number }, sceneIndex: number) {
  const [dx, dy] = LABEL_OFFSETS[sceneIndex % LABEL_OFFSETS.length] ?? LABEL_OFFSETS.at(-1)!;
  return { x: origin.x + dx, y: origin.y + dy };
}

export function korobeinikiReferenceLabelForScene(sceneIndex: number) {
  const eventIndex = KOROBEINIKI_REFERENCE_SCENE_STARTS[sceneIndex];
  if (eventIndex === undefined) return null;
  const origin = REFERENCE_HITS[eventIndex];
  return wallScoreLabelPosition({ x: origin[0], y: origin[1] }, sceneIndex);
}

export function korobeinikiReferenceSceneHit(sceneIndex: number) {
  const eventIndex = KOROBEINIKI_REFERENCE_SCENE_STARTS[sceneIndex];
  if (eventIndex === undefined) return null;
  const hit = REFERENCE_HITS[eventIndex];
  return { x: hit[0], y: hit[1] };
}

export function isKorobeinikiWallLayout(settings: StudioSettings) {
  return settings.instrumentFamily === "boomwhacker"
    && settings.instrumentLayout === "wall-score"
    && settings.platformPrimaryStyle === "wall-boomwhacker-tube";
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

export function wallScoreSceneStartIndices(events: readonly NoteEvent[]) {
  if (!events.length) return [];
  return [0, ...korobeinikiBridgeAfterIndices(events).map((index) => index + 1)];
}

function extendedScenePoint(template: readonly ReferencePoint[], localIndex: number): ReferencePoint {
  const measured = template[localIndex];
  if (measured) return measured;
  const last = template.at(-1) ?? [REFERENCE_WIDTH / 2, 0];
  const extra = localIndex - template.length + 1;
  const center = 350 - Math.min(54, extra * 4);
  const spread = 82 + Math.min(42, extra * 3);
  const x = localIndex % 2 === 0 ? center - spread : center + spread;
  return [x, last[1] + extra * (82 + Math.min(14, extra * 2))];
}

export function wallScoreReferenceHits(events: readonly NoteEvent[], width: number) {
  if (!events.length) return [];
  const sceneStarts = new Set(wallScoreSceneStartIndices(events));
  const points: { x: number; y: number }[] = [];
  let sceneIndex = -1;
  let localIndex = 0;
  let sceneOriginY = 220;

  events.forEach((event, index) => {
    if (sceneStarts.has(index)) {
      sceneIndex += 1;
      localIndex = 0;
      if (index > 0) {
        const previousY = points.at(-1)?.y ?? sceneOriginY;
        sceneOriginY = previousY + REFERENCE_SCENE_GAPS[(sceneIndex - 1) % REFERENCE_SCENE_GAPS.length];
      }
    }
    const template = REFERENCE_SCENE_POINTS[sceneIndex % REFERENCE_SCENE_POINTS.length];
    const [x, localY] = extendedScenePoint(template, localIndex);
    const previousPoint = points.at(-1);
    if (localIndex === 0 || !previousPoint) {
      points.push({ x: x * width / REFERENCE_WIDTH, y: sceneOriginY + localY });
    } else {
      const [previousX, previousLocalY] = extendedScenePoint(template, localIndex - 1);
      const gapMs = Math.max(0, event.timeMs - events[index - 1].timeMs);
      // The measured reference layout assumes a regular 230 ms step. When two
      // notes arrive faster, compress that step by the same ratio so the marble
      // keeps its readable travel speed instead of sprinting across a full gap.
      const spacingScale = Math.min(1, gapMs / REFERENCE_STEP_MS);
      points.push({
        x: previousPoint.x + (x - previousX) * width / REFERENCE_WIDTH * spacingScale,
        y: previousPoint.y + (localY - previousLocalY) * spacingScale,
      });
    }
    localIndex += 1;
  });
  return points;
}

function separateWallScoreStrikePoints(
  visualHits: readonly { x: number; y: number }[],
  settings: StudioSettings,
) {
  const contactOffset = -wallScoreTubeHitPoint({ x: 0, y: 0 }, settings).y;
  const safeRadius = contactOffset + settings.ballSize * 0.45;
  const adjusted: { x: number; y: number }[] = [];
  for (const visual of visualHits) {
    let y = visual.y;
    for (const previous of adjusted) {
      const dx = Math.abs(visual.x - previous.x);
      if (dx >= safeRadius) continue;
      const minimumHitY = previous.y + Math.sqrt(safeRadius ** 2 - dx ** 2);
      y = Math.max(y, minimumHitY + contactOffset);
    }
    adjusted.push({ x: visual.x, y });
  }
  return adjusted;
}

export const WALL_SCORE_RAIL_ENTRY_T = 0.18;
export const WALL_SCORE_RAIL_EXIT_T = 0.78;

export interface WallScoreRailSegment {
  afterIndex: number;
  points: { x: number; y: number }[];
}

interface WallScoreBridgeGeometry {
  entry: { x: number; y: number };
  exit: { x: number; y: number };
  sag: number;
}

function wallScoreBridgeGeometry(start: MarblePlatform, end: MarblePlatform): WallScoreBridgeGeometry {
  const dx = end.hitX - start.hitX;
  const dy = end.hitY - start.hitY;
  const bridgeY = start.hitY + dy * 0.42 - Math.min(10, Math.abs(dx) * 0.05);
  return {
    entry: { x: start.hitX + dx * 0.28, y: bridgeY },
    exit: { x: start.hitX + dx * 0.7, y: bridgeY + dy * 0.06 },
    sag: Math.min(14, Math.max(9, Math.abs(dx) * 0.06)),
  };
}

function shortBridgeFlight(
  from: { x: number; y: number },
  to: { x: number; y: number },
  phase: number,
) {
  const p = Math.max(0, Math.min(1, phase));
  return {
    x: from.x + (to.x - from.x) * p,
    y: from.y + (to.y - from.y) * p - Math.sin(Math.PI * p) * 14,
  };
}

function wallScoreRailCenter(geometry: WallScoreBridgeGeometry, phase: number) {
  const p = Math.max(0, Math.min(1, phase));
  return {
    x: geometry.entry.x + (geometry.exit.x - geometry.entry.x) * p,
    y: geometry.entry.y + (geometry.exit.y - geometry.entry.y) * p
      + Math.sin(Math.PI * p) * geometry.sag,
  };
}

export function wallScoreMarblePointAtPhase(
  start: MarblePlatform,
  end: MarblePlatform,
  phase: number,
) {
  const p = Math.max(0, Math.min(1, phase));
  const geometry = wallScoreBridgeGeometry(start, end);
  if (p < WALL_SCORE_RAIL_ENTRY_T) {
    return shortBridgeFlight(start, geometry.entry, p / WALL_SCORE_RAIL_ENTRY_T);
  }
  if (p <= WALL_SCORE_RAIL_EXIT_T) {
    return wallScoreRailCenter(
      geometry,
      (p - WALL_SCORE_RAIL_ENTRY_T) / (WALL_SCORE_RAIL_EXIT_T - WALL_SCORE_RAIL_ENTRY_T),
    );
  }
  return shortBridgeFlight(
    geometry.exit,
    end,
    (p - WALL_SCORE_RAIL_EXIT_T) / (1 - WALL_SCORE_RAIL_EXIT_T),
  );
}

function wallScoreRailPoint(start: MarblePlatform, end: MarblePlatform, ratio: number, ballRadius: number) {
  const ball = wallScoreMarblePointAtPhase(start, end, ratio);
  const sample = 0.001;
  const before = wallScoreMarblePointAtPhase(start, end, Math.max(WALL_SCORE_RAIL_ENTRY_T, ratio - sample));
  const after = wallScoreMarblePointAtPhase(start, end, Math.min(WALL_SCORE_RAIL_EXIT_T, ratio + sample));
  const velocity = { x: after.x - before.x, y: after.y - before.y };
  const speed = Math.max(0.001, Math.hypot(velocity.x, velocity.y));
  let normal = { x: -velocity.y / speed, y: velocity.x / speed };
  if (normal.y < 0) normal = { x: -normal.x, y: -normal.y };
  return { x: ball.x + normal.x * ballRadius, y: ball.y + normal.y * ballRadius };
}

export function wallScoreRailSegments(platforms: readonly MarblePlatform[], ballRadius: number): WallScoreRailSegment[] {
  const segments: WallScoreRailSegment[] = [];
  for (let index = 0; index < platforms.length - 1; index += 1) {
    const start = platforms[index];
    const end = platforms[index + 1];
    const spanMs = end.event.timeMs - start.event.timeMs;
    if (spanMs < KOROBEINIKI_BRIDGE_GAP_MS) continue;
    const steps = 10;
    const points = Array.from({ length: steps + 1 }, (_, pointIndex) => {
      const ratio = WALL_SCORE_RAIL_ENTRY_T
        + (WALL_SCORE_RAIL_EXIT_T - WALL_SCORE_RAIL_ENTRY_T) * pointIndex / steps;
      return wallScoreRailPoint(start, end, ratio, ballRadius);
    });
    segments.push({ afterIndex: index, points });
  }
  return segments;
}

export function buildKorobeinikiReferenceCourse(
  events: readonly NoteEvent[],
  settings: StudioSettings,
  width: number,
  onProgress?: (progress: number) => void,
): MarblePlatform[] {
  const visualHits = separateWallScoreStrikePoints(wallScoreReferenceHits(events, width), settings);
  const hits = visualHits.map((visual) => wallScoreTubeHitPoint(visual, settings));
  const platforms = events.map((event, index) => {
    const visualHit = visualHits[index];
    const hit = hits[index];
    const next = hits[index + 1] ?? null;
    const spanSeconds = next
      ? Math.max(0.08, (events[index + 1].timeMs - event.timeMs) / 1000)
      : 0.42;
    const deltaY = next ? next.y - hit.y : 0;
    const bounceHeight = Math.max(
      REFERENCE_MIN_ARC_HEIGHT,
      deltaY * 0.25 + settings.ballSize * 0.45,
    );
    const gravity = next
      ? 8 * bounceHeight / spanSeconds ** 2
      : REFERENCE_GRAVITY;
    const previous = hits[index - 1];
    const terminalDirection = previous ? Math.sign(hit.x - previous.x) || 1 : 1;
    const outVX = next ? (next.x - hit.x) / spanSeconds : terminalDirection * 110;
    const outVY = next
      ? (deltaY - 4 * bounceHeight) / spanSeconds
      : -Math.max(160, settings.ballSize * 10);
    const platform: MarblePlatform = {
      index,
      x: hit.x,
      y: hit.y,
      visualX: visualHit.x,
      visualY: visualHit.y,
      width: settings.platformWidth * 0.58,
      thickness: settings.platformThickness,
      tiltRad: 0,
      color: korobeinikiColorForMidi(event.midi),
      contactX: hit.x,
      contactY: hit.y,
      hitX: hit.x,
      hitY: hit.y,
      normalX: 0,
      normalY: -1,
      outVX,
      outVY,
      gravity,
      contactMode: "surface",
      motionMode: "ballistic",
      event,
      visualStyle: "wall-boomwhacker-tube",
      visualThickness: Math.max(40, settings.platformThickness),
      visualTiltRad: 0,
    };
    onProgress?.(Math.min(1, (index + 1) / Math.max(1, events.length)));
    return platform;
  });
  return platforms;
}
