export type LongContentGuide = {
  hook: string;
  useCase: string;
  mentalModel: string;
  steps: string[];
  watch: string[];
  takeaway: string;
};

const sharedSortWatch = [
  "Màu vàng là phần đang so sánh, màu hồng là thao tác đổi/chia mốc.",
  "Màu xanh là phần đã ổn định hoặc chắc chắn đúng vị trí.",
];

export const LONG_CONTENT_GUIDES: Record<string, LongContentGuide> = {
  bubble: {
    hook: "Bubble Sort giống bong bóng: phần tử lớn nổi dần về cuối mảng.",
    useCase: "Dùng để dạy tư duy so sánh hai phần tử kề nhau, không phải để tối ưu hiệu năng.",
    mentalModel: "Mỗi lượt quét chỉ hỏi một câu: cặp bên trái có lớn hơn cặp bên phải không? Nếu có thì đổi chỗ.",
    steps: ["Duyệt từng cặp liền kề từ trái sang phải.", "Swap khi thứ tự đang sai.", "Sau mỗi vòng, phần tử lớn nhất còn lại nằm ở cuối vùng chưa sắp xếp."],
    watch: sharedSortWatch,
    takeaway: "Dễ hiểu nhất cho người mới, nhưng O(n²) nên chậm khi dữ liệu lớn.",
  },
  selection: {
    hook: "Selection Sort chọn đúng người nhỏ nhất cho từng vị trí.",
    useCase: "Phù hợp để giải thích khái niệm tìm min và cố định dần vùng đã sắp xếp.",
    mentalModel: "Thay vì đổi liên tục, thuật toán đi tìm ứng viên nhỏ nhất rồi đưa về đầu vùng chưa sắp xếp.",
    steps: ["Đặt vị trí hiện tại là ô cần lấp.", "Quét phần còn lại để tìm giá trị nhỏ nhất.", "Đổi min về vị trí hiện tại rồi chuyển sang ô kế tiếp."],
    watch: sharedSortWatch,
    takeaway: "Ít swap hơn Bubble Sort, nhưng vẫn phải quét O(n²).",
  },
  insertion: {
    hook: "Insertion Sort giống xếp bài trên tay: rút một lá rồi chèn vào đúng chỗ.",
    useCase: "Rất tốt cho mảng nhỏ hoặc dữ liệu gần như đã sắp xếp.",
    mentalModel: "Bên trái luôn là danh sách đã gọn; phần tử mới sẽ trượt lùi cho đến khi gặp vị trí đúng.",
    steps: ["Lấy phần tử kế tiếp làm key.", "Dịch các phần tử lớn hơn key sang phải.", "Chèn key vào khoảng trống vừa tạo."],
    watch: sharedSortWatch,
    takeaway: "Best case O(n) khi dữ liệu gần đúng thứ tự, worst case O(n²).",
  },
  quick: {
    hook: "Quick Sort chia mảng quanh một pivot rồi xử lý từng nửa.",
    useCase: "Một trong những tư duy chia để trị quan trọng nhất trong sắp xếp.",
    mentalModel: "Pivot là vạch ranh giới: nhỏ hơn qua một bên, lớn hơn qua một bên, sau đó lặp lại.",
    steps: ["Chọn pivot.", "Partition để đưa phần tử nhỏ/lớn về đúng phía.", "Đệ quy hai vùng trái và phải cho đến khi vùng còn rất nhỏ."],
    watch: ["Màu tím là pivot hoặc mốc chia.", ...sharedSortWatch],
    takeaway: "Trung bình O(n log n), nhưng chọn pivot tệ có thể rơi về O(n²).",
  },
  merge: {
    hook: "Merge Sort tách nhỏ mảng rồi trộn lại theo đúng thứ tự.",
    useCase: "Dễ giải thích chia để trị và ổn định thứ tự dữ liệu bằng thao tác merge.",
    mentalModel: "Hai danh sách đã sắp xếp có thể trộn rất nhanh bằng cách luôn lấy phần tử nhỏ hơn ở đầu.",
    steps: ["Chia mảng làm hai nửa cho đến khi mỗi vùng chỉ còn một phần tử.", "Merge hai vùng đã sắp xếp thành vùng lớn hơn.", "Lặp lại cho đến khi toàn bộ mảng được ghép xong."],
    watch: sharedSortWatch,
    takeaway: "Luôn O(n log n), đổi lại cần thêm bộ nhớ O(n).",
  },
  heap: {
    hook: "Heap Sort biến mảng thành cây ưu tiên rồi rút phần tử lớn nhất.",
    useCase: "Hợp để dạy heap, priority queue và sắp xếp không cần bộ nhớ phụ lớn.",
    mentalModel: "Max-heap đảm bảo phần tử lớn nhất nằm ở gốc; đưa gốc về cuối rồi khôi phục heap.",
    steps: ["Build max-heap từ mảng ban đầu.", "Swap gốc với phần tử cuối của vùng heap.", "Giảm vùng heap và heapify lại từ gốc."],
    watch: sharedSortWatch,
    takeaway: "O(n log n), in-place, nhưng không ổn định thứ tự các phần tử bằng nhau.",
  },
  counting: {
    hook: "Counting Sort không so sánh; nó đếm số lần xuất hiện của từng giá trị.",
    useCase: "Rất mạnh khi dữ liệu là số nguyên trong khoảng giá trị nhỏ.",
    mentalModel: "Thay vì hỏi ai lớn hơn ai, thuật toán hỏi: mỗi giá trị xuất hiện bao nhiêu lần?",
    steps: ["Tạo bảng đếm theo từng giá trị.", "Quét mảng để tăng số lượng tương ứng.", "Ghi lại output bằng cách trải các giá trị theo số lần đã đếm."],
    watch: ["Bảng đếm cho thấy tần suất từng giá trị.", "Vùng output được ghi lại từ nhỏ đến lớn."],
    takeaway: "Có thể gần O(n + k), nhưng chỉ hợp khi miền giá trị k không quá lớn.",
  },
  radix: {
    hook: "Radix Sort sắp xếp số theo từng chữ số, từ hàng đơn vị lên cao hơn.",
    useCase: "Hợp với dữ liệu số nguyên có độ dài chữ số giới hạn.",
    mentalModel: "Mỗi vòng gom số theo một chữ số; nhiều vòng ổn định sẽ tạo ra thứ tự tổng thể.",
    steps: ["Xét chữ số ở hàng hiện tại.", "Đưa phần tử vào bucket 0–9 tương ứng.", "Ghép bucket lại rồi chuyển sang chữ số kế tiếp."],
    watch: ["Những số cùng chữ số hiện tại sẽ đi cùng bucket.", "Sau mỗi pass, trật tự đúng hơn ở nhiều chữ số hơn."],
    takeaway: "Không dựa trên so sánh, nhanh khi số chữ số nhỏ và cần sort nhiều số nguyên.",
  },
  bucket: {
    hook: "Bucket Sort chia dữ liệu vào nhiều xô, rồi sắp xếp từng xô nhỏ.",
    useCase: "Tốt khi dữ liệu phân bố tương đối đều trên một khoảng giá trị.",
    mentalModel: "Đưa phần tử gần nhau vào cùng bucket để biến một bài toán lớn thành nhiều bài toán nhỏ.",
    steps: ["Chọn số bucket và khoảng giá trị mỗi bucket.", "Phân phối từng phần tử vào bucket phù hợp.", "Sắp xếp từng bucket rồi nối lại."],
    watch: ["Các bucket thể hiện vùng giá trị.", "Bucket lệch quá nhiều sẽ làm thuật toán mất lợi thế."],
    takeaway: "Có thể rất nhanh với phân bố đẹp, nhưng phụ thuộc mạnh vào cách chia bucket.",
  },
  shell: {
    hook: "Shell Sort là Insertion Sort nhưng nhảy bước xa trước, gần sau.",
    useCase: "Giúp người học thấy cách giảm đảo ngược lớn trước khi tinh chỉnh cục bộ.",
    mentalModel: "Ban đầu so sánh các phần tử cách xa nhau để đưa dữ liệu về gần vị trí đúng nhanh hơn.",
    steps: ["Chọn gap lớn.", "Insertion sort trên các nhóm cách nhau gap.", "Giảm gap dần về 1 để hoàn tất."],
    watch: sharedSortWatch,
    takeaway: "Nhanh hơn insertion sort đơn giản, độ phức tạp phụ thuộc chuỗi gap.",
  },
  cocktail: {
    hook: "Cocktail Sort là Bubble Sort đi hai chiều: trái qua phải rồi phải qua trái.",
    useCase: "Dễ minh hoạ dữ liệu nhỏ bị lệch cả hai đầu.",
    mentalModel: "Một lượt đẩy phần tử lớn về cuối, lượt ngược lại kéo phần tử nhỏ về đầu.",
    steps: ["Quét xuôi và swap cặp sai.", "Rút ngắn biên phải.", "Quét ngược để kéo giá trị nhỏ về đầu rồi rút ngắn biên trái."],
    watch: sharedSortWatch,
    takeaway: "Trực quan hơn Bubble trong vài trường hợp, nhưng bản chất vẫn O(n²).",
  },
  comb: {
    hook: "Comb Sort sửa Bubble Sort bằng cách so sánh các phần tử cách xa nhau trước.",
    useCase: "Dùng để giải thích vì sao loại bỏ 'rùa' ở xa sẽ giúp sort nhanh hơn.",
    mentalModel: "Gap lớn giúp phần tử nhỏ nằm cuối mảng di chuyển về trước nhanh, rồi gap nhỏ dần để hoàn thiện.",
    steps: ["Bắt đầu với gap gần bằng độ dài mảng.", "So sánh và swap các cặp cách nhau gap.", "Thu nhỏ gap cho đến khi gap = 1 và không còn swap."],
    watch: sharedSortWatch,
    takeaway: "Thường nhanh hơn Bubble Sort, nhưng vẫn không bảo đảm O(n log n).",
  },
  gnome: {
    hook: "Gnome Sort giống chú lùn đổi chậu hoa: sai thì lùi, đúng thì tiến.",
    useCase: "Rất dễ kể chuyện bằng animation vì con trỏ đi tới đi lui rõ ràng.",
    mentalModel: "Nếu cặp hiện tại đúng thứ tự thì đi tiếp; nếu sai thì swap và lùi lại kiểm tra dây chuyền.",
    steps: ["Đứng tại vị trí hiện tại.", "So sánh với phần tử trước đó.", "Sai thì swap và lùi; đúng thì tiến."],
    watch: sharedSortWatch,
    takeaway: "Ý tưởng đơn giản như insertion sort, nhưng hiệu năng O(n²).",
  },
  tim: {
    hook: "Tim Sort tận dụng các đoạn đã có thứ tự tự nhiên trong dữ liệu thật.",
    useCase: "Rất đáng dạy vì nhiều ngôn ngữ dùng biến thể Tim Sort cho sort mặc định.",
    mentalModel: "Dữ liệu thực tế hiếm khi hoàn toàn ngẫu nhiên; thuật toán tìm các run rồi merge thông minh.",
    steps: ["Tìm hoặc tạo các run đã sắp xếp.", "Dùng insertion sort để tối ưu run nhỏ.", "Merge các run theo chiến lược cân bằng."],
    watch: ["Các vùng có thứ tự sẽ được tận dụng thay vì làm lại từ đầu.", "Khi merge, những run nhỏ hợp thành run lớn."],
    takeaway: "Rất mạnh trên dữ liệu thực tế, ổn định, nhưng triển khai phức tạp hơn nhiều sort cơ bản.",
  },
  intro: {
    hook: "Intro Sort bắt đầu như Quick Sort nhưng tự đổi chiến thuật khi rủi ro tăng.",
    useCase: "Dạy tư duy hybrid: nhanh trong thực tế nhưng vẫn giữ worst-case an toàn.",
    mentalModel: "Nếu đệ quy quá sâu, thuật toán hiểu rằng pivot đang xấu và chuyển sang Heap Sort.",
    steps: ["Chạy Quick Sort với giới hạn độ sâu.", "Khi vùng nhỏ, dùng Insertion Sort để giảm overhead.", "Khi đệ quy vượt ngưỡng, chuyển sang Heap Sort."],
    watch: ["Pivot vẫn điều khiển quá trình partition.", "Các pha chuyển chiến thuật giúp tránh worst-case của Quick Sort."],
    takeaway: "Kết hợp tốc độ trung bình tốt của Quick Sort với worst-case O(n log n).",
  },
  linear: {
    hook: "Linear Search đi từng phần tử cho đến khi tìm thấy mục tiêu.",
    useCase: "Cơ bản nhất để dạy tìm kiếm khi dữ liệu chưa được sắp xếp.",
    mentalModel: "Không có giả định gì về dữ liệu, nên cách chắc chắn nhất là kiểm tra từng ô.",
    steps: ["Bắt đầu từ đầu mảng.", "So sánh từng phần tử với target.", "Dừng khi tìm thấy hoặc đi hết mảng."],
    watch: ["Highlight cho biết vị trí đang kiểm tra.", "Nếu target xuất hiện sớm, thuật toán kết thúc sớm."],
    takeaway: "Đơn giản, dùng được mọi mảng, nhưng worst-case O(n).",
  },
  binary: {
    hook: "Binary Search cắt đôi vùng tìm kiếm sau mỗi lần so sánh.",
    useCase: "Cực kỳ quan trọng khi dữ liệu đã sắp xếp.",
    mentalModel: "Nhìn vào điểm giữa: nếu target nhỏ hơn thì bỏ nửa phải, lớn hơn thì bỏ nửa trái.",
    steps: ["Đặt left và right ở hai đầu vùng tìm kiếm.", "Kiểm tra mid.", "Thu hẹp một nửa vùng cho đến khi tìm thấy hoặc hết vùng."],
    watch: ["Vùng bị loại bỏ không cần kiểm tra lại.", "Điều kiện bắt buộc: dữ liệu phải được sắp xếp trước."],
    takeaway: "O(log n), nhanh hơn tuyến tính rất nhiều khi n lớn.",
  },
  bfs: {
    hook: "BFS lan theo từng lớp, giống sóng nước đi từ điểm bắt đầu.",
    useCase: "Tìm đường ngắn nhất theo số cạnh trong đồ thị không trọng số.",
    mentalModel: "Dùng queue: ai vào trước được xử lý trước, nên các node gần start được thăm trước.",
    steps: ["Đưa node bắt đầu vào queue.", "Lấy node đầu queue ra thăm.", "Đưa các hàng xóm chưa thăm vào cuối queue."],
    watch: ["Node sáng lên là đang được thăm.", "Các lớp xa dần cho thấy độ rộng của quá trình lan."],
    takeaway: "Rất hợp cho shortest path không trọng số và duyệt theo tầng.",
  },
  dfs: {
    hook: "DFS đi sâu hết một nhánh rồi mới quay lại.",
    useCase: "Dùng nhiều trong backtracking, phát hiện thành phần liên thông và duyệt cây/đồ thị.",
    mentalModel: "Giống đi vào mê cung: cứ chọn một lối và đi sâu, khi cụt mới quay lui.",
    steps: ["Bắt đầu ở một node.", "Thăm một hàng xóm chưa thăm và đi sâu tiếp.", "Backtrack khi không còn hàng xóm mới."],
    watch: ["Đường đi hiện tại thể hiện nhánh đang đào sâu.", "Sự khác biệt lớn với BFS là thứ tự thăm node."],
    takeaway: "Dễ cài bằng recursion hoặc stack, rất mạnh cho bài toán khám phá cấu trúc.",
  },
  dijkstra: {
    hook: "Dijkstra luôn mở rộng từ node có khoảng cách tạm thời nhỏ nhất.",
    useCase: "Tìm đường đi ngắn nhất trên đồ thị có trọng số không âm.",
    mentalModel: "Mỗi bước chọn điểm đang rẻ nhất để chắc chắn hóa, rồi cập nhật chi phí cho hàng xóm.",
    steps: ["Gán khoảng cách start = 0, các node khác = vô cực.", "Chọn node chưa xử lý có dist nhỏ nhất.", "Relax các cạnh đi ra để cập nhật đường tốt hơn."],
    watch: ["Nhãn dist cho thấy chi phí tốt nhất đang biết.", "Cạnh active là cạnh đang được relax."],
    takeaway: "Rất quan trọng trong bản đồ, routing và bài toán tối ưu đường đi với trọng số không âm.",
  },
  custom: {
    hook: "Custom Algorithm dùng chính code của bạn để tạo animation.",
    useCase: "Phù hợp khi muốn biến một ý tưởng hoặc biến thể thuật toán thành video riêng.",
    mentalModel: "Bạn điều khiển frame bằng hàm vis để đánh dấu so sánh, swap, biến và trạng thái.",
    steps: ["Viết code thao tác trên arr.", "Gọi vis để ghi lại từng trạng thái quan trọng.", "Preview animation rồi xuất video."],
    watch: ["Frame càng rõ thì video càng dễ hiểu.", "Đừng ghi quá nhiều frame vô nghĩa khiến video dài và rối."],
    takeaway: "Đây là đường mở để biến tool thành xưởng sản xuất nội dung thuật toán riêng.",
  },
};

export function getLongContentGuide(algoId: string) {
  return LONG_CONTENT_GUIDES[algoId] ?? LONG_CONTENT_GUIDES.custom;
}
