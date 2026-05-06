import type { Complexity } from "./types";

export const COMPLEXITY: Record<string, Complexity> = {
  bubble: { time: "O(n²)", best: "O(n)", worst: "O(n²)", space: "O(1)" },
  selection: { time: "O(n²)", best: "O(n²)", worst: "O(n²)", space: "O(1)" },
  insertion: { time: "O(n²)", best: "O(n)", worst: "O(n²)", space: "O(1)" },
  quick: { time: "O(n log n)", best: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  merge: { time: "O(n log n)", best: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  heap: { time: "O(n log n)", best: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
  linear: { time: "O(n)", best: "O(1)", worst: "O(n)", space: "O(1)" },
  binary: { time: "O(log n)", best: "O(1)", worst: "O(log n)", space: "O(1)" },
  bfs: { time: "O(V + E)", space: "O(V)" },
  dfs: { time: "O(V + E)", space: "O(V)" },
  dijkstra: { time: "O((V+E) log V)", space: "O(V)" },
  custom: { time: "—", space: "—" },
};
