import { AlgoDef, Complexity } from "./algorithms";
import { buildInsertionSortScenes } from "./insertionLongContentTimeline";
import { buildOddEvenSortScenes } from "./oddEvenLongContentTimeline";
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
  if (algo.id === "insertion") {
    return buildInsertionSortScenes({ algo, complexity, animationSeconds, introSeconds, lang });
  }
  if (algo.id === "odd_even") {
    return buildOddEvenSortScenes({ algo, complexity, animationSeconds, introSeconds, lang });
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
      title: vi ? "Bubble Sort trực quan" : "Bubble Sort visually",
      subtitle: vi
        ? "Sắp xếp bằng cách so sánh từng cặp kề nhau và đổi chỗ khi sai thứ tự."
        : "Sort by comparing adjacent pairs and swapping them when they are out of order.",
      bullets: vi
        ? ["Compare hai phần tử kề nhau.", "Swap khi thứ tự chưa đúng.", "Mỗi pass đưa giá trị lớn dần về cuối mảng."]
        : ["Compare adjacent values.", "Swap when the order is wrong.", "Each pass moves larger values toward the end."],
      narration: vi
        ? "Chào bạn, mình là trợ lý KATA. Vào thẳng Bubble Sort nhé: thuật toán sẽ so sánh từng cặp kề nhau, sai thứ tự thì đổi chỗ, và sau mỗi lượt quét phần tử lớn dần sẽ trôi về cuối mảng."
        : "Hi, I am the KATA AI supporter. Let us go straight into Bubble Sort: the algorithm compares adjacent pairs, swaps them when the order is wrong, and after each pass the larger values drift toward the end.",
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
        ? "Điều thú vị là Bubble Sort rất dễ giải thích, nhưng không phải lúc nào cũng đáng dùng. Nếu dữ liệu gần đúng thứ tự, nó có thể đi khá nhẹ. Nếu dữ liệu bị đảo ngược, gần như cặp nào cũng phải kiểm tra rồi đổi chỗ. Nói cách khác, cùng một thuật toán nhưng chất lượng input quyết định cảm giác nhanh hay chậm. Vì vậy trước khi xem chart chạy, mình muốn bạn nắm câu hỏi chính: Bubble Sort đang sửa lỗi cục bộ từng cặp, và chi phí sẽ tăng mạnh khi có quá nhiều lỗi cục bộ."
        : "The interesting part is that Bubble Sort is easy to explain, but not always worth using. If the data is almost sorted, it can move lightly. If the data is reversed, almost every pair must be checked and swapped. In other words, the same algorithm can feel fast or slow depending on the input quality. Before we run the chart, hold on to the main question: Bubble Sort fixes local pair mistakes, and the cost grows when there are too many of those mistakes.",
      durationSec: 8,
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
        ? "Cốt lõi của Bubble Sort rất đời thường: đừng cố giải cả mảng một lúc, chỉ sửa từng cặp đứng cạnh nhau. Nếu phần tử bên trái lớn hơn phần tử bên phải, thứ tự cục bộ đang sai và cần đổi chỗ. Nếu cặp đó đã đúng, bỏ qua và xét cặp kế tiếp. Khi thao tác này lặp lại từ trái sang phải, phần tử lớn nhất trong vùng chưa sorted sẽ dần bị đẩy về cuối."
        : "The core idea is very human: do not solve the whole list at once, just fix neighboring pairs. If the left value is greater than the right value, that local order is wrong and needs a swap. If the pair is already correct, skip it and inspect the next pair. Repeating this from left to right gradually pushes the largest unsorted value to the end.",
      durationSec: 9,
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
        ? "Với mảng 5, 1, 4, 2, 8, mình sẽ đọc theo đúng luồng xử lý. Đầu tiên so sánh 5 và 1: 5 lớn hơn 1 nên swap, để 1 đi về bên trái. Tiếp theo 5 gặp 4: vẫn sai thứ tự nên swap tiếp. Rồi 5 gặp 2: lại swap, vì 2 cần đứng trước 5. Khi 5 gặp 8 thì không đổi, vì 5 nhỏ hơn 8. Hết lượt đầu, 8 đã nằm đúng ở cuối. Lượt sau tiếp tục sửa các lỗi còn lại như cặp 4 và 2, cho đến khi một lượt quét không còn swap nào."
        : "With the array 5, 1, 4, 2, 8, I will narrate the actual flow. First compare 5 and 1: 5 is greater than 1, so we swap and let 1 move left. Next 5 meets 4: still out of order, so swap again. Then 5 meets 2: swap again, because 2 belongs before 5. When 5 meets 8, there is no swap because 5 is smaller than 8. After the first pass, 8 is locked at the end. The next pass keeps fixing the remaining mistakes, such as 4 and 2, until a full pass has no swaps.",
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
        ? "Bây giờ mình sẽ nói sát theo animation. Khi con trỏ nằm trên hai cột màu cyan, đó là một phép compare. Nếu cột bên trái cao hơn, thuật toán kết luận thứ tự đang sai và chuyển sang trạng thái swap, thường được tô cam hoặc hồng. Ví dụ 5 đứng trước 1 thì phải đổi, vì mảng tăng dần không cho giá trị lớn đứng trước giá trị nhỏ. Sau swap, 1 lùi về bên trái, còn 5 tiếp tục được so sánh với phần tử kế tiếp. Nếu gặp 8, 5 không cần đổi vì thứ tự đã đúng. Cứ như vậy, mỗi pass đẩy giá trị lớn nhất còn lại sang phải. Vùng màu xanh ở cuối không còn là chỗ để đoán nữa; đó là vùng đã được khóa, thuật toán sẽ không cần sửa lại."
        : "Now I will narrate close to the animation. When the pointer sits on two cyan bars, that is a comparison. If the left bar is taller, the order is wrong and the algorithm moves into a swap state, usually shown in orange or pink. For example, 5 before 1 must be swapped, because ascending order does not allow a larger value before a smaller one. After the swap, 1 moves left while 5 keeps being compared with the next value. If it meets 8, there is no swap because the order is already correct. Each pass pushes the largest remaining value to the right. The green region at the end is no longer something to guess about; it is locked.",
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
        ? "Đây là chi tiết khiến Bubble Sort bớt ngây thơ hơn. Hãy nghe cách swapped flag hoạt động: đầu mỗi pass, ta giả sử chưa có đổi chỗ. Nếu trong lúc quét mà có swap, flag bật lên, nghĩa là mảng vẫn còn lỗi cục bộ. Nhưng nếu đi hết một pass mà không swap lần nào, mọi cặp kề nhau đều đã đúng thứ tự. Khi đó không cần chờ thêm animation nữa; thuật toán có bằng chứng để dừng ngay."
        : "This is the detail that makes Bubble Sort less naive. Here is how the swapped flag works: at the start of each pass, assume no swap has happened. If a swap occurs during the scan, the flag turns on, meaning the list still has local mistakes. But if a full pass finishes with no swaps, every adjacent pair is already in order. At that point the algorithm has proof to stop immediately.",
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
        ? "Về bộ nhớ, Bubble Sort khá gọn vì nó sắp xếp trực tiếp trên mảng, gần như không cần mảng phụ. Nhưng cái giá nằm ở thời gian. Nếu có n phần tử, một pass phải nhìn qua nhiều cặp kề nhau. Với dữ liệu đảo ngược, gần như mỗi lần nhìn lại dẫn tới swap, nên số thao tác phình lên theo bình phương. Vì vậy khi n tăng, video có thể chỉ thêm vài cột, nhưng lượng compare và swap tăng rất mạnh."
        : "In memory, Bubble Sort is compact because it sorts in place and barely needs extra storage. The cost is time. With n values, one pass must inspect many adjacent pairs. On reversed data, almost every inspection leads to a swap, so the work grows quadratically. That means the video may add only a few more bars, but the number of comparisons and swaps rises sharply.",
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
