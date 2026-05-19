import type { Frame, TournamentNode } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

type Positioned = TournamentNode & { x: number; y: number; level: number; slot: number };

export function drawTournamentLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const state = frame.tournament;
  if (!state?.rounds.length) {
    drawSmallText(ctx, "repeat tournaments: smallest winner is extracted to output", x + 4, y + 14, theme.highlight, "left");
    return;
  }

  const treeH = Math.max(54, h - 36);
  const positioned = layoutRounds(state.rounds, x + 12, y + 28, w - 24, treeH);
  const byKey = new Map(positioned.map((node) => [`${node.level}:${node.slot}:${node.id}`, node]));
  const active = new Set(state.activeIds ?? []);

  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.3)";
  ctx.lineWidth = 2;
  for (let level = 0; level + 1 < state.rounds.length; level++) {
    state.rounds[level].forEach((node, slot) => {
      const parentSlot = Math.floor(slot / 2);
      const child = byKey.get(`${level}:${slot}:${node.id}`);
      const parent = findParent(positioned, level + 1, parentSlot, node.id);
      if (!child || !parent) return;
      ctx.beginPath();
      ctx.moveTo(child.x, child.y);
      ctx.lineTo(parent.x, parent.y);
      ctx.stroke();
    });
  }

  for (const node of positioned) {
    const isActive = active.has(node.id);
    const isWinner = state.winnerId === node.id && node.level === state.rounds.length - 1;
    const color = isWinner ? theme.sorted : isActive ? theme.highlight : "rgba(148,163,184,0.9)";
    drawNode(ctx, node, color, isActive || isWinner, theme);
  }
  ctx.restore();

  drawOutputRail(ctx, state.output, x, y + h - 20, w, theme);
  const summary = summaryText(frame, state.phase ?? "build");
  drawSmallText(ctx, summary, x + 4, y + 14, state.phase === "extract" ? theme.sorted : theme.highlight, "left");
}

function layoutRounds(rounds: TournamentNode[][], x: number, y: number, w: number, h: number): Positioned[] {
  const levels = Math.max(1, rounds.length);
  const levelGap = h / levels;
  const positioned: Positioned[] = [];
  rounds.forEach((round, level) => {
    const count = Math.max(1, round.length);
    round.forEach((node, slot) => {
      positioned.push({
        ...node,
        level,
        slot,
        x: x + ((slot + 0.5) / count) * w,
        y: y + (levels - level - 0.5) * levelGap,
      });
    });
  });
  return positioned;
}

function findParent(positioned: Positioned[], level: number, slot: number, childId: number) {
  return positioned.find((node) => node.level === level && node.slot === slot && node.id === childId)
    ?? positioned.find((node) => node.level === level && node.slot === slot);
}

function drawNode(ctx: CanvasRenderingContext2D, node: Positioned, color: string, active: boolean, theme: Theme) {
  const r = active ? 15 : 13;
  ctx.save();
  if (active) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = active ? "#ffffff" : "rgba(15,23,42,0.78)";
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(node.value), node.x, node.y + 0.5);
  ctx.fillStyle = active ? "#ffffff" : "rgba(226,232,240,0.72)";
  ctx.font = "700 9px ui-monospace, monospace";
  ctx.fillText(`#${node.sourceIndex}`, node.x, node.y + r + 9);
  ctx.restore();
  void theme;
}

function drawOutputRail(ctx: CanvasRenderingContext2D, output: number[], x: number, y: number, w: number, theme: Theme) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.72)";
  ctx.strokeStyle = "rgba(34,197,94,0.58)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 2, y - 12, w - 4, 24, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = theme.sorted;
  ctx.font = "800 12px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`output: ${output.join(", ") || "-"}`, x + 12, y);
  ctx.restore();
}

function summaryText(frame: Frame, phase: string) {
  if (phase === "compare") return `match: ${frame.vars.left ?? "-"} vs ${frame.vars.right ?? "-"}  round=${frame.vars.round ?? "-"}`;
  if (phase === "promote") return `winner ${frame.vars.winner ?? frame.vars.value ?? "-"} advances to next round`;
  if (phase === "extract") return `extract min winner=${frame.vars.winner ?? frame.vars.value ?? "-"} into sorted output`;
  return `build tournament with ${frame.vars.activeSize ?? frame.arr.length} active values`;
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
