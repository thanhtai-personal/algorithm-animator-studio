import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldCell,
  AlgorithmWorldPhase,
  AlgorithmWorldProblemType,
  AlgorithmWorldScenarioOptions,
  Frame,
} from "./algorithms/types";
import {
  WORLD_COLS,
  WORLD_GOAL,
  WORLD_ROWS,
  WORLD_START,
  cellKey,
  cellListToKeys,
  makeDynamicObstacleSets,
  makeShiftingLabyrinthWalls,
  manhattan,
  neighbors,
  sameCell,
  worldAlgorithmName,
  worldAlgorithmRuntime,
} from "./algorithmWorld";

type ScoreMap = Record<string, number>;
type SearchResult = { frames: Frame[]; path: AlgorithmWorldCell[]; visitedCount: number };
type BuildArgs = Required<Pick<AlgorithmWorldScenarioOptions, "videoMode" | "problemType" | "primaryAlgorithm" | "secondaryAlgorithm">>;

export function createAlgorithmWorldFrames(opts: AlgorithmWorldScenarioOptions = {}) {
  const args: BuildArgs = {
    videoMode: opts.videoMode ?? "short",
    problemType: opts.problemType ?? "fastest",
    primaryAlgorithm: opts.primaryAlgorithm ?? "astar",
    secondaryAlgorithm: opts.secondaryAlgorithm ?? "dijkstra",
  };
  if (args.videoMode === "long") return createCompareFrames(args);
  return createSingleFrames(args.primaryAlgorithm, args.problemType);
}

function createCompareFrames(args: BuildArgs) {
  const left = createSingleFrames(args.primaryAlgorithm, args.problemType);
  const right = createSingleFrames(args.secondaryAlgorithm, args.problemType);
  const max = Math.max(left.length, right.length);
  const frames: Frame[] = [];
  for (let i = 0; i < max; i++) {
    const leftFrame = left[Math.min(i, left.length - 1)];
    const rightFrame = right[Math.min(i, right.length - 1)];
    frames.push({
      ...leftFrame,
      vars: {
        ...leftFrame.vars,
        task: args.problemType === "escape" ? "Find a path to the exit" : "Find the fastest path to the exit",
        compareLeft: worldAlgorithmName(args.primaryAlgorithm),
        compareRight: worldAlgorithmName(args.secondaryAlgorithm),
      },
      world: undefined,
      worldCompare: {
        problemType: args.problemType,
        left: leftFrame.world!,
        right: rightFrame.world!,
      },
    });
  }
  return frames;
}

function createSingleFrames(algorithm: AlgorithmWorldAlgorithmId, problemType: AlgorithmWorldProblemType) {
  const baseWalls = makeShiftingLabyrinthWalls();
  const dynamicSets = makeDynamicObstacleSets();
  const frames: Frame[] = [];
  const allDynamicWalls: AlgorithmWorldCell[] = [];
  let searchStart = WORLD_START;
  let previousPath: AlgorithmWorldCell[] = [];
  let committedPrefix: AlgorithmWorldCell[] = [WORLD_START];

  pushWorldFrame(frames, algorithm, problemType, {
    phase: "setup",
    status: `${worldAlgorithmName(algorithm)} starts at the maze entrance and looks for the exit.`,
    walls: baseWalls,
    dynamicWalls: [],
    openSet: [WORLD_START],
    closedSet: [],
    current: WORLD_START,
    path: [],
    previousPath: [],
    replanCount: 0,
    line: 0,
  });

  for (let wave = 0; wave < dynamicSets.length; wave++) {
    const result = runSearch({
      algorithm,
      problemType,
      start: searchStart,
      goal: WORLD_GOAL,
      baseWalls,
      dynamicWalls: allDynamicWalls,
      previousPath,
      committedPrefix,
      replanCount: wave,
    });
    frames.push(...result.frames);
    previousPath = mergePath(committedPrefix, result.path);

    const index = Math.min(previousPath.length - 2, Math.max(1, Math.floor(previousPath.length * 0.34)));
    searchStart = previousPath[index] ?? searchStart;
    committedPrefix = previousPath.slice(0, index + 1);
    const blockers = dynamicSets[wave];
    allDynamicWalls.push(...blockers);
    pushWorldFrame(frames, algorithm, problemType, {
      phase: "obstacle",
      status: "Real-time walls appear. The old route breaks, so the search restarts from the current position.",
      walls: baseWalls,
      dynamicWalls: [...allDynamicWalls],
      openSet: [],
      closedSet: [],
      current: searchStart,
      path: committedPrefix,
      previousPath,
      shatteredPath: previousPath,
      pulseCells: blockers,
      replanCount: wave + 1,
      line: 8,
      event: "swap",
    });
  }

  const final = runSearch({
    algorithm,
    problemType,
    start: searchStart,
    goal: WORLD_GOAL,
    baseWalls,
    dynamicWalls: allDynamicWalls,
    previousPath,
    committedPrefix,
    replanCount: dynamicSets.length,
  });
  frames.push(...final.frames);
  pushWorldFrame(frames, algorithm, problemType, {
    phase: "done",
    status: `Exit reached. Final route runs from entrance to exit using ${worldAlgorithmName(algorithm)}.`,
    walls: baseWalls,
    dynamicWalls: allDynamicWalls,
    openSet: [],
    closedSet: [],
    current: WORLD_GOAL,
    path: mergePath(committedPrefix, final.path),
    previousPath,
    replanCount: dynamicSets.length,
    visitedCount: final.visitedCount,
    line: 0,
    event: "found",
  });
  return frames;
}

function runSearch(params: {
  algorithm: AlgorithmWorldAlgorithmId;
  problemType: AlgorithmWorldProblemType;
  start: AlgorithmWorldCell;
  goal: AlgorithmWorldCell;
  baseWalls: AlgorithmWorldCell[];
  dynamicWalls: AlgorithmWorldCell[];
  previousPath: AlgorithmWorldCell[];
  committedPrefix: AlgorithmWorldCell[];
  replanCount: number;
}): SearchResult {
  const blocked = cellListToKeys([...params.baseWalls, ...params.dynamicWalls]);
  const frontier: AlgorithmWorldCell[] = [params.start];
  const frontierKeys = new Set([cellKey(params.start)]);
  const closed: AlgorithmWorldCell[] = [];
  const cameFrom = new Map<string, AlgorithmWorldCell>();
  const gScore: ScoreMap = { [cellKey(params.start)]: 0 };
  const hScore: ScoreMap = { [cellKey(params.start)]: manhattan(params.start, params.goal) };
  const fScore: ScoreMap = { [cellKey(params.start)]: score(params.algorithm, 0, hScore[cellKey(params.start)]) };
  const frames: Frame[] = [];
  let lastPath: AlgorithmWorldCell[] = [params.start];

  while (frontier.length) {
    sortFrontier(frontier, params.algorithm, gScore, fScore);
    const current = frontier.shift()!;
    frontierKeys.delete(cellKey(current));
    if (closed.some((cell) => sameCell(cell, current))) continue;
    closed.push(current);
    lastPath = reconstructPath(cameFrom, current);
    const fullPath = mergePath(params.committedPrefix, lastPath);
    const reached = sameCell(current, params.goal);
    pushWorldFrame(frames, params.algorithm, params.problemType, {
      phase: params.replanCount ? "replan" : "search",
      status: statusText(params.algorithm, reached, params.replanCount),
      walls: params.baseWalls,
      dynamicWalls: params.dynamicWalls,
      openSet: [...frontier],
      closedSet: [...closed],
      current,
      path: reached ? fullPath : params.committedPrefix,
      previousPath: params.previousPath,
      scores: scoreSnapshot(current, gScore, hScore, fScore),
      replanCount: params.replanCount,
      visitedCount: closed.length,
      line: reached ? 0 : 2,
      event: reached ? "found" : "visit",
    });
    if (reached) return { frames, path: lastPath, visitedCount: closed.length };

    for (const next of orderedNeighbors(current, params.algorithm)) {
      const nextKey = cellKey(next);
      if (blocked.has(nextKey) || closed.some((cell) => sameCell(cell, next))) continue;
      const tentativeG = (gScore[cellKey(current)] ?? Infinity) + cellCost(next, params.problemType);
      if (tentativeG >= (gScore[nextKey] ?? Infinity)) continue;
      cameFrom.set(nextKey, current);
      gScore[nextKey] = tentativeG;
      hScore[nextKey] = manhattan(next, params.goal);
      fScore[nextKey] = score(params.algorithm, tentativeG, hScore[nextKey]);
      if (!frontierKeys.has(nextKey)) {
        if (params.algorithm === "dfs") frontier.unshift(next);
        else frontier.push(next);
        frontierKeys.add(nextKey);
      }
      pushWorldFrame(frames, params.algorithm, params.problemType, {
        phase: params.replanCount ? "replan" : "search",
        status: `${worldAlgorithmName(params.algorithm)} checks neighbor cells and updates runtime counters.`,
        walls: params.baseWalls,
        dynamicWalls: params.dynamicWalls,
        openSet: [...frontier],
        closedSet: [...closed],
        current: next,
        path: params.committedPrefix,
        previousPath: params.previousPath,
        pulseCells: [next],
        scores: scoreSnapshot(next, gScore, hScore, fScore),
        replanCount: params.replanCount,
        visitedCount: closed.length,
        line: 6,
        event: "compare",
      });
    }
  }
  return { frames, path: lastPath, visitedCount: closed.length };
}

function orderedNeighbors(cell: AlgorithmWorldCell, algorithm: AlgorithmWorldAlgorithmId) {
  const list = neighbors(cell);
  if (algorithm === "dfs") return [...list].reverse();
  return list;
}

function sortFrontier(frontier: AlgorithmWorldCell[], algorithm: AlgorithmWorldAlgorithmId, gScore: ScoreMap, fScore: ScoreMap) {
  if (algorithm === "bfs" || algorithm === "dfs") return;
  const scores = algorithm === "dijkstra" ? gScore : fScore;
  frontier.sort((a, b) => (scores[cellKey(a)] ?? Infinity) - (scores[cellKey(b)] ?? Infinity));
}

function score(algorithm: AlgorithmWorldAlgorithmId, g: number, h: number) {
  if (algorithm === "astar") return g + h;
  if (algorithm === "dijkstra") return g;
  return g;
}

function cellCost(cell: AlgorithmWorldCell, problemType: AlgorithmWorldProblemType) {
  if (problemType === "escape") return 1;
  return 1 + (cell.x % 5 === 0 || cell.y % 4 === 0 ? 2 : 0);
}

function statusText(algorithm: AlgorithmWorldAlgorithmId, reached: boolean, replanCount: number) {
  if (reached) return `${worldAlgorithmName(algorithm)} found a complete path from entrance to exit.`;
  return replanCount
    ? `${worldAlgorithmName(algorithm)} replans after the maze changed.`
    : `${worldAlgorithmName(algorithm)} expands the maze from the entrance.`;
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

function mergePath(prefix: AlgorithmWorldCell[], suffix: AlgorithmWorldCell[]) {
  if (!prefix.length) return suffix;
  if (!suffix.length) return prefix;
  return sameCell(prefix[prefix.length - 1], suffix[0]) ? [...prefix, ...suffix.slice(1)] : [...prefix, ...suffix];
}

function scoreSnapshot(cell: AlgorithmWorldCell, gScore: ScoreMap, hScore: ScoreMap, fScore: ScoreMap) {
  const key = cellKey(cell);
  return { g: gScore[key] ?? 0, h: hScore[key] ?? 0, f: fScore[key] ?? 0 };
}

function pushWorldFrame(frames: Frame[], algorithm: AlgorithmWorldAlgorithmId, problemType: AlgorithmWorldProblemType, params: {
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
  visitedCount?: number;
  line: number;
  event?: Frame["event"];
}) {
  frames.push({
    arr: [], highlight: [], swap: [], sorted: [], pivot: null,
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
      runtime: worldAlgorithmRuntime(algorithm),
      visited: params.visitedCount ?? params.closedSet.length,
      pathLength: params.path.length || "—",
      task: problemType === "escape" ? "Find a path to the exit" : "Find the fastest path to the exit",
    },
    world: {
      cols: WORLD_COLS,
      rows: WORLD_ROWS,
      start: WORLD_START,
      goal: WORLD_GOAL,
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
      algorithmId: algorithm,
      algorithmName: worldAlgorithmName(algorithm),
      runtimeLabel: worldAlgorithmRuntime(algorithm),
      problemType,
      visitedCount: params.visitedCount ?? params.closedSet.length,
      pathLength: params.path.length || undefined,
    },
  });
}
