import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldCell,
  AlgorithmWorldMazeId,
  AlgorithmWorldProblemType,
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
  makeMazeWalls,
  manhattan,
  sameCell,
  worldAlgorithmName,
  worldAlgorithmRuntime,
} from "./algorithmWorld";
import { getWorldVehicle } from "./algorithmWorldVehicles";
import { runSearch, type AlgorithmWorldBuildArgs } from "./algorithmWorldRunner";

type RacePlan = {
  algorithm: AlgorithmWorldAlgorithmId;
  path: AlgorithmWorldCell[];
  visitedCount: number;
  searchDelay: number;
  finishTick: number;
  reached: boolean;
  vehicleColor: string;
  vehicleId: string;
  vehicleName: string;
  vehicleShape: string;
};

const RACE_APPROACH_TICKS = 3;

export function createRaceCompareFrames(args: AlgorithmWorldBuildArgs) {
  const baseWalls = makeMazeWalls(args.mazeId);
  const dynamicWalls = makeDynamicObstacleSets(args.mazeId).flat();
  const left = createRacePlan(args.primaryAlgorithm, args.problemType, args.mazeId, baseWalls, dynamicWalls, args.primaryVehicleId);
  const right = createRacePlan(args.secondaryAlgorithm, args.problemType, args.mazeId, baseWalls, dynamicWalls, args.secondaryVehicleId);
  const winnerTick = Math.min(left.finishTick, right.finishTick) + RACE_APPROACH_TICKS;
  const maxTick = Math.max(left.finishTick, right.finishTick) + RACE_APPROACH_TICKS + 12;
  const frames: Frame[] = [];

  for (let tick = 0; tick <= maxTick; tick++) {
    const leftWorld = raceWorldFor(left, args.problemType, args.mazeId, baseWalls, dynamicWalls, tick, left.finishTick + RACE_APPROACH_TICKS === winnerTick);
    const rightWorld = raceWorldFor(right, args.problemType, args.mazeId, baseWalls, dynamicWalls, tick, right.finishTick + RACE_APPROACH_TICKS === winnerTick);
    frames.push({
      arr: [], highlight: [], swap: [], sorted: [], pivot: null,
      line: tick,
      event: tick === winnerTick ? "found" : tick < 8 ? null : "visit",
      vars: {
        task: args.problemType === "escape" ? "Find a path to the exit" : "Find the fastest path to the exit",
        layout: args.videoMode,
        presentation: args.presentationMode,
        compareLeft: worldAlgorithmName(args.primaryAlgorithm),
        compareRight: worldAlgorithmName(args.secondaryAlgorithm),
        winner: leftWorld.raceWinner ? leftWorld.algorithmName : rightWorld.raceWinner ? rightWorld.algorithmName : "—",
      },
      worldCompare: { problemType: args.problemType, left: leftWorld, right: rightWorld },
    });
  }
  return frames;
}

function createRacePlan(
  algorithm: AlgorithmWorldAlgorithmId,
  problemType: AlgorithmWorldProblemType,
  mazeId: AlgorithmWorldMazeId,
  baseWalls: AlgorithmWorldCell[],
  dynamicWalls: AlgorithmWorldCell[],
  vehicleId: string,
): RacePlan {
  const vehicle = getWorldVehicle(vehicleId);
  const result = runSearch({
    algorithm,
    problemType,
    start: WORLD_START,
    goal: WORLD_GOAL,
    baseWalls,
    dynamicWalls,
    previousPath: [],
    committedPrefix: [WORLD_START],
    replanCount: 0,
    mazeId,
    presentationMode: "vehicle_race",
  });
  const path = buildDriveRoute(result.frames, result.path.length ? result.path : [WORLD_START], baseWalls, dynamicWalls);
  const searchDelay = 6;
  return {
    algorithm,
    path,
    visitedCount: result.visitedCount,
    searchDelay,
    finishTick: searchDelay + Math.max(0, path.length - 1),
    reached: result.reached,
    vehicleColor: vehicle.color,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleShape: vehicle.shape,
  };
}

function raceWorldFor(
  plan: RacePlan,
  problemType: AlgorithmWorldProblemType,
  mazeId: AlgorithmWorldMazeId,
  baseWalls: AlgorithmWorldCell[],
  dynamicWalls: AlgorithmWorldCell[],
  tick: number,
  isWinner: boolean,
) {
  const raceTick = Math.max(0, tick - RACE_APPROACH_TICKS);
  const finishTick = plan.finishTick + RACE_APPROACH_TICKS;
  const finished = tick >= finishTick && plan.reached;
  const moveIndex = Math.max(0, Math.min(plan.path.length - 1, raceTick - plan.searchDelay));
  const current = finished ? WORLD_GOAL : tick < RACE_APPROACH_TICKS ? { x: -1, y: WORLD_START.y } : raceTick < plan.searchDelay ? WORLD_START : plan.path[moveIndex];
  const visiblePath = finished ? plan.path : plan.path.slice(0, moveIndex + 1);
  const raceTime = Math.min(raceTick, plan.finishTick);
  const status = finished
    ? `${worldAlgorithmName(plan.algorithm)} reached the exit. Timer stopped.`
    : tick < RACE_APPROACH_TICKS
      ? `${worldAlgorithmName(plan.algorithm)} rolls into the maze entrance.`
      : raceTick < plan.searchDelay
      ? `${worldAlgorithmName(plan.algorithm)} scans the visible maze before moving.`
      : `${worldAlgorithmName(plan.algorithm)} drives one valid neighbor cell at a time.`;

  return {
    cols: WORLD_COLS,
    rows: WORLD_ROWS,
    start: WORLD_START,
    goal: WORLD_GOAL,
    walls: [...baseWalls],
    dynamicWalls: [...dynamicWalls],
    openSet: [],
    closedSet: [],
    current,
    path: visiblePath,
    previousPath: plan.path,
    phase: finished ? "done" as const : "search" as const,
    status,
    replanCount: 0,
    algorithmId: plan.algorithm,
    algorithmName: worldAlgorithmName(plan.algorithm),
    runtimeLabel: worldAlgorithmRuntime(plan.algorithm),
    problemType,
    mazeId,
    presentationMode: "vehicle_race" as const,
    visitedCount: plan.visitedCount,
    pathLength: plan.path.length,
    stepCount: raceTime,
    raceTime,
    raceFinishTime: plan.finishTick,
    raceFinished: finished,
    raceWinner: finished && isWinner,
    raceWinAge: finished && isWinner ? tick - finishTick : undefined,
    vehicleColor: plan.vehicleColor,
    vehicleId: plan.vehicleId,
    vehicleName: plan.vehicleName,
    vehicleShape: plan.vehicleShape,
  };
}

function sanitizeAdjacentPath(path: AlgorithmWorldCell[], baseWalls: AlgorithmWorldCell[], dynamicWalls: AlgorithmWorldCell[]) {
  const blocked = cellListToKeys([...baseWalls, ...dynamicWalls]);
  const safe: AlgorithmWorldCell[] = [];
  for (const cell of path) {
    if (blocked.has(cellKey(cell))) continue;
    const last = safe[safe.length - 1];
    if (!last || manhattan(last, cell) === 1 || sameCell(last, cell)) safe.push(cell);
  }
  return safe.length ? safe : [WORLD_START];
}

function buildDriveRoute(frames: Frame[], finalPath: AlgorithmWorldCell[], baseWalls: AlgorithmWorldCell[], dynamicWalls: AlgorithmWorldCell[]) {
  const blocked = cellListToKeys([...baseWalls, ...dynamicWalls]);
  const targets = frames
    .map((frame) => frame.world?.current)
    .filter((cell): cell is AlgorithmWorldCell => Boolean(cell) && !blocked.has(cellKey(cell)));
  const route: AlgorithmWorldCell[] = [WORLD_START];
  for (const target of targets) {
    appendConnector(route, target, blocked);
    if (sameCell(route[route.length - 1], WORLD_GOAL)) return route;
  }
  for (const target of sanitizeAdjacentPath(finalPath, baseWalls, dynamicWalls)) {
    appendConnector(route, target, blocked);
    if (sameCell(route[route.length - 1], WORLD_GOAL)) return route;
  }
  return route;
}

function appendConnector(route: AlgorithmWorldCell[], target: AlgorithmWorldCell, blocked: Set<string>) {
  const last = route[route.length - 1];
  if (sameCell(last, target)) return;
  const connector = shortestOpenPath(last, target, blocked);
  connector.slice(1).forEach((cell) => route.push(cell));
}

function shortestOpenPath(start: AlgorithmWorldCell, goal: AlgorithmWorldCell, blocked: Set<string>) {
  const queue: AlgorithmWorldCell[] = [start];
  const seen = new Set([cellKey(start)]);
  const parent = new Map<string, AlgorithmWorldCell>();
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (sameCell(current, goal)) return reconstructConnector(parent, current);
    for (const next of openNeighbors(current, blocked)) {
      const key = cellKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      parent.set(key, current);
      queue.push(next);
    }
  }
  return [start];
}

function openNeighbors(cell: AlgorithmWorldCell, blocked: Set<string>) {
  const candidates = [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x, y: cell.y - 1 },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x - 1, y: cell.y },
  ];
  return candidates.filter((next) => next.x >= 0 && next.x < WORLD_COLS && next.y >= 0 && next.y < WORLD_ROWS && !blocked.has(cellKey(next)));
}

function reconstructConnector(parent: Map<string, AlgorithmWorldCell>, current: AlgorithmWorldCell) {
  const path = [current];
  let key = cellKey(current);
  while (parent.has(key)) {
    const prev = parent.get(key)!;
    path.unshift(prev);
    key = cellKey(prev);
  }
  return path;
}
