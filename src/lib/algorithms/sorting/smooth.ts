import { snap } from "../frame";
import type { AlgoDef, Frame, SmoothTree } from "../types";

const LEONARDO = [1, 1, 3, 5, 9, 15, 25, 41, 67, 109, 177];

export const smoothSort: AlgoDef = {
  id: "smooth",
  name: "Smooth Sort",
  category: "sort",
  code: `// Dijkstra-style idea: keep a forest of Leonardo heaps.
for each value:
  add it as the next root
  if the last two heap sizes are consecutive Leonardo numbers:
    merge them with the new root into a larger Leonardo heap
  sift/trinkle so heap roots stay ordered
while forest is not empty:
  the rightmost root is the maximum
  extract it to the sorted suffix
  split its Leonardo heap into its two children`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const forest: SmoothTree[] = [];
    const v: Record<string, number | string> = { kind: "smooth", phase: "start" };

    const emit = (line: number, phase: NonNullable<Frame["smooth"]>["phase"], roots: number[] = [], event: Frame["event"] = null) => {
      v.phase = phase; v.trees = forest.map((tree) => `L${tree.order}`).join(" ");
      frames.push(snap(a, line, v, sorted, roots, event === "swap" ? roots : [], roots.at(-1) ?? null, {
        event,
        smooth: { trees: forest.map((tree) => ({ ...tree })), activeRoots: roots, phase },
      }));
    };

    emit(0, "grow");
    for (let i = 0; i < a.length; i++) {
      v.i = i; v.value = a[i];
      if (forest.length >= 2 && forest.at(-2)!.order === forest.at(-1)!.order + 1) {
        const right = forest.pop()!;
        const left = forest.pop()!;
        const merged = { start: left.start, end: i, order: left.order + 1 };
        forest.push(merged);
        v.leftOrder = left.order; v.rightOrder = right.order; v.newOrder = merged.order;
        emit(3, "merge", [left.end, right.end, i], "found");
        sift(merged);
      } else {
        const order = forest.at(-1)?.order === 1 ? 0 : 1;
        forest.push({ start: i, end: i, order });
        v.newOrder = order;
        emit(2, "grow", [i], "visit");
      }
      rebalanceRoots();
    }

    while (forest.length) {
      rebalanceRoots();
      const tree = forest.pop()!;
      v.root = tree.end; v.order = tree.order;
      emit(10, "extract", [tree.end], "found");
      sorted.add(tree.end);

      if (tree.order >= 2) {
        const [left, right] = childrenOf(tree);
        forest.push(left, right);
        v.leftOrder = left.order; v.rightOrder = right.order;
        emit(12, "extract", [left.end, right.end], "visit");
      }
    }

    v.phase = "done";
    frames.push(snap(a, 14, v, sorted, [], [], null, {
      smooth: { trees: [], activeRoots: [], phase: "done" },
    }));
    return frames;

    function rebalanceRoots() {
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 1; j < forest.length; j++) {
          const left = forest[j - 1];
          const right = forest[j];
          v.leftRoot = left.end; v.rightRoot = right.end;
          emit(6, "trinkle", [left.end, right.end], "compare");
          if (a[left.end] <= a[right.end]) continue;
          swap(left.end, right.end);
          changed = true;
          emit(7, "trinkle", [left.end, right.end], "swap");
          sift(left);
        }
      }
    }

    function sift(tree: SmoothTree) {
      let current = { ...tree };
      while (current.order >= 2) {
        const [left, right] = childrenOf(current);
        const larger = a[left.end] >= a[right.end] ? left : right;
        v.root = current.end; v.child = larger.end; v.order = current.order;
        emit(5, "sift", [current.end, left.end, right.end], "compare");
        if (a[current.end] >= a[larger.end]) break;
        swap(current.end, larger.end);
        emit(5, "sift", [current.end, larger.end], "swap");
        current = larger;
      }
    }

    function swap(i: number, j: number) {
      [a[i], a[j]] = [a[j], a[i]];
    }
  },
};

function childrenOf(tree: SmoothTree): [SmoothTree, SmoothTree] {
  const leftOrder = tree.order - 1;
  const rightOrder = tree.order - 2;
  const leftEnd = tree.start + LEONARDO[leftOrder] - 1;
  return [
    { start: tree.start, end: leftEnd, order: leftOrder },
    { start: leftEnd + 1, end: tree.end - 1, order: rightOrder },
  ];
}
