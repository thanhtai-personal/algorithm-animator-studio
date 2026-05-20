import type { AlgoDef, AlgorithmWorldCell, AlgorithmWorldPhase, Frame } from "../types";
import {
  WORLD_COLS,
  WORLD_ROWS,
  cellKey,
  cellListToKeys,
  makeDynamicObstacleSets,
  makeShiftingLabyrinthWalls,
  manhattan,
  neighbors,
  sameCell,
} from "../../algorithmWorld";

const START: AlgorithmWorldCell = { x: 1, y: 1 };
const GOAL: AlgorithmWorldCell = { x: 15, y: 21 };

type ScoreMap = Record<string, number>;

type SearchResult = {
  frames: Frame[];
  path: AlgorithmWorldCell[];
};

export const astar: AlgoDef = {
  id: "astar",
  name: "A* Pathfinding",
  category: "graph",
  code: `openSet = [start];
while (openSet.length) {
  current = node with lowest f = g + h;
  if (current === goal) return path;
  move current to closedSet;
  for (neighbor of current.neighbors) {
    if (wall || closedSet.has(neighbor)) continue;
    update g, h, f and parent when better;
  }
}
replan when real-time walls break the path;`,
  run() {
    const baseWalls = makeShiftingLabyrinthWalls();
    const dynamicSets = makeDynamicObstacleSets();
    const frames: Frame[] = [];
    const allDynamicWalls: AlgorithmWorldCell[] = [];

    pushWorldFrame(frames, {
      phase: "setup",
      status: "Shifting Labyrinth loaded. A* balances cost so far + heuristic distance.",
      walls: baseWalls,
      dynamicWalls: [],
      openSet: [START],
      closedSet: [],
      current: START,
      path: [],
      previousPath: [],
      replanCount: 0,
      line: 0,
    });

    let searchStart = START;
    let previousPath: AlgorithmWorldCell[] = [];
    for (let wave = 0; wave < dynamicSets.length; wave++) {
      const result = runAStarSearch({
        start: searchStart,
        goal: GOAL,
        baseWalls,
        dynamicWalls: allDynamicWalls,
        previousPath,
        replanCount: wave,
        statusPrefix: wave === 0 ? "A* expands the open set" : `Replan #${wave}: pivot through the new gap`,
      });
      frames.push(...result.frames);
      previousPath = result.path;

      const blockers = dynamicSets[wave];
      allDynamicWalls.push(...blockers);
      searchStart = result.path[Math.min(result.path.length - 2, Math.max(1, Math.floor(result.path.length * 0.35)))] ?? searchStart;
      pushWorldFrame(frames, {
        phase: "obstacle",
        status: "Real-time walls appeared. The old best path shatters and A* must replan.",
        walls: baseWalls,
        dynamicWalls: [...allDynamicWalls],
        openSet: [],
        closedSet: [],
        current: searchStart,
        path: [],
        previousPath,
        shatteredPath: previousPath,
        pulseCells: blockers,
        replanCount: wave + 1,
        line: 8,
        event: "swap",
      });
    }

    const final = runAStarSearch({
      start: searchStart,
      goal: GOAL,
      baseWalls,
      dynamicWalls: allDynamicWalls,
      previousPath,
      replanCount: dynamicSets.length,
      statusPrefix: "Final replan: A* locks onto the surviving corridor",
    });
    frames.push(...final.frames);
    pushWorldFrame(frames, {
      phase: "done",
      status: "Goal reached. A* rebuilt the route as the maze changed in real time.",
      walls: baseWalls,
      dynamicWalls: allDynamicWalls,
      openSet: [],
      closedSet: [],
      current: GOAL,
      path: final.path,
      previousPath,
      replanCount: dynamicSets.length,
      line: 0,
      event: "found",
    });
    return frames;
  },
};

function runAStarSearch(params: {
  start: AlgorithmWorldCell;
  goal: AlgorithmWorldCell;
  baseWalls: AlgorithmWorldCell[];
  dynamicWalls: AlgorithmWorldCell[];
  previousPath: AlgorithmWorldCell[];
  replanCount: number;
  statusPrefix: string;
}): SearchResult {
  const blocked = cellListToKeys([...params.baseWalls, ...params.dynamicWalls]);
  const open = [params.start];
  const openKeys = new Set([cellKey(params.start)]);
  const closed: AlgorithmWorldCell[] = [];
  const cameFrom = new Map<string, AlgorithmWorldCell>();
  const gScore: ScoreMap = { [cellKey(params.start)]: 0 };
  const hScore: ScoreMap = { [cellKey(params.start)]: manhattan(params.start, params.goal) };
  const fScore: ScoreMap = { [cellKey(params.start)]: hScore[cellKey(params.start)] };
  const frames: Frame[] = [];
  let lastPath: AlgorithmWorldCell[] = [];

  while (open.length) {
    open.sort((a, b) => (fScore[cellKey(a)] ?? Infinity) - (fScore[cellKey(b)] ?? Infinity));
    const current = open.shift()!;
    openKeys.delete(cellKey(current));
    closed.push(current);
    lastPath = reconstructPath(cameFrom, current);
    pushWorldFrame(frames, {
      phase: params.replanCount ? "replan" : "search",
      status: `${params.statusPrefix}: choosing lowest f-score cell.`,
      walls: params.baseWalls,
      dynamicWalls: params.dynamicWalls,
      openSet: [...open],
      closedSet: [...closed],
      current,
      path: sameCell(current, params.goal) ? lastPath : [],
      previousPath: params.previousPath,
      scores: scoreSnapshot(current, gScore, hScore, fScore),
      replanCount: params.replanCount,
      line: 2,
      event: "visit",
    });

    if (sameCell(current, params.goal)) return { frames, path: lastPath };

    for (const next of neighbors(current)) {
      const nextKey = cellKey(next);
      if (blocked.has(nextKey) || closed.some((cell) => sameCell(cell, next))) continue;
      const tentativeG = (gScore[cellKey(current)] ?? Infinity) + 1;
      if (tentativeG >= (gScore[nextKey] ?? Infinity)) continue;
      cameFrom.set(nextKey, current);
      gScore[nextKey] = tentativeG;
      hScore[nextKey] = manhattan(next, params.goal);
      fScore[nextKey] = tentativeG + hScore[nextKey];
      if (!openKeys.has(nextKey)) {
        open.push(next);
        openKeys.add(nextKey);
      }
      pushWorldFrame(frames, {
        phase: params.replanCount ? "replan" : "search",
        status: `${params.statusPrefix}: recalculating g + h for neighbors.`,
        walls: params.baseWalls,
        dynamicWalls: params.dynamicWalls,
        openSet: [...open],
        closedSet: [...closed],
        current: next,
        path: [],
        previousPath: params.previousPath,
        pulseCells: [next],
        scores: scoreSnapshot(next, gScore, hScore, fScore),
        replanCount: params.replanCount,
        line: 6,
        event: "compare",
      });
    }
  }
  return { frames, path: lastPath };
}

function reconstructPath(cameFrom: Map<string, AlgorithmWorldCell>, current: AlgorithmWorldCell) {
  const path = [current];
  let key = cellKey(current);
  while (cameFrom.has(key)) {
    const prev = cameFrom.get(key)!;
    path.unshift(prev);
    key = cellKey(prev);
  }
  return path;
}

function scoreSnapshot(cell: AlgorithmWorldCell, gScore: ScoreMap, hScore: ScoreMap, fScore: ScoreMap) {
  const key = cellKey(cell);
  return { g: gScore[key] ?? 0, h: hScore[key] ?? manhattan(cell, GOAL), f: fScore[key] ?? 0 };
}

function pushWorldFrame(frames: Frame[], params: {
  phase: AlgorithmWorldPhase;
  status: string;
  walls: AlgorithmWorldCell[];
  dynamicWalls: AlgorithmWorldCell[];
  openSet: AlgorithmWorldCell[];
  closedSet: AlgorithmWorldCell[];
  current: AlgorithmWorldCell | null;
  path: AlgorithmWorldCell[];
  previousPath: AlgorithmWorldCell[];
  shatteredPath?: AlgorithmWorldCell[];
  pulseCells?: AlgorithmWorldCell[];
  scores?: { g: number; h: number; f: number };
  replanCount: number;
  line: number;
  event?: Frame["event"];
}) {
  frames.push({
    arr: [],
    highlight: [],
    swap: [],
    sorted: [],
    pivot: null,
    line: params.line,
    event: params.event ?? null,
    vars: {
      phase: params.phase,
      open: params.openSet.length,
      closed: params.closedSet.length,
      replan: params.replanCount,
      g: params.scores?.g ?? "—",
      h: params.scores?.h ?? "—",
      f: params.scores?.f ?? "—",
      task: "A* vs real-time maze obstacles",
    },
    world: {
      cols: WORLD_COLS,
      rows: WORLD_ROWS,
      start: START,
      goal: GOAL,
      walls: [...params.walls],
      dynamicWalls: [...params.dynamicWalls],
      openSet: [...params.openSet],
      closedSet: [...params.closedSet],
      current: params.current,
      path: [...params.path],
      previousPath: [...params.previousPath],
      shatteredPath: [...(params.shatteredPath ?? [])],
      pulseCells: [...(params.pulseCells ?? [])],
      scores: params.scores,
      phase: params.phase,
      status: params.status,
      replanCount: params.replanCount,
    },
  });
}
