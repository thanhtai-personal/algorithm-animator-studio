
export type AlgorithmWorldCell = { x: number; y: number };
export type AlgorithmWorldAlgorithmId = "dfs" | "bfs" | "dijkstra" | "astar" | "greedy" | "weighted_astar" | "beam" | "bidirectional_bfs" | "wall_follower" | "tremaux";
export type AlgorithmWorldProblemType = "escape" | "fastest";
export type AlgorithmWorldVideoMode = "short" | "long";
export type AlgorithmWorldPresentationMode = "explainer" | "vehicle_race";
export type AlgorithmWorldTournamentRound = 0 | 1 | 2;
export type AlgorithmWorldMazeId = "random" | "dfs_tunnels" | "bfs_rooms" | "dijkstra_weighted" | "astar_labyrinth" | "greedy_trap" | "two_fronts" | "wall_runner";
export type AlgorithmWorldScenarioOptions = {
  videoMode?: AlgorithmWorldVideoMode;
  compareEnabled?: boolean;
  presentationMode?: AlgorithmWorldPresentationMode;
  problemType?: AlgorithmWorldProblemType;
  mazeId?: AlgorithmWorldMazeId;
  primaryAlgorithm?: AlgorithmWorldAlgorithmId;
  secondaryAlgorithm?: AlgorithmWorldAlgorithmId;
  primaryVehicleColor?: string;
  secondaryVehicleColor?: string;
  primaryVehicleId?: string;
  secondaryVehicleId?: string;
  tournamentEnabled?: boolean;
  tournamentRound?: AlgorithmWorldTournamentRound;
  tournamentMatch?: number;
};
export type AlgorithmWorldPhase = "setup" | "search" | "path" | "obstacle" | "replan" | "done";
export type AlgorithmWorldRaceIntroStage = "randomizing" | "assembling" | "versus" | "countdown" | "race" | "winner" | "bracket";
export type AlgorithmWorldTournamentTeam = {
  id?: AlgorithmWorldAlgorithmId;
  name: string;
};
export type AlgorithmWorldTournamentMatch = {
  id: string;
  round: AlgorithmWorldTournamentRound;
  match: number;
  left?: AlgorithmWorldTournamentTeam;
  right?: AlgorithmWorldTournamentTeam;
  winner?: AlgorithmWorldTournamentTeam;
  active?: boolean;
  pending?: boolean;
};
export type AlgorithmWorldTournamentState = {
  titleEn: string;
  titleVi: string;
  round: AlgorithmWorldTournamentRound;
  match: number;
  rounds: AlgorithmWorldTournamentMatch[][];
  winnerName?: string;
};
export type AlgorithmWorldRaceIntroState = {
  stage: AlgorithmWorldRaceIntroStage;
  tick: number;
  duration: number;
  mazeId: AlgorithmWorldMazeId;
  mazeNameEn: string;
  mazeNameVi: string;
  leftName: string;
  rightName: string;
  requestedRandom?: boolean;
  candidatesEn?: string[];
  candidatesVi?: string[];
  pickedIndex?: number;
  assemblyProgress?: number;
  winnerName?: string;
  tie?: boolean;
  tournament?: AlgorithmWorldTournamentState;
};
export type AlgorithmWorldState = {
  cols: number;
  rows: number;
  start: AlgorithmWorldCell;
  goal: AlgorithmWorldCell;
  walls: AlgorithmWorldCell[];
  dynamicWalls: AlgorithmWorldCell[];
  openSet: AlgorithmWorldCell[];
  closedSet: AlgorithmWorldCell[];
  current: AlgorithmWorldCell | null;
  path: AlgorithmWorldCell[];
  previousPath: AlgorithmWorldCell[];
  shatteredPath?: AlgorithmWorldCell[];
  pulseCells?: AlgorithmWorldCell[];
  visibleCells?: AlgorithmWorldCell[];
  scores?: { g: number; h: number; f: number };
  phase: AlgorithmWorldPhase;
  status: string;
  replanCount: number;
  algorithmId?: AlgorithmWorldAlgorithmId;
  algorithmName?: string;
  runtimeLabel?: string;
  problemType?: AlgorithmWorldProblemType;
  mazeId?: AlgorithmWorldMazeId;
  visitedCount?: number;
  pathLength?: number;
  stepCount?: number;
  presentationMode?: AlgorithmWorldPresentationMode;
  raceTime?: number;
  raceFinishTime?: number;
  raceFinished?: boolean;
  raceWinner?: boolean;
  raceWinAge?: number;
  vehicleColor?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleShape?: string;
  raceIntroStage?: AlgorithmWorldRaceIntroStage;
};
export type AlgorithmWorldCompareState = {
  problemType: AlgorithmWorldProblemType;
  left: AlgorithmWorldState;
  right: AlgorithmWorldState;
  raceIntro?: AlgorithmWorldRaceIntroState;
};

export type GraphNode = { id: number; x: number; y: number; label?: string };
export type GraphEdge = { a: number; b: number; w?: number };
export type GraphState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  visited?: number[];
  current?: number | null;
  path?: number[];
  dist?: Record<number, number | string>;
  activeEdge?: [number, number] | null;
  start?: number;
  end?: number;
  pathEdges?: [number, number][];
};

export type CountingState = {
  source: number[];
  uniqueValues: number[];
  counts: number[];
  phase: "init" | "collect" | "sort" | "write" | "done";
  activeSourceIndex?: number;
  activeUniqueIndex?: number;
  activeOutputIndex?: number;
  movingValue?: number;
};

export type BucketState = {
  labels: string[];
  buckets: number[][];
  activeBucket?: number;
  phase?: string;
};

export type TreeSortNode = {
  id: number;
  value: number;
  left?: number;
  right?: number;
};

export type TreeSortState = {
  nodes: TreeSortNode[];
  root?: number;
  active?: number;
  writing?: number;
  phase?: "insert" | "write" | "done";
};

export type TournamentNode = {
  id: number;
  value: number;
  sourceIndex: number;
};

export type TournamentState = {
  rounds: TournamentNode[][];
  activeIds?: number[];
  winnerId?: number;
  output: number[];
  phase?: "build" | "compare" | "promote" | "extract" | "done";
};

export type SmoothTree = {
  start: number;
  end: number;
  order: number;
};

export type SmoothState = {
  trees: SmoothTree[];
  activeRoots?: number[];
  phase?: "grow" | "merge" | "sift" | "trinkle" | "extract" | "done";
};

export type Frame = {
  arr: number[];
  highlight: number[];
  swap: number[];
  sorted: number[];
  pivot: number | null;
  line: number;
  vars: Record<string, number | string>;
  graph?: GraphState;
  world?: AlgorithmWorldState;
  worldCompare?: AlgorithmWorldCompareState;
  target?: number;
  found?: number | null;
  label?: string;
  counting?: CountingState;
  buckets?: BucketState;
  treeSort?: TreeSortState;
  tournament?: TournamentState;
  smooth?: SmoothState;
  event?: "compare" | "swap" | "found" | "visit" | null;
};

export type AlgoCategory = "sort" | "search" | "graph" | "custom";
export type Complexity = { time: string; best?: string; worst?: string; space: string };
export type AlgoDef = {
  id: string;
  name: string;
  category: AlgoCategory;
  code: string;
  complexity?: Complexity;
  run: (arr: number[], opts?: {
    target?: number;
    customCode?: string;
    graph?: GraphState;
    world?: AlgorithmWorldState;
    worldScenario?: AlgorithmWorldScenarioOptions;
    start?: number;
    end?: number;
  }) => Frame[];
};
