import type { Lang } from "./i18n";

type Localized<T> = Record<Lang, T>;

export type LongContentGuide = {
  hook: Localized<string>;
  useCase: Localized<string>;
  mentalModel: Localized<string>;
  steps: Localized<string[]>;
  watch: Localized<string[]>;
  takeaway: Localized<string>;
};

export type PickedLongContentGuide = {
  hook: string;
  useCase: string;
  mentalModel: string;
  steps: string[];
  watch: string[];
  takeaway: string;
};

const t = <T,>(vi: T, en: T): Localized<T> => ({ vi, en });

const sharedSortWatch = t(
  ["Màu vàng là phần đang so sánh, màu hồng là thao tác đổi/chia mốc.", "Màu xanh là phần đã ổn định hoặc chắc chắn đúng vị trí."],
  ["Yellow marks the values being compared; pink shows swaps or split points.", "Green marks the part that is already stable or locked in place."],
);

export const LONG_CONTENT_GUIDES: Record<string, LongContentGuide> = {
  bubble: {
    hook: t("Bubble Sort giống bong bóng: phần tử lớn nổi dần về cuối mảng.", "Bubble Sort works like bubbles: larger values slowly float to the end."),
    useCase: t("Dùng để dạy tư duy so sánh hai phần tử kề nhau, không phải để tối ưu hiệu năng.", "Use it to teach adjacent comparisons, not to optimize performance."),
    mentalModel: t("Mỗi lượt quét chỉ hỏi một câu: cặp bên trái có lớn hơn cặp bên phải không? Nếu có thì đổi chỗ.", "Each pass asks one question: is the left value greater than the right value? If yes, swap them."),
    steps: t(["Duyệt từng cặp liền kề từ trái sang phải.", "Swap khi thứ tự đang sai.", "Sau mỗi vòng, phần tử lớn nhất còn lại nằm ở cuối vùng chưa sắp xếp."], ["Scan adjacent pairs from left to right.", "Swap when the pair is in the wrong order.", "After each pass, the largest remaining value lands at the end of the unsorted area."]),
    watch: sharedSortWatch,
    takeaway: t("Dễ hiểu nhất cho người mới, nhưng O(n²) nên chậm khi dữ liệu lớn.", "Very beginner-friendly, but O(n²) makes it slow for large data."),
  },
  selection: {
    hook: t("Selection Sort chọn đúng người nhỏ nhất cho từng vị trí.", "Selection Sort chooses the smallest candidate for each position."),
    useCase: t("Phù hợp để giải thích khái niệm tìm min và cố định dần vùng đã sắp xếp.", "Great for explaining how to find a minimum and grow a sorted prefix."),
    mentalModel: t("Thay vì đổi liên tục, thuật toán đi tìm ứng viên nhỏ nhất rồi đưa về đầu vùng chưa sắp xếp.", "Instead of swapping constantly, it searches for the smallest candidate and moves it to the front of the unsorted area."),
    steps: t(["Đặt vị trí hiện tại là ô cần lấp.", "Quét phần còn lại để tìm giá trị nhỏ nhất.", "Đổi min về vị trí hiện tại rồi chuyển sang ô kế tiếp."], ["Treat the current index as the slot to fill.", "Scan the remaining values to find the minimum.", "Swap that minimum into the current slot, then move on."]),
    watch: sharedSortWatch,
    takeaway: t("Ít swap hơn Bubble Sort, nhưng vẫn phải quét O(n²).", "It uses fewer swaps than Bubble Sort, but still scans in O(n²)."),
  },
  cycle: {
    hook: t("Cycle Sort cố gắng ghi mỗi giá trị vào đúng vị trí cuối cùng với số lần write rất ít.", "Cycle Sort tries to write each value directly into its final slot with very few writes."),
    useCase: t("Hợp để dạy bài toán khi thao tác ghi tốn kém, ví dụ bộ nhớ flash hoặc EEPROM.", "Useful for teaching cases where writes are expensive, such as flash memory or EEPROM."),
    mentalModel: t("Với một item, đếm có bao nhiêu giá trị nhỏ hơn nó để biết vị trí đúng, ghi vào đó, rồi tiếp tục mang giá trị bị đẩy ra đi tìm chỗ mới.", "For an item, count how many values are smaller to find its final position, write it there, then carry the displaced value to its own slot."),
    steps: t(["Chọn cycleStart và giữ item đang mang.", "Đếm các phần tử nhỏ hơn item để tìm pos đích.", "Ghi item vào pos, mang phần tử bị đẩy ra và lặp lại cho đến khi quay về cycleStart."], ["Pick cycleStart and carry its item.", "Count values smaller than the item to find the target position.", "Write the item into that position, carry the displaced value, and repeat until the cycle returns to cycleStart."]),
    watch: t(["Badge item là giá trị đang được mang ngoài mảng.", "Mũi tên cho thấy item sẽ được ghi vào pos nào.", "Các duplicate được bỏ qua để tránh ghi đè sai slot."], ["The item badge is the value being carried outside the array.", "The arrow shows which position the item will be written into.", "Duplicates are skipped to avoid overwriting the wrong slot."]),
    takeaway: t("Thời gian vẫn O(n²), nhưng số lần ghi gần tối thiểu; đây là điểm khác biệt lớn so với các sort cơ bản khác.", "Time is still O(n²), but writes are near-minimal; that is the key difference from other basic sorts."),
  },
  bitonic: {
    hook: t("Bitonic Sort sắp xếp bằng mạng compare-swap có cấu trúc rất đều.", "Bitonic Sort orders values through a highly structured compare-swap network."),
    useCase: t("Rất hợp để dạy sorting network, xử lý song song và GPU-style sorting.", "Great for teaching sorting networks, parallel processing, and GPU-style sorting."),
    mentalModel: t("Tạo hai nửa ngược chiều để thành dãy bitonic, rồi liên tục compare-swap các cặp cách nhau một gap để merge về một chiều.", "Build two opposite-direction halves into a bitonic sequence, then repeatedly compare-swap gap pairs to merge in one direction."),
    steps: t(["Chia mảng thành hai nửa.", "Sắp nửa trái tăng dần và nửa phải giảm dần.", "Merge bitonic bằng các cặp compare-swap có gap giảm dần."], ["Split the array into two halves.", "Sort the left half ascending and the right half descending.", "Merge the bitonic sequence with decreasing-gap compare-swap pairs."]),
    watch: t(["Các cặp được so sánh thường cách nhau theo gap lớn rồi nhỏ dần.", "Hướng asc/desc cho biết nửa nào đang được tạo thành dãy bitonic."], ["Compared pairs are often separated by a large gap that shrinks.", "The asc/desc direction shows which half is forming the bitonic sequence."]),
    takeaway: t("Không phải sort mặc định cho CPU thường, nhưng rất trực quan để hiểu sorting network và song song hóa.", "It is not the default CPU sort, but it is excellent for understanding sorting networks and parallelism."),
  },
  flash: {
    hook: t("Flash Sort không so sánh từng cặp ngay từ đầu; nó ước lượng vị trí bằng công thức min/max rồi 'flash' giá trị vào vùng gần đúng.", "Flash Sort does not start with pair-by-pair comparisons; it estimates positions from the min/max range and flashes values into approximate zones."),
    useCase: t("Hợp để minh họa distribution sorting trên dữ liệu số phân bố khá đều, rồi so sánh với Counting/Bucket/Radix để thấy khác biệt.", "Useful for showing distribution sorting on fairly uniform numeric data, and for contrasting it with Counting, Bucket, and Radix Sort."),
    mentalModel: t("Thay vì hỏi 'hai cột này có sai thứ tự không?', Flash Sort hỏi 'giá trị này nên rơi vào lớp nào theo thước min-max?'. Sau đó insertion sort chỉ dọn phần lộn xộn nhỏ còn lại.", "Instead of asking 'are these two bars out of order?', Flash Sort asks 'which class should this value fall into on the min-max scale?'. Then insertion sort cleans up the remaining local disorder."),
    steps: t(["Tìm min và max để dựng thước giá trị.", "Tính class cho từng phần tử bằng công thức tuyến tính.", "Đếm số phần tử trong mỗi class và prefix sum để có biên vùng.", "Flash các giá trị vào vùng class gần đúng bằng swap.", "Chạy insertion sort để hoàn tất thứ tự bên trong từng vùng."], ["Find min and max to build a value scale.", "Compute a class for each value with a linear formula.", "Count values per class and prefix sum the counts into boundaries.", "Flash values into their approximate class zones using swaps.", "Run insertion sort to finish ordering inside the zones."]),
    watch: t(["Panel class C0, C1, C2... là điểm khác biệt: giá trị được phân phối theo khoảng min-max, không phải theo chữ số như Radix.", "Flash phase dùng swap để kéo giá trị về vùng gần đúng; đây không phải sorted hoàn chỉnh.", "Insertion cleanup ở cuối cho thấy Flash Sort vẫn cần một thuật toán phụ để sửa lỗi cục bộ.", "Khác Counting/Pigeonhole: không tạo một ô cho từng giá trị; nó chỉ chia thành vài class ước lượng.", "Nếu dữ liệu phân bố xấu, các class lệch nhiều và cleanup có thể chậm."], ["The C0, C1, C2... class panel is the key difference: values are distributed by min-max ranges, not by digits like Radix.", "The flash phase uses swaps to pull values into approximate zones; it is not fully sorted yet.", "The insertion cleanup at the end shows that Flash Sort still needs a helper algorithm to fix local disorder.", "Unlike Counting/Pigeonhole, it does not create one slot per value; it uses a few estimated classes.", "If the distribution is poor, classes become unbalanced and cleanup can slow down."]),
    takeaway: t("Tinh túy của Flash Sort là 'ước lượng vị trí trước, sửa chi tiết sau'. Nó rất khác Bubble/Quick/Heap vì bước mạnh nhất không phải so sánh, mà là phân lớp theo công thức.", "The essence of Flash Sort is 'estimate positions first, fix details later.' It is very different from Bubble/Quick/Heap because its strongest move is not comparison, but formula-based classification."),
  },
  bogo: {
    hook: t("Bogo Sort là thuật toán cố tình ngớ ngẩn: không chia vùng, không tìm min, không pivot — chỉ xáo trộn rồi kiểm tra.", "Bogo Sort is intentionally ridiculous: no partition, no minimum scan, no pivot — just shuffle and check."),
    useCase: t("Rất hợp cho short vì nó đối lập hoàn toàn với các thuật toán sắp xếp nghiêm túc: càng xem càng thấy vì sao thuật toán cần chiến lược.", "Great for shorts because it is the opposite of serious sorting algorithms: the more you watch, the clearer it is why algorithms need strategy."),
    mentalModel: t("Hãy tưởng tượng trộn bộ bài rồi hy vọng nó tự đúng thứ tự. Nếu sai một cặp liền kề, Bogo không sửa cặp đó; nó vứt toàn bộ trật tự hiện tại và xáo lại từ đầu.", "Imagine shuffling a deck and hoping it lands perfectly sorted. If one adjacent pair is wrong, Bogo does not repair that pair; it throws away the current order and shuffles again."),
    steps: t(["Xáo mảng bằng các swap ngẫu nhiên.", "Quét từ trái sang phải để kiểm tra từng cặp liền kề.", "Nếu thấy một cặp sai thứ tự, đánh dấu attempt thất bại.", "Không giữ lại tiến trình nào; quay về shuffle.", "Chỉ kết thúc khi một lần shuffle tình cờ tạo ra mảng đã sort."], ["Shuffle the array using random swaps.", "Scan left to right and check each adjacent pair.", "If one pair is out of order, mark the attempt as failed.", "Keep no progress; go back to shuffle.", "Stop only when one lucky shuffle happens to be sorted."]),
    watch: t(["Các swap trong pha shuffle là sự hỗn loạn, không phải tối ưu dần.", "Pha check chỉ xác nhận may mắn, không sửa lỗi.", "Không có pivot như Quick Sort, không có gap như Shell/Comb, không có bucket như Counting/Radix.", "Short nên dùng mảng rất nhỏ vì số lần thử trung bình tăng theo n!.", "Demo có lucky attempt để video kết thúc, nhưng thông điệp chính là: không có chiến lược thì không có tiến trình chắc chắn."], ["The shuffle swaps are chaos, not gradual optimization.", "The check phase only verifies luck; it does not fix mistakes.", "There is no pivot like Quick Sort, no gap like Shell/Comb, and no buckets like Counting/Radix.", "Use a tiny array for shorts because the average attempts grow with n!.", "The demo includes a lucky attempt so the video can end, but the main message is: no strategy means no guaranteed progress."]),
    takeaway: t("Tinh túy của Bogo Sort nằm ở sự phi lý: average O(n · n!), worst-case không giới hạn, và gần như chỉ có giá trị để dạy ‘đừng làm vậy’. Exact opposite of a practical algorithm.", "The essence of Bogo Sort is absurdity: average O(n · n!), unbounded worst case, and almost only useful for teaching 'do not do this.' It is the exact opposite of a practical algorithm."),
  },
  insertion: {
    hook: t("Insertion Sort giống xếp bài trên tay: rút một lá rồi chèn vào đúng chỗ.", "Insertion Sort is like sorting cards in your hand: take one card and insert it into place."),
    useCase: t("Rất tốt cho mảng nhỏ hoặc dữ liệu gần như đã sắp xếp.", "Excellent for small arrays or data that is already almost sorted."),
    mentalModel: t("Bên trái luôn là danh sách đã gọn; phần tử mới sẽ trượt lùi cho đến khi gặp vị trí đúng.", "The left side stays sorted; the new value slides backward until it reaches the correct position."),
    steps: t(["Lấy phần tử kế tiếp làm key.", "Dịch các phần tử lớn hơn key sang phải.", "Chèn key vào khoảng trống vừa tạo."], ["Take the next element as the key.", "Shift values larger than the key to the right.", "Insert the key into the gap you created."]),
    watch: sharedSortWatch,
    takeaway: t("Best case O(n) khi dữ liệu gần đúng thứ tự, worst case O(n²).", "Best case is O(n) on nearly sorted data, but the worst case is O(n²)."),
  },
  quick: {
    hook: t("Quick Sort chia mảng quanh một pivot rồi xử lý từng nửa.", "Quick Sort splits the array around a pivot, then solves each side."),
    useCase: t("Một trong những tư duy chia để trị quan trọng nhất trong sắp xếp.", "One of the most important divide-and-conquer ideas in sorting."),
    mentalModel: t("Pivot là vạch ranh giới: nhỏ hơn qua một bên, lớn hơn qua một bên, sau đó lặp lại.", "The pivot is a boundary: smaller values go to one side, larger values go to the other, then the process repeats."),
    steps: t(["Chọn pivot.", "Partition để đưa phần tử nhỏ/lớn về đúng phía.", "Đệ quy hai vùng trái và phải cho đến khi vùng còn rất nhỏ."], ["Choose a pivot.", "Partition values to the correct side of the pivot.", "Recursively process the left and right regions until they become tiny."]),
    watch: t(["Màu tím là pivot hoặc mốc chia.", ...sharedSortWatch.vi], ["Purple marks the pivot or split point.", ...sharedSortWatch.en]),
    takeaway: t("Trung bình O(n log n), nhưng chọn pivot tệ có thể rơi về O(n²).", "Average time is O(n log n), but a bad pivot strategy can fall back to O(n²)."),
  },
  merge: {
    hook: t("Merge Sort tách nhỏ mảng rồi trộn lại theo đúng thứ tự.", "Merge Sort splits the array into tiny pieces, then merges them back in order."),
    useCase: t("Dễ giải thích chia để trị và ổn định thứ tự dữ liệu bằng thao tác merge.", "Great for explaining divide and conquer plus stable merging."),
    mentalModel: t("Hai danh sách đã sắp xếp có thể trộn rất nhanh bằng cách luôn lấy phần tử nhỏ hơn ở đầu.", "Two sorted lists can be merged quickly by repeatedly taking the smaller front value."),
    steps: t(["Chia mảng làm hai nửa cho đến khi mỗi vùng chỉ còn một phần tử.", "Merge hai vùng đã sắp xếp thành vùng lớn hơn.", "Lặp lại cho đến khi toàn bộ mảng được ghép xong."], ["Split the array in half until each region has one element.", "Merge two sorted regions into a larger sorted region.", "Repeat until the entire array is merged." ]),
    watch: sharedSortWatch,
    takeaway: t("Luôn O(n log n), đổi lại cần thêm bộ nhớ O(n).", "Always O(n log n), but it needs O(n) extra memory."),
  },
  heap: {
    hook: t("Heap Sort biến mảng thành cây ưu tiên rồi rút phần tử lớn nhất.", "Heap Sort turns the array into a priority tree, then repeatedly removes the largest value."),
    useCase: t("Hợp để dạy heap, priority queue và sắp xếp không cần bộ nhớ phụ lớn.", "Useful for teaching heaps, priority queues, and in-place sorting."),
    mentalModel: t("Max-heap đảm bảo phần tử lớn nhất nằm ở gốc; đưa gốc về cuối rồi khôi phục heap.", "A max-heap keeps the largest value at the root; move it to the end, then restore the heap."),
    steps: t(["Build max-heap từ mảng ban đầu.", "Swap gốc với phần tử cuối của vùng heap.", "Giảm vùng heap và heapify lại từ gốc."], ["Build a max-heap from the array.", "Swap the root with the last value in the heap region.", "Shrink the heap region and heapify from the root again."]),
    watch: sharedSortWatch,
    takeaway: t("O(n log n), in-place, nhưng không ổn định thứ tự các phần tử bằng nhau.", "O(n log n) and in-place, but not stable for equal values."),
  },
  counting: {
    hook: t("Counting Sort không so sánh; nó đếm số lần xuất hiện của từng giá trị.", "Counting Sort does not compare values; it counts how many times each value appears."),
    useCase: t("Rất mạnh khi dữ liệu là số nguyên trong khoảng giá trị nhỏ.", "Very strong when values are integers inside a small range."),
    mentalModel: t("Thay vì hỏi ai lớn hơn ai, thuật toán hỏi: mỗi giá trị xuất hiện bao nhiêu lần?", "Instead of asking which value is larger, it asks: how many times does each value appear?"),
    steps: t(["Tạo bảng đếm theo từng giá trị.", "Quét mảng để tăng số lượng tương ứng.", "Ghi lại output bằng cách trải các giá trị theo số lần đã đếm."], ["Create a count table for each value.", "Scan the array and increment the matching count.", "Write the output by expanding each value according to its count."]),
    watch: t(["Bảng đếm cho thấy tần suất từng giá trị.", "Vùng output được ghi lại từ nhỏ đến lớn."], ["The count table shows how often each value appears.", "The output region is rebuilt from small to large values."]),
    takeaway: t("Có thể gần O(n + k), nhưng chỉ hợp khi miền giá trị k không quá lớn.", "It can be close to O(n + k), but only when the value range k is not too large."),
  },
  pigeonhole: {
    hook: t("Pigeonhole Sort tạo một lỗ cho từng giá trị trong khoảng min..max, rồi tính đúng ô chứa bằng công thức value - min.", "Pigeonhole Sort creates one hole for every value in min..max, then locates the exact hole with value - min."),
    useCase: t("Hợp khi dữ liệu là số nguyên và khoảng giá trị nhỏ so với số phần tử.", "Useful when data is integer-based and the value range is small compared with the number of items."),
    mentalModel: t("Trước hết thuật toán lấy min và max. Nếu min = 10, max = 18 thì nó tạo 9 hole: hole 0 chứa giá trị 10, hole 1 chứa 11, ... hole 8 chứa 18. Vì vậy giá trị 14 không vào ô số 14; nó vào hole index 4 vì 14 - 10 = 4.", "First the algorithm finds min and max. If min = 10 and max = 18, it creates 9 holes: hole 0 stores value 10, hole 1 stores 11, and so on up to hole 8 storing 18. So value 14 does not go to slot 14; it goes to hole index 4 because 14 - 10 = 4."),
    steps: t(["Quét mảng gốc để tìm min.", "Quét tiếp để tìm max.", "Cho min tạo hole đầu tiên, max tạo hole cuối cùng.", "Chèn dần các hole ở giữa để tạo đủ dãy min..max.", "Với từng value, tính hole = value - min để xác định ô chứa.", "Tăng số lượng trong hole đó, rồi đọc hole từ nhỏ đến lớn để ghi output."], ["Scan the original array to find min.", "Scan again to find max.", "Place min as the first hole and max as the last hole.", "Insert the middle holes until the full min..max range exists.", "For each value, compute hole = value - min to locate the container.", "Increment that hole count, then read holes low to high to write the output."]),
    watch: t(["Min bay xuống đầu mảng hole, max bay xuống cuối mảng hole.", "Các hole ở giữa được chèn dần; hole chưa sinh chưa có cột.", "Dòng trạng thái sau đó hiển thị công thức value - min = hole.", "Hole count 0 vẫn hiện nhưng bị mờ, cho thấy giá trị đó không xuất hiện trong input.", "Nếu range quá rộng, số hole tăng nhanh và thuật toán mất lợi thế."], ["Min moves to the first hole, and max moves to the last hole.", "Middle holes are inserted gradually; uncreated holes have no column yet.", "The next status line shows value - min = hole.", "A hole with count 0 stays dim, showing that value never appears in the input.", "If the range is too wide, hole count grows quickly and the algorithm loses its advantage."]),
    takeaway: t("Nhanh O(n + k) khi k nhỏ, nhưng tốn bộ nhớ O(n + k) và không phù hợp với miền giá trị lớn.", "Fast at O(n + k) when k is small, but it needs O(n + k) memory and does not fit large value ranges."),
  },
  strand: {
    hook: t("Strand Sort kéo từng dãy con tăng ra khỏi input, rồi merge dãy đó vào output đã sắp xếp.", "Strand Sort pulls increasing subsequences out of the input, then merges each strand into the sorted output."),
    useCase: t("Hợp để dạy ý tưởng tận dụng các đoạn tăng tự nhiên và thao tác merge ổn định.", "Useful for teaching how to reuse naturally increasing runs and merge them stably."),
    mentalModel: t("Mỗi lượt tạo một strand: lấy phần tử đầu, rồi quét input; giá trị nào lớn hơn hoặc bằng cuối strand thì được kéo vào strand. Khi strand hoàn tất, merge nó vào output.", "Each pass builds a strand: take the first item, scan the input, and pull any value greater than or equal to the strand tail. When the strand is complete, merge it into the output."),
    steps: t(["Tách phần tử đầu của input để bắt đầu strand.", "Quét input còn lại và kéo các giá trị tiếp tục tăng vào strand.", "Bỏ qua giá trị phá vỡ thứ tự tăng để lượt sau xử lý.", "Merge strand đã tăng vào output đã sort.", "Lặp lại cho đến khi input rỗng."], ["Remove the first input value to start a strand.", "Scan the remaining input and pull values that continue the increasing order.", "Skip values that would break the strand for a later pass.", "Merge the increasing strand into the sorted output.", "Repeat until input is empty."]),
    watch: t(["Bucket input là dữ liệu chưa xử lý.", "Bucket strand là dãy con tăng đang được kéo ra.", "Bucket output là kết quả đã sort sau mỗi lần merge."], ["The input bucket is the unprocessed data.", "The strand bucket is the increasing subsequence being extracted.", "The output bucket is the sorted result after each merge."]),
    takeaway: t("Best case có thể gần O(n) khi input đã tăng, nhưng worst-case vẫn O(n²) và cần thêm bộ nhớ O(n).", "The best case can approach O(n) on already increasing input, but the worst case remains O(n²) and needs O(n) extra memory."),
  },
  tournament: {
    hook: t("Tournament Sort tổ chức các phần tử thành cây đấu loại; winner nhỏ nhất được đưa ra output sau mỗi giải.", "Tournament Sort organizes values into a knockout tree; the smallest winner is extracted after each tournament."),
    useCase: t("Hợp để dạy selection bằng cấu trúc cây và ý tưởng winner đi tiếp qua nhiều vòng so sánh.", "Useful for teaching selection through a tree structure and the idea of winners advancing through comparison rounds."),
    mentalModel: t("Mỗi cặp đấu chọn giá trị nhỏ hơn đi tiếp. Khi chỉ còn một winner ở đỉnh cây, đó là min hiện tại; lấy nó ra rồi dựng giải mới cho các phần tử còn lại.", "Each match sends the smaller value forward. When one winner remains at the tree root, it is the current minimum; extract it and rebuild the tournament for the remaining values."),
    steps: t(["Đặt các phần tử còn active ở hàng lá.", "So sánh từng cặp và đẩy winner nhỏ hơn lên vòng kế tiếp.", "Lặp các vòng cho đến khi còn một winner.", "Ghi winner vào output đã sắp xếp.", "Loại winner khỏi active set rồi dựng tournament tiếp theo."], ["Place active values at the leaves.", "Compare pairs and promote the smaller winner to the next round.", "Repeat rounds until one winner remains.", "Write that winner to the sorted output.", "Remove the winner from the active set and build the next tournament."]),
    watch: t(["Các node dưới cùng là phần tử còn active.", "Màu vàng là match đang so sánh.", "Node xanh ở đỉnh là winner nhỏ nhất của tournament hiện tại.", "Output rail cho thấy các winner đã được lấy ra theo thứ tự tăng."], ["Bottom nodes are the still-active values.", "Yellow marks the current match.", "The green root node is the minimum winner of the current tournament.", "The output rail shows winners extracted in ascending order."]),
    takeaway: t("Bản dựng lại tournament mỗi lượt là O(n²), nhưng hình ảnh cây giúp thấy rõ cách selection có thể được tổ chức thành các vòng đấu.", "The rebuild-each-time version is O(n²), but the tree visual clearly shows how selection can be organized as tournament rounds."),
  },
  smooth: {
    hook: t("Smooth Sort là biến thể Heap Sort dùng forest các Leonardo heap để tận dụng dữ liệu gần có thứ tự.", "Smooth Sort is a Heap Sort variant that uses a forest of Leonardo heaps to benefit from nearly sorted data."),
    useCase: t("Hợp để dạy adaptive sorting: vẫn giữ worst-case O(n log n), nhưng best-case gần O(n) khi dữ liệu đã khá mượt.", "Useful for teaching adaptive sorting: it keeps O(n log n) worst case while approaching O(n) on already smooth data."),
    mentalModel: t("Thay vì một heap nhị phân duy nhất, thuật toán xây nhiều heap kích thước Leonardo. Khi hai heap cuối có kích thước liên tiếp, chúng ghép với root mới thành heap lớn hơn; sift giữ max trong mỗi heap, trinkle giữ root phải đủ lớn để extract.", "Instead of one binary heap, the algorithm builds several Leonardo-sized heaps. When the last two heap sizes are consecutive, they merge with the new root into a larger heap; sift keeps each heap root maximal, and trinkle keeps the right root ready for extraction."),
    steps: t(["Thêm từng phần tử vào forest.", "Ghép hai heap Leonardo liên tiếp với root mới khi có thể.", "Sift trong heap để root lớn hơn hai root con.", "Trinkle giữa các root để root phải trở thành max kế tiếp.", "Extract root phải, rồi tách heap Leonardo thành hai heap con."], ["Add each value to the forest.", "Merge consecutive Leonardo heaps with the new root when possible.", "Sift inside a heap so its root dominates child roots.", "Trinkle across roots so the right root becomes the next maximum.", "Extract the right root, then split its Leonardo heap into two child heaps."]),
    watch: t(["Dải L0, L1, L2... là kích thước Leonardo của từng heap.", "Node root cho biết giá trị lớn nhất đại diện mỗi heap.", "Sift sửa lỗi bên trong một heap.", "Trinkle sửa thứ tự giữa các root của forest.", "Vùng xanh bên phải là suffix đã sort sau mỗi lần extract."], ["The L0, L1, L2... bands are Leonardo heap sizes.", "Root nodes show the maximum representative of each heap.", "Sift repairs one heap internally.", "Trinkle repairs ordering across forest roots.", "The green right suffix is sorted after each extraction."]),
    takeaway: t("Khó cài hơn Heap Sort nhiều, nhưng rất đáng học vì cho thấy cách cấu trúc dữ liệu giúp thuật toán thích nghi với input gần sorted.", "It is much harder to implement than Heap Sort, but worth learning because it shows how a data structure makes sorting adapt to nearly sorted input."),
  },
  stooge: {
    hook: t("Stooge Sort là ví dụ cực đoan của đệ quy: sửa hai đầu đoạn rồi sort 2/3 trái, 2/3 phải, và 2/3 trái thêm lần nữa.", "Stooge Sort is an extreme recursion example: fix the two ends, then sort the left two-thirds, the right two-thirds, and the left two-thirds again."),
    useCase: t("Hợp để dạy recurrence, overlap recursion và vì sao một thuật toán có thể đúng nhưng rất không hiệu quả.", "Useful for teaching recurrence, overlapping recursion, and why an algorithm can be correct but very inefficient."),
    mentalModel: t("Nếu đầu đoạn lớn hơn cuối đoạn thì đổi chỗ. Sau đó thuật toán không chia đôi gọn gàng; nó xử lý các đoạn 2/3 bị chồng lặp, nên cùng một vùng bị làm đi làm lại rất nhiều lần.", "If the first value is larger than the last, swap them. Then the algorithm does not split cleanly in half; it processes overlapping two-thirds ranges, so the same region is revisited many times."),
    steps: t(["Chọn đoạn hiện tại [lo..hi].", "So sánh hai đầu đoạn và swap nếu sai thứ tự.", "Nếu đoạn dài hơn 2, tính third = floor(length / 3).", "Đệ quy sort [lo..hi-third].", "Đệ quy sort [lo+third..hi].", "Đệ quy sort [lo..hi-third] thêm lần nữa."], ["Choose the current range [lo..hi].", "Compare the two ends and swap if they are out of order.", "If the range length is greater than 2, compute third = floor(length / 3).", "Recursively sort [lo..hi-third].", "Recursively sort [lo+third..hi].", "Recursively sort [lo..hi-third] one more time."]),
    watch: t(["Dải current là đoạn đang được xử lý.", "Hai đầu đoạn là cặp compare/swap quan trọng nhất.", "Hai dải left 2/3 và right 2/3 bị chồng lên nhau, giải thích vì sao số bước phình rất nhanh.", "Depth cho thấy độ sâu đệ quy hiện tại."], ["The current band is the active range.", "The two ends are the key compare/swap pair.", "The left two-thirds and right two-thirds bands overlap, explaining why the step count grows quickly.", "Depth shows the current recursion level."]),
    takeaway: t("Đây không phải sort thực dụng; giá trị của nó nằm ở việc minh họa recursion chồng lặp và chi phí O(n^2.7095).", "This is not a practical sort; its value is illustrating overlapping recursion and the O(n^2.7095) cost."),
  },
  radix: {
    hook: t("Radix Sort sắp xếp số theo từng chữ số, từ hàng đơn vị lên cao hơn.", "Radix Sort sorts numbers digit by digit, from the ones place upward."),
    useCase: t("Hợp với dữ liệu số nguyên có độ dài chữ số giới hạn.", "Useful for integers with a limited number of digits."),
    mentalModel: t("Mỗi vòng gom số theo một chữ số; nhiều vòng ổn định sẽ tạo ra thứ tự tổng thể.", "Each pass groups values by one digit; stable passes combine into the final order."),
    steps: t(["Xét chữ số ở hàng hiện tại.", "Đưa phần tử vào bucket 0–9 tương ứng.", "Ghép bucket lại rồi chuyển sang chữ số kế tiếp."], ["Look at the current digit.", "Put each value into bucket 0 through 9.", "Join the buckets and move to the next digit."]),
    watch: t(["Những số cùng chữ số hiện tại sẽ đi cùng bucket.", "Sau mỗi pass, trật tự đúng hơn ở nhiều chữ số hơn."], ["Values with the same current digit move into the same bucket.", "After each pass, more digit positions become correctly ordered."]),
    takeaway: t("Không dựa trên so sánh, nhanh khi số chữ số nhỏ và cần sort nhiều số nguyên.", "It is non-comparison based and fast when digit count is small."),
  },
  bucket: {
    hook: t("Bucket Sort chia dữ liệu vào nhiều xô, rồi sắp xếp từng xô nhỏ.", "Bucket Sort distributes values into buckets, then sorts each small bucket."),
    useCase: t("Tốt khi dữ liệu phân bố tương đối đều trên một khoảng giá trị.", "Good when data is fairly evenly distributed across a range."),
    mentalModel: t("Đưa phần tử gần nhau vào cùng bucket để biến một bài toán lớn thành nhiều bài toán nhỏ.", "Put nearby values into the same bucket to turn one big problem into many small ones."),
    steps: t(["Chọn số bucket và khoảng giá trị mỗi bucket.", "Phân phối từng phần tử vào bucket phù hợp.", "Sắp xếp từng bucket rồi nối lại."], ["Choose buckets and their value ranges.", "Distribute each value into the right bucket.", "Sort each bucket and concatenate the result."]),
    watch: t(["Các bucket thể hiện vùng giá trị.", "Bucket lệch quá nhiều sẽ làm thuật toán mất lợi thế."], ["Buckets represent value ranges.", "If buckets become unbalanced, the algorithm loses its advantage."]),
    takeaway: t("Có thể rất nhanh với phân bố đẹp, nhưng phụ thuộc mạnh vào cách chia bucket.", "Can be very fast with a good distribution, but depends heavily on bucket design."),
  },
  shell: {
    hook: t("Shell Sort là Insertion Sort nhưng nhảy bước xa trước, gần sau.", "Shell Sort is Insertion Sort that jumps far first, then gets closer."),
    useCase: t("Giúp người học thấy cách giảm đảo ngược lớn trước khi tinh chỉnh cục bộ.", "Shows how removing large inversions first makes the final cleanup easier."),
    mentalModel: t("Ban đầu so sánh các phần tử cách xa nhau để đưa dữ liệu về gần vị trí đúng nhanh hơn.", "At first, compare far-apart values so elements move near their correct positions faster."),
    steps: t(["Chọn gap lớn.", "Insertion sort trên các nhóm cách nhau gap.", "Giảm gap dần về 1 để hoàn tất."], ["Choose a large gap.", "Run insertion-style passes on values separated by that gap.", "Shrink the gap down to 1 to finish." ]),
    watch: sharedSortWatch,
    takeaway: t("Nhanh hơn insertion sort đơn giản, độ phức tạp phụ thuộc chuỗi gap.", "Faster than simple insertion sort, but complexity depends on the gap sequence."),
  },
  cocktail: {
    hook: t("Cocktail Sort là Bubble Sort đi hai chiều: trái qua phải rồi phải qua trái.", "Cocktail Sort is Bubble Sort in two directions: left to right, then right to left."),
    useCase: t("Dễ minh hoạ dữ liệu nhỏ bị lệch cả hai đầu.", "Good for visualizing small data where misplaced values exist at both ends."),
    mentalModel: t("Một lượt đẩy phần tử lớn về cuối, lượt ngược lại kéo phần tử nhỏ về đầu.", "One pass pushes large values to the end; the backward pass pulls small values to the front."),
    steps: t(["Quét xuôi và swap cặp sai.", "Rút ngắn biên phải.", "Quét ngược để kéo giá trị nhỏ về đầu rồi rút ngắn biên trái."], ["Scan forward and swap wrong pairs.", "Shrink the right boundary.", "Scan backward to pull small values forward, then shrink the left boundary." ]),
    watch: sharedSortWatch,
    takeaway: t("Trực quan hơn Bubble trong vài trường hợp, nhưng bản chất vẫn O(n²).", "More visual than Bubble Sort in some cases, but still fundamentally O(n²)."),
  },
  comb: {
    hook: t("Comb Sort sửa Bubble Sort bằng cách so sánh các phần tử cách xa nhau trước.", "Comb Sort improves Bubble Sort by comparing far-apart values first."),
    useCase: t("Dùng để giải thích vì sao loại bỏ 'rùa' ở xa sẽ giúp sort nhanh hơn.", "Useful for explaining why moving slow small values forward early can speed things up."),
    mentalModel: t("Gap lớn giúp phần tử nhỏ nằm cuối mảng di chuyển về trước nhanh, rồi gap nhỏ dần để hoàn thiện.", "A large gap helps small values near the end move forward quickly, then the gap shrinks for cleanup."),
    steps: t(["Bắt đầu với gap gần bằng độ dài mảng.", "So sánh và swap các cặp cách nhau gap.", "Thu nhỏ gap cho đến khi gap = 1 và không còn swap."], ["Start with a gap close to the array length.", "Compare and swap pairs separated by the gap.", "Shrink the gap until it becomes 1 and no swaps remain." ]),
    watch: sharedSortWatch,
    takeaway: t("Thường nhanh hơn Bubble Sort, nhưng vẫn không bảo đảm O(n log n).", "Usually faster than Bubble Sort, but it still does not guarantee O(n log n)."),
  },
  gnome: {
    hook: t("Gnome Sort giống chú lùn đổi chậu hoa: sai thì lùi, đúng thì tiến.", "Gnome Sort acts like a garden gnome arranging pots: wrong means step back, right means move forward."),
    useCase: t("Rất dễ kể chuyện bằng animation vì con trỏ đi tới đi lui rõ ràng.", "Very easy to tell as an animation because the pointer visibly moves back and forth."),
    mentalModel: t("Nếu cặp hiện tại đúng thứ tự thì đi tiếp; nếu sai thì swap và lùi lại kiểm tra dây chuyền.", "If the current pair is ordered, move forward; if not, swap and step back to check the chain."),
    steps: t(["Đứng tại vị trí hiện tại.", "So sánh với phần tử trước đó.", "Sai thì swap và lùi; đúng thì tiến."], ["Stand at the current position.", "Compare with the previous value.", "If wrong, swap and step back; if right, move forward." ]),
    watch: sharedSortWatch,
    takeaway: t("Ý tưởng đơn giản như insertion sort, nhưng hiệu năng O(n²).", "The idea is as simple as insertion sort, but performance is O(n²)."),
  },
  tim: {
    hook: t("Tim Sort tận dụng các đoạn đã có thứ tự tự nhiên trong dữ liệu thật.", "Tim Sort takes advantage of naturally ordered runs in real-world data."),
    useCase: t("Rất đáng dạy vì nhiều ngôn ngữ dùng biến thể Tim Sort cho sort mặc định.", "Worth teaching because many languages use a Tim Sort variant as their default sort."),
    mentalModel: t("Dữ liệu thực tế hiếm khi hoàn toàn ngẫu nhiên; thuật toán tìm các run rồi merge thông minh.", "Real data is rarely totally random; Tim Sort finds runs and merges them intelligently."),
    steps: t(["Tìm hoặc tạo các run đã sắp xếp.", "Dùng insertion sort để tối ưu run nhỏ.", "Merge các run theo chiến lược cân bằng."], ["Find or create sorted runs.", "Use insertion sort to optimize small runs.", "Merge runs with a balancing strategy." ]),
    watch: t(["Các vùng có thứ tự sẽ được tận dụng thay vì làm lại từ đầu.", "Khi merge, những run nhỏ hợp thành run lớn."], ["Already ordered regions are reused instead of rebuilt from scratch.", "During merging, small runs combine into larger runs." ]),
    takeaway: t("Rất mạnh trên dữ liệu thực tế, ổn định, nhưng triển khai phức tạp hơn nhiều sort cơ bản.", "Very strong on real data and stable, but much more complex to implement."),
  },
  intro: {
    hook: t("Intro Sort bắt đầu như Quick Sort nhưng tự đổi chiến thuật khi rủi ro tăng.", "Intro Sort starts like Quick Sort but changes strategy when risk increases."),
    useCase: t("Dạy tư duy hybrid: nhanh trong thực tế nhưng vẫn giữ worst-case an toàn.", "Teaches hybrid design: fast in practice while protecting the worst case."),
    mentalModel: t("Nếu đệ quy quá sâu, thuật toán hiểu rằng pivot đang xấu và chuyển sang Heap Sort.", "If recursion gets too deep, the algorithm treats the pivot choices as risky and switches to Heap Sort."),
    steps: t(["Chạy Quick Sort với giới hạn độ sâu.", "Khi vùng nhỏ, dùng Insertion Sort để giảm overhead.", "Khi đệ quy vượt ngưỡng, chuyển sang Heap Sort."], ["Run Quick Sort with a depth limit.", "Use Insertion Sort for tiny regions to reduce overhead.", "Switch to Heap Sort when recursion exceeds the threshold." ]),
    watch: t(["Pivot vẫn điều khiển quá trình partition.", "Các pha chuyển chiến thuật giúp tránh worst-case của Quick Sort."], ["The pivot still controls partitioning.", "The strategy switch helps avoid Quick Sort's worst case." ]),
    takeaway: t("Kết hợp tốc độ trung bình tốt của Quick Sort với worst-case O(n log n).", "Combines Quick Sort's good average speed with O(n log n) worst-case protection."),
  },
  tree_sort: {
    hook: t("Tree Sort đưa từng giá trị vào cây tìm kiếm nhị phân rồi đọc inorder để ra thứ tự tăng dần.", "Tree Sort inserts values into a binary search tree, then reads inorder to produce sorted order."),
    useCase: t("Hợp để dạy mối liên hệ giữa BST và sắp xếp, nhất là khi muốn thấy dữ liệu chuyển thành cấu trúc cây.", "Useful for teaching the relationship between BSTs and sorting, especially when data becomes a tree structure."),
    mentalModel: t("Mỗi giá trị nhỏ hơn đi trái, lớn hơn hoặc bằng đi phải; inorder luôn thăm trái, node, phải nên tạo ra thứ tự tăng.", "Smaller values go left, larger or equal values go right; inorder visits left, node, right, so it yields ascending order."),
    steps: t(["Chèn từng phần tử vào BST.", "So sánh tại mỗi node để đi trái hoặc phải.", "Duyệt inorder và ghi lại mảng theo thứ tự tăng dần."], ["Insert each value into the BST.", "Compare at each node to move left or right.", "Run inorder traversal and write values back in ascending order."]),
    watch: t(["Pha insert cho thấy giá trị đang đi qua các node.", "Pha write cho thấy inorder traversal lấp dần mảng output."], ["The insert phase shows each value moving through tree nodes.", "The write phase shows inorder traversal filling the output array."]),
    takeaway: t("Average O(n log n), nhưng nếu cây lệch nặng thì worst-case O(n²); cây cân bằng sẽ tốt hơn.", "Average time is O(n log n), but a badly skewed tree degrades to O(n²); balanced trees improve it."),
  },
  linear: {
    hook: t("Linear Search đi từng phần tử cho đến khi tìm thấy mục tiêu.", "Linear Search checks one value at a time until it finds the target."),
    useCase: t("Cơ bản nhất để dạy tìm kiếm khi dữ liệu chưa được sắp xếp.", "The simplest search when the data is not sorted."),
    mentalModel: t("Không có giả định gì về dữ liệu, nên cách chắc chắn nhất là kiểm tra từng ô.", "With no assumptions about the data, the safest method is to check every slot."),
    steps: t(["Bắt đầu từ đầu mảng.", "So sánh từng phần tử với target.", "Dừng khi tìm thấy hoặc đi hết mảng."], ["Start at the beginning of the array.", "Compare each value with the target.", "Stop when found, or after scanning the whole array." ]),
    watch: t(["Highlight cho biết vị trí đang kiểm tra.", "Nếu target xuất hiện sớm, thuật toán kết thúc sớm."], ["The highlight shows the current checked position.", "If the target appears early, the algorithm stops early." ]),
    takeaway: t("Đơn giản, dùng được mọi mảng, nhưng worst-case O(n).", "Simple and works for any array, but worst case is O(n)."),
  },
  binary: {
    hook: t("Binary Search cắt đôi vùng tìm kiếm sau mỗi lần so sánh.", "Binary Search cuts the search range in half after every comparison."),
    useCase: t("Cực kỳ quan trọng khi dữ liệu đã sắp xếp.", "Extremely important when the data is already sorted."),
    mentalModel: t("Nhìn vào điểm giữa: nếu target nhỏ hơn thì bỏ nửa phải, lớn hơn thì bỏ nửa trái.", "Look at the middle: if the target is smaller, discard the right half; if larger, discard the left half."),
    steps: t(["Đặt left và right ở hai đầu vùng tìm kiếm.", "Kiểm tra mid.", "Thu hẹp một nửa vùng cho đến khi tìm thấy hoặc hết vùng."], ["Place left and right at the ends of the search range.", "Check the middle index.", "Discard half of the range until the target is found or the range is empty." ]),
    watch: t(["Vùng bị loại bỏ không cần kiểm tra lại.", "Điều kiện bắt buộc: dữ liệu phải được sắp xếp trước."], ["Discarded regions never need to be checked again.", "Requirement: the data must be sorted first." ]),
    takeaway: t("O(log n), nhanh hơn tuyến tính rất nhiều khi n lớn.", "O(log n), dramatically faster than linear search when n is large."),
  },
  bfs: {
    hook: t("BFS lan theo từng lớp, giống sóng nước đi từ điểm bắt đầu.", "BFS spreads layer by layer, like ripples moving from the start node."),
    useCase: t("Tìm đường ngắn nhất theo số cạnh trong đồ thị không trọng số.", "Finds the shortest path by edge count in an unweighted graph."),
    mentalModel: t("Dùng queue: ai vào trước được xử lý trước, nên các node gần start được thăm trước.", "It uses a queue: first in, first out, so nodes close to the start are visited first."),
    steps: t(["Đưa node bắt đầu vào queue.", "Lấy node đầu queue ra thăm.", "Đưa các hàng xóm chưa thăm vào cuối queue."], ["Push the start node into the queue.", "Visit the node at the front of the queue.", "Push unvisited neighbors to the back of the queue." ]),
    watch: t(["Node sáng lên là đang được thăm.", "Các lớp xa dần cho thấy độ rộng của quá trình lan."], ["A highlighted node is being visited.", "Expanding layers show the breadth-first wave." ]),
    takeaway: t("Rất hợp cho shortest path không trọng số và duyệt theo tầng.", "Perfect for unweighted shortest paths and level-order traversal."),
  },
  dfs: {
    hook: t("DFS đi sâu hết một nhánh rồi mới quay lại.", "DFS goes deep along one branch before backtracking."),
    useCase: t("Dùng nhiều trong backtracking, phát hiện thành phần liên thông và duyệt cây/đồ thị.", "Common in backtracking, connected components, and tree or graph traversal."),
    mentalModel: t("Giống đi vào mê cung: cứ chọn một lối và đi sâu, khi cụt mới quay lui.", "Like walking through a maze: choose a path, go deep, then backtrack when stuck."),
    steps: t(["Bắt đầu ở một node.", "Thăm một hàng xóm chưa thăm và đi sâu tiếp.", "Backtrack khi không còn hàng xóm mới."], ["Start at one node.", "Visit an unvisited neighbor and continue deeper.", "Backtrack when no new neighbors remain." ]),
    watch: t(["Đường đi hiện tại thể hiện nhánh đang đào sâu.", "Sự khác biệt lớn với BFS là thứ tự thăm node."], ["The current path shows the branch being explored.", "The big difference from BFS is the visit order." ]),
    takeaway: t("Dễ cài bằng recursion hoặc stack, rất mạnh cho bài toán khám phá cấu trúc.", "Easy to implement with recursion or a stack, and powerful for exploring structure."),
  },
  dijkstra: {
    hook: t("Dijkstra luôn mở rộng từ node có khoảng cách tạm thời nhỏ nhất.", "Dijkstra always expands from the node with the smallest temporary distance."),
    useCase: t("Tìm đường đi ngắn nhất trên đồ thị có trọng số không âm.", "Finds shortest paths in graphs with non-negative edge weights."),
    mentalModel: t("Mỗi bước chọn điểm đang rẻ nhất để chắc chắn hóa, rồi cập nhật chi phí cho hàng xóm.", "Each step finalizes the cheapest known node, then updates costs for its neighbors."),
    steps: t(["Gán khoảng cách start = 0, các node khác = vô cực.", "Chọn node chưa xử lý có dist nhỏ nhất.", "Relax các cạnh đi ra để cập nhật đường tốt hơn."], ["Set start distance to 0 and all others to infinity.", "Pick the unprocessed node with the smallest distance.", "Relax outgoing edges to update better paths." ]),
    watch: t(["Nhãn dist cho thấy chi phí tốt nhất đang biết.", "Cạnh active là cạnh đang được relax."], ["Distance labels show the best known cost.", "The active edge is the edge currently being relaxed." ]),
    takeaway: t("Rất quan trọng trong bản đồ, routing và bài toán tối ưu đường đi với trọng số không âm.", "Very important for maps, routing, and non-negative weighted shortest paths."),
  },
  custom: {
    hook: t("Custom Algorithm dùng chính code của bạn để tạo animation.", "Custom Algorithm uses your own code to create animation frames."),
    useCase: t("Phù hợp khi muốn biến một ý tưởng hoặc biến thể thuật toán thành video riêng.", "Useful when you want to turn your own algorithm idea into a video."),
    mentalModel: t("Bạn điều khiển frame bằng hàm vis để đánh dấu so sánh, swap, biến và trạng thái.", "You control frames with the vis function to mark comparisons, swaps, variables, and state."),
    steps: t(["Viết code thao tác trên arr.", "Gọi vis để ghi lại từng trạng thái quan trọng.", "Preview animation rồi xuất video."], ["Write code that manipulates arr.", "Call vis to record important states.", "Preview the animation, then export the video." ]),
    watch: t(["Frame càng rõ thì video càng dễ hiểu.", "Đừng ghi quá nhiều frame vô nghĩa khiến video dài và rối."], ["Clear frames make the video easier to understand.", "Avoid recording too many meaningless frames that make the video long and noisy." ]),
    takeaway: t("Đây là đường mở để biến tool thành xưởng sản xuất nội dung thuật toán riêng.", "This is the open path for turning the tool into your own algorithm content studio."),
  },
};

export function getLongContentGuide(algoId: string) {
  return LONG_CONTENT_GUIDES[algoId] ?? LONG_CONTENT_GUIDES.custom;
}

export function pickGuideText(guide: LongContentGuide, lang: Lang): PickedLongContentGuide {
  return {
    hook: guide.hook[lang],
    useCase: guide.useCase[lang],
    mentalModel: guide.mentalModel[lang],
    steps: guide.steps[lang],
    watch: guide.watch[lang],
    takeaway: guide.takeaway[lang],
  };
}
