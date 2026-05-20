import type { AlgorithmWorldCell } from "./algorithms/types";

export const WORLD_COLS = 17;
export const WORLD_ROWS = 23;

export const cellKey = (cell: AlgorithmWorldCell) => `${cell.x},${cell.y}`;
export const sameCell = (a: AlgorithmWorldCell, b: AlgorithmWorldCell) => a.x === b.x && a.y === b.y;
export const manhattan = (a: AlgorithmWorldCell, b: AlgorithmWorldCell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function makeShiftingLabyrinthWalls() {
  const open = new Set<string>();
  const carve = (x: number, y: number) => {
    if (x >= 0 && x < WORLD_COLS && y >= 0 && y < WORLD_ROWS) open.add(`${x},${y}`);
  };

  const carveLine = (from: AlgorithmWorldCell, to: AlgorithmWorldCell) => {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let x = from.x;
    let y = from.y;
    carve(x, y);
    while (x !== to.x || y !== to.y) {
      if (x !== to.x) x += dx;
      if (y !== to.y) y += dy;
      carve(x, y);
    }
  };

  const route: AlgorithmWorldCell[] = [
    { x: 1, y: 1 }, { x: 7, y: 1 }, { x: 7, y: 5 }, { x: 3, y: 5 },
    { x: 3, y: 9 }, { x: 12, y: 9 }, { x: 12, y: 13 }, { x: 5, y: 13 },
    { x: 5, y: 18 }, { x: 15, y: 18 }, { x: 15, y: 21 },
  ];
  route.forEach((point, index) => index > 0 && carveLine(route[index - 1], point));

  const detours: AlgorithmWorldCell[][] = [
    [{ x: 6, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 8 }],
    [{ x: 4, y: 6 }, { x: 4, y: 11 }, { x: 10, y: 11 }],
    [{ x: 10, y: 10 }, { x: 15, y: 10 }, { x: 15, y: 17 }],
    [{ x: 6, y: 14 }, { x: 13, y: 14 }, { x: 13, y: 20 }],
    [{ x: 2, y: 10 }, { x: 2, y: 17 }, { x: 7, y: 17 }],
  ];
  detours.forEach((detour) => detour.forEach((point, index) => index > 0 && carveLine(detour[index - 1], point)));

  for (let y = 1; y < WORLD_ROWS - 1; y += 4) {
    for (let x = 1; x < WORLD_COLS - 1; x++) if ((x + y) % 5 === 0) carve(x, y);
  }

  const walls: AlgorithmWorldCell[] = [];
  for (let y = 0; y < WORLD_ROWS; y++) {
    for (let x = 0; x < WORLD_COLS; x++) {
      const border = x === 0 || y === 0 || x === WORLD_COLS - 1 || y === WORLD_ROWS - 1;
      if (border || !open.has(`${x},${y}`)) walls.push({ x, y });
    }
  }
  return walls;
}

export function makeDynamicObstacleSets() {
  return [
    [{ x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }],
    [{ x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }],
    [{ x: 13, y: 18 }, { x: 14, y: 18 }, { x: 15, y: 18 }],
  ];
}

export function cellListToKeys(cells: AlgorithmWorldCell[]) {
  return new Set(cells.map(cellKey));
}

export function neighbors(cell: AlgorithmWorldCell) {
  return [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 },
  ].filter((next) => next.x > 0 && next.y > 0 && next.x < WORLD_COLS - 1 && next.y < WORLD_ROWS - 1);
}
