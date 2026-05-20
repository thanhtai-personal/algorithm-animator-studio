import type { AlgoDef, Complexity } from "./algorithms";
import type { Lang } from "./i18n";
import type { LongContentScene } from "./longContentTimeline";

const KIND_LABELS = {
  intro: { vi: "Mở đầu", en: "Intro" },
  mental: { vi: "Ý tưởng", en: "Core idea" },
  steps: { vi: "Các bước", en: "Steps" },
  animation: { vi: "Animation", en: "Animation" },
  complexity: { vi: "Độ phức tạp", en: "Complexity" },
  recap: { vi: "Tóm tắt", en: "Recap" },
} as const;

type DraftScene = Omit<LongContentScene, "kindLabel">;

export function buildOddEvenSortScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
  lang: Lang;
}): LongContentScene[] {
  const { algo, complexity, animationSeconds, introSeconds, lang } = params;
  const vi = lang === "vi";
  const scenes: DraftScene[] = [
    {
      id: "odd-even-intro",
      kind: "intro",
      title: vi ? "Odd-Even Sort trực quan" : "Odd-Even Sort visually",
      subtitle: vi ? "Một biến thể của Bubble Sort: quét cặp lẻ rồi quét cặp chẵn." : "A Bubble Sort variant: scan odd pairs, then even pairs.",
      bullets: vi
        ? ["Pha lẻ: so sánh cặp 1-2, 3-4, 5-6...", "Pha chẵn: so sánh cặp 0-1, 2-3, 4-5...", "Lặp lại đến khi cả hai pha không còn đổi chỗ."]
        : ["Odd phase compares pairs 1-2, 3-4, 5-6...", "Even phase compares pairs 0-1, 2-3, 4-5...", "Repeat until both phases make no swaps."],
      narration: vi
        ? `Vào thẳng ${algo.name}. Hãy xem nó như Bubble Sort nhưng chia nhịp thành hai nửa. Ở pha lẻ, thuật toán chỉ nhìn các cặp bắt đầu tại chỉ số lẻ như 1-2, 3-4. Sau đó ở pha chẵn, nó nhìn các cặp bắt đầu tại chỉ số chẵn như 0-1, 2-3. Nếu một cặp sai thứ tự thì đổi chỗ. Khi cả hai pha đi qua mà không có lần đổi chỗ nào, mảng đã được sắp xếp.`
        : `Let us go straight into ${algo.name}. Think of it as Bubble Sort split into two rhythms. In the odd phase, the algorithm checks pairs that start at odd indexes, such as 1-2 and 3-4. Then the even phase checks pairs that start at even indexes, such as 0-1 and 2-3. If a pair is out of order, it swaps. When both phases finish with no swaps, the array is sorted.`,
      durationSec: Math.max(6, introSeconds),
      dataSet: [6, 5, 4, 3, 2, 1],
    },
    {
      id: "odd-even-mental-model",
      kind: "mental",
      title: vi ? "Mô hình tư duy" : "Mental model",
      subtitle: vi ? "Không sửa mọi cặp cùng lúc; thuật toán sửa theo nhịp xen kẽ." : "It does not fix every pair at once; it alternates pair groups.",
      bullets: vi
        ? ["Trong một pha, các cặp không chồng lên nhau.", "Vì không chồng nhau, về lý thuyết các cặp trong cùng pha có thể chạy song song.", "Sau pha lẻ và pha chẵn, lỗi cục bộ được đẩy dần sang đúng vị trí."]
        : ["Inside one phase, compared pairs do not overlap.", "Because they do not overlap, pairs in the same phase can theoretically run in parallel.", "After odd and even phases, local mistakes move toward the right places."],
      narration: vi
        ? "Điểm khác biệt quan trọng nằm ở việc các cặp trong cùng một pha không đụng nhau. Ví dụ pha lẻ có thể xét 1-2 và 3-4 vì hai cặp này không dùng chung phần tử. Đó là lý do Odd-Even Sort thường được nhắc tới khi nói về mạng sắp xếp hoặc ý tưởng song song hóa. Dù vậy, trong phiên bản chạy tuần tự trên màn hình, ta vẫn đi từng cặp để bạn dễ quan sát."
        : "The key difference is that pairs inside one phase do not overlap. For example, the odd phase can check 1-2 and 3-4 because those pairs do not share an element. That is why Odd-Even Sort is often mentioned with sorting networks or parallel ideas. In this visual version, we still walk pair by pair so the process is easy to follow.",
      durationSec: 10,
      dataSet: [6, 5, 4, 3, 2, 1],
    },
    {
      id: "phase-walkthrough",
      kind: "steps",
      title: vi ? "Đi từng phase với [6, 5, 4, 3, 2, 1]" : "Phase walkthrough with [6, 5, 4, 3, 2, 1]",
      subtitle: vi ? "Pha lẻ trước, pha chẵn sau, rồi lặp lại." : "Odd phase first, even phase next, then repeat.",
      bullets: vi
        ? ["Pha lẻ sửa 5 > 4 và 3 > 2.", "Pha chẵn sửa 6 > 4, 5 > 2 và 3 > 1.", "Nếu còn đổi chỗ, vòng kế tiếp tiếp tục chạy."]
        : ["Odd phase fixes 5 > 4 and 3 > 2.", "Even phase fixes 6 > 4, 5 > 2 and 3 > 1.", "If any swap happened, the next round continues."],
      narration: vi
        ? "Giờ theo đúng input 6, 5, 4, 3, 2, 1. Pha lẻ bỏ qua cặp đầu tiên và bắt đầu ở chỉ số 1: so sánh 5 và 4, vì 5 lớn hơn 4 nên đổi chỗ. Tiếp theo là cặp 3 và 2, cũng sai thứ tự nên đổi tiếp. Sau đó chuyển sang pha chẵn. Lúc này thuật toán xét 6 và 4, sai nên đổi chỗ. Rồi 5 và 2, cũng đổi chỗ. Cuối cùng 3 và 1, lại đổi chỗ. Vì trong vòng này có đổi chỗ, cờ đã sắp xếp bị tắt và thuật toán phải chạy thêm vòng nữa."
        : "Now follow the input 6, 5, 4, 3, 2, 1. The odd phase skips the first pair and starts at index 1: compare 5 and 4; since 5 is greater than 4, swap them. Next comes 3 and 2, also out of order, so swap again. Then we switch to the even phase. Now the algorithm checks 6 and 4, which is wrong, so it swaps. Then 5 and 2 also swap. Finally 3 and 1 swap. Because this round made swaps, the sorted flag turns off and another round is required.",
      durationSec: 16,
      animation: true,
      dataSet: [6, 5, 4, 3, 2, 1],
    },
    {
      id: "odd-even-animation",
      kind: "animation",
      title: vi ? "Theo dõi phase trên chart" : "Watch the phases on the chart",
      subtitle: vi ? "Nhãn pha cho biết đang chạy nhóm cặp nào." : "The phase badge tells you which pair group is active.",
      bullets: vi
        ? ["Pha lẻ chỉ xét các cặp bắt đầu ở chỉ số lẻ.", "Pha chẵn chỉ xét các cặp bắt đầu ở chỉ số chẵn.", "Một vòng đủ hai pha mà không đổi chỗ thì thuật toán dừng."]
        : ["Odd phase activates only pairs starting at odd indexes.", "Even phase activates only pairs starting at even indexes.", "Pink means swap; final green means sorted."],
      narration: vi
        ? "Ở đoạn animation chính, hãy nhìn nhãn pha trước. Khi nhãn là lẻ, các vạch nối chỉ nằm trên nhóm cặp lẻ. Khi nhãn đổi sang chẵn, nhóm cặp được dịch sang một ô. Mỗi lần cặp bên trái lớn hơn cặp bên phải, hai cột đổi chỗ và cờ đã sắp xếp chuyển về false. Khi một vòng đầy đủ gồm pha lẻ và pha chẵn không tạo lần đổi chỗ nào, mọi cặp kề nhau đã đúng thứ tự, nên thuật toán dừng."
        : "In the main animation, look at the phase badge first. When the badge says odd, the pair bands sit on the odd-index group. When it switches to even, the active group shifts by one slot. Whenever the left value is greater than the right value, the two bars swap and the sorted flag becomes false. When a full round of odd and even phases produces no swap, every adjacent pair is ordered, so the algorithm stops.",
      durationSec: animationSeconds,
      animation: true,
      dataSet: [6, 5, 4, 3, 2, 1],
    },
    {
      id: "odd-even-complexity",
      kind: "complexity",
      title: vi ? "Độ phức tạp & đánh đổi" : "Complexity and trade-offs",
      subtitle: vi ? "Dễ song song hóa hơn Bubble Sort, nhưng bản tuần tự vẫn chậm với dữ liệu lớn." : "More parallel-friendly than Bubble Sort, but still slow sequentially on large data.",
      bullets: [
        `Best case: ${complexity?.best ?? "O(n)"}`,
        `Average: ${complexity?.time ?? "O(n²)"}`,
        `Worst case: ${complexity?.worst ?? "O(n²)"}`,
        `Space: ${complexity?.space ?? "O(1)"}`,
      ],
      narration: vi
        ? "Về độ phức tạp, Odd-Even Sort vẫn thuộc nhóm đơn giản kiểu Bubble Sort. Nếu dữ liệu đã gần đúng và một vòng không có lần đổi chỗ nào, trường hợp tốt nhất có thể là O n. Nhưng trung bình và trường hợp xấu nhất vẫn là O n bình phương. Điểm đáng học không phải là tốc độ tuần tự, mà là cấu trúc theo pha: trong cùng một pha, nhiều cặp độc lập có thể được xử lý song song. Bộ nhớ vẫn là O một vì thuật toán đổi trực tiếp trong mảng."
        : "For complexity, Odd-Even Sort is still in the simple Bubble-Sort family. If the data is already close and a round makes no swaps, the best case can be O n. But the average and worst cases remain O n squared. The interesting lesson is not sequential speed; it is the phase structure: inside one phase, many independent pairs can be processed in parallel. Space stays O one because the algorithm swaps in place.",
      durationSec: 12,
      dataSet: [1, 3, 2, 5, 4, 6],
    },
    {
      id: "odd-even-recap",
      kind: "recap",
      title: vi ? "Tóm tắt để nhớ" : "Quick recap",
      subtitle: vi ? "Pha lẻ, pha chẵn, lặp đến khi không còn đổi chỗ." : "Odd phase, even phase, repeat until no swaps remain.",
      bullets: vi
        ? ["Biến thể của Bubble Sort.", "Cặp trong cùng pha không chồng nhau.", "Tuần tự vẫn O(n²), nhưng ý tưởng theo pha rất hợp để dạy compare-swap song song."]
        : ["A Bubble Sort variant.", "Pairs inside one phase do not overlap.", "Sequential time is still O(n²), but the phase idea is useful for parallel compare-swap."],
      narration: vi
        ? "Tóm lại, Odd-Even Sort là cách nhìn Bubble Sort theo nhịp xen kẽ. Pha lẻ sửa các cặp lẻ, pha chẵn sửa các cặp chẵn, và thuật toán lặp cho đến khi cả vòng không còn đổi chỗ. Nó không phải lựa chọn mặc định cho production, nhưng rất tốt để hiểu compare-swap theo pha và ý tưởng song song hóa."
        : "To recap, Odd-Even Sort is Bubble Sort viewed as alternating rhythms. The odd phase fixes odd-index pairs, the even phase fixes even-index pairs, and the algorithm repeats until a whole round has no swaps. It is not the default production sort, but it is excellent for understanding phased compare-swap and parallelization ideas.",
      durationSec: 8,
      dataSet: [1, 2, 3, 4, 5, 6],
    },
  ];

  return scenes.map((scene) => ({ ...scene, kindLabel: KIND_LABELS[scene.kind][lang] }));
}
