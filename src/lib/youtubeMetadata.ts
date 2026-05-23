import { ALGORITHMS, COMPLEXITY } from "./algorithms";
import type { AlgorithmWorldAlgorithmId, AlgorithmWorldTournamentResults, AlgorithmWorldTournamentRound } from "./algorithms/types";
import { worldAlgorithmName } from "./algorithmWorld";
import { resolveTournamentMatch, tournamentMatchLabel } from "./algorithmWorldTournament";
import { getLongContentGuide, pickGuideText } from "./longContentData";
import type { LongVideoType } from "./longVideoTypes";
import type { Lang } from "./i18n";

export type YoutubeAlgorithmMetadata = {
  title: string;
  description: string;
  tags: string;
  lang: Lang;
  videoType?: LongVideoType;
};

const BASE_TAGS = ["algorithm", "programming", "visualization", "computer science", "coding", "tutorial", "kata studio"];

const EXTRA_TAGS: Record<string, string[]> = {
  bubble: ["bubble sort", "sorting algorithm", "beginner algorithm"],
  odd_even: ["odd even sort", "parallel sorting", "sorting network"],
  pancake: ["pancake sort", "prefix reversal", "flip sorting"],
  bitonic: ["bitonic sort", "sorting network", "parallel sorting"],
  bogo: ["bogo sort", "stupid sort", "random shuffle", "worst sorting algorithm", "shuffle and check", "algorithm parody"],
  flash: ["flash sort", "distribution sort", "classification sort", "insertion cleanup"],
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
  astar: ["a star algorithm", "astar", "pathfinding", "maze solver", "heuristic search", "game ai"],
  custom: ["custom algorithm", "algorithm animation", "code visualization"],
};

export function buildYoutubeMetadata(algoId: string, lang: Lang, variant: "short" | "long", videoType: LongVideoType = "classic"): YoutubeAlgorithmMetadata {
  const algo = ALGORITHMS[algoId] ?? ALGORITHMS.custom;
  const guide = pickGuideText(getLongContentGuide(algo.id), lang);
  const complexity = COMPLEXITY[algo.id];
  const isVi = lang === "vi";
  const style = getVideoTypeCopy(videoType, lang);
  const baseTitle = variant === "long"
    ? (videoType === "classic"
      ? (isVi ? `${algo.name} giải thích đầy đủ bằng animation` : `${algo.name} Explained with Full Animation`)
      : (isVi ? `${algo.name} ${style.titleSuffix} | giải thích bằng animation` : `${algo.name} ${style.titleSuffix} | Animated Explanation`))
    : (isVi ? `${algo.name} trực quan trong 60 giây` : `${algo.name} Visualized in 60 Seconds`);
  const title = appendTitleHashtags(baseTitle, buildTitleHashtags(algo.name, variant, videoType));

  const sections = isVi
    ? [
      variant === "short" ? `Xem bản long video giải thích đầy đủ ${algo.name} trên kênh để hiểu từng bước, độ phức tạp và ví dụ chạy chi tiết.` : "",
      variant === "long"
        ? `${algo.name} được giải thích theo phong cách ${style.name} để bạn thấy từng bước thuật toán hoạt động trên dữ liệu thật.`
        : `${algo.name} được giải thích bằng animation trực quan để bạn thấy từng bước thuật toán hoạt động trên dữ liệu thật.`,
      variant === "long" ? style.description : "",
      `Ý chính: ${guide.hook}`,
      `Khi nên dùng: ${guide.useCase}`,
      `Mô hình tư duy: ${guide.mentalModel}`,
      ["Các bước chính:", ...guide.steps.map((step, index) => `${index + 1}. ${step}`)].join("\n"),
      ["Quan sát trong video:", ...guide.watch.map((item) => `- ${item}`)].join("\n"),
      complexity ? `Độ phức tạp: best ${complexity.best ?? complexity.time}, average ${complexity.time}, worst ${complexity.worst ?? complexity.time}, space ${complexity.space}.` : "",
      `Kết luận: ${guide.takeaway}`,
      "Tạo video thuật toán bằng tool: https://algorithm-animator-studio.vercel.app/",
    ]
    : [
      variant === "short" ? `Watch the full long-form ${algo.name} explanation on the channel for step-by-step reasoning, complexity and a detailed walkthrough.` : "",
      variant === "long"
        ? `${algo.name} is explained in a ${style.name} format so you can see how each step works on real data.`
        : `${algo.name} is explained with a visual animation so you can see how each step works on real data.`,
      variant === "long" ? style.description : "",
      `Core idea: ${guide.hook}`,
      `When to use it: ${guide.useCase}`,
      `Mental model: ${guide.mentalModel}`,
      ["Main steps:", ...guide.steps.map((step, index) => `${index + 1}. ${step}`)].join("\n"),
      ["What to watch:", ...guide.watch.map((item) => `- ${item}`)].join("\n"),
      complexity ? `Complexity: best ${complexity.best ?? complexity.time}, average ${complexity.time}, worst ${complexity.worst ?? complexity.time}, space ${complexity.space}.` : "",
      `Takeaway: ${guide.takeaway}`,
      "Create algorithm videos with this tool: https://algorithm-animator-studio.vercel.app/",
    ];

  return {
    title,
    description: sections.filter(Boolean).join("\n\n"),
    tags: uniqueTags([
      algo.name,
      algo.id.replace(/_/g, " "),
      ...(EXTRA_TAGS[algo.id] ?? []),
      ...(variant === "short" ? ["youtube shorts", "shorts", "short video", "long video", "full explanation"] : []),
      ...BASE_TAGS,
    ]).join(", "),
    lang,
    videoType,
  };
}

export function buildMazeTournamentYoutubeMetadata(params: {
  lang: Lang;
  round: AlgorithmWorldTournamentRound;
  match: number;
  results: AlgorithmWorldTournamentResults;
  entrants: AlgorithmWorldAlgorithmId[];
  variant: "short" | "long";
  playlistUrl?: string;
}): YoutubeAlgorithmMetadata {
  const isVi = params.lang === "vi";
  const resolved = resolveTournamentMatch(params.round, params.match, params.results, params.entrants);
  const left = worldAlgorithmName(resolved.left);
  const right = worldAlgorithmName(resolved.right);
  const matchLabel = tournamentMatchLabel(resolved.round, resolved.match, params.lang);
  const isShort = params.variant === "short";
  const titleBase = isVi
    ? `${isShort ? "Shorts recap" : "Full match"}: ${matchLabel} - ${left} vs ${right}`
    : `${isShort ? "Shorts Recap" : "Full Match"}: ${matchLabel} - ${left} vs ${right}`;
  const hashtags = uniqueTags([
    "#mazealgorithm",
    isShort ? "#shorts" : "#fullmatch",
    "#pathfinding",
  ]);
  const playlistLine = isVi
    ? `Playlist đầy đủ: ${params.playlistUrl?.trim() || "[dán link playlist Maze Algorithm Knockout tại đây]"}`
    : `Full playlist: ${params.playlistUrl?.trim() || "[paste the Maze Algorithm Knockout playlist link here]"}`;
  const description = isVi
    ? isShort ? [
      `${left} vs ${right} trong ${matchLabel} - bản Shorts recap của Maze Algorithm Knockout.`,
      "Bản full match đã được đăng trước đó 1 ngày trong playlist. Shorts này dùng để recap nhanh và kéo bạn về video dài.",
      "Muốn xem trước các match tiếp theo trước khi có Shorts recap? Mở playlist và xem các video Full Match mới nhất.",
      playlistLine,
      "Chủ đề: maze solver, pathfinding, graph search, algorithm race, coding visualization.",
      hashtags.join(" "),
      "Tạo video thuật toán bằng tool: https://algorithm-animator-studio.vercel.app/",
    ] : [
      `${left} đối đầu ${right} trong ${matchLabel} của Maze Algorithm Knockout.`,
      "Đây là bản Full Match trong playlist, đăng trước Shorts recap 1 ngày. Nếu muốn xem trước các trận sau, hãy theo dõi playlist vì full match luôn ra trước shorts.",
      "Xem toàn bộ diễn biến: random maze, ráp map, VS screen, countdown, race, winner reveal và bracket update.",
      playlistLine,
      "Video tập trung vào tốc độ tìm đường, khả năng xử lý vật cản và chiến thuật chọn frontier của từng thuật toán.",
      "Chủ đề: maze solver, pathfinding, graph search, algorithm race, coding visualization.",
      hashtags.join(" "),
      "Tạo video thuật toán bằng tool: https://algorithm-animator-studio.vercel.app/",
    ]
    : isShort ? [
      `${left} vs ${right} in ${matchLabel} - a Shorts recap from the Maze Algorithm Knockout.`,
      "The full match was posted 1 day earlier in the playlist. This Short is a quick recap that points viewers back to the long video.",
      "Want to see upcoming matches before their Shorts recaps? Open the playlist and watch the newest Full Match uploads.",
      playlistLine,
      "Topics: maze solver, pathfinding, graph search, algorithm race, coding visualization.",
      hashtags.join(" "),
      "Create algorithm videos with this tool: https://algorithm-animator-studio.vercel.app/",
    ] : [
      `${left} faces ${right} in ${matchLabel} of the Maze Algorithm Knockout.`,
      "This is the Full Match in the playlist, published 1 day before the Shorts recap. To watch future matches early, follow the playlist because full matches come first.",
      "Watch the complete flow: random maze roll, map assembly, VS screen, countdown, race, winner reveal and bracket update.",
      playlistLine,
      "The match highlights pathfinding speed, obstacle handling and frontier selection strategy for each algorithm.",
      "Topics: maze solver, pathfinding, graph search, algorithm race, coding visualization.",
      hashtags.join(" "),
      "Create algorithm videos with this tool: https://algorithm-animator-studio.vercel.app/",
    ];
  return {
    title: appendTitleHashtags(titleBase, hashtags),
    description: description.join("\n\n"),
    tags: uniqueTags([
      "maze algorithm",
      "maze solver",
      "pathfinding",
      "pathfinding algorithm",
      "algorithm race",
      "algorithm tournament",
      "knockout tournament",
      "graph search",
      "maze pathfinding",
      "coding visualization",
      left,
      right,
      resolved.left.replace(/_/g, " "),
      resolved.right.replace(/_/g, " "),
      ...(isShort
        ? ["youtube shorts", "shorts", "shorts recap", "watch full video", "full match", "playlist"]
        : ["long video", "full match", "algorithm match", "maze race", "watch early", "playlist"]),
      ...BASE_TAGS,
    ]).join(", "),
    lang: params.lang,
  };
}

export function appendYoutubeDescriptionCredit(description: string, licenseText?: string, lang: Lang = "en") {
  const license = licenseText?.trim();
  if (!license || description.includes(license)) return description;
  const label = lang === "vi" ? "Bản quyền nhạc" : "Music license";
  return `${description.trim()}${description.trim() ? "\n\n" : ""}${label}:\n${license}`;
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

function buildTitleHashtags(algoName: string, variant: "short" | "long", videoType: LongVideoType) {
  const algorithmHash = toHashtag(algoName);
  const styleHash = videoType === "kinetic-typography"
    ? "#kinetictypography"
    : videoType === "animated-explainer"
      ? "#animatedexplainer"
      : videoType === "ui-kinetic-explainer"
        ? "#uikinetic"
        : "#algorithm";
  return uniqueTags([
    algorithmHash,
    variant === "short" ? "#shorts" : styleHash,
    variant === "short" ? "#algorithm" : "#programming",
  ]);
}

function appendTitleHashtags(title: string, hashtags: string[]) {
  const suffix = hashtags.filter(Boolean).join(" ");
  if (!suffix) return title;
  const maxTitleLength = 100;
  const available = maxTitleLength - suffix.length - 1;
  const safeTitle = title.length > available ? `${title.slice(0, Math.max(20, available - 3)).trim()}...` : title;
  return `${safeTitle} ${suffix}`;
}

function toHashtag(value: string) {
  const compact = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join("");
  return compact ? `#${compact}` : "#algorithm";
}

function getVideoTypeCopy(type: LongVideoType, lang: Lang) {
  const vi = lang === "vi";
  if (type === "kinetic-typography") return {
    name: vi ? "Kinetic Typography" : "Kinetic Typography",
    titleSuffix: vi ? "key words" : "key words",
    description: vi
      ? "Video dùng text chuyển động nhanh theo nhạc, kết hợp minh họa compare, swap, sorted tail và độ phức tạp."
      : "The video uses fast beat-synced text with short compare, swap, sorted-tail and complexity illustrations.",
  };
  if (type === "animated-explainer") return {
    name: vi ? "Animated Explainer" : "Animated Explainer",
    titleSuffix: vi ? "Animated Explainer" : "Animated Explainer",
    description: vi
      ? "Video dùng icon, nhân vật và scene chuyển động để biến ý tưởng thuật toán thành câu chuyện trực quan."
      : "The video uses icons, characters and moving scenes to turn the algorithm idea into a visual story.",
  };
  if (type === "ui-kinetic-explainer") return {
    name: vi ? "UI Kinetic Explainer" : "UI Kinetic Explainer",
    titleSuffix: vi ? "UI Kinetic Explainer" : "UI Kinetic Explainer",
    description: vi
      ? "Video mô phỏng giao diện app/web, hiển thị trạng thái thuật toán bằng panel, chart và motion kiểu demo sản phẩm."
      : "The video simulates an app/web interface with panels, charts and product-demo style motion.",
  };
  return {
    name: vi ? "classic lecture" : "classic lecture",
    titleSuffix: vi ? "giải thích đầy đủ" : "Full Lecture",
    description: vi
      ? "Video theo phong cách bài giảng cổ điển với slide, chart thuật toán và voice-over giải thích chi tiết."
      : "The video uses a classic lecture format with slides, algorithm charts and detailed voice-over.",
  };
}
