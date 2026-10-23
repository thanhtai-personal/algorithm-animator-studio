import type { Frame, TreeSortNode } from "../algorithms";
import type { Theme } from "./theme";

type PositionedNode = TreeSortNode & { x: number; y: number; depth: number };

export function drawTreeSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const state = frame.treeSort;
  if (!state?.nodes.length) {
    drawSmallText(ctx, "insert values into a binary search tree", x + 4, y + 16, theme.highlight, "left");
    return;
  }

  const positioned = layoutTree(state.nodes, state.root, x + 18, y + 26, w - 36, h - 38);
  const byId = new Map(positioned.map((node) => [node.id, node]));

  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.34)";
  ctx.lineWidth = 2;
  for (const node of positioned) {
    for (const childId of [node.left, node.right]) {
      const child = childId ? byId.get(childId) : undefined;
      if (!child) continue;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(child.x, child.y);
      ctx.stroke();
    }
  }

  const radius = Math.max(11, Math.min(20, w / Math.max(12, positioned.length * 1.8)));
  for (const node of positioned) {
    const active = state.active === node.id;
    const writing = state.writing === node.id;
    ctx.fillStyle = writing ? theme.sorted : active ? theme.highlight : "rgba(148,163,184,0.9)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = writing || active ? "#ffffff" : "rgba(15,23,42,0.75)";
    ctx.lineWidth = writing || active ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = `800 ${Math.max(10, radius * 0.72)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(node.value), node.x, node.y + 1);
  }
  ctx.restore();

  const phase = String(frame.vars.phase ?? state.phase ?? "insert");
  const text = phase === "write"
    ? `inorder: left -> node -> right, write ${frame.vars.value ?? "-"} at index ${frame.vars.index ?? "-"}`
    : `BST insert: ${frame.vars.value ?? "-"} ${Number(frame.vars.value) < Number(frame.vars.node) ? "<" : ">="} ${frame.vars.node ?? "root"}`;
  drawSmallText(ctx, text, x + 4, y + 14, phase === "write" ? theme.sorted : theme.highlight, "left");
}

function layoutTree(nodes: TreeSortNode[], rootId: number | undefined, x: number, y: number, w: number, h: number) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ordered: PositionedNode[] = [];
  const depths = new Map<number, number>();

  const visit = (id: number | undefined, depth: number) => {
    if (!id) return;
    const node = byId.get(id);
    if (!node) return;
    visit(node.left, depth + 1);
    depths.set(node.id, depth);
    ordered.push({ ...node, x: 0, y: 0, depth });
    visit(node.right, depth + 1);
  };

  visit(rootId ?? nodes[0]?.id, 0);
  const maxDepth = Math.max(1, ...ordered.map((node) => node.depth));
  return ordered.map((node, index) => ({
    ...node,
    x: x + ((index + 0.5) / Math.max(1, ordered.length)) * w,
    y: y + (node.depth / maxDepth) * Math.max(1, h - 20) + 18,
    depth: depths.get(node.id) ?? node.depth,
  }));
}

function drawSmallText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 15px ui-monospace, monospace";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}
