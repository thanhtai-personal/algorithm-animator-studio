import { customAlgo } from "./custom";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { binarySearch } from "./search/binary";
import { linearSearch } from "./search/linear";
import { bubbleSort } from "./sorting/bubble";
import { bucketSort } from "./sorting/bucket";
import { cocktailSort } from "./sorting/cocktail";
import { combSort } from "./sorting/comb";
import { countingSort } from "./sorting/counting";
import { gnomeSort } from "./sorting/gnome";
import { heapSort } from "./sorting/heap";
import { insertionSort } from "./sorting/insertion";
import { introSort } from "./sorting/intro";
import { mergeSort } from "./sorting/merge";
import { oddEvenSort } from "./sorting/oddEven";
import { quickSort } from "./sorting/quick";
import { radixSort } from "./sorting/radix";
import { selectionSort } from "./sorting/selection";
import { shellSort } from "./sorting/shell";
import { timSort } from "./sorting/tim";
import type { AlgoDef } from "./types";

export { COMPLEXITY } from "./complexity";
export { makeSampleGraph, parseGraph } from "./graph/utils";
export type {
  AlgoCategory,
  AlgoDef,
  BucketState,
  Complexity,
  CountingState,
  Frame,
  GraphEdge,
  GraphNode,
  GraphState,
} from "./types";

export const ALGORITHMS: Record<string, AlgoDef> = {
  bubble: bubbleSort,
  odd_even: oddEvenSort,
  selection: selectionSort,
  insertion: insertionSort,
  quick: quickSort,
  merge: mergeSort,
  heap: heapSort,
  counting: countingSort,
  radix: radixSort,
  bucket: bucketSort,
  shell: shellSort,
  cocktail: cocktailSort,
  comb: combSort,
  gnome: gnomeSort,
  tim: timSort,
  intro: introSort,
  linear: linearSearch,
  binary: binarySearch,
  bfs,
  dfs,
  dijkstra,
  custom: customAlgo,
};

export const ALGO_GROUPS: { label: { en: string; vi: string }; ids: string[] }[] = [
  {
    label: { en: "Sorting", vi: "Sắp xếp" },
    ids: [
      "bubble", "odd_even", "selection", "insertion", "quick", "merge", "heap",
      "counting", "radix", "bucket", "shell", "cocktail", "comb", "gnome", "tim", "intro",
    ],
  },
  { label: { en: "Searching", vi: "Tìm kiếm" }, ids: ["linear", "binary"] },
  { label: { en: "Graph", vi: "Đồ thị" }, ids: ["bfs", "dfs", "dijkstra"] },
  { label: { en: "Custom", vi: "Custom" }, ids: ["custom"] },
];
