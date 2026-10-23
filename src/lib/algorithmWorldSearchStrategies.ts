import type { AlgorithmWorldCell, Frame } from "./algorithms/types";
import { WORLD_COLS, WORLD_GOAL, WORLD_ROWS, WORLD_START, cellKey, cellListToKeys, manhattan, neighbors, sameCell, worldAlgorithmName } from "./algorithmWorld";
import { pushWorldFrame } from "./algorithmWorldFrameBuilder";
import type { SearchParams, SearchResult } from "./algorithmWorldRunner";

type ParentMap = Map<string, AlgorithmWorldCell>;
type Dir = { dx: number; dy: number };

const DIRS: Dir[] = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
];

export function runBidirectionalBfs(params: SearchParams): SearchResult {
  const blocked = cellListToKeys([...params.baseWalls, ...params.dynamicWalls]);
  let frontA = [params.start];
  let frontB = [params.goal];
  const seenA = new Set([cellKey(params.start)]);
  const seenB = new Set([cellKey(params.goal)]);
  const parentA: ParentMap = new Map();
  const parentB: ParentMap = new Map();
  const closedA: AlgorithmWorldCell[] = [];
  const closedB: AlgorithmWorldCell[] = [];
  const frames: Frame[] = [];
  let steps = 0;

  while (frontA.length && frontB.length && steps < 260) {
    const fromStart = frontA.length <= frontB.length;
    const currentFront = fromStart ? frontA : frontB;
    const nextFront: AlgorithmWorldCell[] = [];
    for (const current of currentFront) {
      steps++;
      const closed = fromStart ? closedA : closedB;
      closed.push(current);
      pushStrategyFrame(frames, params, {
        phase: params.replanCount ? "replan" : "search",
        current,
        openSet: [...frontA, ...frontB],
        closedSet: [...closedA, ...closedB],
        pulseCells: fromStart ? frontB : frontA,
        status: `${worldAlgorithmName(params.algorithm)} expands from both entrance and exit until the waves meet.`,
        line: 2,
        event: "visit",
        stepCount: steps,
      });

      for (const next of neighbors(current)) {
        const key = cellKey(next);
        if (blocked.has(key)) continue;
        if (fromStart && !seenA.has(key)) {
          seenA.add(key);
          parentA.set(key, current);
          if (seenB.has(key)) return finishBidirectional(params, frames, parentA, parentB, next, [...closedA, ...closedB], steps);
          nextFront.push(next);
        }
        if (!fromStart && !seenB.has(key)) {
          seenB.add(key);
          parentB.set(key, current);
          if (seenA.has(key)) return finishBidirectional(params, frames, parentA, parentB, next, [...closedA, ...closedB], steps);
          nextFront.push(next);
        }
      }
    }
    if (fromStart) frontA = nextFront;
    else frontB = nextFront;
  }
  return { frames, path: [params.start], visitedCount: closedA.length + closedB.length, reached: false };
}

export function runWallFollower(params: SearchParams): SearchResult {
  const blocked = cellListToKeys([...params.baseWalls, ...params.dynamicWalls]);
  const frames: Frame[] = [];
  const route: AlgorithmWorldCell[] = [params.start];
  const visited: AlgorithmWorldCell[] = [];
  let current = params.start;
  let dir = 0;
  const maxSteps = 700;

  for (let step = 1; step <= maxSteps; step++) {
    visited.push(current);
    const path = mergePrefix(params.committedPrefix, route);
    pushStrategyFrame(frames, params, {
      phase: params.replanCount ? "replan" : "search",
      current,
      openSet: legalMoves(current, blocked),
      closedSet: [...visited],
      path,
      status: `${worldAlgorithmName(params.algorithm)} keeps one wall on its side and moves only to an adjacent open cell.`,
      line: 4,
      event: sameCell(current, params.goal) ? "found" : "visit",
      stepCount: step,
    });
    if (sameCell(current, params.goal)) return { frames, path: route, visitedCount: visited.length, reached: true };

    const turnOrder = [1, 0, -1, 2];
    let moved = false;
    for (const turn of turnOrder) {
      const ndir = mod(dir + turn, DIRS.length);
      const next = move(current, DIRS[ndir]);
      if (isOpen(next, blocked)) {
        dir = ndir;
        current = next;
        route.push(next);
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  return appendFallback(params, frames, route, visited, "Wall follower got trapped, then uses a safety connector for the demo route.");
}

export function runTremaux(params: SearchParams): SearchResult {
  const blocked = cellListToKeys([...params.baseWalls, ...params.dynamicWalls]);
  const frames: Frame[] = [];
  const stack: AlgorithmWorldCell[] = [params.start];
  const route: AlgorithmWorldCell[] = [params.start];
  const visits = new Map<string, number>([[cellKey(params.start), 1]]);
  const closed: AlgorithmWorldCell[] = [];
  let step = 0;

  while (stack.length && step < 700) {
    const current = stack[stack.length - 1];
    step++;
    closed.push(current);
    pushStrategyFrame(frames, params, {
      phase: params.replanCount ? "replan" : "search",
      current,
      openSet: unblockedNeighbors(current, blocked),
      closedSet: [...closed],
      path: mergePrefix(params.committedPrefix, route),
      status: `${worldAlgorithmName(params.algorithm)} marks passages, prefers unvisited cells, then backtracks when needed.`,
      line: visits.get(cellKey(current))! > 1 ? 6 : 3,
      event: sameCell(current, params.goal) ? "found" : "visit",
      stepCount: step,
    });
    if (sameCell(current, params.goal)) return { frames, path: route, visitedCount: closed.length, reached: true };

    const next = unblockedNeighbors(current, blocked)
      .sort((a, b) => (visits.get(cellKey(a)) ?? 0) - (visits.get(cellKey(b)) ?? 0) || manhattan(a, params.goal) - manhattan(b, params.goal))[0];
    if (next && (visits.get(cellKey(next)) ?? 0) === 0) {
      stack.push(next);
      route.push(next);
      visits.set(cellKey(next), 1);
    } else {
      stack.pop();
      if (stack.length) {
        const back = stack[stack.length - 1];
        route.push(back);
        visits.set(cellKey(back), (visits.get(cellKey(back)) ?? 0) + 1);
      }
    }
  }
  return appendFallback(params, frames, route, closed, "Trémaux ran out of marked passages, then uses a safety connector for the demo route.");
}

function finishBidirectional(params: SearchParams, frames: Frame[], parentA: ParentMap, parentB: ParentMap, meet: AlgorithmWorldCell, closedSet: AlgorithmWorldCell[], steps: number): SearchResult {
  const path = [...pathFromStart(parentA, meet), ...pathToGoal(parentB, meet).slice(1)];
  pushStrategyFrame(frames, params, {
    phase: "done",
    current: meet,
    openSet: [],
    closedSet,
    path: mergePrefix(params.committedPrefix, path),
    pulseCells: [meet],
    status: `${worldAlgorithmName(params.algorithm)} found the meeting cell and joins the two half-paths.`,
    line: 8,
    event: "found",
    stepCount: steps,
  });
  return { frames, path, visitedCount: closedSet.length, reached: true };
}

function appendFallback(params: SearchParams, frames: Frame[], route: AlgorithmWorldCell[], closed: AlgorithmWorldCell[], status: string): SearchResult {
  const blocked = cellListToKeys([...params.baseWalls, ...params.dynamicWalls]);
  const connector = shortestOpenPath(route[route.length - 1] ?? params.start, params.goal, blocked);
  const path = [...route, ...connector.slice(1)];
  pushStrategyFrame(frames, params, {
    phase: "done",
    current: params.goal,
    openSet: [],
    closedSet: closed,
    path: mergePrefix(params.committedPrefix, path),
    status,
    line: 9,
    event: "found",
    stepCount: frames.length + 1,
  });
  return { frames, path, visitedCount: closed.length, reached: true };
}

function pushStrategyFrame(frames: Frame[], params: SearchParams, opts: {
  phase: "search" | "replan" | "done";
  current: AlgorithmWorldCell;
  openSet: AlgorithmWorldCell[];
  closedSet: AlgorithmWorldCell[];
  status: string;
  line: number;
  event: Frame["event"];
  stepCount: number;
  path?: AlgorithmWorldCell[];
  pulseCells?: AlgorithmWorldCell[];
}) {
  const h = manhattan(opts.current, WORLD_GOAL);
  pushWorldFrame(frames, params.algorithm, params.problemType, {
    phase: opts.phase,
    status: opts.status,
    walls: params.baseWalls,
    dynamicWalls: params.dynamicWalls,
    openSet: opts.openSet,
    closedSet: opts.closedSet,
    current: opts.current,
    path: opts.path ?? params.committedPrefix,
    previousPath: params.previousPath,
    pulseCells: opts.pulseCells,
    scores: { g: opts.stepCount, h, f: opts.stepCount + h },
    replanCount: params.replanCount,
    mazeId: params.mazeId,
    presentationMode: params.presentationMode,
    visitedCount: opts.closedSet.length,
    stepCount: opts.stepCount,
    line: opts.line,
    event: opts.event,
  });
}

function pathFromStart(parent: ParentMap, current: AlgorithmWorldCell) {
  const path = [current];
  let key = cellKey(current);
  while (parent.has(key)) {
    const prev = parent.get(key)!;
    path.unshift(prev);
    key = cellKey(prev);
  }
  return path;
}

function pathToGoal(parent: ParentMap, current: AlgorithmWorldCell) {
  const path = [current];
  let key = cellKey(current);
  while (parent.has(key)) {
    const next = parent.get(key)!;
    path.push(next);
    key = cellKey(next);
  }
  return path;
}

function unblockedNeighbors(cell: AlgorithmWorldCell, blocked: Set<string>) {
  return neighbors(cell).filter((next) => !blocked.has(cellKey(next)));
}

function legalMoves(cell: AlgorithmWorldCell, blocked: Set<string>) {
  return DIRS.map((dir) => move(cell, dir)).filter((next) => isOpen(next, blocked));
}

function isOpen(cell: AlgorithmWorldCell, blocked: Set<string>) {
  return cell.x >= 0 && cell.x < WORLD_COLS && cell.y >= 0 && cell.y < WORLD_ROWS && !blocked.has(cellKey(cell));
}

function move(cell: AlgorithmWorldCell, dir: Dir) {
  return { x: cell.x + dir.dx, y: cell.y + dir.dy };
}

function mod(value: number, by: number) {
  return ((value % by) + by) % by;
}

function shortestOpenPath(start: AlgorithmWorldCell, goal: AlgorithmWorldCell, blocked: Set<string>) {
  const queue = [start];
  const seen = new Set([cellKey(start)]);
  const parent: ParentMap = new Map();
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (sameCell(current, goal)) return pathFromStart(parent, current);
    for (const next of unblockedNeighbors(current, blocked)) {
      const key = cellKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      parent.set(key, current);
      queue.push(next);
    }
  }
  return [start];
}

function mergePrefix(prefix: AlgorithmWorldCell[], suffix: AlgorithmWorldCell[]) {
  if (!prefix.length) return suffix;
  if (!suffix.length) return prefix;
  return sameCell(prefix[prefix.length - 1], suffix[0]) ? [...prefix, ...suffix.slice(1)] : [...prefix, ...suffix];
}
