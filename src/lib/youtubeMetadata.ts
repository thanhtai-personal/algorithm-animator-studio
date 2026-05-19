import { ALGORITHMS, COMPLEXITY } from "./algorithms";
import { getLongContentGuide, pickGuideText } from "./longContentData";
import type { Lang } from "./i18n";

export type YoutubeAlgorithmMetadata = {
  title: string;
  description: string;
  tags: string;
};

const BASE_TAGS = ["algorithm", "programming", "visualization", "computer science", "coding", "tutorial", "kata studio"];

const EXTRA_TAGS: Record<string, string[]> = {
  bubble: ["bubble sort", "sorting algorithm", "beginner algorithm"],
  odd_even: ["odd even sort", "parallel sorting", "sorting network"],
  pancake: ["pancake sort", "prefix reversal", "flip sorting"],
  bitonic: ["bitonic sort", "sorting network", "parallel sorting"],
  cycle: ["cycle sort", "minimum writes", "in place sorting"],
  selection: ["selection sort", "minimum selection", "sorting algorithm"],
  insertion: ["insertion sort", "nearly sorted data", "stable sort"],
  quick: ["quick sort", "partition", "divide and conquer"],
  merge: ["merge sort", "stable sorting", "divide and conquer"],
  heap: ["heap sort", "binary heap", "priority queue"],
  counting: ["counting sort", "non comparison sort", "integer sorting"],
  pigeonhole: ["pigeonhole sort", "integer sorting", "range based sorting"],
  strand: ["strand sort", "merge sorting", "adaptive sorting"],
  tournament: ["tournament sort", "selection tree", "knockout sorting"],
  smooth: ["smooth sort", "leonardo heap", "adaptive sorting"],
  stooge: ["stooge sort", "recursive sorting", "inefficient sorting"],
  radix: ["radix sort", "digit sorting", "bucket sorting"],
  bucket: ["bucket sort", "distribution sort", "data distribution"],
  shell: ["shell sort", "gap sequence", "insertion sort"],
  cocktail: ["cocktail sort", "bidirectional bubble sort", "sorting animation"],
  comb: ["comb sort", "gap sort", "bubble sort improvement"],
  gnome: ["gnome sort", "simple sorting", "insertion sort variant"],
  tim: ["tim sort", "python sort", "stable sort"],
  intro: ["intro sort", "hybrid sort", "quick sort heap sort"],
  tree_sort: ["tree sort", "binary search tree", "inorder traversal"],
  linear: ["linear search", "search algorithm", "sequential search"],
  binary: ["binary search", "logarithmic search", "sorted array"],
  bfs: ["breadth first search", "graph traversal", "queue"],
  dfs: ["depth first search", "graph traversal", "stack recursion"],
  dijkstra: ["dijkstra algorithm", "shortest path", "weighted graph"],
  custom: ["custom algorithm", "algorithm animation", "code visualization"],
};

export function buildYoutubeMetadata(algoId: string, lang: Lang, variant: "short" | "long"): YoutubeAlgorithmMetadata {
  const algo = ALGORITHMS[algoId] ?? ALGORITHMS.custom;
  const guide = pickGuideText(getLongContentGuide(algo.id), lang);
  const complexity = COMPLEXITY[algo.id];
  const isVi = lang === "vi";
  const title = variant === "long"
    ? (isVi ? `${algo.name} giải thích đầy đủ bằng animation` : `${algo.name} Explained with Full Animation`)
    : (isVi ? `${algo.name} trực quan trong 60 giây` : `${algo.name} Visualized in 60 Seconds`);

  const sections = isVi
    ? [
      `${algo.name} được giải thích bằng animation trực quan để bạn thấy từng bước thuật toán hoạt động trên dữ liệu thật.`,
      `Ý chính: ${guide.hook}`,
      `Khi nên dùng: ${guide.useCase}`,
      `Mô hình tư duy: ${guide.mentalModel}`,
      ["Các bước chính:", ...guide.steps.map((step, index) => `${index + 1}. ${step}`)].join("\n"),
      ["Quan sát trong video:", ...guide.watch.map((item) => `- ${item}`)].join("\n"),
      complexity ? `Độ phức tạp: best ${complexity.best ?? complexity.time}, average ${complexity.time}, worst ${complexity.worst ?? complexity.time}, space ${complexity.space}.` : "",
      `Kết luận: ${guide.takeaway}`,
      "Video được tạo bằng Kata Algorithm Animator Studio.",
    ]
    : [
      `${algo.name} is explained with a visual animation so you can see how each step works on real data.`,
      `Core idea: ${guide.hook}`,
      `When to use it: ${guide.useCase}`,
      `Mental model: ${guide.mentalModel}`,
      ["Main steps:", ...guide.steps.map((step, index) => `${index + 1}. ${step}`)].join("\n"),
      ["What to watch:", ...guide.watch.map((item) => `- ${item}`)].join("\n"),
      complexity ? `Complexity: best ${complexity.best ?? complexity.time}, average ${complexity.time}, worst ${complexity.worst ?? complexity.time}, space ${complexity.space}.` : "",
      `Takeaway: ${guide.takeaway}`,
      "Generated with Kata Algorithm Animator Studio.",
    ];

  return {
    title,
    description: sections.filter(Boolean).join("\n\n"),
    tags: uniqueTags([algo.name, algo.id.replace(/_/g, " "), ...(EXTRA_TAGS[algo.id] ?? []), ...BASE_TAGS]).join(", "),
  };
}

export function appendYoutubeDescriptionCredit(description: string, licenseText?: string) {
  const license = licenseText?.trim();
  if (!license || description.includes(license)) return description;
  return `${description.trim()}${description.trim() ? "\n\n" : ""}Music license:\n${license}`;
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.map((tag) => tag.trim()).filter((tag) => {
    const key = tag.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
