type KineticTextCard = {
  top?: string;
  main: string;
  bottom?: string;
  accent?: string;
  invert?: boolean;
  rotate?: number;
};

const W = 1920;

export function drawKineticTextCard(ctx: CanvasRenderingContext2D, card: KineticTextCard, local: number, accent: string) {
  const effect = pickTextEffect(card);
  if (effect === "slide") return drawSlideText(ctx, card, local, accent);
  if (effect === "split") return drawSplitText(ctx, card, local, accent);
  if (effect === "wave") return drawWaveText(ctx, card, local, accent);
  if (effect === "stack") return drawStackText(ctx, card, local, accent);
  return drawStampText(ctx, card, local, accent);
}

function drawStampText(ctx: CanvasRenderingContext2D, card: KineticTextCard, local: number, accent: string) {
  const inEase = easeOutBack(clamp01(local / 0.22));
  const outEase = local > 0.74 ? easeOutCubic((local - 0.74) / 0.26) : 0;
  const scale = (0.58 + 0.44 * inEase) * (1 - 0.18 * outEase);
  const y = 390 + (1 - inEase) * 95 - outEase * 92;
  const x = W / 2 + (1 - inEase) * (card.rotate && card.rotate < 0 ? -180 : 180);
  drawTextBlock(ctx, card, { x, y, scale, rotate: ((card.rotate ?? 0) * Math.PI) / 180 * inEase, accent });
}

function drawSlideText(ctx: CanvasRenderingContext2D, card: KineticTextCard, local: number, accent: string) {
  const enter = easeOutCubic(clamp01(local / 0.28));
  const exit = local > 0.78 ? easeOutCubic((local - 0.78) / 0.22) : 0;
  const textColor = card.invert ? "#050505" : "#ffffff";
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  if (card.top) drawFitted(ctx, card.top, W / 2 - (1 - enter) * 520, 238 - exit * 70, 48, 760, 900);
  drawFitted(ctx, card.main, W / 2 + (1 - enter) * 650, 410 - exit * 90, 168, 1420, 950);
  if (card.bottom) {
    ctx.fillStyle = card.invert ? "rgba(5,5,5,0.72)" : accent;
    drawFitted(ctx, card.bottom, W / 2 - (1 - enter) * 520, 515 - exit * 80, 60, 1280, 900);
  }
  ctx.restore();
}

function drawSplitText(ctx: CanvasRenderingContext2D, card: KineticTextCard, local: number, accent: string) {
  const enter = easeOutBack(clamp01(local / 0.34));
  const exit = local > 0.76 ? easeOutCubic((local - 0.76) / 0.24) : 0;
  const chars = Array.from(card.main);
  const baseSize = fitFontSize(ctx, card.main, 170, 1320, 82, 950);
  const totalWidth = measureChars(ctx, chars, baseSize, 950);
  let x = W / 2 - totalWidth / 2;
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = card.invert ? "#050505" : "#ffffff";
  if (card.top) drawFitted(ctx, card.top, W / 2, 240, 48, 760, 900);
  ctx.font = `950 ${baseSize}px ui-sans-serif, system-ui, sans-serif`;
  chars.forEach((char, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const y = 414 + side * (1 - enter) * 180 - exit * 100;
    ctx.fillText(char, x + side * (1 - enter) * 260, y);
    x += ctx.measureText(char).width;
  });
  if (card.bottom) {
    ctx.fillStyle = card.invert ? "rgba(5,5,5,0.72)" : accent;
    drawFitted(ctx, card.bottom, W / 2, 520 + (1 - enter) * 70, 60, 1280, 900);
  }
  ctx.restore();
}

function drawWaveText(ctx: CanvasRenderingContext2D, card: KineticTextCard, local: number, accent: string) {
  const enter = easeOutCubic(clamp01(local / 0.24));
  const chars = Array.from(card.main);
  const baseSize = fitFontSize(ctx, card.main, 164, 1340, 78, 950);
  const totalWidth = measureChars(ctx, chars, baseSize, 950);
  let x = W / 2 - totalWidth / 2;
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = card.invert ? "#050505" : "#ffffff";
  if (card.top) drawFitted(ctx, card.top, W / 2, 238, 48, 760, 900);
  ctx.font = `950 ${baseSize}px ui-sans-serif, system-ui, sans-serif`;
  chars.forEach((char, index) => {
    const delay = index / Math.max(1, chars.length - 1);
    const charIn = easeOutBack(clamp01((local - delay * 0.22) / 0.24));
    const wave = Math.sin(local * Math.PI * 4 + index * 0.7) * 22;
    ctx.fillText(char, x, 412 + wave * enter + (1 - charIn) * 120);
    x += ctx.measureText(char).width;
  });
  if (card.bottom) {
    ctx.fillStyle = card.invert ? "rgba(5,5,5,0.72)" : accent;
    drawFitted(ctx, card.bottom, W / 2, 520, 60, 1280, 900);
  }
  ctx.restore();
}

function drawStackText(ctx: CanvasRenderingContext2D, card: KineticTextCard, local: number, accent: string) {
  const enter = easeOutBack(clamp01(local / 0.28));
  const exit = local > 0.78 ? easeOutCubic((local - 0.78) / 0.22) : 0;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = card.invert ? "#050505" : "#ffffff";
  if (card.top) drawFitted(ctx, card.top, W / 2, 230 + (1 - enter) * 80, 48, 780, 900);
  drawFitted(ctx, card.main, W / 2, 396 + (1 - enter) * 120 - exit * 96, 158, 1380, 950);
  if (card.bottom) {
    ctx.fillStyle = card.invert ? "rgba(5,5,5,0.72)" : accent;
    drawFitted(ctx, card.bottom, W / 2, 516 + (1 - enter) * 150, 60, 1280, 900);
  }
  ctx.restore();
}

function drawTextBlock(ctx: CanvasRenderingContext2D, card: KineticTextCard, opts: { x: number; y: number; scale: number; rotate: number; accent: string }) {
  ctx.save();
  ctx.translate(opts.x, opts.y);
  ctx.rotate(opts.rotate);
  ctx.scale(opts.scale, opts.scale);
  ctx.textAlign = "center";
  ctx.fillStyle = card.invert ? "#050505" : "#ffffff";
  if (card.top) drawFitted(ctx, card.top, 0, -140, 48, 760, 900);
  drawFitted(ctx, card.main, 0, 20, 174, 1280, 950);
  if (card.bottom) {
    ctx.fillStyle = card.invert ? "rgba(5,5,5,0.7)" : opts.accent;
    drawFitted(ctx, card.bottom, 0, 108, 62, 1180, 900);
  }
  ctx.restore();
}

function pickTextEffect(card: KineticTextCard) {
  const text = `${card.top ?? ""} ${card.main} ${card.bottom ?? ""}`.toLowerCase();
  if (text.includes(">") || text.includes("swap") || text.includes("đổi")) return "split";
  if (text.includes("o(") || text.includes("case") || text.includes("stable")) return "stack";
  if (text.includes("scan") || text.includes("quét") || text.includes("right") || text.includes("pass")) return "slide";
  if (text.length <= 12 || /\d/.test(text)) return "wave";
  return "stamp";
}

function drawFitted(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, weight: number) {
  const fitted = fitFontSize(ctx, text, size, maxWidth, Math.max(28, size * 0.48), weight);
  ctx.font = `${weight} ${fitted}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(text, x, y);
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, initial: number, maxWidth: number, min: number, weight: number) {
  let size = initial;
  while (size > min) {
    ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  }
  return min;
}

function measureChars(ctx: CanvasRenderingContext2D, chars: string[], size: number, weight: number) {
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
  return chars.reduce((total, char) => total + ctx.measureText(char).width, 0);
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

function easeOutBack(value: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  const safe = clamp01(value);
  return 1 + c3 * Math.pow(safe - 1, 3) + c1 * Math.pow(safe - 1, 2);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
