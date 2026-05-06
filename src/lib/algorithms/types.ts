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
  phase: "collect" | "sort" | "write" | "done";
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

export type Frame = {
  arr: number[];
  highlight: number[];
  swap: number[];
  sorted: number[];
  pivot: number | null;
  line: number;
  vars: Record<string, number | string>;
  graph?: GraphState;
  target?: number;
  found?: number | null;
  label?: string;
  counting?: CountingState;
  buckets?: BucketState;
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
    start?: number;
    end?: number;
  }) => Frame[];
};
