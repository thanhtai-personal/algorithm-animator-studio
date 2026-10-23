import type { AlgorithmWorldCell, AlgorithmWorldCompareState, AlgorithmWorldState } from "../algorithms";
import type { Lang } from "../i18n";
import type { Theme } from "./theme";
import { roundRect } from "./shapes";
import { drawTournamentBracket } from "./algorithmWorldTournamentRenderer";

export function drawRaceTrackBase(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  const w = cell * cols;
  const h = cell * rows;
  const lip = Math.max(12, cell * 0.42);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  roundRect(ctx, x - lip + 10, y - lip + 14, w + lip * 2, h + lip * 2, 16);
  ctx.fill();

  const curb = ctx.createLinearGradient(x - lip, y - lip, x + w + lip, y + h + lip);
  curb.addColorStop(0, "#7f1d1d");
  curb.addColorStop(0.5, "#ef4444");
  curb.addColorStop(1, "#111827");
  ctx.fillStyle = curb;
  roundRect(ctx, x - lip, y - lip, w + lip * 2, h + lip * 2, 16);
  ctx.fill();

  const road = ctx.createLinearGradient(x, y, x, y + h);
  road.addColorStop(0, "#2b3442");
  road.addColorStop(0.45, "#171717");
  road.addColorStop(1, "#111827");
  ctx.fillStyle = road;
  roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 8);
  ctx.fill();

  drawAsphaltTexture(ctx, cols, rows, cell, x, y);
  drawLaneGrid(ctx, cols, rows, cell, x, y);
  drawCheckeredGate(ctx, rows, cell, x - lip * 0.45, y, true);
  drawCheckeredGate(ctx, rows, cell, x + w + lip * 0.12, y, false);
  ctx.restore();
}

function drawAsphaltTexture(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tint = (col * 17 + row * 29) % 3;
      ctx.fillStyle = tint === 0 ? "#ffffff" : tint === 1 ? "#64748b" : "#000000";
      ctx.fillRect(x + col * cell + cell * 0.18, y + row * cell + cell * 0.22, Math.max(1, cell * 0.08), Math.max(1, cell * 0.08));
    }
  }
  ctx.restore();
}

function drawLaneGrid(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  const w = cols * cell;
  const h = rows * cell;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= cols; col++) {
    ctx.beginPath(); ctx.moveTo(x + col * cell, y); ctx.lineTo(x + col * cell, y + h); ctx.stroke();
  }
  for (let row = 0; row <= rows; row++) {
    ctx.beginPath(); ctx.moveTo(x, y + row * cell); ctx.lineTo(x + w, y + row * cell); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(253,224,71,0.28)";
  ctx.setLineDash([cell * 0.45, cell * 0.35]);
  ctx.lineWidth = Math.max(1.2, cell * 0.04);
  for (let row = 2; row < rows; row += 4) {
    ctx.beginPath(); ctx.moveTo(x, y + row * cell); ctx.lineTo(x + w, y + row * cell); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCheckeredGate(ctx: CanvasRenderingContext2D, rows: number, cell: number, x: number, y: number, start: boolean) {
  const gateW = Math.max(8, cell * 0.34);
  for (let row = 0; row < rows; row++) {
    ctx.fillStyle = row % 2 === 0 ? "#f8fafc" : "#020617";
    ctx.fillRect(x, y + row * cell, gateW, cell / 2);
    ctx.fillStyle = row % 2 === 0 ? "#020617" : "#f8fafc";
    ctx.fillRect(x, y + row * cell + cell / 2, gateW, cell / 2);
  }
  ctx.fillStyle = start ? "#22d3ee" : "#fb7185";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x - 2, y - 3, gateW + 4, 3);
  ctx.fillRect(x - 2, y + rows * cell, gateW + 4, 3);
  ctx.globalAlpha = 1;
}

export function drawRaceWalls(ctx: CanvasRenderingContext2D, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  ctx.save();
  const lift = Math.max(5, cell * 0.24);
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    ctx.fillStyle = dynamic ? "#7c2d12" : "#1f2937";
    roundRect(ctx, px + 4, py + lift + 4, cell - 2, cell - lift, Math.max(3, cell * 0.12));
    ctx.fill();
    const grad = ctx.createLinearGradient(px, py, px, py + cell);
    grad.addColorStop(0, dynamic ? "#fdba74" : "#f8fafc");
    grad.addColorStop(0.5, dynamic ? "#f97316" : "#cbd5e1");
    grad.addColorStop(1, dynamic ? "#c2410c" : "#94a3b8");
    ctx.fillStyle = grad;
    roundRect(ctx, px, py, cell - 2, cell - lift, Math.max(3, cell * 0.12));
    ctx.fill();
    ctx.strokeStyle = dynamic ? "#fed7aa" : "#ef4444";
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.stroke();
    ctx.fillStyle = dynamic ? "rgba(124,45,18,0.28)" : "rgba(239,68,68,0.18)";
    ctx.fillRect(px + 3, py + cell * 0.32, cell - 8, Math.max(2, cell * 0.08));
  });
  ctx.restore();
}

export function drawRaceWinner(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, cx: number, cy: number, w: number, h: number, theme: Theme, lang: Lang) {
  const age = world.raceWinAge ?? 0;
  const pop = age < 10 ? 0.72 + age * 0.04 : 1 + Math.sin(age * 0.45) * 0.035;
  const base = Math.min(1, Math.max(0.56, h / 210));
  const alpha = Math.min(1, 0.28 + age * 0.12);
  const boxW = Math.min(w * 0.9, 720) * pop;
  const boxH = Math.min(h * 0.74, 150 * base) * pop;
  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, boxW * 0.64);
  glow.addColorStop(0, "rgba(253,224,71,0.22)");
  glow.addColorStop(1, "rgba(253,224,71,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - boxW * 0.75, cy - boxH, boxW * 1.5, boxH * 2);
  ctx.fillStyle = "rgba(2,6,23,0.96)";
  ctx.strokeStyle = age < 10 ? "#fde047" : `${theme.highlight}dd`;
  ctx.lineWidth = Math.max(3, 4 * pop);
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 34 + Math.sin(age * 0.5) * 10;
  roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 22);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  roundRect(ctx, cx - boxW * 0.28, cy - boxH / 2 - 14 * base * pop, boxW * 0.56, 28 * base * pop, 14 * base * pop);
  ctx.fillStyle = "#fde047";
  ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.font = `1000 ${Math.round(14 * base * pop)}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WINNER", cx, cy - boxH / 2 - pop);
  ctx.fillStyle = "#fde047";
  ctx.font = `1000 ${Math.round(46 * base * pop)}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFillText(ctx, world.algorithmName ?? "Algorithm", cx, cy - 6 * base * pop, boxW * 0.86);
  ctx.fillStyle = "#fff";
  ctx.font = `900 ${Math.round(18 * base * pop)}px ui-sans-serif, system-ui`;
  fitFillText(ctx, lang === "vi" ? "Xe thắng đã dừng tại cửa ra" : "Winning car stopped at the exit", cx, cy + 34 * base * pop, boxW * 0.86);
  ctx.restore();
}


export function drawRaceIntroOverlay(
  ctx: CanvasRenderingContext2D,
  compare: AlgorithmWorldCompareState,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang,
) {
  const intro = compare.raceIntro;
  if (!intro || intro.stage === "race") return;
  if (intro.stage === "randomizing") {
    drawRandomArenaRoll(ctx, compare, x, y, w, h, theme, lang);
    return;
  }
  const cx = x + w / 2;
  const cy = y + h * 0.46;
  const progress = Math.min(1, Math.max(0, (intro.tick + 1) / Math.max(1, intro.duration)));
  ctx.save();
  ctx.fillStyle = intro.stage === "winner" ? "rgba(2,6,23,0.72)" : "rgba(2,6,23,0.5)";
  ctx.fillRect(x, y, w, h);
  drawCinematicParticles(ctx, x, y, w, h, theme.highlight, intro.tick);

  if (intro.stage === "assembling") {
    drawGlassCard(ctx, cx, cy, Math.min(780, w * 0.86), 190, theme.highlight, 0.95);
    drawCenteredText(ctx, label(lang, "ĐANG RÁP SÂN ĐẤU", "ASSEMBLING ARENA"), cx, cy - 54, 30, "#a5f3fc", 900);
    drawCenteredText(ctx, localizedMazeName(intro, lang), cx, cy - 6, 50, "#fff", 1000);
    drawProgressBar(ctx, cx - Math.min(560, w * 0.62) / 2, cy + 54, Math.min(560, w * 0.62), 14, intro.assemblyProgress ?? progress, theme.highlight);
    ctx.restore();
    return;
  }

  if (intro.stage === "bracket" && intro.tournament) {
    drawTournamentBracket(ctx, intro.tournament, x, y, w, h, theme, lang, intro.tick, intro.duration);
    ctx.restore();
    return;
  }

  if (intro.stage === "winner") {
    const pop = progress < 0.28 ? 0.75 + progress * 0.9 : 1 + Math.sin(intro.tick * 0.36) * 0.025;
    drawGlassCard(ctx, cx, cy, Math.min(820, w * 0.9) * pop, 250 * pop, "#fde047", 0.97);
    const winner = intro.tie ? label(lang, "HÒA", "TIE") : intro.winnerName ?? "WINNER";
    drawCenteredText(ctx, label(lang, "🏁 CHIẾN THẮNG", "🏁 WINNER"), cx, cy - 70 * pop, 34 * pop, "#fde047", 1000, w * 0.78);
    drawCenteredText(ctx, winner, cx, cy - 8 * pop, 60 * pop, "#fff", 1000, w * 0.72);
    drawCenteredText(ctx, label(lang, "Xe thắng được đưa lên giữa video", "Winner spotlight in the center"), cx, cy + 62 * pop, 22 * pop, "#a5f3fc", 900, w * 0.78);
    ctx.restore();
    return;
  }

  if (intro.stage === "countdown") {
    const countdownStep = Math.min(3, Math.floor(progress * 4));
    const text = countdownStep < 3 ? String(3 - countdownStep) : "START";
    const pulse = 1 + Math.sin(intro.tick * 0.55) * 0.08;
    drawCenteredText(ctx, text, cx, cy, Math.min(text === "START" ? 132 : 190, w * (text === "START" ? 0.13 : 0.18)) * pulse, "#fde047", 1000, w * 0.72);
    drawCenteredText(ctx, label(lang, "Chuẩn bị xuất phát", "Ready to launch"), cx, cy + Math.min(130, h * 0.17), 28, "#a5f3fc", 900, w * 0.76);
    ctx.restore();
    return;
  }

  drawVersusIntro(ctx, intro.leftName, intro.rightName, x, y, w, h, progress, intro.tick, theme.highlight);
  ctx.restore();
}

export function shouldDrawRaceIntroOnly(compare: AlgorithmWorldCompareState) {
  const stage = compare.raceIntro?.stage;
  return stage === "bracket" || stage === "randomizing" || stage === "assembling" || stage === "versus";
}

function drawRandomArenaRoll(ctx: CanvasRenderingContext2D, compare: AlgorithmWorldCompareState, x: number, y: number, w: number, h: number, theme: Theme, lang: Lang) {
  const intro = compare.raceIntro!;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.94)";
  ctx.fillRect(x, y, w, h);
  drawCinematicParticles(ctx, x, y, w, h, theme.highlight, intro.tick);
  drawCenteredText(ctx, label(lang, "🎲 RANDOM SÂN ĐẤU", "🎲 RANDOM ARENA"), cx, y + h * 0.19, Math.min(58, w * 0.055), "#fde047", 1000);
  drawCenteredText(ctx, label(lang, "Đang chọn mê cung cho trận đua", "Picking the maze for this race"), cx, y + h * 0.27, 24, "#a5f3fc", 900);
  const names = lang === "vi" ? intro.candidatesVi ?? [] : intro.candidatesEn ?? [];
  const active = names.length ? (intro.pickedIndex ?? intro.tick) % names.length : 0;
  const itemW = Math.min(560, w * 0.76);
  names.slice(0, 7).forEach((name, index) => {
    const relative = index - active;
    const wrapped = ((relative + names.length + 3) % names.length) - 3;
    if (Math.abs(wrapped) > 2) return;
    const yy = cy + wrapped * 56;
    const scale = wrapped === 0 ? 1.08 : 0.88;
    const alpha = wrapped === 0 ? 1 : 0.45;
    drawGlassCard(ctx, cx, yy, itemW * scale, 42, wrapped === 0 ? "#fde047" : theme.highlight, alpha);
    drawCenteredText(ctx, name, cx, yy + 1, wrapped === 0 ? 25 : 20, wrapped === 0 ? "#fff" : "#cbd5e1", 900);
  });
  drawCenteredText(ctx, `${intro.leftName}  VS  ${intro.rightName}`, cx, y + h * 0.82, 28, "#fff", 1000);
  ctx.restore();
}

function drawCinematicParticles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, tick: number) {
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = color;
  const step = Math.max(42, Math.min(72, w / 12));
  for (let yy = y + 28; yy < y + h - 20; yy += step) {
    for (let xx = x + 28; xx < x + w - 20; xx += step) {
      const wave = Math.sin((xx + yy + tick * 12) * 0.018);
      const r = 1.2 + Math.max(0, wave) * 1.8;
      ctx.beginPath();
      ctx.arc(xx + wave * 5, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGlassCard(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, stroke: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2,6,23,0.9)";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 28;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 26);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, tick: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 2;
  for (let i = -10; i < 18; i++) {
    const xx = x + ((i * 86 + tick * 18) % (w + 220)) - 120;
    ctx.beginPath();
    ctx.moveTo(xx, y + h);
    ctx.lineTo(xx + h * 0.48, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVersusIntro(ctx: CanvasRenderingContext2D, left: string, right: string, x: number, y: number, w: number, h: number, progress: number, tick: number, color: string) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const enter = easeOutBack(Math.min(1, progress / 0.42));
  const settle = easeOutCubic(Math.min(1, Math.max(0, (progress - 0.7) / 0.3)));
  const isPortrait = h > w * 0.95;
  const leftTarget = isPortrait ? { x: x + w * 0.5, y: y + h * 0.14 } : { x: x + w * 0.22, y: y + 44 };
  const rightTarget = isPortrait ? { x: x + w * 0.5, y: y + h * 0.86 } : { x: x + w * 0.78, y: y + 44 };
  const leftX = lerp(lerp(x - w * 0.22, x + w * 0.28, enter), leftTarget.x, settle);
  const rightX = lerp(lerp(x + w * 1.22, x + w * 0.72, enter), rightTarget.x, settle);
  const leftY = lerp(cy - h * 0.11, leftTarget.y, settle);
  const rightY = lerp(cy + h * 0.11, rightTarget.y, settle);
  const vsPop = 1 + Math.max(0, Math.sin(Math.min(1, Math.max(0, (progress - 0.38) / 0.28)) * Math.PI)) * 0.45;
  drawSpeedLines(ctx, x, y, w, h, color, tick);
  ctx.save();
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = Math.max(5, w * 0.006);
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h * 0.84);
  ctx.lineTo(x + w * 0.9, y + h * 0.16);
  ctx.stroke();
  ctx.restore();
  drawTeamPlate(ctx, left, leftX, leftY, Math.min(460, w * 0.36), "#22d3ee");
  drawTeamPlate(ctx, right, rightX, rightY, Math.min(460, w * 0.36), "#fb7185");
  drawCenteredText(ctx, "VS", cx, cy, Math.min(126, w * 0.12) * vsPop, "#fde047", 1000, w * 0.35);
}

function drawTeamPlate(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, w: number, color: string) {
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.88)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  roundRect(ctx, cx - w / 2, cy - 32, w, 64, 18);
  ctx.fill(); ctx.stroke();
  ctx.restore();
  drawCenteredText(ctx, text, cx, cy, 32, "#fff", 1000, w * 0.86);
}

function drawProgressBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, progress: number, color: string) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(148,163,184,0.22)";
  ctx.fill();
  roundRect(ctx, x, y, w * Math.min(1, Math.max(0, progress)), h, h / 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
}

function drawCenteredText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight: number, maxWidth?: number) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  let fittedSize = size;
  ctx.font = `${Math.round(fittedSize)}px ui-sans-serif, system-ui`;
  while (maxWidth && fittedSize > 14 && ctx.measureText(text).width > maxWidth) {
    fittedSize -= 2;
    ctx.font = `${Math.round(fittedSize)}px ui-sans-serif, system-ui`;
  }
  ctx.lineWidth = Math.max(4, size * 0.08);
  ctx.strokeStyle = "rgba(2,6,23,0.82)";
  ctx.strokeText(text, x, y);
  ctx.font = `${weight} ${Math.round(fittedSize)}px ui-sans-serif, system-ui`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function fitFillText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth?: number) {
  if (!maxWidth || ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  const scale = maxWidth / ctx.measureText(text).width;
  ctx.save();
  ctx.scale(scale, 1);
  ctx.fillText(text, x / scale, y);
  ctx.restore();
}

function localizedMazeName(intro: AlgorithmWorldCompareState["raceIntro"], lang: Lang) {
  if (!intro) return "";
  return lang === "vi" ? intro.mazeNameVi : intro.mazeNameEn;
}

function localizedMazeLine(intro: NonNullable<AlgorithmWorldCompareState["raceIntro"]>, lang: Lang) {
  return lang === "vi" ? `${intro.leftName} VS ${intro.rightName} tại ${intro.mazeNameVi}` : `${intro.leftName} VS ${intro.rightName} at ${intro.mazeNameEn}`;
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}

function easeOutBack(value: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
