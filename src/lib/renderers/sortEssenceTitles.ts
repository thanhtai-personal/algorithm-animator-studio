import type { Lang } from "../i18n";

const TITLES: Record<string, { vi: string; en: string }> = {
  bubble: { vi: "Bubble pass: so sánh kề nhau để tạo đuôi đã sort", en: "Bubble pass: adjacent comparisons grow a sorted tail" },
  selection: { vi: "Selection scan: tìm min, đặt vào prefix đã sort", en: "Selection scan: find min, place into sorted prefix" },
  cycle: { vi: "Cycle Sort: đếm vị trí đúng rồi xoay cycle", en: "Cycle Sort: count the final slot, then rotate the cycle" },
  insertion: { vi: "Insertion window: dịch giá trị, chèn key", en: "Insertion window: shift values, insert key" },
  quick: { vi: "Quick partition: pivot chia vùng trái/phải", en: "Quick partition: pivot splits left/right regions" },
  merge: { vi: "Merge ranges: so sánh hai nửa đã sort", en: "Merge ranges: compare two sorted halves" },
  heap: { vi: "Heap view: parent lớn hơn con, max ra cuối", en: "Heap view: parent dominates children, max moves to tail" },
  radix: { vi: "Radix buckets: đưa giá trị theo chữ số hiện tại", en: "Radix buckets: route values by current digit" },
  pigeonhole: { vi: "Pigeonhole: đưa giá trị vào hole theo offset min", en: "Pigeonhole: route values into min-offset holes" },
  strand: { vi: "Strand Sort: kéo dãy con tăng rồi merge vào output", en: "Strand Sort: extract increasing strands, then merge output" },
  tournament: { vi: "Tournament Sort: cây đấu loại chọn min mỗi lượt", en: "Tournament Sort: knockout tree selects each minimum" },
  smooth: { vi: "Smooth Sort: forest heap Leonardo, sift và trinkle", en: "Smooth Sort: Leonardo heap forest, sift and trinkle" },
  bucket: { vi: "Bucket ranges: phân phối, sort từng bucket, nối lại", en: "Bucket ranges: distribute, sort each bucket, concatenate" },
  shell: { vi: "Shell gaps: insertion sort theo khoảng cách", en: "Shell gaps: gapped insertion sort" },
  bitonic: { vi: "Bitonic network: compare-swap theo gap và hướng", en: "Bitonic network: compare-swap by gap and direction" },
  odd_even: { vi: "Odd-Even: xen kẽ pass cặp lẻ rồi cặp chẵn", en: "Odd-Even: alternate odd-pair and even-pair passes" },
  cocktail: { vi: "Cocktail shaker: bubble theo hai chiều", en: "Cocktail shaker: bubble both directions" },
  comb: { vi: "Comb gap: thu nhỏ so sánh khoảng cách xa", en: "Comb gap: shrink long-distance comparisons" },
  gnome: { vi: "Gnome walk: lùi lại khi sai thứ tự cục bộ", en: "Gnome walk: step back when local order breaks" },
  tim: { vi: "TimSort runs: sort run nhỏ rồi merge", en: "TimSort runs: insertion-sorted runs then merges" },
  intro: { vi: "IntroSort hybrid: quick, insertion, heap fallback", en: "IntroSort hybrid: quick, insertion, heap fallback" },
  tree_sort: { vi: "Tree Sort: insert BST rồi duyệt inorder", en: "Tree Sort: insert into a BST, then inorder" },
};

export function titleForSortEssence(id: string, lang: Lang) {
  return TITLES[id]?.[lang] ?? (lang === "vi" ? "Góc nhìn sorting" : "Sorting lens");
}
