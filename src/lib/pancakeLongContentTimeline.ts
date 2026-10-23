import type { AlgoDef, Complexity } from "./algorithms";
import type { Lang } from "./i18n";
import type { LongContentScene } from "./longContentTimeline";

const KIND_LABELS: Record<LongContentScene["kind"], Record<Lang, string>> = {
  intro: { vi: "Mở đầu", en: "Intro" },
  hook: { vi: "Tình huống", en: "Scenario" },
  mental: { vi: "Mô hình", en: "Mental model" },
  steps: { vi: "Quy trình", en: "Process" },
  animation: { vi: "Minh họa", en: "Walkthrough" },
  complexity: { vi: "Chi phí", en: "Cost" },
  "use-case": { vi: "Nên dùng", en: "Use when" },
  avoid: { vi: "Tránh dùng", en: "Avoid when" },
  recap: { vi: "Tóm tắt", en: "Recap" },
};

type DraftScene = Omit<LongContentScene, "kindLabel">;

export function buildPancakeSortScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
  lang: Lang;
}): LongContentScene[] {
  const { algo, complexity, animationSeconds, introSeconds, lang } = params;
  const vi = lang === "vi";
  const input = [3, 6, 1, 5, 2, 4];
  const scenes: DraftScene[] = [
    {
      id: "pancake-intro",
      kind: "intro",
      title: vi ? "Pancake Sort: sắp xếp bằng flip prefix" : "Pancake Sort: sorting with prefix flips",
      subtitle: vi ? "Thuật toán không swap hai phần tử tùy ý; nó chỉ được đảo đoạn bắt đầu từ index 0." : "The algorithm cannot swap arbitrary values; it can only reverse a prefix starting at index 0.",
      bullets: vi
        ? ["Mỗi vòng chọn giá trị lớn nhất trong prefix chưa sorted.", "Có tối đa hai lần flip để đưa giá trị đó về cuối prefix.", "Sau mỗi vòng, suffix bên phải tăng thêm một vị trí đã cố định."]
        : ["Each round selects the largest value in the unsorted prefix.", "Up to two flips move that value to the prefix end.", "After each round, the fixed suffix grows by one position."],
      narration: vi
        ? `Vào thẳng ${algo.name}. Điểm đặc biệt là thuật toán chỉ có một thao tác mạnh: flip một prefix, tức là đảo toàn bộ đoạn bắt đầu từ index 0 đến một vị trí được chọn. Vì vậy mỗi vòng sẽ tìm giá trị lớn nhất trong đoạn chưa sorted, đưa nó lên đầu nếu cần, rồi flip cả đoạn để đặt nó vào cuối prefix.`
        : `Let us go straight into ${algo.name}. The special constraint is that the algorithm has one powerful move: flip a prefix, meaning reverse the segment from index zero to a chosen position. Each round finds the largest value in the unfixed prefix, moves it to the front if needed, then flips the whole prefix to place it at the end.`,
      durationSec: Math.max(6, introSeconds),
      dataSet: input,
    },
    {
      id: "pancake-mental-model",
      kind: "mental",
      title: vi ? "Mô hình tư duy: đặt max vào cuối prefix" : "Mental model: place the max at the prefix end",
      subtitle: vi ? "Đừng nghĩ theo swap kề nhau. Hãy nghĩ theo một vùng prefix đang ngắn dần." : "Do not think in adjacent swaps. Think in terms of a shrinking prefix.",
      bullets: vi
        ? ["Prefix 0..size-1 là vùng còn phải xử lý.", "Giá trị lớn nhất của prefix thuộc về vị trí size-1.", "Khi vị trí đó được chốt, vòng sau bỏ qua nó."]
        : ["Prefix 0..size-1 is the active working area.", "The largest value in that prefix belongs at size-1.", "Once that position is fixed, the next round ignores it."],
      narration: vi
        ? "Mô hình cần nhớ là: thuật toán xây phần sorted từ bên phải sang trái. Ở mỗi vòng, prefix đang xét có độ dài size. Ta chỉ quan tâm giá trị lớn nhất trong prefix đó, vì nó phải nằm ở cuối prefix. Khi đã đặt đúng, vị trí cuối prefix trở thành một phần của suffix đã sorted và không cần động vào nữa."
        : "The model to remember is that the algorithm builds the sorted region from right to left. In each round, the active prefix has length size. We only care about the largest value inside that prefix, because it belongs at the prefix end. Once it is placed, that slot becomes part of the sorted suffix and will not be touched again.",
      durationSec: 10,
      dataSet: input,
    },
    {
      id: "pancake-step-by-step",
      kind: "steps",
      title: vi ? "Đi từng bước với [3, 6, 1, 5, 2, 4]" : "Step by step with [3, 6, 1, 5, 2, 4]",
      subtitle: vi ? "Vòng đầu cho thấy đủ cả ba ý: scan max, flip lên đầu, flip về cuối prefix." : "The first round shows all three ideas: scan max, flip to front, flip to prefix end.",
      bullets: vi
        ? ["Scan prefix 0..5: max là 6 ở index 1.", "Flip 0..1: đưa 6 lên index 0.", "Flip 0..5: đưa 6 về index 5 và khóa vị trí này."]
        : ["Scan prefix 0..5: max is 6 at index 1.", "Flip 0..1: move 6 to index 0.", "Flip 0..5: move 6 to index 5 and lock that slot."],
      narration: vi
        ? "Bắt đầu với input 3, 6, 1, 5, 2, 4. Trong prefix 0 đến 5, thuật toán quét để tìm max. Nó thấy 6 là lớn nhất và đang ở index 1. Vì max chưa ở đầu, ta flip đoạn 0 đến 1, nên 6 lên index 0. Sau đó flip đoạn 0 đến 5. Lần flip thứ hai đặt 6 vào index 5, đúng vị trí cuối cùng của vòng này. Từ đây index 5 được khóa."
        : "Start with input 3, 6, 1, 5, 2, 4. In prefix zero through five, the algorithm scans for the maximum. It finds 6 at index one. Since that max is not at the front, flip zero through one, so 6 moves to index zero. Then flip zero through five. The second flip places 6 at index five, the final slot for this round. From this point, index five is locked.",
      durationSec: 17,
      animation: true,
      dataSet: input,
    },
    {
      id: "pancake-animation",
      kind: "animation",
      title: vi ? "Theo dõi prefix, max và hai lần flip" : "Track the prefix, max, and the two flips",
      subtitle: vi ? "Chart luôn cho biết prefix đang xử lý và đoạn nào sắp bị đảo." : "The chart shows the active prefix and the segment being reversed.",
      bullets: vi
        ? ["Scan: so sánh để cập nhật max trong prefix.", "Flip ngắn: đưa max lên đầu nếu max không ở index 0.", "Flip dài: đưa max về cuối prefix rồi khóa suffix."]
        : ["Scan: compare and update the max inside the prefix.", "Short flip: move the max to the front when needed.", "Long flip: move the max to the prefix end and lock the suffix."],
      narration: vi
        ? "Ở animation chính, hãy đọc theo phase. Phase scan max nghĩa là thuật toán chỉ đang tìm giá trị lớn nhất trong prefix hiện tại. Khi phase chuyển sang flip max to top, đoạn được tô là prefix ngắn từ 0 tới vị trí max; mục tiêu là đưa max về đầu mảng. Khi phase là flip max to sorted end, đoạn được tô dài hơn, từ 0 tới cuối prefix; sau cú flip này, max rơi đúng vào biên phải của vùng chưa sorted. Mỗi lần khóa xong một vị trí, size giảm đi một."
        : "In the main animation, read the phase first. Scan max means the algorithm is only finding the largest value in the current prefix. When the phase becomes flip max to top, the highlighted segment is the short prefix from zero to the max position; the goal is to move the max to the front. When the phase is flip max to sorted end, the highlighted segment is longer, from zero to the prefix end; after that flip, the max lands on the right edge of the unfixed area. Each locked position reduces size by one.",
      durationSec: animationSeconds,
      animation: true,
      dataSet: input,
    },
    {
      id: "pancake-edge-cases",
      kind: "mental",
      title: vi ? "Khi nào bỏ qua flip?" : "When do we skip a flip?",
      subtitle: vi ? "Không phải vòng nào cũng cần đúng hai lần flip." : "Not every round needs exactly two flips.",
      bullets: vi
        ? ["Nếu max đã ở cuối prefix: không cần flip vòng đó.", "Nếu max đã ở index 0: bỏ qua flip ngắn.", "Nếu max nằm giữa prefix: thường cần hai flip."]
        : ["If max is already at the prefix end: no flip is needed.", "If max is already at index 0: skip the short flip.", "If max is inside the prefix: usually use two flips."],
      narration: vi
        ? "Một chi tiết quan trọng: tối đa hai flip không có nghĩa là luôn luôn hai flip. Nếu max đã nằm ở cuối prefix, vị trí đó đã đúng nên bỏ qua cả vòng flip. Nếu max đã ở index 0, ta không cần flip ngắn, chỉ cần flip dài để đưa nó về cuối prefix. Chỉ khi max nằm ở giữa, mô hình hai bước mới xuất hiện đầy đủ."
        : "An important detail: up to two flips does not mean always two flips. If the max is already at the prefix end, that slot is already correct and no flip is needed. If the max is already at index zero, skip the short flip and only do the long flip. Only when the max sits in the middle do we see the full two-step pattern.",
      durationSec: 10,
      dataSet: [1, 2, 3, 4, 5, 6],
    },
    {
      id: "pancake-complexity",
      kind: "complexity",
      title: vi ? "Độ phức tạp & đánh đổi" : "Complexity and trade-offs",
      subtitle: vi ? "Ý tưởng rất trực quan, nhưng chi phí vẫn tăng theo bình phương." : "The idea is visual, but the work still grows quadratically.",
      bullets: [
        `Best case: ${complexity?.best ?? "O(n²)"}`,
        `Average: ${complexity?.time ?? "O(n²)"}`,
        `Worst case: ${complexity?.worst ?? "O(n²)"}`,
        `Space: ${complexity?.space ?? "O(1)"}`,
        vi ? "Không stable: flip prefix có thể đảo thứ tự các giá trị bằng nhau." : "Not stable: prefix flips can reverse equal values.",
      ],
      narration: vi
        ? "Về chi phí, Pancake Sort vẫn là O n bình phương. Lý do là mỗi vòng phải scan prefix để tìm max, và tổng độ dài các prefix là n cộng n trừ một, rồi tiếp tục giảm dần. Số lần flip chỉ là O n, vì mỗi vòng tối đa hai flip, nhưng chi phí tìm max mới là phần tạo ra O n bình phương. Bộ nhớ là O một vì mọi thao tác đều làm trực tiếp trên mảng. Thuật toán không stable, vì một lần flip prefix có thể đảo thứ tự của các giá trị bằng nhau."
        : "For cost, Pancake Sort is still O n squared. Each round scans the active prefix to find the max, and the total scanned length is n plus n minus one, then keeps shrinking. The number of flips is only O n because each round uses at most two flips, but the max search creates the O n squared time. Space is O one because the work happens in place. The algorithm is not stable because a prefix flip can reverse equal values.",
      durationSec: 13,
      dataSet: [6, 5, 4, 3, 2, 1],
    },
    {
      id: "pancake-recap",
      kind: "recap",
      title: vi ? "Tóm tắt để nhớ Pancake Sort" : "Quick recap for Pancake Sort",
      subtitle: vi ? "Tìm max trong prefix, đưa lên đầu, đưa về cuối prefix, rồi thu nhỏ prefix." : "Find the max in the prefix, move it to front, move it to the prefix end, then shrink.",
      bullets: vi
        ? ["Luật duy nhất: flip prefix từ index 0.", "Mỗi vòng chốt thêm một vị trí bên phải.", "Dễ học về invariant, prefix reversal và in-place sorting."]
        : ["Only move: flip a prefix from index 0.", "Each round fixes one more position on the right.", "Useful for learning invariants, prefix reversal and in-place sorting."],
      narration: vi
        ? "Tóm lại, Pancake Sort là bài học rất rõ về ràng buộc thao tác. Nếu chỉ được flip prefix, ta vẫn có thể sort bằng chiến lược chọn max. Tìm max trong prefix, đưa max lên đầu nếu cần, flip đến cuối prefix để đặt đúng vị trí, rồi thu nhỏ prefix. Đó là toàn bộ nhịp chính."
        : "To recap, Pancake Sort is a clear lesson in operation constraints. Even if the only allowed move is a prefix flip, we can still sort by repeatedly selecting the maximum. Find the max in the prefix, move it to the front if needed, flip to the prefix end, and shrink the prefix. That is the whole rhythm.",
      durationSec: 8,
      dataSet: [1, 2, 3, 4, 5, 6],
    },
  ];

  return scenes.map((scene) => ({ ...scene, kindLabel: KIND_LABELS[scene.kind][lang] }));
}
