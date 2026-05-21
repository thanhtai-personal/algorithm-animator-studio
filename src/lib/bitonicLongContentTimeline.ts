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

export function buildBitonicSortScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
  lang: Lang;
}): LongContentScene[] {
  const { algo, complexity, animationSeconds, introSeconds, lang } = params;
  const vi = lang === "vi";
  const input = [10, 30, 11, 20, 4, 33, 2, 1];
  const scenes: DraftScene[] = [
    {
      id: "bitonic-intro",
      kind: "intro",
      title: vi ? "Bitonic Sort giải quyết bài toán gì?" : "What problem does Bitonic Sort solve?",
      subtitle: vi ? "Nó sinh ra để mô tả sort bằng một mạng compare-swap đều đặn, dễ chia tầng và dễ song song hóa." : "It exists to express sorting as a regular compare-swap network that can be layered and parallelized.",
      bullets: vi
        ? ["Không tối ưu cho sort CPU thông thường.", "Mạnh ở cấu trúc cố định: tầng, hướng, gap.", "Hữu ích khi muốn hiểu sorting network, phần cứng hoặc xử lý song song."]
        : ["Not a default CPU sorting choice.", "Strong because of fixed structure: layers, direction, gap.", "Useful for sorting networks, hardware, and parallel processing."],
      narration: vi
        ? `Vào thẳng ${algo.name}. Câu hỏi đầu tiên không phải là nó swap ra sao, mà là vì sao thuật toán này tồn tại. Bitonic Sort sinh ra từ tư duy sorting network: ta muốn một lịch compare-swap đều đặn, chia được thành nhiều tầng, và có thể chạy nhiều cặp độc lập cùng lúc. Vì vậy nó không phải lựa chọn mặc định để sort mảng lớn trên CPU thông thường, nhưng rất đáng học khi muốn hiểu sort theo mạng, phần cứng hoặc xử lý song song.`
        : `Let us go straight into ${algo.name}. The first question is not how it swaps, but why this algorithm exists. Bitonic Sort comes from sorting-network thinking: we want a regular compare-swap schedule, split into layers, where independent pairs can run at the same time. So it is not the default choice for large CPU arrays, but it is very useful for understanding network sorting, hardware, and parallel processing.`,
      durationSec: Math.max(7, introSeconds),
      dataSet: input,
    },
    {
      id: "bitonic-problem",
      kind: "hook",
      title: vi ? "Bài toán: sort khi lịch thao tác cần cố định" : "The problem: sorting with a fixed schedule",
      subtitle: vi ? "Một số môi trường không chỉ cần kết quả sorted; chúng cần các tầng compare-swap có thể dự đoán trước." : "Some environments need more than a sorted result; they need predictable compare-swap layers.",
      bullets: vi
        ? ["Branch ít hơn, lịch thao tác đều hơn.", "Các cặp trong cùng tầng có thể độc lập.", "Dễ ánh xạ sang GPU, SIMD hoặc mạch phần cứng."]
        : ["Fewer data-dependent branches and a more regular schedule.", "Pairs inside the same layer can be independent.", "Easier to map to GPUs, SIMD, or hardware circuits."],
      narration: vi
        ? "Bài toán Bitonic Sort nhắm tới là: làm sao sắp xếp bằng một lịch thao tác có thể dự đoán trước. Với nhiều thuật toán sort truyền thống, đường đi phụ thuộc rất mạnh vào dữ liệu: pivot khác, nhánh khác, số lần so sánh khác. Sorting network lại nhìn khác: nó chuẩn bị sẵn các tầng compare-swap. Trong cùng một tầng, nhiều cặp không đụng nhau, nên có thể suy nghĩ theo hướng song song hóa. Đây là lý do Bitonic Sort thường xuất hiện trong bài học về GPU, SIMD, mạch so sánh hoặc network sorting."
        : "The problem Bitonic Sort targets is sorting with a predictable operation schedule. Many traditional sorts are highly data-dependent: different pivots, different branches, different comparison paths. A sorting network is different: it prepares layers of compare-swap operations. Within one layer, many pairs do not touch each other, so they can be reasoned about in parallel. That is why Bitonic Sort often appears in lessons about GPUs, SIMD, comparator circuits, or network sorting.",
      durationSec: 12,
      dataSet: input,
    },
    {
      id: "bitonic-mental-model",
      kind: "mental",
      title: vi ? "Điểm khác biệt: dãy bitonic và direction" : "What makes it different: bitonic sequence and direction",
      subtitle: vi ? "Bitonic nghĩa là tăng rồi giảm, hoặc giảm rồi tăng. Merge sẽ kéo toàn bộ về một hướng." : "Bitonic means rising then falling, or falling then rising. The merge pulls everything into one direction.",
      bullets: vi
        ? ["ASC: nếu trái > phải thì swap.", "DESC: nếu trái < phải thì swap.", "Merge: so sánh các cặp cách nhau một gap, rồi giảm gap."]
        : ["ASC: swap when left > right.", "DESC: swap when left < right.", "Merge: compare pairs separated by a gap, then shrink the gap."],
      narration: vi
        ? "Điểm cần nhớ đầu tiên là hướng. Trong nhánh ASC, cặp sai khi giá trị bên trái lớn hơn bên phải, vì ta muốn số nhỏ đứng trước. Trong nhánh DESC thì ngược lại: cặp sai khi bên trái nhỏ hơn bên phải, vì ta muốn số lớn đứng trước. Khi hai nhánh ngược hướng ghép lại, ta có một dãy bitonic. Từ đó, bitonic merge dùng gap lớn để đưa nhóm giá trị về đúng nửa, rồi gap nhỏ hơn để tinh chỉnh."
        : "The first thing to remember is direction. In an ASC branch, a pair is wrong when the left value is greater than the right, because smaller values should come first. In a DESC branch, it is the opposite: a pair is wrong when the left value is smaller than the right, because larger values should come first. When the two opposite branches join, we have a bitonic sequence. From there, bitonic merge uses a large gap to move values into the right half, then smaller gaps to refine the order.",
      durationSec: 12,
      dataSet: input,
    },
    {
      id: "bitonic-step-by-step",
      kind: "steps",
      title: vi ? "Cơ chế chính: split, merge, gap" : "Core mechanism: split, merge, gap",
      subtitle: vi ? "Ví dụ chỉ dùng để minh họa cơ chế; trọng tâm là vì sao hướng và gap tạo thành network." : "The example illustrates the mechanism; the focus is why direction and gap form a network.",
      bullets: vi
        ? ["Chia mảng thành hai nửa: trái ASC, phải DESC.", "Trong merge ASC, gap 4 so sánh cặp xa như 10 với 33, 30 với 4.", "Sau gap 4, thuật toán tiếp tục gap 2 rồi gap 1."]
        : ["Split the array into two halves: left ASC, right DESC.", "In the ASC merge, gap 4 compares distant pairs such as 10 with 33 and 30 with 4.", "After gap 4, the algorithm continues with gap 2 and then gap 1."],
      narration: vi
        ? "Bây giờ đi theo input cụ thể. Trước hết thuật toán chia mảng thành hai nửa. Nửa trái được xây theo hướng tăng dần, nửa phải theo hướng giảm dần. Khi bước merge ASC bắt đầu trên toàn mảng, gap đầu tiên là 4. Vì vậy ta không so sánh cặp kề nhau; ta so sánh index 0 với 4, index 1 với 5, index 2 với 6, và index 3 với 7. Nếu một cặp sai hướng ASC, nghĩa là giá trị trái lớn hơn giá trị phải, thì swap. Sau lớp gap 4, gap giảm xuống 2, rồi 1, để thứ tự được tinh chỉnh dần."
        : "Now follow the concrete input. First the algorithm splits the array into two halves. The left half is built in ascending direction, and the right half in descending direction. When the full ASC merge begins, the first gap is 4. So we do not compare adjacent pairs; we compare index 0 with 4, index 1 with 5, index 2 with 6, and index 3 with 7. If a pair violates ASC order, meaning the left value is greater than the right value, it swaps. After the gap-4 layer, the gap shrinks to 2 and then to 1, refining the order.",
      durationSec: 14,
      animation: true,
      dataSet: input,
    },
    {
      id: "bitonic-animation",
      kind: "animation",
      title: vi ? "Theo dõi network: split, direction, gap" : "Watch the network: split, direction, gap",
      subtitle: vi ? "Nhãn biến cho biết đang merge đoạn nào, theo hướng nào và gap bao nhiêu." : "The variable label tells you which range is merging, in which direction, and with which gap.",
      bullets: vi
        ? ["Split tạo hai hướng đối lập.", "Compare-swap dùng điều kiện ASC hoặc DESC.", "Gap giảm dần: khoảng cách lớn trước, cặp gần sau."]
        : ["Split creates opposite directions.", "Compare-swap uses ASC or DESC conditions.", "Gaps shrink: distant pairs first, close pairs later."],
      narration: vi
        ? "Ở animation chính, hãy đọc biến dir và gap trước. Dir bằng ASC nghĩa là cặp đúng khi bên trái nhỏ hơn hoặc bằng bên phải. Dir bằng DESC nghĩa là cặp đúng khi bên trái lớn hơn hoặc bằng bên phải. Gap cho biết hai cột đang so sánh cách nhau bao xa. Khi gap lớn, chart đang tách các giá trị về đúng vùng lớn. Khi gap nhỏ, nó đang sửa thứ tự chi tiết hơn. Điểm hay của Bitonic Sort là lịch so sánh này rất đều, vì vậy nó thường được dùng để minh họa sorting network."
        : "In the main animation, read dir and gap first. Dir ASC means a pair is correct when the left value is less than or equal to the right value. Dir DESC means a pair is correct when the left value is greater than or equal to the right value. Gap tells you how far apart the compared bars are. With a large gap, the chart moves values into the right broad region. With a small gap, it refines the detailed order. The nice thing about Bitonic Sort is that this schedule is very regular, which makes it useful for explaining sorting networks.",
      durationSec: animationSeconds,
      animation: true,
      dataSet: input,
    },
    {
      id: "bitonic-power-of-two",
      kind: "mental",
      title: vi ? "Vì sao hay nhắc power-of-two?" : "Why power-of-two sizes matter",
      subtitle: vi ? "Bitonic network đẹp nhất khi số phần tử là lũy thừa của 2." : "The bitonic network is cleanest when the number of values is a power of two.",
      bullets: vi
        ? ["8, 16, 32... chia đôi đều qua nhiều tầng.", "Input không đủ power-of-two thường được padding bằng giá trị giả.", "Trong app này, giá trị padding bị ẩn khỏi chart."]
        : ["8, 16, 32... split evenly through many layers.", "Non-power-of-two input is often padded with sentinel values.", "In this app, padded sentinel values are hidden from the chart."],
      narration: vi
        ? "Một chi tiết kỹ thuật là Bitonic Sort rất tự nhiên với kích thước lũy thừa của 2, ví dụ 8 hoặc 16 phần tử. Khi số lượng không đủ, cách triển khai thường padding thêm giá trị giả rất lớn để đủ mạng so sánh, rồi ẩn hoặc bỏ các giá trị giả đó khỏi kết quả thật. Vì vậy nếu bạn thấy Bitonic Sort hoạt động đẹp nhất với 8 cột, đó không phải ngẫu nhiên; đó là cấu trúc chia đôi của network."
        : "A technical detail is that Bitonic Sort is most natural with power-of-two sizes, such as 8 or 16 values. When the input is not a power of two, implementations often pad with large sentinel values to complete the comparison network, then hide or remove those fake values from the real result. So if Bitonic Sort looks cleanest with 8 bars, that is not an accident; it comes from the network's repeated halving structure.",
      durationSec: 11,
      dataSet: [10, 30, 11, 20, 4, 33, 2],
    },
    {
      id: "bitonic-use-cases",
      kind: "use-case",
      title: vi ? "Nên dùng khi nào?" : "When should you use it?",
      subtitle: vi ? "Dùng khi cấu trúc đều và khả năng song song quan trọng hơn độ nhanh tổng quát." : "Use it when regular structure and parallelism matter more than general-purpose speed.",
      bullets: vi
        ? ["Minh họa sorting network trong bài giảng.", "Mô phỏng comparator network hoặc phần cứng.", "GPU/SIMD khi dữ liệu nhỏ, kích thước đều và cần lịch thao tác ổn định."]
        : ["Teaching sorting networks.", "Modeling comparator networks or hardware.", "GPU/SIMD situations with small, regular sizes and a stable schedule."],
      narration: vi
        ? "Nên dùng Bitonic Sort trong các bài toán mà cấu trúc đều là lợi thế. Ví dụ, khi bạn dạy sorting network, bạn cần một thuật toán có các tầng compare-swap rất rõ. Khi mô phỏng phần cứng, comparator network, GPU hoặc SIMD, lịch thao tác ổn định có thể quan trọng hơn việc né từng phép so sánh. Với dữ liệu nhỏ, kích thước đều, đặc biệt là lũy thừa của 2, Bitonic Sort trở thành ví dụ rất sạch để triển khai và giải thích."
        : "Use Bitonic Sort when regular structure is an advantage. For teaching sorting networks, you want an algorithm with clear compare-swap layers. For hardware, comparator-network, GPU, or SIMD modeling, a stable operation schedule can matter more than avoiding every comparison. With small, regular sizes, especially powers of two, Bitonic Sort becomes a clean example to implement and explain.",
      durationSec: 11,
      dataSet: input,
    },
    {
      id: "bitonic-avoid-cases",
      kind: "avoid",
      title: vi ? "Không nên dùng cho bài toán nào?" : "When should you avoid it?",
      subtitle: vi ? "Nếu chỉ cần sort mảng trong app/web/backend thông thường, built-in sort gần như luôn hợp lý hơn." : "If you just need to sort arrays in normal app, web, or backend code, built-in sort is usually the right choice.",
      bullets: vi
        ? ["Không tận dụng tốt input đã gần sorted.", "Không phải stable sort mặc định.", "O(n log² n) thường thua quick/merge/tim sort trong môi trường CPU phổ biến."]
        : ["Does not benefit much from nearly sorted input.", "Not a default stable sort.", "O(n log² n) usually loses to quick, merge, or tim sort on common CPUs."],
      narration: vi
        ? "Không nên dùng Bitonic Sort chỉ vì muốn sort nhanh trong ứng dụng thông thường. Lý do là lịch compare-swap gần như cố định, nên input đã gần sorted cũng không giúp giảm mạnh chi phí. Độ phức tạp O n log bình phương n thường kém hấp dẫn hơn các thuật toán production như Tim Sort, Merge Sort hoặc Quick Sort đã tối ưu trong thư viện chuẩn. Nếu bài toán yêu cầu stable sort mặc định, Bitonic Sort cũng không phải lựa chọn tự nhiên."
        : "Avoid Bitonic Sort if your goal is simply fast sorting in a normal application. Its compare-swap schedule is mostly fixed, so nearly sorted input does not reduce the work much. Its O n log squared n complexity is usually less attractive than production algorithms such as Tim Sort, Merge Sort, or optimized Quick Sort in standard libraries. If the task requires a default stable sort, Bitonic Sort is also not the natural choice.",
      durationSec: 12,
      dataSet: [1, 2, 4, 10, 11, 20, 30, 33],
    },
    {
      id: "bitonic-complexity",
      kind: "complexity",
      title: vi ? "Độ phức tạp & đánh đổi" : "Complexity and trade-offs",
      subtitle: vi ? "Các thông số quan trọng: best, average, worst, space và tính stable." : "The important metrics: best, average, worst, space, and stability.",
      bullets: [
        `Best case: ${complexity?.best ?? "O(n log² n)"}`,
        `Average: ${complexity?.time ?? "O(n log² n)"}`,
        `Worst case: ${complexity?.worst ?? "O(n log² n)"}`,
        `Space: ${complexity?.space ?? "O(log n)"}`,
        vi ? "Stable: không phải đặc tính mặc định của Bitonic Sort." : "Stable: not a default property of Bitonic Sort.",
      ],
      narration: vi
        ? "Về độ phức tạp, Bitonic Sort có best, average và worst đều là O n log bình phương n. Điều này khác Bubble Sort: input đã sorted không làm thuật toán biến thành tuyến tính, vì network vẫn có lịch so sánh cố định. Bộ nhớ trong triển khai đệ quy là O log n. Điểm mạnh không nằm ở tốc độ tổng quát trên CPU thông thường, mà nằm ở cấu trúc rất đều, dễ biểu diễn theo tầng và có ý nghĩa khi nói về phần cứng hoặc xử lý song song."
        : "For complexity, Bitonic Sort has best, average and worst all at O n log squared n. This differs from Bubble Sort: already sorted input does not make it linear, because the network still follows a fixed comparison schedule. Space in this recursive implementation is O log n. Its strength is not general-purpose CPU speed; it is the highly regular structure, which is easy to express in layers and meaningful for hardware or parallel processing.",
      durationSec: 14,
      dataSet: input,
    },
    {
      id: "bitonic-recap",
      kind: "recap",
      title: vi ? "Tóm tắt Bitonic Sort" : "Bitonic Sort recap",
      subtitle: vi ? "Hãy nhớ bốn từ: bitonic, hướng, gap, compare-swap." : "Remember four words: bitonic, direction, gap, compare-swap.",
      bullets: vi
        ? ["Tạo hai nửa ngược hướng.", "Merge bằng gap giảm dần.", "ASC và DESC có điều kiện swap ngược nhau.", "Chi phí cố định: O(n log² n)."]
        : ["Build two opposite-direction halves.", "Merge with shrinking gaps.", "ASC and DESC use opposite swap rules.", "Fixed cost: O(n log² n)."],
      narration: vi
        ? "Tóm lại, Bitonic Sort không phải là câu chuyện cặp kề nhau. Nó là câu chuyện về network. Tạo hai nửa ngược hướng để có dãy bitonic. Sau đó merge bằng các cặp cách nhau theo gap lớn rồi nhỏ dần. Hướng ASC và DESC quyết định điều kiện swap. Nếu nhớ được bốn từ: bitonic, hướng, gap và compare-swap, bạn đã nắm được mô hình chính."
        : "To recap, Bitonic Sort is not a story about adjacent pairs. It is a story about a network. Build two opposite-direction halves to form a bitonic sequence. Then merge using pairs separated by gaps that shrink. ASC and DESC decide the swap condition. If you remember four words: bitonic, direction, gap and compare-swap, you have the core model.",
      durationSec: 9,
      dataSet: [1, 2, 4, 10, 11, 20, 30, 33],
    },
  ];

  return scenes.map((scene) => ({ ...scene, kindLabel: KIND_LABELS[scene.kind][lang] }));
}
