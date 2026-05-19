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

export function buildInsertionSortScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
  lang: Lang;
}) {
  const { algo, complexity, animationSeconds, introSeconds, lang } = params;
  const vi = lang === "vi";
  const scenes: DraftScene[] = [
    {
      id: "insertion-intro",
      kind: "intro",
      title: vi ? "Insertion Sort: xếp bài bằng một vùng đã gọn" : "Insertion Sort: sorting with a tidy prefix",
      subtitle: vi
        ? "Không đẩy phần tử lớn đi từng cặp như Bubble Sort; thuật toán giữ bên trái luôn sorted rồi chèn key vào đúng chỗ."
        : "It does not push large values pair by pair like Bubble Sort; it keeps the left side sorted and inserts each key into place.",
      bullets: vi
        ? ["Vùng trái là sorted prefix.", "Key được rút ra khỏi vùng chưa xử lý.", "Các giá trị lớn hơn key dịch sang phải để mở chỗ trống."]
        : ["The left side is a sorted prefix.", "The key is taken from the unprocessed area.", "Values larger than the key shift right to open a gap."],
      narration: vi
        ? `Vào thẳng ${algo.name}. Hãy tưởng tượng bạn đang xếp bài trên tay: phần bài bên trái đã gọn, bạn rút thêm một lá mới, rồi lùi dần qua các lá lớn hơn để tìm đúng vị trí chèn. Đây là tinh thần khác Bubble Sort: không cố làm nổi phần tử lớn về cuối, mà nuôi một vùng đã sorted ở bên trái.`
        : `Let us go straight into ${algo.name}. Imagine sorting cards in your hand: the left side is already tidy, you take one new card, then move left past larger cards until the insertion point is found. This is different from Bubble Sort: it does not float large values to the end; it grows a sorted prefix on the left.`,
      durationSec: Math.max(6, introSeconds),
      dataSet: [5, 2, 4, 6, 1, 3],
    },
    {
      id: "card-table",
      kind: "hook",
      title: vi ? "Phong cách xếp bài: key nằm ngoài hàng" : "Card-table style: the key sits outside the row",
      subtitle: vi
        ? "Mỗi vòng chỉ có một nhân vật chính: key. Những phần tử lớn hơn key nhường chỗ bằng cách dịch phải."
        : "Each round has one main actor: the key. Larger values make room by shifting right.",
      bullets: vi
        ? ["Không swap liên tục hai cột kề nhau.", "Có một lỗ trống di chuyển sang trái.", "Chèn key là thao tác kết thúc vòng hiện tại."]
        : ["No repeated adjacent pair swapping.", "A gap moves left through the prefix.", "Inserting the key completes the current round."],
      narration: vi
        ? "Để video này không giống Bubble Sort, hãy nhìn nó như một bàn xếp bài. Key tạm thời được nhấc ra khỏi hàng. Khi nhìn sang trái, nếu gặp phần tử lớn hơn key, phần tử đó dịch sang phải, còn lỗ trống dịch sang trái. Khi gặp phần tử nhỏ hơn hoặc chạm đầu mảng, key rơi vào đúng lỗ trống."
        : "To keep this lesson distinct from Bubble Sort, read it like a card table. The key is temporarily lifted out of the row. Looking left, if a value is larger than the key, that value shifts right and the gap moves left. When we meet a smaller value or the start of the array, the key drops into the gap.",
      durationSec: 10,
      dataSet: [5, 2, 4, 6, 1, 3],
    },
    {
      id: "sorted-prefix",
      kind: "mental",
      title: vi ? "Invariant: bên trái luôn đã sorted" : "Invariant: the left side stays sorted",
      subtitle: vi
        ? "Sau khi xử lý vị trí i, đoạn từ 0 đến i đã đúng thứ tự tương đối."
        : "After processing position i, the segment from 0 through i is in sorted order.",
      bullets: vi
        ? ["Prefix sorted ban đầu chỉ có phần tử đầu tiên.", "Mỗi key mới được chèn vào prefix này.", "Thuật toán không cần biết toàn mảng đã đúng ngay lập tức."]
        : ["The sorted prefix starts with the first value.", "Each new key is inserted into that prefix.", "The algorithm does not need the entire array to be sorted immediately."],
      narration: vi
        ? "Invariant quan trọng nhất là: bên trái luôn đã sorted. Ban đầu một phần tử thì tự nó đã sorted. Ở vòng tiếp theo, ta chỉ cần chèn phần tử mới vào đúng vị trí trong vùng bên trái. Nếu làm đúng, vùng sorted tăng thêm một ô. Cứ vậy đến cuối mảng."
        : "The key invariant is: the left side stays sorted. At the beginning, one value is sorted by itself. On the next round, we only need to insert the new value into the correct place in that left region. If that is done correctly, the sorted prefix grows by one slot, all the way to the end.",
      durationSec: 9,
      dataSet: [2, 5, 4, 6, 1, 3],
    },
    {
      id: "micro-example",
      kind: "steps",
      title: vi ? "Ví dụ nhỏ với [5, 2, 4, 6, 1, 3]" : "Small example with [5, 2, 4, 6, 1, 3]",
      subtitle: vi
        ? "Ta sẽ đọc theo từng key, không đọc theo pass trái-sang-phải như Bubble Sort."
        : "We read it key by key, not as left-to-right Bubble Sort passes.",
      bullets: vi
        ? ["Key 2: 5 dịch phải, 2 chèn vào đầu.", "Key 4: 5 dịch phải, 4 đứng sau 2.", "Key 1: 6, 5, 4, 2 cùng dịch phải để mở đầu mảng."]
        : ["Key 2: 5 shifts right, 2 inserts at the front.", "Key 4: 5 shifts right, 4 lands after 2.", "Key 1: 6, 5, 4, and 2 shift right to open the front."],
      narration: vi
        ? "Với mảng 5, 2, 4, 6, 1, 3, vòng đầu lấy key là 2. So với 5, vì 5 lớn hơn 2 nên 5 dịch sang phải, rồi 2 chèn vào đầu. Vòng sau key là 4: 5 lớn hơn 4 nên dịch phải, nhưng 2 nhỏ hơn 4 nên dừng, chèn 4 sau 2. Khi key là 1, nhiều phần tử phải dịch cùng lúc: 6, 5, 4 và 2 đều lớn hơn 1, nên lỗ trống đi về tận đầu mảng."
        : "With the array 5, 2, 4, 6, 1, 3, the first key is 2. Compared with 5, since 5 is larger, 5 shifts right and 2 inserts at the front. The next key is 4: 5 is larger and shifts right, but 2 is smaller, so we stop and insert 4 after 2. When the key is 1, several values must shift: 6, 5, 4, and 2 are all larger, so the gap moves to the front.",
      durationSec: 16,
      animation: true,
      dataSet: [5, 2, 4, 6, 1, 3],
    },
    {
      id: "shift-walkthrough",
      kind: "animation",
      title: vi ? "Theo dõi key, lỗ trống và thao tác dịch" : "Track the key, the gap, and each shift",
      subtitle: vi
        ? "Màu so sánh cho biết key đang nhìn sang trái; màu dịch cho biết một giá trị lớn hơn key vừa nhường chỗ."
        : "The comparison color shows the key looking left; the shift color shows a larger value making room.",
      bullets: vi
        ? ["Key là giá trị đang chờ chèn.", "Compare quyết định có tiếp tục lùi không.", "Shift không phải swap: chỉ copy giá trị lớn sang phải.", "Chèn key khi điều kiện while dừng."]
        : ["The key is the value waiting to be inserted.", "Compare decides whether to keep moving left.", "Shift is not a swap: it copies a larger value rightward.", "Insert the key when the while condition stops."],
      narration: vi
        ? "Bây giờ tập trung vào ba tín hiệu. Một: key là giá trị đang chờ chèn. Hai: phép compare hỏi phần tử bên trái có lớn hơn key không. Ba: nếu câu trả lời là có, ta không swap hai cột như Bubble Sort; ta copy phần tử lớn đó sang phải. Chính thao tác dịch này tạo ra lỗ trống. Khi compare thất bại, nghĩa là bên trái đã nhỏ hơn hoặc bằng key, lỗ trống hiện tại chính là vị trí cần chèn."
        : "Now focus on three signals. First, the key is the value waiting to be inserted. Second, the comparison asks whether the value on the left is larger than the key. Third, if the answer is yes, we do not swap two bars like Bubble Sort; we copy that larger value to the right. That shift creates the gap. When the comparison fails, the left value is smaller than or equal to the key, so the current gap is the insertion position.",
      durationSec: animationSeconds,
      animation: true,
      dataSet: [5, 2, 4, 6, 1, 3],
    },
    {
      id: "nearly-sorted",
      kind: "use-case",
      title: vi ? "Điểm mạnh: dữ liệu gần đúng thứ tự" : "Strength: nearly sorted data",
      subtitle: vi
        ? "Nếu key thường đã gần đúng vị trí, vòng while dừng rất nhanh."
        : "If each key is already near its final position, the while loop stops quickly.",
      bullets: vi
        ? ["Best case O(n) khi mảng đã sorted.", "Rất hợp cho mảng nhỏ, run nhỏ, hoặc cleanup cuối.", "Đây là lý do TimSort và IntroSort dùng insertion cho đoạn nhỏ."]
        : ["Best case O(n) when the array is already sorted.", "Great for small arrays, small runs, or final cleanup.", "This is why TimSort and IntroSort use insertion on tiny segments."],
      narration: vi
        ? "Insertion Sort sáng nhất khi dữ liệu gần đúng thứ tự. Nếu key vừa lấy ra đã lớn hơn phần tử bên trái, vòng while dừng gần như ngay lập tức. Khi đó mỗi phần tử chỉ cần một vài phép kiểm tra, nên best case là O n. Đây cũng là lý do nhiều thuật toán lai dùng Insertion Sort cho các đoạn nhỏ hoặc gần sorted."
        : "Insertion Sort shines when the data is almost in order. If the key is already greater than the value on its left, the while loop stops almost immediately. Then each value needs only a small number of checks, so the best case is O n. That is also why hybrid algorithms use Insertion Sort for tiny or nearly sorted segments.",
      durationSec: 11,
      animation: true,
      dataSet: [1, 2, 3, 5, 4, 6, 7, 8],
    },
    {
      id: "stability",
      kind: "mental",
      title: vi ? "Ổn định: phần tử bằng nhau giữ thứ tự" : "Stable: equal values keep their order",
      subtitle: vi
        ? "Điều kiện thường là arr[j] > key, không phải arr[j] >= key."
        : "The usual condition is arr[j] > key, not arr[j] >= key.",
      bullets: vi
        ? ["Giá trị bằng key không bị đẩy qua phải.", "Thứ tự tương đối của bản ghi bằng nhau được giữ lại.", "Quan trọng khi sort object theo nhiều khóa."]
        : ["Values equal to the key are not pushed right.", "The relative order of equal records is preserved.", "This matters when sorting objects by multiple keys."],
      narration: vi
        ? "Một điểm hay khác là tính ổn định. Trong mã chuẩn, điều kiện dịch là phần tử bên trái lớn hơn key. Nếu hai giá trị bằng nhau, phần tử cũ không bị đẩy qua phải, nên thứ tự tương đối được giữ lại. Với dữ liệu thực tế như danh sách học sinh, hóa đơn, hoặc record có nhiều trường, tính ổn định rất đáng chú ý."
        : "Another useful property is stability. In the standard code, the shift condition is that the left value is greater than the key. If two values are equal, the older value is not pushed right, so relative order is preserved. With real records such as students, invoices, or multi-field objects, stability matters.",
      durationSec: 9,
      dataSet: [3, 1, 3, 2, 3],
    },
    {
      id: "complexity",
      kind: "complexity",
      title: vi ? "Chi phí đến từ số lần dịch" : "The cost comes from shifting",
      subtitle: vi
        ? "Worst case đảo ngược buộc mỗi key lùi qua gần như toàn bộ prefix."
        : "A reversed worst case forces each key to move across almost the entire prefix.",
      bullets: [
        `Best case: ${complexity?.best ?? "O(n)"}`,
        `${vi ? "Average" : "Average"}: ${complexity?.time ?? "O(n²)"}`,
        `Worst case: ${complexity?.worst ?? "O(n²)"}`,
        `Space: ${complexity?.space ?? "O(1)"}`,
        vi ? "In-place và stable, nhưng không dành cho mảng lớn lộn xộn." : "In-place and stable, but not meant for large messy arrays.",
      ],
      narration: vi
        ? "Chi phí của Insertion Sort không nằm ở pass đẩy đuôi như Bubble Sort, mà nằm ở số lần key phải lùi qua prefix. Mảng đã sorted thì gần như không dịch gì, nên O n. Mảng đảo ngược thì key mới thường phải đi về đầu, và rất nhiều phần tử phải dịch phải. Tổng số thao tác tăng theo bình phương, nên worst case vẫn là O n bình phương. Bù lại, thuật toán dùng O một bộ nhớ phụ và có thể stable."
        : "Insertion Sort's cost is not a tail-growing pass like Bubble Sort; it is the number of positions each key must move through the prefix. A sorted array barely shifts anything, so it is O n. A reversed array usually sends each new key to the front, forcing many values to shift right. The total work grows quadratically, so the worst case is still O n squared. In return, it uses O one extra space and can be stable.",
      durationSec: 13,
      animation: true,
      dataSet: [8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      id: "avoid",
      kind: "avoid",
      title: vi ? "Khi không nên chọn Insertion Sort" : "When not to choose Insertion Sort",
      subtitle: vi
        ? "Nếu mảng lớn và lộn xộn, thuật toán phải dịch quá nhiều."
        : "If the array is large and messy, the algorithm shifts too much.",
      bullets: vi
        ? ["Không chọn làm sort mặc định cho dataset lớn.", "Dữ liệu đảo ngược là tình huống rất xấu.", "Thực tế nên dùng built-in sort, Merge, Quick, Heap, Tim hoặc IntroSort."]
        : ["Do not use it as the default for large datasets.", "Reversed data is a very bad case.", "In practice, use built-in sort, Merge, Quick, Heap, Tim, or IntroSort."],
      narration: vi
        ? "Vì vậy, đừng dùng Insertion Sort như lựa chọn mặc định cho dữ liệu lớn và ngẫu nhiên. Nó đáng học vì mô hình rất sạch: sorted prefix, key, shift và insert. Nhưng khi hiệu năng là yêu cầu chính, hãy dùng sort built-in hoặc thuật toán có độ phức tạp tốt hơn."
        : "So do not use Insertion Sort as the default for large random data. It is worth learning because the model is clean: sorted prefix, key, shift, and insert. But when performance is the main requirement, use the built-in sort or an algorithm with better scaling.",
      durationSec: 9,
      dataSet: [8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      id: "recap",
      kind: "recap",
      title: vi ? "Tóm tắt: rút key, dịch phải, chèn vào" : "Recap: take key, shift right, insert",
      subtitle: vi
        ? "Hãy nhớ Insertion Sort như cách xây một prefix đã sorted, từng phần tử một."
        : "Remember Insertion Sort as building one sorted prefix, one value at a time.",
      bullets: vi
        ? ["Bên trái luôn sorted.", "Key lùi qua các giá trị lớn hơn.", "Rất tốt cho mảng nhỏ hoặc gần sorted, nhưng worst case O(n²)."]
        : ["The left side stays sorted.", "The key moves left past larger values.", "Great for small or nearly sorted arrays, but worst case is O(n²)."],
      narration: vi
        ? "Tóm lại, Insertion Sort không giống Bubble Sort. Bubble Sort sửa từng cặp kề nhau để đẩy giá trị lớn về cuối. Insertion Sort thì xây một vùng sorted ở bên trái: rút key, dịch các giá trị lớn sang phải, rồi chèn key vào lỗ trống. Với mảng nhỏ hoặc gần sorted, nó rất gọn. Với dữ liệu lớn và lộn xộn, O n bình phương là lý do nên chọn thuật toán khác."
        : "To recap, Insertion Sort is not Bubble Sort. Bubble Sort fixes adjacent pairs to push large values to the end. Insertion Sort builds a sorted region on the left: take the key, shift larger values right, then insert the key into the gap. For small or nearly sorted arrays it is compact. For large messy data, O n squared is the reason to choose something else.",
      durationSec: 8,
      dataSet: [1, 2, 3, 4, 5, 6],
    },
  ];

  return scenes.map((scene) => ({
    ...scene,
    kindLabel: KIND_LABELS[scene.kind][lang],
  }));
}
