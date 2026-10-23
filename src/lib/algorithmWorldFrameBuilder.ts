import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldCell,
  AlgorithmWorldMazeId,
  AlgorithmWorldPhase,
  AlgorithmWorldPresentationMode,
  AlgorithmWorldProblemType,
  Frame,
} from "./algorithms/types";
import {
  WORLD_COLS,
  WORLD_GOAL,
  WORLD_ROWS,
  WORLD_START,
  cellKey,
  worldAlgorithmName,
  worldAlgorithmRuntime,
} from "./algorithmWorld";

type PushParams = {
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
  mazeId: AlgorithmWorldMazeId;
  presentationMode: AlgorithmWorldPresentationMode;
  visitedCount?: number;
  stepCount?: number;
  line: number;
  event?: Frame["event"];
};

export function pushWorldFrame(frames: Frame[], algorithm: AlgorithmWorldAlgorithmId, problemType: AlgorithmWorldProblemType, params: PushParams) {
  frames.push({
    arr: [], highlight: [], swap: [], sorted: [], pivot: null,
    line: params.line,
    event: params.event ?? null,
    vars: {
      phase: params.phase,
      open: params.openSet.length,
      closed: params.closedSet.length,
      replan: params.replanCount,
      maze: params.mazeId,
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
      mazeId: params.mazeId,
      presentationMode: params.presentationMode,
      visibleCells: visibleCellsFor(params),
      stepCount: params.stepCount ?? frames.length + 1,
      visitedCount: params.visitedCount ?? params.closedSet.length,
      pathLength: params.path.length || undefined,
    },
  });
}

function visibleCellsFor(params: {
  openSet: AlgorithmWorldCell[];
  closedSet: AlgorithmWorldCell[];
  current: AlgorithmWorldCell | null;
  path: AlgorithmWorldCell[];
  previousPath: AlgorithmWorldCell[];
  shatteredPath?: AlgorithmWorldCell[];
  pulseCells?: AlgorithmWorldCell[];
}) {
  const visible = new Map<string, AlgorithmWorldCell>();
  const reveal = (cell: AlgorithmWorldCell | null | undefined, radius = 1) => {
    if (!cell) return;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const next = { x: cell.x + dx, y: cell.y + dy };
        if (next.x < 0 || next.x >= WORLD_COLS || next.y < 0 || next.y >= WORLD_ROWS) continue;
        visible.set(cellKey(next), next);
      }
    }
  };
  reveal(WORLD_START, 2);
  reveal(WORLD_GOAL, 1);
  params.closedSet.forEach((cell) => reveal(cell, 1));
  params.openSet.forEach((cell) => reveal(cell, 1));
  params.path.forEach((cell) => reveal(cell, 1));
  params.previousPath.forEach((cell) => reveal(cell, 0));
  params.shatteredPath?.forEach((cell) => reveal(cell, 0));
  params.pulseCells?.forEach((cell) => reveal(cell, 1));
  reveal(params.current, 2);
  return [...visible.values()];
}
