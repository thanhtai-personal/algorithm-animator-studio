import { snap } from "../frame";
import type { AlgoDef, Frame, TreeSortState } from "../types";

type TreeNode = {
  id: number;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
};

export const treeSort: AlgoDef = {
  id: "tree_sort",
  name: "Tree Sort",
  category: "sort",
  code: `for (const value of arr) {
  root = insert(root, value);
}
let index = 0;
inorder(root, (value) => {
  arr[index++] = value;
});`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    let root: TreeNode | null = null;
    let nextId = 1;
    const treeState = (extra: Omit<TreeSortState, "nodes" | "root"> = {}) => ({
      treeSort: { nodes: snapshotTree(root), root: root?.id, ...extra },
    });
    f.push(snap(a, 0, v, sorted, [], [], null, treeState()));

    const insert = (node: TreeNode | null, value: number, sourceIndex: number, depth: number): TreeNode => {
      v.phase = "insert"; v.value = value; v.source = sourceIndex; v.depth = depth;
      if (!node) {
        const created = { id: nextId++, value, left: null, right: null };
        f.push(snap(a, 1, v, sorted, [sourceIndex], [], null, { event: "visit", ...treeState({ active: created.id, phase: "insert" }) }));
        return created;
      }

      v.node = node.value;
      f.push(snap(a, 2, v, sorted, [sourceIndex], [], null, { event: "compare", ...treeState({ active: node.id, phase: "insert" }) }));
      if (value < node.value) node.left = insert(node.left, value, sourceIndex, depth + 1);
      else node.right = insert(node.right, value, sourceIndex, depth + 1);
      return node;
    };

    for (let i = 0; i < a.length; i++) root = insert(root, a[i], i, 0);

    let writeIndex = 0;
    const inorder = (node: TreeNode | null) => {
      if (!node) return;
      inorder(node.left);
      v.phase = "write"; v.value = node.value; v.index = writeIndex;
      a[writeIndex] = node.value;
      sorted.add(writeIndex);
      f.push(snap(a, 7, v, sorted, [writeIndex], [writeIndex], null, { event: "swap", ...treeState({ writing: node.id, phase: "write" }) }));
      writeIndex++;
      inorder(node.right);
    };

    inorder(root);
    f.push(snap(a, 8, v, sorted, [], [], null, treeState({ phase: "done" })));
    return f;
  },
};

function snapshotTree(root: TreeNode | null): TreeSortState["nodes"] {
  const nodes: TreeSortState["nodes"] = [];
  const visit = (node: TreeNode | null) => {
    if (!node) return;
    nodes.push({ id: node.id, value: node.value, left: node.left?.id, right: node.right?.id });
    visit(node.left);
    visit(node.right);
  };
  visit(root);
  return nodes;
}
