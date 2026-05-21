import type { AlgorithmWorldState } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawVehicle(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, cell: number, x: number, y: number, theme: Theme) {
  if (!world.current) return;
  const c = world.current;
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  const shape = world.vehicleShape ?? "sport";
  const color = vehicleColorForWorld(world, theme);
  const prev = previousVehicleCell(world);
  const angle = prev ? Math.atan2(c.y - prev.y, c.x - prev.x) : 0;
  const bodyW = Math.max(12, cell * vehicleWidth(shape));
  const bodyH = Math.max(8, cell * vehicleHeight(shape));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = "rgba(0,0,0,0.36)";
  ctx.beginPath();
  ctx.ellipse(0, bodyH * 0.46, bodyW * 0.58, bodyH * 0.33, 0, 0, Math.PI * 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(-bodyW / 2, -bodyH / 2, bodyW / 2, bodyH / 2);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.18, color);
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = Math.max(1.4, cell * 0.065);
  drawVehicleBody(ctx, shape, bodyW, bodyH, cell);
  ctx.fill();
  ctx.stroke();
  drawVehicleDetails(ctx, shape, bodyW, bodyH, cell, color);
  ctx.restore();
}

export function vehicleColorForWorld(world: AlgorithmWorldState, theme: Theme) {
  if (world.vehicleColor) return world.vehicleColor;
  if (world.algorithmId === "dfs") return "#fb7185";
  if (world.algorithmId === "bfs" || world.algorithmId === "bidirectional_bfs") return "#38bdf8";
  if (world.algorithmId === "dijkstra") return "#facc15";
  if (world.algorithmId === "greedy" || world.algorithmId === "beam") return "#fb923c";
  if (world.algorithmId === "tremaux" || world.algorithmId === "wall_follower") return "#a78bfa";
  if (world.algorithmId === "weighted_astar") return "#bef264";
  if (world.algorithmId === "astar") return "#34d399";
  return theme.highlight;
}

function vehicleWidth(shape: string) {
  if (shape === "truck" || shape === "van") return 1.02;
  if (shape === "formula" || shape === "kart") return 0.82;
  if (shape === "drone") return 0.68;
  return 0.92;
}

function vehicleHeight(shape: string) {
  if (shape === "truck" || shape === "van") return 0.64;
  if (shape === "formula" || shape === "kart") return 0.48;
  if (shape === "drone") return 0.68;
  return 0.56;
}

function drawVehicleBody(ctx: CanvasRenderingContext2D, shape: string, bodyW: number, bodyH: number, cell: number) {
  if (shape === "formula") {
    ctx.beginPath();
    ctx.moveTo(bodyW * 0.58, 0);
    ctx.lineTo(bodyW * 0.12, -bodyH * 0.56);
    ctx.lineTo(-bodyW * 0.48, -bodyH * 0.42);
    ctx.lineTo(-bodyW * 0.58, bodyH * 0.42);
    ctx.lineTo(bodyW * 0.12, bodyH * 0.56);
    ctx.closePath();
    return;
  }
  if (shape === "drone") {
    ctx.beginPath();
    ctx.arc(0, 0, bodyH * 0.46, 0, Math.PI * 2);
    return;
  }
  roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.16));
}

function drawVehicleDetails(ctx: CanvasRenderingContext2D, shape: string, bodyW: number, bodyH: number, cell: number, color: string) {
  if (shape === "drone") {
    ctx.strokeStyle = `${color}cc`;
    ctx.lineWidth = Math.max(2, cell * 0.08);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * bodyW * 0.54, sy * bodyH * 0.54); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx * bodyW * 0.62, sy * bodyH * 0.62, cell * 0.14, 0, Math.PI * 2); ctx.stroke();
    });
  } else {
    ctx.fillStyle = "rgba(2,6,23,0.96)";
    const wheel = Math.max(2, cell * 0.1);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
      ctx.beginPath(); ctx.arc(sx * bodyW * 0.31, sy * bodyH * 0.56, wheel, 0, Math.PI * 2); ctx.fill();
    }));
  }
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  if (shape === "truck" || shape === "van") roundRect(ctx, bodyW * 0.08, -bodyH * 0.34, bodyW * 0.28, bodyH * 0.68, 4);
  else if (shape === "kart" || shape === "buggy") {
    ctx.beginPath(); ctx.arc(bodyW * 0.08, 0, bodyH * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(2,6,23,0.72)"; ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(bodyW * 0.34, 0);
    ctx.lineTo(bodyW * 0.06, -bodyH * 0.24);
    ctx.lineTo(bodyW * 0.06, bodyH * 0.24);
    ctx.closePath();
  }
  ctx.fill();
}

function previousVehicleCell(world: AlgorithmWorldState) {
  const current = world.current;
  if (!current) return null;
  const route = world.path.length ? world.path : world.previousPath;
  for (let i = route.length - 1; i >= 0; i--) {
    const item = route[i];
    if (item.x !== current.x || item.y !== current.y) return item;
  }
  return null;
}
