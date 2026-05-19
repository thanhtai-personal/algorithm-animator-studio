import { customAlgo } from "./custom";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { binarySearch } from "./search/binary";
import { linearSearch } from "./search/linear";
import { bitonicSort } from "./sorting/bitonic";
import { bogoSort } from "./sorting/bogo";
import { bubbleSort } from "./sorting/bubble";
import { bucketSort } from "./sorting/bucket";
import { flashSort } from "./sorting/flash";
import { cocktailSort } from "./sorting/cocktail";
import { combSort } from "./sorting/comb";
import { countingSort } from "./sorting/counting";
import { cycleSort } from "./sorting/cycle";
import { gnomeSort } from "./sorting/gnome";
import { heapSort } from "./sorting/heap";
import { insertionSort } from "./sorting/insertion";
import { introSort } from "./sorting/intro";
import { mergeSort } from "./sorting/merge";
import { oddEvenSort } from "./sorting/oddEven";
import { pancakeSort } from "./sorting/pancake";
import { pigeonholeSort } from "./sorting/pigeonhole";
import { quickSort } from "./sorting/quick";
import { radixSort } from "./sorting/radix";
import { selectionSort } from "./sorting/selection";
import { shellSort } from "./sorting/shell";
import { smoothSort } from "./sorting/smooth";
import { stoogeSort } from "./sorting/stooge";
import { strandSort } from "./sorting/strand";
import { timSort } from "./sorting/tim";
import { tournamentSort } from "./sorting/tournament";
import { treeSort } from "./sorting/treeSort";
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
  TreeSortNode,
  TreeSortState,
  TournamentNode,
  TournamentState,
  SmoothState,
  SmoothTree,
} from "./types";

export const ALGORITHMS: Record<string, AlgoDef> = {
  bubble: bubbleSort,
  odd_even: oddEvenSort,
  pancake: pancakeSort,
  bitonic: bitonicSort,
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
  tree_sort: treeSort,
  cycle: cycleSort,
  pigeonhole: pigeonholeSort,
  strand: strandSort,
  tournament: tournamentSort,
  smooth: smoothSort,
  stooge: stoogeSort,
  bogo: bogoSort,
  flash: flashSort,
  custom: customAlgo,
};

export const DEFAULT_ALGORITHM_ID = Object.keys(ALGORITHMS).filter((id) => id !== "custom").at(-1) ?? "bubble";

export const ALGO_GROUPS: { label: { en: string; vi: string }; ids: string[] }[] = [
  {
    label: { en: "Sorting", vi: "Sắp xếp" },
    ids: [
      "bubble", "odd_even", "pancake", "bitonic", "selection", "insertion", "quick", "merge", "heap",
      "counting", "radix", "bucket", "shell", "cocktail", "comb", "gnome", "tim", "intro", "tree_sort", "cycle", "pigeonhole", "strand", "tournament", "smooth", "stooge", "bogo", "flash",
    ],
  },
  { label: { en: "Searching", vi: "Tìm kiếm" }, ids: ["linear", "binary"] },
  { label: { en: "Graph", vi: "Đồ thị" }, ids: ["bfs", "dfs", "dijkstra"] },
  { label: { en: "Custom", vi: "Custom" }, ids: ["custom"] },
];
