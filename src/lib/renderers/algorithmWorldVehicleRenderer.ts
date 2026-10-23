import type { AlgorithmWorldState } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawVehicle(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, cell: number, x: number, y: number, theme: Theme) {
  if (!world.current) return;
  const c = world.current;
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  const shape = world.vehicleShape ?? "sport";
  const bodyW = Math.max(12, cell * (shape === "truck" ? 0.96 : shape === "formula" ? 0.76 : 0.9));
  const bodyH = Math.max(8, cell * (shape === "truck" ? 0.62 : 0.56));
  const color = vehicleColorForWorld(world, theme);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = Math.max(1.5, cell * 0.08);
  roundRect(ctx, cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.18));
  ctx.fill();
  ctx.stroke();
  if (shape === "formula") {
    ctx.beginPath();
    ctx.moveTo(cx + bodyW * 0.55, cy);
    ctx.lineTo(cx + bodyW * 0.15, cy - bodyH * 0.5);
    ctx.lineTo(cx + bodyW * 0.15, cy + bodyH * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (shape === "drone") drawDroneArms(ctx, cx, cy, bodyW, bodyH, cell, color);
  ctx.fillStyle = "rgba(2,6,23,0.9)";
  ctx.beginPath(); ctx.arc(cx - bodyW * 0.3, cy + bodyH * 0.48, Math.max(2, cell * 0.12), 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + bodyW * 0.3, cy + bodyH * 0.48, Math.max(2, cell * 0.12), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(cx + bodyW * 0.36, cy);
  ctx.lineTo(cx + bodyW * 0.12, cy - bodyH * 0.2);
  ctx.lineTo(cx + bodyW * 0.12, cy + bodyH * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function vehicleColorForWorld(world: AlgorithmWorldState, theme: Theme) {
  if (world.vehicleColor) return world.vehicleColor;
  return legacyVehicleColor(world.algorithmId, theme);
}

function legacyVehicleColor(id: AlgorithmWorldState["algorithmId"], theme: Theme) {
  if (id === "dfs") return "#fb7185";
  if (id === "bfs") return "#38bdf8";
  if (id === "dijkstra") return "#facc15";
  if (id === "astar") return "#34d399";
  return theme.highlight;
}

function drawDroneArms(ctx: CanvasRenderingContext2D, cx: number, cy: number, bodyW: number, bodyH: number, cell: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, cell * 0.08);
  const arm = bodyW * 0.58;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + sx * arm, cy + sy * bodyH * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + sx * arm, cy + sy * bodyH * 0.9, Math.max(3, cell * 0.16), 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}
