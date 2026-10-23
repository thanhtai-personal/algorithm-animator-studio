export function applyTextShadow(ctx: CanvasRenderingContext2D, fontSize: number) {
  const blur = Math.max(8, fontSize * 0.18);
  const offset = Math.max(2, fontSize * 0.035);
  ctx.shadowColor = "rgba(0,0,0,0.88)";
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offset;
  ctx.shadowOffsetY = offset;
}

export function clearTextShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function withTextShadow(ctx: CanvasRenderingContext2D, fontSize: number, draw: () => void) {
  ctx.save();
  applyTextShadow(ctx, fontSize);
  draw();
  ctx.restore();
}
