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
    narration: buildNarration(scene.title, scene.subtitle, scene.bullets, lang),
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
        ? "Chào bạn, mình KATA AI. Hôm nay mình sẽ biến Bubble Sort từ một đoạn code khô khan thành một câu chuyện chuyển động. Bạn chỉ cần nhìn vào các cột, màu sắc và nhịp đổi chỗ, rồi thuật toán sẽ tự trở nên dễ hiểu."
        : "Hi, I am KATA AI. Today we will turn Bubble Sort from a dry piece of code into a moving story. Watch the bars, the colors, and the rhythm of each swap, and the algorithm will start to make sense.",
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
        ? "Điều thú vị là cùng một thuật toán, nhưng chỉ cần dữ liệu thay đổi, cảm giác tốc độ đã khác hẳn. Có lúc Bubble Sort đi rất nhẹ nhàng. Có lúc nó phải đổi chỗ liên tục như đang gỡ một nút thắt. Mình sẽ dẫn bạn đi từ trực giác đến cách đánh giá khi nào nên dùng nó."
        : "Here is the interesting part: the same algorithm can feel completely different when the data changes. Sometimes Bubble Sort glides through the list. Sometimes it keeps swapping as if it is untangling a knot. We will move from intuition to the real decision of when to use it.",
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
        ? "Cốt lõi của Bubble Sort rất đời thường: chỉ nhìn hai phần tử đứng cạnh nhau. Nếu bên trái lớn hơn bên phải, ta đổi chỗ. Làm như vậy lặp đi lặp lại, phần tử lớn sẽ dần nổi về cuối mảng, giống như bọt khí nổi lên mặt nước."
        : "The core idea is very human: only look at two neighboring values. If the left one is bigger than the right one, swap them. Repeat that simple action, and larger values drift toward the end, like bubbles rising to the surface.",
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
        ? "Ở ví dụ này, đừng cố nhìn toàn bộ mảng một lần. Hãy nhìn như Bubble Sort nhìn: từng cặp một. Mỗi lần đổi chỗ chỉ sửa một lỗi nhỏ, nhưng nhiều lỗi nhỏ được sửa liên tiếp sẽ tạo thành một kết quả đúng cho cả mảng."
        : "In this example, do not try to solve the whole list at once. Look the way Bubble Sort looks: one pair at a time. Each swap fixes one small mistake, and enough small fixes eventually create a fully ordered array.",
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
        ? "Bây giờ hãy theo dõi ba tín hiệu. Màu nổi bật cho biết cặp đang được so sánh. Khi thứ tự sai, hai cột đổi chỗ. Và sau mỗi pass, vùng đã chắc chắn đúng ở cuối mảng sẽ lớn dần. Chỉ cần bám ba tín hiệu này, bạn sẽ không bị lạc trong animation."
        : "Now watch three signals. The highlight shows the pair being compared. When the order is wrong, the two bars swap. After each pass, the locked sorted region grows at the end. Follow those three signals and the animation stays easy to read.",
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
        ? "Đây là chi tiết khiến Bubble Sort bớt ngây thơ hơn. Nếu một lượt quét đi hết mảng mà không cần đổi chỗ lần nào, ta biết mảng đã sorted. Lúc đó dừng ngay, không quét thêm cho tốn thời gian."
        : "This is the detail that makes Bubble Sort less naive. If a full pass finishes without a single swap, the array is already sorted. At that point, stop immediately instead of scanning again for no reason.",
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
        ? "Về bộ nhớ, Bubble Sort khá gọn vì nó sắp xếp trực tiếp trên mảng. Nhưng cái giá nằm ở thời gian. Khi số phần tử tăng lên, số lần so sánh có thể tăng rất nhanh, đặc biệt với dữ liệu đảo ngược hoặc lộn xộn."
        : "In memory, Bubble Sort is compact because it sorts in place. The cost is time. As the list grows, comparisons can rise very quickly, especially when the data is reversed or messy.",
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
        ? "Vậy Bubble Sort có vô dụng không? Không. Nó rất tốt để học cách thuật toán suy nghĩ bằng compare, swap và invariant. Với dữ liệu rất nhỏ, hoặc dữ liệu gần như đã sorted kèm early stop, nó vẫn có chỗ đứng trong demo và bài học."
        : "So is Bubble Sort useless? No. It is excellent for learning how algorithms think through comparisons, swaps, and invariants. With tiny data, or nearly sorted data plus early stop, it still has a place in demos and lessons.",
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
        ? "Nhưng nếu bước sang dữ liệu lớn hoặc hệ thống production, hãy để Bubble Sort ở lại trong lớp học. Khi hiệu năng là vấn đề thật, bạn nên dùng sort built-in hoặc các thuật toán mạnh hơn như Quick Sort, Merge Sort, Heap Sort hoặc Tim Sort."
        : "But once you move to large data or production systems, leave Bubble Sort in the classroom. When performance matters, use the built-in sort or stronger algorithms such as Quick Sort, Merge Sort, Heap Sort, or Tim Sort.",
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
        ? "Tóm lại, Bubble Sort không phải lựa chọn cho dữ liệu lớn. Nhưng để hiểu compare, swap, pass và early stop, nó là một sân khấu trực quan tuyệt vời. Khi bạn nhìn được nhịp chuyển động này, những thuật toán sắp xếp phức tạp hơn cũng sẽ dễ tiếp cận hơn."
        : "To recap, Bubble Sort is not the choice for large data. But for understanding compare, swap, passes, and early stop, it is a wonderfully visual stage. Once you see this rhythm, more advanced sorting algorithms become easier to approach.",
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

function buildNarration(title: string, subtitle: string, bullets: string[], lang: Lang) {
  if (lang === "vi") {
    return [
      `Ở phần này, mình muốn bạn tập trung vào ý chính: ${title}.`,
      subtitle ? `${subtitle}` : "",
      bullets.length ? `Hãy nhớ ${bullets.slice(0, 3).join("; ")}.` : "",
      "Mình sẽ giữ nhịp chậm vừa đủ để bạn theo dõi cả lời giải thích lẫn chuyển động trên màn hình.",
    ].filter(Boolean).join(" ");
  }

  return [
    `In this part, focus on the main idea: ${title}.`,
    subtitle,
    bullets.length ? `Keep these points in mind: ${bullets.slice(0, 3).join("; ")}.` : "",
    "The pacing stays slow enough for you to follow both the explanation and the motion on screen.",
  ].filter(Boolean).join(" ");
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
