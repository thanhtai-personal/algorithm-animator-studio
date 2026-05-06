import type { Frame } from "./algorithms";
import { roundRect } from "./rendering/shapes";
import type { Theme } from "./rendering/theme";

export function drawCodePanel(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  code: string,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  theme: Theme,
  canvasHeight: number,
) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  roundRect(ctx, cx, cy, cw, ch, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.12)";
  roundRect(ctx, cx, cy, cw, 56, 24);
  ctx.fill();
  ctx.fillStyle = theme.highlight;
  ctx.beginPath(); ctx.arc(cx + 28, cy + 28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Code (JS)", cx + 52, cy + 36);

  const varsStr = Object.entries(frame.vars).map(([k, v]) => `${k}=${v}`).join("  ");
  if (varsStr) {
    ctx.fillStyle = theme.highlight;
    ctx.font = "500 22px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(varsStr.slice(0, 80), cx + cw - 24, cy + 36);
  }

  const lines = code.split("\n");
  const fontSize = Math.max(16, Math.round(canvasHeight * 0.013));
  const lineH = fontSize + 8;
  ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
  ctx.textBaseline = "top";
  const codeStartY = cy + 72;
  const maxLines = Math.floor((ch - 80) / lineH);
  const current = frame.line;
  let startLine = Math.max(0, current - Math.floor(maxLines / 2));
  startLine = Math.min(startLine, Math.max(0, lines.length - maxLines));
  for (let i = 0; i < Math.min(maxLines, lines.length - startLine); i++) {
    const idx = startLine + i;
    const y = codeStartY + i * lineH;
    if (idx === current) {
      ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
      ctx.fillRect(cx + 12, y - 4, cw - 24, lineH);
    }
    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.textAlign = "right";
    ctx.fillText(String(idx + 1).padStart(2, " "), cx + 56, y);
    ctx.fillStyle = idx === current ? "#fde68a" : "#cbd5e1";
    ctx.textAlign = "left";
    ctx.fillText(lines[idx] ?? "", cx + 76, y);
  }
  ctx.textBaseline = "alphabetic";
}
