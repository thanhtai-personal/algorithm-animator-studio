import type { AlgorithmWorldAlgorithmId, AlgorithmWorldCell, AlgorithmWorldProblemType } from "./algorithms/types";

export const WORLD_COLS = 25;
export const WORLD_ROWS = 15;
export const WORLD_START: AlgorithmWorldCell = { x: 0, y: 7 };
export const WORLD_GOAL: AlgorithmWorldCell = { x: WORLD_COLS - 1, y: 7 };

export const WORLD_ALGORITHMS: Array<{
  id: AlgorithmWorldAlgorithmId;
  name: string;
  runtime: string;
  taskFit: AlgorithmWorldProblemType[];
  note: string;
}> = [
  { id: "dfs", name: "DFS", runtime: "O(V + E)", taskFit: ["escape"], note: "Finds an exit fast, not guaranteed shortest." },
  { id: "bfs", name: "BFS", runtime: "O(V + E)", taskFit: ["escape", "fastest"], note: "Shortest path on an unweighted maze." },
  { id: "dijkstra", name: "Dijkstra", runtime: "O(E log V)", taskFit: ["fastest"], note: "Shortest path when cells can have weighted costs." },
  { id: "astar", name: "A*", runtime: "O(E log V)", taskFit: ["escape", "fastest"], note: "Dijkstra guided by a heuristic toward the exit." },
];

export const cellKey = (cell: AlgorithmWorldCell) => `${cell.x},${cell.y}`;
export const sameCell = (a: AlgorithmWorldCell, b: AlgorithmWorldCell) => a.x === b.x && a.y === b.y;
export const manhattan = (a: AlgorithmWorldCell, b: AlgorithmWorldCell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const cellListToKeys = (cells: AlgorithmWorldCell[]) => new Set(cells.map(cellKey));

export function neighbors(cell: AlgorithmWorldCell) {
  return [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x, y: cell.y - 1 },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x - 1, y: cell.y },
  ].filter((next) => next.x >= 0 && next.x < WORLD_COLS && next.y >= 0 && next.y < WORLD_ROWS);
}

export function worldAlgorithmName(id: AlgorithmWorldAlgorithmId) {
  return WORLD_ALGORITHMS.find((item) => item.id === id)?.name ?? id.toUpperCase();
}

export function worldAlgorithmRuntime(id: AlgorithmWorldAlgorithmId) {
  return WORLD_ALGORITHMS.find((item) => item.id === id)?.runtime ?? "O(?)";
}

export function makeShiftingLabyrinthWalls() {
  const open = new Set<string>();
  const carve = (x: number, y: number) => {
    if (x >= 0 && x < WORLD_COLS && y >= 0 && y < WORLD_ROWS) open.add(`${x},${y}`);
  };
  const line = (from: AlgorithmWorldCell, to: AlgorithmWorldCell) => {
    let { x, y } = from;
    carve(x, y);
    while (x !== to.x || y !== to.y) {
      if (x !== to.x) x += Math.sign(to.x - x);
      else if (y !== to.y) y += Math.sign(to.y - y);
      carve(x, y);
    }
  };
  const carveRoute = (points: AlgorithmWorldCell[]) => points.forEach((point, i) => i > 0 && line(points[i - 1], point));

  carveRoute([WORLD_START, { x: 4, y: 7 }, { x: 4, y: 2 }, { x: 10, y: 2 }, { x: 10, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 12 }, { x: 21, y: 12 }, { x: 21, y: 7 }, WORLD_GOAL]);
  carveRoute([{ x: 3, y: 8 }, { x: 8, y: 8 }, { x: 8, y: 4 }, { x: 13, y: 4 }, { x: 13, y: 9 }, { x: 18, y: 9 }, { x: 18, y: 5 }, { x: 22, y: 5 }, { x: 22, y: 7 }]);
  carveRoute([{ x: 2, y: 10 }, { x: 6, y: 10 }, { x: 6, y: 13 }, { x: 12, y: 13 }, { x: 12, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 7 }]);
  carveRoute([{ x: 6, y: 3 }, { x: 6, y: 6 }, { x: 11, y: 6 }, { x: 11, y: 11 }, { x: 16, y: 11 }]);

  for (let y = 2; y < WORLD_ROWS - 2; y += 3) {
    for (let x = 2; x < WORLD_COLS - 2; x += 4) if ((x + y) % 2 === 0) carve(x, y);
  }

  const walls: AlgorithmWorldCell[] = [];
  for (let y = 0; y < WORLD_ROWS; y++) {
    for (let x = 0; x < WORLD_COLS; x++) if (!open.has(`${x},${y}`)) walls.push({ x, y });
  }
  return walls;
}

export function makeDynamicObstacleSets() {
  return [
    [{ x: 8, y: 7 }, { x: 8, y: 6 }, { x: 9, y: 6 }],
    [{ x: 15, y: 7 }, { x: 15, y: 8 }, { x: 15, y: 9 }],
    [{ x: 21, y: 8 }, { x: 21, y: 9 }, { x: 21, y: 10 }],
  ];
}
