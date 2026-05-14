import { AlgoDef, Complexity } from "./algorithms";
import type { Lang } from "./i18n";
import { getLongContentGuide, pickGuideText } from "./longContentData";

export type LongSceneKind = "intro" | "hook" | "mental" | "steps" | "animation" | "complexity" | "use-case" | "avoid" | "recap";

export type LongContentScene = {
  id: string;
  kind: LongSceneKind;
  kindLabel: string;
  title: string;
  subtitle: string;
  bullets: string[];
  narration: string;
  durationSec: number;
  animation?: boolean;
  dataSet?: number[];
};

const KIND_LABELS: Record<LongSceneKind, Record<Lang, string>> = {
  intro: { vi: "Mở đầu", en: "Intro" },
  hook: { vi: "Hook", en: "Hook" },
  mental: { vi: "Ý tưởng", en: "Core idea" },
  steps: { vi: "Các bước", en: "Steps" },
  animation: { vi: "Animation", en: "Animation" },
  complexity: { vi: "Độ phức tạp", en: "Complexity" },
  "use-case": { vi: "Nên dùng", en: "Use when" },
  avoid: { vi: "Không nên dùng", en: "Avoid when" },
  recap: { vi: "Tóm tắt", en: "Recap" },
};

export function buildLongContentScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
  lang: Lang;
}) {
  const { algo, complexity, animationSeconds, introSeconds, lang } = params;
  if (algo.id === "bubble") {
    return buildBubbleSortScenes({ complexity, animationSeconds, introSeconds, lang });
  }

  const guide = pickGuideText(getLongContentGuide(algo.id), lang);
  const complexityBullets = [
    complexity?.best ? `Best case: ${complexity.best}` : null,
    complexity?.time ? `${lang === "vi" ? "Trung bình" : "Average"}: ${complexity.time}` : null,
    complexity?.worst ? `Worst case: ${complexity.worst}` : null,
    complexity?.space ? `Space: ${complexity.space}` : null,
    guide.takeaway,
  ].filter(Boolean) as string[];

  const scenes: Omit<LongContentScene, "kindLabel" | "narration">[] = [
    {
      id: "intro",
      kind: "intro",
      title: lang === "vi" ? `${algo.name} giải thích bằng animation` : `${algo.name} explained visually`,
      subtitle: guide.hook,
      bullets: [guide.useCase],
      durationSec: introSeconds,
    },
    {
      id: "mental-model",
      kind: "mental",
      title: lang === "vi" ? "Ý tưởng cốt lõi" : "Core mental model",
      subtitle: guide.mentalModel,
      bullets: guide.watch,
      durationSec: 7,
    },
    {
      id: "steps",
      kind: "steps",
      title: lang === "vi" ? "Các bước chính" : "Main steps",
      subtitle: lang === "vi"
        ? "Xem animation như một timeline: mỗi màu là một tín hiệu xử lý."
        : "Read the animation as a timeline: each color is a processing signal.",
      bullets: guide.steps,
      durationSec: 9,
    },
    {
      id: "animation",
      kind: "animation",
      title: lang === "vi" ? "Chạy thuật toán từng bước" : "Run the algorithm step by step",
      subtitle: lang === "vi"
        ? "Phần này dùng lại animation của short nhưng kéo dài để người xem kịp hiểu."
        : "This reuses the short-form animation, slowed down so viewers can follow the idea.",
      bullets: [...guide.steps, ...guide.watch].slice(0, 5),
      durationSec: animationSeconds,
      animation: true,
    },
    {
      id: "complexity",
      kind: "complexity",
      title: lang === "vi" ? "Độ phức tạp & đánh đổi" : "Complexity and trade-offs",
      subtitle: lang === "vi"
        ? "Không chỉ chạy được, cần biết thuật toán mạnh/yếu ở đâu."
        : "It is not enough that it works; we need to know where it is strong or weak.",
      bullets: complexityBullets,
      durationSec: 8,
    },
    {
      id: "recap",
      kind: "recap",
      title: lang === "vi" ? "Tóm tắt để nhớ nhanh" : "Quick recap",
      subtitle: guide.takeaway,
      bullets: [guide.hook, guide.useCase, lang === "vi" ? "Subscribe để xem thêm animation thuật toán khác." : "Subscribe for more visual algorithm explanations."],
      durationSec: 6,
    },
  ];

  return scenes.map((scene) => ({
    ...scene,
    kindLabel: KIND_LABELS[scene.kind][lang],
    narration: buildNarration(scene.title, scene.subtitle, scene.bullets),
  }));
}

function buildBubbleSortScenes(params: { complexity?: Complexity; animationSeconds: number; introSeconds: number; lang: Lang }) {
  const { complexity, animationSeconds, introSeconds, lang } = params;
  const vi = lang === "vi";
  const scenes: Omit<LongContentScene, "kindLabel">[] = [
    {
      id: "kata-intro",
      kind: "intro",
      title: vi ? "KATA Tool cùng KATA Nova" : "KATA Tool with KATA Nova",
      subtitle: vi
        ? "Creator định hướng cách giảng giải, KATA Nova hỗ trợ phân tích và dựng kịch bản."
        : "The creator drives the teaching direction, while KATA Nova helps shape the script and analysis.",
      bullets: vi
        ? ["Human teaching direction + AI-assisted scripting.", "Mục tiêu: biến thuật toán thành animation dễ hiểu.", "Video chỉ được export sau khi bạn review text và tạo voice."]
        : ["Human teaching direction + AI-assisted scripting.", "Goal: turn algorithms into clear animation.", "Export only after text review and voice generation."],
      narration: vi
        ? "Chào bạn, mình là người xây dựng KATA Tool. Đồng hành với mình trong quá trình thiết kế kịch bản và phân tích thuật toán là KATA Nova. Hôm nay, chúng ta dùng chính tool này để mổ xẻ Bubble Sort bằng animation."
        : "Welcome to KATA Tool. I build the teaching flow, and KATA Nova helps with script design and algorithm analysis. Today we will use this tool to break down Bubble Sort visually.",
      durationSec: Math.max(5, introSeconds),
      dataSet: [8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      id: "hook",
      kind: "hook",
      title: vi ? "Bubble Sort có lúc nhanh, có lúc rất chậm" : "Bubble Sort can be fast or painfully slow",
      subtitle: vi ? "Cùng một thuật toán, nhưng dữ liệu khác nhau tạo ra chi phí rất khác nhau." : "Same algorithm, different data, very different cost.",
      bullets: vi
        ? ["Worst case: nhiều compare và swap.", "Nearly sorted: có thể dừng sớm.", "Câu hỏi chính: khi nào nên dùng và khi nào không nên dùng?"]
        : ["Worst case: many comparisons and swaps.", "Nearly sorted: early stop is possible.", "Main question: when should we use it, and when should we avoid it?"],
      narration: vi
        ? "Cùng là Bubble Sort, nhưng có lúc nó chạy rất nhanh, có lúc lại cực kỳ chậm. Trong video này, chúng ta sẽ đi từ trực giác, từng bước chạy, độ phức tạp, cho đến khi nào nên dùng và khi nào không nên dùng."
        : "Bubble Sort can look fast in one case and painfully slow in another. In this video we will cover the intuition, the step-by-step process, complexity, and when to use or avoid it.",
      durationSec: 8,
      animation: true,
      dataSet: [8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      id: "core-idea",
      kind: "mental",
      title: vi ? "Ý tưởng cốt lõi" : "Core idea",
      subtitle: vi ? "So sánh hai phần tử kề nhau. Sai thứ tự thì đổi chỗ." : "Compare adjacent values. Swap when the order is wrong.",
      bullets: vi
        ? ["Mỗi pass quét từ trái sang phải.", "Phần tử lớn nhất còn lại nổi về cuối vùng chưa sorted.", "Màu xanh đánh dấu vị trí đã chắc chắn đúng."]
        : ["Each pass scans from left to right.", "The largest remaining value floats to the end of the unsorted region.", "Green marks positions that are locked."],
      narration: vi
        ? "Bubble Sort hoạt động bằng một quy tắc rất đơn giản: nhìn hai phần tử kề nhau. Nếu phần tử bên trái lớn hơn phần tử bên phải, đổi chỗ chúng. Sau một lượt quét, phần tử lớn nhất nổi dần về cuối mảng."
        : "Bubble Sort follows a simple rule: look at two adjacent values. If the left value is greater than the right value, swap them. After one pass, the largest remaining value moves toward the end.",
      durationSec: 9,
      animation: true,
      dataSet: [5, 1, 4, 2, 8],
    },
    {
      id: "step-by-step",
      kind: "steps",
      title: vi ? "Chạy từng bước với [5, 1, 4, 2, 8]" : "Step by step with [5, 1, 4, 2, 8]",
      subtitle: vi ? "Thuật toán sửa từng lỗi cục bộ cho đến khi toàn bộ mảng đúng thứ tự." : "The algorithm fixes local mistakes until the whole array is ordered.",
      bullets: vi
        ? ["Pass 1 đưa 8 về cuối.", "Pass 2 sửa cặp 4 và 2.", "Pass 3 không còn swap, có thể dừng sớm."]
        : ["Pass 1 moves 8 to the end.", "Pass 2 fixes the pair 4 and 2.", "Pass 3 has no swaps, so we can stop early."],
      narration: vi
        ? "Hãy xem Bubble Sort như một chuỗi sửa lỗi cục bộ. Nó không tìm ngay đáp án toàn cục, mà chỉ sửa từng cặp cạnh nhau. Khi lặp lại đủ nhiều lần, toàn bộ mảng trở nên có thứ tự."
        : "Think of Bubble Sort as a chain of local fixes. It does not solve the whole array at once. It fixes adjacent pairs, and repeated passes eventually make the entire array ordered.",
      durationSec: 13,
      animation: true,
      dataSet: [5, 1, 4, 2, 8],
    },
    {
      id: "animation",
      kind: "animation",
      title: vi ? "Animation Bubble Sort" : "Bubble Sort animation",
      subtitle: vi ? "Theo dõi compare, swap, vùng sorted và thời điểm dừng sớm." : "Watch comparisons, swaps, the sorted region, and early stopping.",
      bullets: vi
        ? ["Cyan: cặp đang compare.", "Cam/hồng: thao tác swap.", "Xanh: vùng đã đúng vị trí.", "Counter cho biết pass, comparisons và swaps."]
        : ["Cyan: compared pair.", "Orange/pink: swap.", "Green: locked sorted region.", "Counters show passes, comparisons and swaps."],
      narration: vi
        ? "Ở phần animation, hãy chú ý ba tín hiệu chính. Cặp đang so sánh được highlight. Nếu thứ tự sai, hai cột đổi chỗ. Sau mỗi pass, vùng sorted ở cuối mảng sẽ lớn dần."
        : "In the animation, watch three signals. The compared pair is highlighted. If the order is wrong, the bars swap. After each pass, the sorted region at the end grows.",
      durationSec: animationSeconds,
      animation: true,
      dataSet: [5, 1, 4, 2, 8],
    },
    {
      id: "early-stop",
      kind: "mental",
      title: vi ? "Tối ưu swapped flag" : "The swapped flag optimization",
      subtitle: vi ? "Nếu một pass không có swap, mảng đã sorted." : "If a pass has no swaps, the array is already sorted.",
      bullets: vi
        ? ["Best case với early stop: O(n).", "Không có early stop, thuật toán vẫn quét lãng phí.", "Data gần sorted là trường hợp Bubble Sort dễ chấp nhận nhất."]
        : ["Best case with early stop: O(n).", "Without early stop, the algorithm keeps scanning unnecessarily.", "Nearly sorted data is Bubble Sort's most acceptable case."],
      narration: vi
        ? "Nếu sau một lượt quét mà không có lần đổi chỗ nào, mảng đã sorted. Đây là tối ưu quan trọng nhất của Bubble Sort, giúp trường hợp tốt nhất trở thành tuyến tính."
        : "If a full pass has no swaps, the array is already sorted. This is Bubble Sort's most important optimization, turning the best case into linear time.",
      durationSec: 10,
      animation: true,
      dataSet: [1, 2, 3, 5, 4, 6, 7, 8],
    },
    {
      id: "complexity",
      kind: "complexity",
      title: vi ? "Độ phức tạp theo từng trường hợp" : "Complexity by case",
      subtitle: vi ? "Best, average và worst case khác nhau rõ rệt." : "Best, average and worst cases are very different.",
      bullets: [
        `Best case: ${complexity?.best ?? "O(n)"}`,
        `${vi ? "Average" : "Average"}: ${complexity?.time ?? "O(n²)"}`,
        `Worst case: ${complexity?.worst ?? "O(n²)"}`,
        `Space: ${complexity?.space ?? "O(1)"}`,
        vi ? "Worst case đảo ngược có thể cần xấp xỉ n(n - 1) / 2 comparisons và swaps." : "The reversed worst case can need about n(n - 1) / 2 comparisons and swaps.",
      ],
      narration: vi
        ? "Về bộ nhớ, Bubble Sort rất tiết kiệm vì nó sort trực tiếp trên mảng, chỉ cần vài biến tạm. Nhưng về thời gian, vòng lặp lồng nhau làm số lần so sánh tăng theo bình phương của số phần tử."
        : "In memory usage, Bubble Sort is cheap because it sorts in place. In time, however, nested loops make comparisons grow quadratically with the number of elements.",
      durationSec: 12,
      animation: true,
      dataSet: [8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      id: "use-cases",
      kind: "use-case",
      title: vi ? "Khi nên dùng Bubble Sort" : "When Bubble Sort is acceptable",
      subtitle: vi ? "Dùng như công cụ học tập và minh họa." : "Use it as a teaching and visualization tool.",
      bullets: vi
        ? ["Người mới học compare, swap, pass và invariant.", "Data rất nhỏ hoặc gần như đã sorted.", "Cần thuật toán stable, in-place, dễ demo bằng animation."]
        : ["Beginners learning compare, swap, passes and invariants.", "Very small or nearly sorted data.", "Need a stable, in-place algorithm that is easy to animate."],
      narration: vi
        ? "Bubble Sort phù hợp khi bạn đang học thuật toán, cần demo animation, hoặc xử lý dữ liệu rất nhỏ. Nó cũng có ý nghĩa khi dữ liệu gần như đã sorted và implementation có early stop."
        : "Bubble Sort is useful when learning algorithms, building visual demos, or handling very small data. It can also be acceptable when data is nearly sorted and early stop is implemented.",
      durationSec: 10,
      animation: true,
      dataSet: [1, 2, 3, 4, 6, 5, 7, 8],
    },
    {
      id: "avoid-cases",
      kind: "avoid",
      title: vi ? "Khi không nên dùng" : "When not to use it",
      subtitle: vi ? "Không chọn Bubble Sort cho dữ liệu lớn hoặc production." : "Do not choose Bubble Sort for large data or production sorting.",
      bullets: vi
        ? ["Data lớn làm O(n²) trở thành vấn đề thật.", "Dữ liệu đảo ngược hoặc rất lộn xộn sẽ chạy chậm.", "Thực tế nên dùng sort built-in, Quick Sort, Merge Sort, Heap Sort hoặc Tim Sort."]
        : ["Large data makes O(n²) a real problem.", "Reversed or very messy data runs slowly.", "In practice, prefer built-in sort, Quick Sort, Merge Sort, Heap Sort or Tim Sort."],
      narration: vi
        ? "Không nên dùng Bubble Sort khi dữ liệu lớn, khi cần hiệu năng ổn định trong production, hoặc khi sort nằm trong luồng realtime và backend tải cao."
        : "Avoid Bubble Sort for large data, production workloads that need stable performance, realtime UI flows, backend APIs, or heavy data pipelines.",
      durationSec: 10,
      animation: true,
      dataSet: [8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      id: "recap",
      kind: "recap",
      title: vi ? "Tổng kết để nhớ nhanh" : "Quick recap",
      subtitle: vi ? "Dễ hiểu, stable, in-place, nhưng không dành cho data lớn." : "Easy to understand, stable, in-place, but not for large data.",
      bullets: vi
        ? ["Best case: O(n) với early stop.", "Average và worst case: O(n²).", "Hãy xem Bubble Sort là công cụ học tập, không phải lựa chọn mặc định cho production."]
        : ["Best case: O(n) with early stop.", "Average and worst case: O(n²).", "Treat Bubble Sort as a learning tool, not a production default."],
      narration: vi
        ? "Bubble Sort không phải thuật toán bạn chọn cho dữ liệu lớn. Nhưng nó là một trong những thuật toán tốt nhất để học cách máy tính sắp xếp dữ liệu bằng so sánh và đổi chỗ."
        : "Bubble Sort is not the algorithm you choose for large data. But it is one of the best algorithms for learning how computers sort by comparing and swapping values.",
      durationSec: 8,
      dataSet: [1, 2, 3, 4, 5, 6, 7, 8],
    },
  ];

  return scenes.map((scene) => ({
    ...scene,
    kindLabel: KIND_LABELS[scene.kind][lang],
  }));
}

export function getSceneAtTime(scenes: LongContentScene[], elapsedSec: number) {
  let cursor = 0;
  for (const scene of scenes) {
    const start = cursor;
    const end = cursor + scene.durationSec;
    if (elapsedSec <= end) return { scene, start, end, progress: clamp01((elapsedSec - start) / scene.durationSec) };
    cursor = end;
  }
  const last = scenes[scenes.length - 1];
  return { scene: last, start: cursor - (last?.durationSec ?? 0), end: cursor, progress: 1 };
}

export function getTotalDuration(scenes: LongContentScene[]) {
  return scenes.reduce((sum, scene) => sum + scene.durationSec, 0);
}

function buildNarration(title: string, subtitle: string, bullets: string[]) {
  return [title, subtitle, ...bullets].filter(Boolean).join(". ");
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
