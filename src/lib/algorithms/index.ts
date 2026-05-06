import { customAlgo } from "./custom";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { binarySearch } from "./search/binary";
import { linearSearch } from "./search/linear";
import { bubbleSort } from "./sorting/bubble";
import { heapSort } from "./sorting/heap";
import { insertionSort } from "./sorting/insertion";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { selectionSort } from "./sorting/selection";
import type { AlgoDef } from "./types";

export { COMPLEXITY } from "./complexity";
export { makeSampleGraph, parseGraph } from "./graph/utils";
export type {
  AlgoCategory,
  AlgoDef,
  Complexity,
  Frame,
  GraphEdge,
  GraphNode,
  GraphState,
} from "./types";

export const ALGORITHMS: Record<string, AlgoDef> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  quick: quickSort,
  merge: mergeSort,
  heap: heapSort,
  linear: linearSearch,
  binary: binarySearch,
  bfs,
  dfs,
  dijkstra,
  custom: customAlgo,
};

export const ALGO_GROUPS: { label: { en: string; vi: string }; ids: string[] }[] = [
  { label: { en: "Sorting", vi: "Sắp xếp" }, ids: ["bubble", "selection", "insertion", "quick", "merge", "heap"] },
  { label: { en: "Searching", vi: "Tìm kiếm" }, ids: ["linear", "binary"] },
  { label: { en: "Graph", vi: "Đồ thị" }, ids: ["bfs", "dfs", "dijkstra"] },
  { label: { en: "Custom", vi: "Custom" }, ids: ["custom"] },
];
