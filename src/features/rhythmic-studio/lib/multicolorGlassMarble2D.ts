const CORE_COLORS = ["#efb434", "#39a9d6", "#e15b4f", "#71b66a", "#6c5eb7"];

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

export function drawMulticolorGlassMarble2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pulse: number,
  spin: number,
) {
  ctx.save();
  ctx.translate(x - radius * 0.42, y + radius * 1.12);
  ctx.rotate(-0.18);
  ctx.scale(1, 0.3);
  const shadow = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.45);
  shadow.addColorStop(0, "rgba(4,9,16,.3)");
  shadow.addColorStop(1, "rgba(4,9,16,0)");
  ctx.fillStyle = shadow;
  circle(ctx, 0, 0, radius * 1.45);
  ctx.fill();
  ctx.restore();

  ctx.save();
  const shell = ctx.createRadialGradient(
    x - radius * 0.34, y - radius * 0.38, radius * 0.04,
    x, y, radius,
  );
  shell.addColorStop(0, "rgba(255,255,255,.98)");
  shell.addColorStop(0.18, "rgba(222,252,242,.62)");
  shell.addColorStop(0.54, "rgba(107,191,172,.2)");
  shell.addColorStop(0.82, "rgba(35,106,119,.27)");
  shell.addColorStop(1, "rgba(5,20,31,.72)");
  ctx.fillStyle = shell;
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.clip();

  ctx.translate(x, y);
  ctx.rotate(spin * 0.34);
  CORE_COLORS.forEach((color, index) => {
    const angle = index * Math.PI * 0.4 - 0.65;
    const distance = radius * (index % 2 ? 0.18 : 0.1);
    ctx.save();
    ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
    ctx.rotate(angle + (index % 2 ? 0.35 : -0.18));
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.48, radius * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const depth = ctx.createLinearGradient(-radius, -radius, radius, radius);
  depth.addColorStop(0, "rgba(255,255,255,.34)");
  depth.addColorStop(0.5, "rgba(255,255,255,0)");
  depth.addColorStop(1, "rgba(3,12,22,.46)");
  ctx.fillStyle = depth;
  circle(ctx, 0, 0, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(226,255,248,.88)";
  ctx.lineWidth = Math.max(1.15, radius * 0.075);
  circle(ctx, x, y, radius - ctx.lineWidth * 0.5);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.76 + pulse * 0.12})`;
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.32, y - radius * 0.36, radius * 0.23, radius * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
