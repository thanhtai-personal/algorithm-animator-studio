import type { StudioSettings } from "../types";
import type { TerminalMarbleGoal } from "./terminalMarbleGoal";

function funnelPath(ctx: CanvasRenderingContext2D, goal: TerminalMarbleGoal, cameraY: number) {
  const mouthY = goal.mouthY - cameraY;
  const bottomY = goal.bottomY - cameraY;
  const halfMouth = goal.mouthWidth / 2;
  const halfBottom = Math.max(16, goal.mouthWidth * 0.19);
  ctx.beginPath();
  ctx.moveTo(goal.centerX - halfMouth, mouthY);
  ctx.quadraticCurveTo(
    goal.centerX - halfMouth * 0.72,
    mouthY + goal.depth * 0.58,
    goal.centerX - halfBottom,
    bottomY,
  );
  ctx.lineTo(goal.centerX + halfBottom, bottomY);
  ctx.quadraticCurveTo(
    goal.centerX + halfMouth * 0.72,
    mouthY + goal.depth * 0.58,
    goal.centerX + halfMouth,
    mouthY,
  );
  ctx.closePath();
}

export function drawTerminalMarbleGoalBack2D(
  ctx: CanvasRenderingContext2D,
  goal: TerminalMarbleGoal,
  cameraY: number,
  settings: StudioSettings,
  timeMs: number,
) {
  const mouthY = goal.mouthY - cameraY;
  const bottomY = goal.bottomY - cameraY;
  const pulse = 0.5 + Math.sin(timeMs * 0.006) * 0.5;
  const gradient = ctx.createLinearGradient(0, mouthY, 0, bottomY);
  gradient.addColorStop(0, "rgba(121,132,148,.78)");
  gradient.addColorStop(0.58, "rgba(54,61,72,.96)");
  gradient.addColorStop(1, "rgba(25,29,36,.98)");

  ctx.save();
  ctx.fillStyle = `rgba(103,232,249,${0.09 + pulse * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(goal.centerX, mouthY, goal.mouthWidth * 0.67, settings.ballSize * 1.35, 0, 0, Math.PI * 2);
  ctx.fill();

  funnelPath(ctx, goal, cameraY);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = Math.max(3, settings.ballSize * 0.25);
  ctx.strokeStyle = "rgba(190,205,220,.92)";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(goal.centerX, bottomY, goal.mouthWidth * 0.2, settings.ballSize * 0.68, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(5,8,12,.88)";
  ctx.fill();
  ctx.strokeStyle = settings.prismEnd;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawTerminalMarbleGoalFront2D(
  ctx: CanvasRenderingContext2D,
  goal: TerminalMarbleGoal,
  cameraY: number,
  settings: StudioSettings,
) {
  const mouthY = goal.mouthY - cameraY;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(
    goal.centerX,
    mouthY + settings.ballSize * 0.12,
    goal.mouthWidth / 2,
    settings.ballSize * 0.52,
    0,
    0,
    Math.PI,
  );
  ctx.lineWidth = Math.max(4, settings.ballSize * 0.32);
  ctx.strokeStyle = "rgba(225,232,240,.96)";
  ctx.stroke();
  ctx.restore();
}
