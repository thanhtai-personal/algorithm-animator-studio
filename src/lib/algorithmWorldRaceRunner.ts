import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldCell,
  AlgorithmWorldMazeId,
  AlgorithmWorldProblemType,
  AlgorithmWorldRaceIntroStage,
  AlgorithmWorldState,
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
  mazeNamePair,
  randomMazeCandidates,
  sameCell,
  worldAlgorithmName,
  worldAlgorithmRuntime,
} from "./algorithmWorld";
import { buildTournamentState } from "./algorithmWorldTournament";
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

type IntroFrameOpts = {
  stage: AlgorithmWorldRaceIntroStage;
  tick: number;
  duration: number;
  event: Frame["event"];
  walls: AlgorithmWorldCell[];
  dynamicWalls: AlgorithmWorldCell[];
  leftWinner?: boolean;
  rightWinner?: boolean;
  winnerName?: string;
  tie?: boolean;
  winnerAlgorithm?: AlgorithmWorldAlgorithmId;
  assemblyProgress?: number;
  pickedIndex?: number;
};

const RACE_APPROACH_TICKS = 3;
const RANDOM_TICKS = 38;
const ASSEMBLE_TICKS = 30;
const VS_TICKS = 42;
const WINNER_TICKS = 52;
const BRACKET_TICKS = 70;

export function createRaceCompareFrames(args: AlgorithmWorldBuildArgs) {
  const baseWalls = makeMazeWalls(args.mazeId);
  const dynamicWalls = makeDynamicObstacleSets(args.mazeId).flat();
  const left = createRacePlan(args.primaryAlgorithm, args.problemType, args.mazeId, baseWalls, dynamicWalls, args.primaryVehicleId);
  const right = createRacePlan(args.secondaryAlgorithm, args.problemType, args.mazeId, baseWalls, dynamicWalls, args.secondaryVehicleId);
  const winnerTick = Math.min(left.finishTick, right.finishTick) + RACE_APPROACH_TICKS;
  const maxTick = Math.max(left.finishTick, right.finishTick) + RACE_APPROACH_TICKS + 12;
  const frames: Frame[] = [];

  if (args.randomMazeRequested) {
    for (let tick = 0; tick < RANDOM_TICKS; tick++) {
      frames.push(createIntroFrame(args, left, right, { stage: "randomizing", tick, duration: RANDOM_TICKS, event: tick % 6 === 0 ? "compare" : null, walls: [], dynamicWalls: [], pickedIndex: tick }));
    }
    const orderedWalls = assemblyOrder(baseWalls);
    for (let tick = 0; tick < ASSEMBLE_TICKS; tick++) {
      const progress = easeOutCubic((tick + 1) / ASSEMBLE_TICKS);
      frames.push(createIntroFrame(args, left, right, {
        stage: "assembling",
        tick,
        duration: ASSEMBLE_TICKS,
        event: tick % 5 === 0 ? "swap" : null,
        walls: orderedWalls.slice(0, Math.ceil(orderedWalls.length * progress)),
        dynamicWalls,
        assemblyProgress: progress,
      }));
    }
  }

  for (let tick = 0; tick < VS_TICKS; tick++) {
    frames.push(createIntroFrame(args, left, right, { stage: "versus", tick, duration: VS_TICKS, event: tick === 10 ? "found" : null, walls: baseWalls, dynamicWalls }));
  }

  for (let tick = 0; tick <= maxTick; tick++) {
    const leftWorld = raceWorldFor(left, args.problemType, args.mazeId, baseWalls, dynamicWalls, tick, left.finishTick + RACE_APPROACH_TICKS === winnerTick);
    const rightWorld = raceWorldFor(right, args.problemType, args.mazeId, baseWalls, dynamicWalls, tick, right.finishTick + RACE_APPROACH_TICKS === winnerTick);
    frames.push(createRaceFrame(args, leftWorld, rightWorld, tick, tick === winnerTick ? "found" : tick < 8 ? null : "visit", "race"));
  }

  const isTie = left.finishTick === right.finishTick;
  const leftWins = left.finishTick <= right.finishTick;
  const winnerAlgorithm = leftWins ? left.algorithm : right.algorithm;
  const tie = args.tournamentEnabled ? false : isTie;
  for (let tick = 0; tick < WINNER_TICKS; tick++) {
    frames.push(createIntroFrame(args, left, right, {
      stage: "winner",
      tick,
      duration: WINNER_TICKS,
      event: tick === 0 ? "found" : null,
      walls: baseWalls,
      dynamicWalls,
      leftWinner: tie || leftWins,
      rightWinner: tie || !leftWins,
      winnerName: tie ? undefined : worldAlgorithmName(winnerAlgorithm),
      winnerAlgorithm,
      tie,
    }));
  }
  if (args.tournamentEnabled) {
    for (let tick = 0; tick < BRACKET_TICKS; tick++) {
      frames.push(createIntroFrame(args, left, right, {
        stage: "bracket",
        tick,
        duration: BRACKET_TICKS,
        event: tick === 0 ? "found" : null,
        walls: baseWalls,
        dynamicWalls,
        leftWinner: leftWins,
        rightWinner: !leftWins,
        winnerName: worldAlgorithmName(winnerAlgorithm),
        winnerAlgorithm,
      }));
    }
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

function createIntroFrame(args: AlgorithmWorldBuildArgs, left: RacePlan, right: RacePlan, opts: IntroFrameOpts): Frame {
  const leftWorld = raceWorldFor(left, args.problemType, args.mazeId, opts.walls, opts.dynamicWalls, (opts.stage === "winner" || opts.stage === "bracket") ? left.finishTick + RACE_APPROACH_TICKS : 0, Boolean(opts.leftWinner));
  const rightWorld = raceWorldFor(right, args.problemType, args.mazeId, opts.walls, opts.dynamicWalls, (opts.stage === "winner" || opts.stage === "bracket") ? right.finishTick + RACE_APPROACH_TICKS : 0, Boolean(opts.rightWinner));
  leftWorld.raceIntroStage = opts.stage;
  rightWorld.raceIntroStage = opts.stage;
  return createRaceFrame(args, leftWorld, rightWorld, opts.tick, opts.event, opts.stage, opts);
}

function createRaceFrame(args: AlgorithmWorldBuildArgs, leftWorld: AlgorithmWorldState, rightWorld: AlgorithmWorldState, tick: number, event: Frame["event"], stage: AlgorithmWorldRaceIntroStage, opts?: Partial<IntroFrameOpts>): Frame {
  const maze = mazeNamePair(args.mazeId);
  const candidates = randomMazeCandidates();
  return {
    arr: [], highlight: [], swap: [], sorted: [], pivot: null,
    line: tick,
    event,
    vars: {
      task: args.problemType === "escape" ? "Find a path to the exit" : "Find the fastest path to the exit",
      layout: args.videoMode,
      presentation: args.presentationMode,
      compareLeft: worldAlgorithmName(args.primaryAlgorithm),
      compareRight: worldAlgorithmName(args.secondaryAlgorithm),
      maze: maze.en,
      raceStage: stage,
      winner: leftWorld.raceWinner ? leftWorld.algorithmName : rightWorld.raceWinner ? rightWorld.algorithmName : opts?.tie ? "TIE" : "—",
    },
    worldCompare: {
      problemType: args.problemType,
      left: leftWorld,
      right: rightWorld,
      raceIntro: {
        stage,
        tick,
        duration: opts?.duration ?? 1,
        mazeId: args.mazeId,
        mazeNameEn: maze.en,
        mazeNameVi: maze.vi,
        leftName: worldAlgorithmName(args.primaryAlgorithm),
        rightName: worldAlgorithmName(args.secondaryAlgorithm),
        requestedRandom: args.randomMazeRequested,
        candidatesEn: candidates.map((item) => item.en),
        candidatesVi: candidates.map((item) => item.vi),
        pickedIndex: opts?.pickedIndex,
        assemblyProgress: opts?.assemblyProgress,
        winnerName: opts?.winnerName,
        tie: opts?.tie,
        tournament: args.tournamentEnabled ? buildTournamentState({
          round: args.tournamentRound,
          match: args.tournamentMatch,
          winner: opts?.winnerAlgorithm,
        }) : undefined,
      },
    },
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
): AlgorithmWorldState {
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

function assemblyOrder(walls: AlgorithmWorldCell[]) {
  const center = { x: WORLD_COLS / 2, y: WORLD_ROWS / 2 };
  return [...walls].sort((a, b) => Math.abs(a.x - center.x) + Math.abs(a.y - center.y) - (Math.abs(b.x - center.x) + Math.abs(b.y - center.y)));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
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
