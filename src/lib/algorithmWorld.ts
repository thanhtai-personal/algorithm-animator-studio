import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldCell,
  AlgorithmWorldMazeId,
  AlgorithmWorldProblemType,
} from "./algorithms/types";
import type { Lang } from "./i18n";

export const WORLD_COLS = 25;
export const WORLD_ROWS = 15;
export const WORLD_START: AlgorithmWorldCell = { x: 0, y: 7 };
export const WORLD_GOAL: AlgorithmWorldCell = { x: WORLD_COLS - 1, y: 7 };

export type Localized = { en: string; vi: string };

type MazeRoute = AlgorithmWorldCell[];

type MazePreset = {
  id: AlgorithmWorldMazeId;
  name: Localized;
  note: Localized;
  recommendedFor: AlgorithmWorldAlgorithmId[];
  problemFit: AlgorithmWorldProblemType[];
  routes: MazeRoute[];
  extraOpen?: AlgorithmWorldCell[];
  dynamicObstacles: AlgorithmWorldCell[][];
};

export const WORLD_ALGORITHMS: Array<{
  id: AlgorithmWorldAlgorithmId;
  name: string;
  runtime: string;
  taskFit: AlgorithmWorldProblemType[];
  recommendedMazeId: AlgorithmWorldMazeId;
  note: Localized;
}> = [
  {
    id: "dfs",
    name: "DFS",
    runtime: "O(V + E)",
    taskFit: ["escape"],
    recommendedMazeId: "dfs_tunnels",
    note: {
      en: "Finds an exit with deep backtracking, not guaranteed shortest.",
      vi: "Tìm được lối ra bằng cách đi sâu và quay lui, không đảm bảo ngắn nhất.",
    },
  },
  {
    id: "bfs",
    name: "BFS",
    runtime: "O(V + E)",
    taskFit: ["escape", "fastest"],
    recommendedMazeId: "bfs_rooms",
    note: {
      en: "Best for unweighted mazes because it expands layer by layer.",
      vi: "Hợp mê cung không trọng số vì mở rộng từng lớp theo khoảng cách.",
    },
  },
  {
    id: "dijkstra",
    name: "Dijkstra",
    runtime: "O(E log V)",
    taskFit: ["fastest"],
    recommendedMazeId: "dijkstra_weighted",
    note: {
      en: "Best when cells have different movement costs.",
      vi: "Hợp bài toán có ô đi qua tốn chi phí khác nhau.",
    },
  },
  {
    id: "astar",
    name: "A*",
    runtime: "O(E log V)",
    taskFit: ["escape", "fastest"],
    recommendedMazeId: "astar_labyrinth",
    note: {
      en: "Dijkstra guided by a heuristic toward the exit.",
      vi: "Giống Dijkstra nhưng được heuristic dẫn hướng về lối ra.",
    },
  },
  {
    id: "greedy",
    name: "Greedy Best-First",
    runtime: "O(E log V)",
    taskFit: ["escape"],
    recommendedMazeId: "greedy_trap",
    note: {
      en: "Runs toward the cell that looks closest to the exit, so it is fast but easy to bait.",
      vi: "Luôn lao về ô trông gần cửa ra nhất, rất nhanh nhưng dễ bị bẫy đường cụt.",
    },
  },
  {
    id: "weighted_astar",
    name: "Weighted A*",
    runtime: "O(E log V)",
    taskFit: ["escape", "fastest"],
    recommendedMazeId: "astar_labyrinth",
    note: {
      en: "A* with a stronger heuristic: quicker decisions, sometimes a less perfect route.",
      vi: "A* tăng trọng số heuristic: quyết nhanh hơn, đôi khi đường đi kém tối ưu hơn.",
    },
  },
  {
    id: "beam",
    name: "Beam Search",
    runtime: "O(b · width · d)",
    taskFit: ["escape"],
    recommendedMazeId: "greedy_trap",
    note: {
      en: "Keeps only a few promising roads, great for dramatic races but not guaranteed optimal.",
      vi: "Chỉ giữ vài hướng có vẻ tốt, rất hợp video đua xe nhưng không đảm bảo tối ưu.",
    },
  },
  {
    id: "bidirectional_bfs",
    name: "Bidirectional BFS",
    runtime: "O(b^(d/2))",
    taskFit: ["escape", "fastest"],
    recommendedMazeId: "two_fronts",
    note: {
      en: "Starts from both entrance and exit, then connects when the search waves meet.",
      vi: "Tìm từ cả lối vào lẫn lối ra, nối đường khi hai làn sóng gặp nhau.",
    },
  },
  {
    id: "wall_follower",
    name: "Right-Hand Wall Follower",
    runtime: "O(steps)",
    taskFit: ["escape"],
    recommendedMazeId: "wall_runner",
    note: {
      en: "A simple maze rule for cars: keep one wall on the right and keep driving.",
      vi: "Luật mê cung dễ hiểu cho xe: luôn bám tường bên phải rồi tiếp tục chạy.",
    },
  },
  {
    id: "tremaux",
    name: "Trémaux",
    runtime: "O(E)",
    taskFit: ["escape"],
    recommendedMazeId: "dfs_tunnels",
    note: {
      en: "Marks visited passages and backtracks, making maze solving easy to explain visually.",
      vi: "Đánh dấu lối đã đi và quay lui, rất dễ kể thành câu chuyện tìm đường trong mê cung.",
    },
  },
];

export const MAZE_PRESETS: MazePreset[] = [
  {
    id: "dfs_tunnels",
    name: { en: "Backtracking Tunnels", vi: "Đường hầm quay lui" },
    note: {
      en: "Long branches and dead ends make DFS visually easy to understand.",
      vi: "Nhiều nhánh cụt giúp nhìn rõ cách DFS đi sâu rồi quay lui.",
    },
    recommendedFor: ["dfs"],
    problemFit: ["escape"],
    routes: [
      [WORLD_START, { x: 2, y: 7 }, { x: 2, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 12 }, { x: 13, y: 12 }, { x: 13, y: 4 }, { x: 19, y: 4 }, { x: 19, y: 10 }, { x: 22, y: 10 }, { x: 22, y: 7 }, WORLD_GOAL],
      [{ x: 2, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 1 }],
      [{ x: 7, y: 9 }, { x: 4, y: 9 }, { x: 4, y: 13 }],
      [{ x: 13, y: 8 }, { x: 17, y: 8 }, { x: 17, y: 13 }],
      [{ x: 19, y: 6 }, { x: 23, y: 6 }, { x: 23, y: 2 }],
    ],
    dynamicObstacles: [],
  },
  {
    id: "bfs_rooms",
    name: { en: "Equal-Cost Rooms", vi: "Phòng đồng chi phí" },
    note: {
      en: "Wide rooms show BFS expanding evenly until the exit layer is reached.",
      vi: "Không gian rộng giúp thấy BFS lan từng lớp cho đến khi gặp lối ra.",
    },
    recommendedFor: ["bfs"],
    problemFit: ["escape", "fastest"],
    routes: [
      [WORLD_START, { x: 4, y: 7 }, { x: 4, y: 3 }, { x: 10, y: 3 }, { x: 10, y: 7 }, { x: 16, y: 7 }, { x: 16, y: 3 }, { x: 21, y: 3 }, { x: 21, y: 7 }, WORLD_GOAL],
      [{ x: 4, y: 7 }, { x: 4, y: 11 }, { x: 10, y: 11 }, { x: 10, y: 7 }],
      [{ x: 10, y: 7 }, { x: 10, y: 13 }, { x: 16, y: 13 }, { x: 16, y: 7 }],
      [{ x: 16, y: 7 }, { x: 21, y: 11 }, { x: 21, y: 7 }],
    ],
    extraOpen: roomCells([{ x: 5, y: 4 }, { x: 9, y: 10 }]).concat(roomCells([{ x: 12, y: 4 }, { x: 15, y: 12 }])),
    dynamicObstacles: [],
  },
  {
    id: "dijkstra_weighted",
    name: { en: "Weighted Detours", vi: "Đường vòng có trọng số" },
    note: {
      en: "Multiple detours make weighted shortest-path behavior clearer.",
      vi: "Nhiều đường vòng giúp thấy rõ logic chọn đường rẻ/nhanh nhất.",
    },
    recommendedFor: ["dijkstra"],
    problemFit: ["fastest"],
    routes: [
      [WORLD_START, { x: 3, y: 7 }, { x: 3, y: 2 }, { x: 9, y: 2 }, { x: 9, y: 9 }, { x: 14, y: 9 }, { x: 14, y: 4 }, { x: 20, y: 4 }, { x: 20, y: 7 }, WORLD_GOAL],
      [{ x: 3, y: 7 }, { x: 8, y: 7 }, { x: 8, y: 12 }, { x: 15, y: 12 }, { x: 15, y: 9 }],
      [{ x: 9, y: 4 }, { x: 12, y: 4 }, { x: 12, y: 1 }, { x: 22, y: 1 }, { x: 22, y: 7 }],
      [{ x: 14, y: 6 }, { x: 18, y: 6 }, { x: 18, y: 11 }, { x: 23, y: 11 }, { x: 23, y: 7 }],
    ],
    dynamicObstacles: [],
  },
  {
    id: "astar_labyrinth",
    name: { en: "Heuristic Labyrinth", vi: "Mê cung heuristic" },
    note: {
      en: "A dense shifting maze highlights A* balancing g + h.",
      vi: "Mê cung dày và biến động làm nổi bật cách A* cân bằng g + h.",
    },
    recommendedFor: ["astar", "weighted_astar"],
    problemFit: ["escape", "fastest"],
    routes: [
      [WORLD_START, { x: 4, y: 7 }, { x: 4, y: 2 }, { x: 10, y: 2 }, { x: 10, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 12 }, { x: 21, y: 12 }, { x: 21, y: 7 }, WORLD_GOAL],
      [{ x: 3, y: 8 }, { x: 8, y: 8 }, { x: 8, y: 4 }, { x: 13, y: 4 }, { x: 13, y: 9 }, { x: 18, y: 9 }, { x: 18, y: 5 }, { x: 22, y: 5 }, { x: 22, y: 7 }],
      [{ x: 2, y: 10 }, { x: 6, y: 10 }, { x: 6, y: 13 }, { x: 12, y: 13 }, { x: 12, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 7 }],
      [{ x: 6, y: 3 }, { x: 6, y: 6 }, { x: 11, y: 6 }, { x: 11, y: 11 }, { x: 16, y: 11 }],
    ],
    extraOpen: checkerOpenCells(),
    dynamicObstacles: [
      [{ x: 8, y: 7 }, { x: 8, y: 6 }, { x: 9, y: 6 }],
      [{ x: 15, y: 7 }, { x: 15, y: 8 }, { x: 15, y: 9 }],
      [{ x: 21, y: 8 }, { x: 21, y: 9 }, { x: 21, y: 10 }],
    ],
  },
  {
    id: "greedy_trap",
    name: { en: "Greedy Trap", vi: "Bẫy tham lam" },
    note: {
      en: "A shortcut seems close to the exit but ends in a trap, perfect for Greedy vs A* races.",
      vi: "Một lối tắt trông rất gần cửa ra nhưng là bẫy cụt, hợp cho Greedy đấu A*.",
    },
    recommendedFor: ["greedy", "beam"],
    problemFit: ["escape", "fastest"],
    routes: [
      [WORLD_START, { x: 2, y: 7 }, { x: 2, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 11 }, { x: 14, y: 11 }, { x: 14, y: 5 }, { x: 20, y: 5 }, { x: 20, y: 7 }, WORLD_GOAL],
      [{ x: 10, y: 7 }, { x: 18, y: 7 }, { x: 18, y: 2 }, { x: 22, y: 2 }],
      [{ x: 4, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 13 }, { x: 11, y: 13 }],
      [{ x: 14, y: 8 }, { x: 21, y: 8 }, { x: 21, y: 11 }, { x: 23, y: 11 }],
    ],
    extraOpen: roomCells([{ x: 11, y: 6 }, { x: 17, y: 8 }]),
    dynamicObstacles: [],
  },
  {
    id: "two_fronts",
    name: { en: "Two-Front Arena", vi: "Đấu trường hai đầu" },
    note: {
      en: "Symmetric rooms make bidirectional BFS easy to see because both waves meet near the center.",
      vi: "Các phòng đối xứng giúp thấy rõ Bidirectional BFS lan từ hai đầu và gặp ở giữa.",
    },
    recommendedFor: ["bidirectional_bfs", "bfs"],
    problemFit: ["escape", "fastest"],
    routes: [
      [WORLD_START, { x: 5, y: 7 }, { x: 5, y: 3 }, { x: 12, y: 3 }, { x: 12, y: 7 }, { x: 19, y: 7 }, WORLD_GOAL],
      [{ x: 5, y: 7 }, { x: 5, y: 11 }, { x: 12, y: 11 }, { x: 12, y: 7 }],
      [{ x: 12, y: 3 }, { x: 19, y: 3 }, { x: 19, y: 7 }],
      [{ x: 12, y: 11 }, { x: 19, y: 11 }, { x: 19, y: 7 }],
    ],
    extraOpen: roomCells([{ x: 7, y: 5 }, { x: 17, y: 9 }]),
    dynamicObstacles: [],
  },
  {
    id: "wall_runner",
    name: { en: "Wall Runner Loop", vi: "Vòng bám tường" },
    note: {
      en: "A looped corridor gives wall-following and Trémaux a readable racing route.",
      vi: "Hành lang vòng giúp Wall Follower và Trémaux có đường chạy dễ nhìn.",
    },
    recommendedFor: ["wall_follower", "tremaux"],
    problemFit: ["escape"],
    routes: [
      [WORLD_START, { x: 3, y: 7 }, { x: 3, y: 2 }, { x: 21, y: 2 }, { x: 21, y: 12 }, { x: 3, y: 12 }, { x: 3, y: 7 }, { x: 10, y: 7 }, { x: 10, y: 4 }, { x: 16, y: 4 }, { x: 16, y: 7 }, WORLD_GOAL],
      [{ x: 10, y: 7 }, { x: 10, y: 10 }, { x: 16, y: 10 }, { x: 16, y: 7 }],
      [{ x: 6, y: 4 }, { x: 6, y: 10 }],
      [{ x: 19, y: 4 }, { x: 19, y: 10 }],
    ],
    extraOpen: [],
    dynamicObstacles: [],
  },
];


export function isRandomMazeId(id: AlgorithmWorldMazeId | undefined) {
  return id === "random";
}

export function resolveMazeId(id: AlgorithmWorldMazeId | undefined, seed = Date.now()) {
  if (id && id !== "random") return getMazePreset(id).id;
  const index = Math.abs(Math.floor(seed)) % MAZE_PRESETS.length;
  return MAZE_PRESETS[index].id;
}

export function mazeName(id: AlgorithmWorldMazeId | undefined, lang: Lang) {
  if (id === "random") return lang === "vi" ? "Sân đấu ngẫu nhiên" : "Random Arena";
  return localize(getMazePreset(id).name, lang);
}

export function mazeNamePair(id: AlgorithmWorldMazeId | undefined) {
  const preset = getMazePreset(id);
  return { en: preset.name.en, vi: preset.name.vi };
}

export function randomMazeCandidates() {
  return MAZE_PRESETS.map((maze) => maze.name);
}

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

export function localize(value: Localized, lang: Lang) {
  return value[lang] ?? value.en;
}

export function getMazePreset(id: AlgorithmWorldMazeId | undefined) {
  return MAZE_PRESETS.find((item) => item.id === id) ?? MAZE_PRESETS[3];
}

export function recommendedMazeForAlgorithm(id: AlgorithmWorldAlgorithmId) {
  return WORLD_ALGORITHMS.find((item) => item.id === id)?.recommendedMazeId ?? "astar_labyrinth";
}

export function makeMazeWalls(mazeId?: AlgorithmWorldMazeId) {
  const preset = getMazePreset(mazeId);
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
  preset.routes.forEach((points) => points.forEach((point, i) => i > 0 && line(points[i - 1], point)));
  preset.extraOpen?.forEach((cell) => carve(cell.x, cell.y));

  const walls: AlgorithmWorldCell[] = [];
  for (let y = 0; y < WORLD_ROWS; y++) {
    for (let x = 0; x < WORLD_COLS; x++) if (!open.has(`${x},${y}`)) walls.push({ x, y });
  }
  return walls;
}

export function makeDynamicObstacleSets(mazeId?: AlgorithmWorldMazeId) {
  return getMazePreset(mazeId).dynamicObstacles;
}

export function makeShiftingLabyrinthWalls() {
  return makeMazeWalls("astar_labyrinth");
}

function roomCells([from, to]: [AlgorithmWorldCell, AlgorithmWorldCell]) {
  const cells: AlgorithmWorldCell[] = [];
  for (let y = from.y; y <= to.y; y++) for (let x = from.x; x <= to.x; x++) cells.push({ x, y });
  return cells;
}

function checkerOpenCells() {
  const cells: AlgorithmWorldCell[] = [];
  for (let y = 2; y < WORLD_ROWS - 2; y += 3) {
    for (let x = 2; x < WORLD_COLS - 2; x += 4) if ((x + y) % 2 === 0) cells.push({ x, y });
  }
  return cells;
}
