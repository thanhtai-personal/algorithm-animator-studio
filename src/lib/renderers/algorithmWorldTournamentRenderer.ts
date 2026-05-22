import type { AlgorithmWorldTournamentMatch, AlgorithmWorldTournamentState } from "../algorithms";
import type { Lang } from "../i18n";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawTournamentBracket(
  ctx: CanvasRenderingContext2D,
  tournament: AlgorithmWorldTournamentState,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang,
  tick: number,
  duration: number,
) {
  const progress = Math.min(1, (tick + 1) / Math.max(1, duration));
  const title = lang === "vi" ? tournament.titleVi : tournament.titleEn;
  const cx = x + w / 2;
  const isLandscape = w > h * 1.2;
  const trophyY = y + (isLandscape ? Math.max(36, h * 0.075) : h * 0.065);
  const titleY = trophyY + (isLandscape ? 40 : 44);
  const subtitleY = titleY + (isLandscape ? 30 : 38);
  const bracketX = x + w * 0.045;
  const bracketY = y + (isLandscape ? h * 0.3 : h * 0.24);
  const bracketW = w * 0.91;
  const bracketH = h * (isLandscape ? 0.56 : 0.58);
  ctx.save();
  drawTrophy(ctx, cx, trophyY);
  drawCenteredText(ctx, title, cx, titleY, Math.min(isLandscape ? 36 : 42, w * 0.048), "#fde047", 1000);
  drawCenteredText(ctx, label(lang, "Đội thắng tiến vào vòng trong", "Winner advances to the next round"), cx, subtitleY, isLandscape ? 18 : 21, "#a5f3fc", 900);
  drawBracketConnectors(ctx, tournament, bracketX, bracketY, bracketW, bracketH, theme.highlight, progress);
  tournament.rounds.forEach((round, roundIndex) => {
    const colW = bracketColumnWidth(bracketW);
    const colX = bracketColumnX(roundIndex, bracketX, bracketW, colW);
    const roundLabel = [label(lang, "Tứ kết", "Quarterfinals"), label(lang, "Bán kết", "Semifinals"), label(lang, "Chung kết", "Final")][roundIndex];
    drawCenteredText(ctx, roundLabel, colX + colW / 2, bracketY - 28, 20, "#cbd5e1", 900);
    round.forEach((match, matchIndex) => {
      const pos = bracketMatchPosition(roundIndex, matchIndex, bracketX, bracketY, bracketW, bracketH, colW);
      drawBracketMatch(ctx, match, pos.x, pos.y, colW, pos.h, theme.highlight, lang, progress);
    });
  });
  drawAdvancingWinner(ctx, tournament, bracketX, bracketY, bracketW, bracketH, progress, lang);
  if (tournament.winnerName) {
    const bannerY = y + h * 0.91;
    drawGlassCard(ctx, cx, bannerY, Math.min(690, w * 0.82), 76, "#fde047", 0.94);
    drawCenteredText(ctx, `${tournament.winnerName} ➜ ${label(lang, "VÒNG TRONG", "NEXT ROUND")}`, cx, bannerY, 28, "#fff", 1000);
  }
  ctx.restore();
}

function drawBracketConnectors(
  ctx: CanvasRenderingContext2D,
  tournament: AlgorithmWorldTournamentState,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  progress: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.24 + progress * 0.35;
  ctx.lineWidth = 3;
  for (let round = 0; round < 2; round++) {
    const count = tournament.rounds[round].length;
    for (let i = 0; i < count; i += 2) {
      const colW = bracketColumnWidth(w);
      const fromA = bracketMatchPosition(round, i, x, y, w, h, colW);
      const fromB = bracketMatchPosition(round, i + 1, x, y, w, h, colW);
      const to = bracketMatchPosition(round + 1, i / 2, x, y, w, h, colW);
      const midX = fromA.x + fromA.w + (to.x - fromA.x - fromA.w) * 0.46;
      ctx.beginPath();
      ctx.moveTo(fromA.x + fromA.w, fromA.y + fromA.h / 2);
      ctx.lineTo(midX, fromA.y + fromA.h / 2);
      ctx.lineTo(midX, fromB.y + fromB.h / 2);
      ctx.lineTo(fromB.x + fromB.w, fromB.y + fromB.h / 2);
      ctx.moveTo(midX, to.y + to.h / 2);
      ctx.lineTo(to.x, to.y + to.h / 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function bracketMatchPosition(round: number, match: number, x: number, y: number, w: number, h: number, colW: number) {
  const colX = bracketColumnX(round, x, w, colW);
  const matchH = bracketMatchHeight(h);
  if (round <= 0) {
    const count = 4;
    const gap = (h - count * matchH) / (count - 1);
    return { x: colX, y: y + match * (matchH + gap), w: colW, h: matchH };
  }
  const fromA = bracketMatchPosition(round - 1, match * 2, x, y, w, h, colW);
  const fromB = bracketMatchPosition(round - 1, match * 2 + 1, x, y, w, h, colW);
  const centerY = (fromA.y + fromA.h / 2 + fromB.y + fromB.h / 2) / 2;
  return { x: colX, y: centerY - matchH / 2, w: colW, h: matchH };
}

function bracketMatchHeight(h: number) {
  return Math.min(72, h / (4 * 1.34));
}

function bracketColumnWidth(w: number) {
  return Math.min(220, Math.max(112, w * 0.25));
}

function bracketColumnX(round: number, x: number, w: number, colW: number) {
  return x + round * ((w - colW) / 2);
}

function drawBracketMatch(
  ctx: CanvasRenderingContext2D,
  match: AlgorithmWorldTournamentMatch,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lang: Lang,
  progress: number,
) {
  const stroke = match.active ? "#fde047" : match.winner ? color : "rgba(148,163,184,0.38)";
  ctx.save();
  ctx.globalAlpha = match.pending && !match.active ? 0.62 : 0.95;
  ctx.fillStyle = "rgba(2,6,23,0.86)";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = match.active ? 3.5 : 2;
  if (match.active) { ctx.shadowColor = "#fde047"; ctx.shadowBlur = 18 * progress; }
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
  drawTeamRow(ctx, match.left?.name, match.winner?.name === match.left?.name, x + 10, y + 10, w - 20, h / 2 - 12, lang);
  drawTeamRow(ctx, match.right?.name, match.winner?.name === match.right?.name, x + 10, y + h / 2 + 2, w - 20, h / 2 - 12, lang);
  if (match.winner) {
    ctx.fillStyle = "#fde047";
    ctx.font = "900 15px ui-sans-serif, system-ui";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("➜", x + w - 12, y + h / 2);
  }
  ctx.restore();
}

function drawTeamRow(ctx: CanvasRenderingContext2D, name: string | undefined, winner: boolean, x: number, y: number, w: number, h: number, lang: Lang) {
  ctx.save();
  if (!name) {
    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.setLineDash([5, 5]);
    roundRect(ctx, x, y, w, h, 9);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (winner) {
    ctx.fillStyle = "rgba(250,204,21,0.18)";
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
  }
  ctx.fillStyle = winner ? "#fde047" : "#f8fafc";
  ctx.font = `900 ${winner ? 17 : 15}px ui-sans-serif, system-ui`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(winner ? `🏁 ${name}` : name, x + 9, y + h / 2, w - 18);
  if (winner) {
    ctx.fillStyle = "#a5f3fc";
    ctx.font = "800 11px ui-sans-serif, system-ui";
    ctx.textAlign = "right";
    ctx.fillText(lang === "vi" ? "ĐI TIẾP" : "ADV", x + w - 8, y + h / 2);
  }
  ctx.restore();
}

function drawAdvancingWinner(
  ctx: CanvasRenderingContext2D,
  tournament: AlgorithmWorldTournamentState,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  lang: Lang,
) {
  if (!tournament.winnerName || tournament.round >= 2) return;
  const active = tournament.rounds[tournament.round]?.[tournament.match];
  if (!active?.winner) return;
  const colW = bracketColumnWidth(w);
  const fromMatch = bracketMatchPosition(tournament.round, tournament.match, x, y, w, h, colW);
  const toMatch = bracketMatchPosition((tournament.round + 1) as 0 | 1 | 2, Math.floor(tournament.match / 2), x, y, w, h, colW);
  const fromSlot = active.winner.name === active.right?.name ? 1 : 0;
  const toSlot = tournament.match % 2;
  const rowH = fromMatch.h / 2 - 12;
  const from = rowCenter(fromMatch.x + 10, fromMatch.y + (fromSlot ? fromMatch.h / 2 + 2 : 10), fromMatch.w - 20, rowH);
  const to = rowCenter(toMatch.x + 10, toMatch.y + (toSlot ? toMatch.h / 2 + 2 : 10), toMatch.w - 20, rowH);
  const move = easeInOut(Math.min(1, Math.max(0, (progress - 0.18) / 0.72)));
  const cx = lerp(from.x, to.x, move);
  const cy = lerp(from.y, to.y, move);
  drawFlyingTeam(ctx, active.winner.name, cx, cy, fromMatch.w - 20, rowH, move, lang);
}

function rowCenter(x: number, y: number, w: number, h: number) {
  return { x: x + w / 2, y: y + h / 2 };
}

function drawFlyingTeam(ctx: CanvasRenderingContext2D, name: string, cx: number, cy: number, w: number, h: number, progress: number, lang: Lang) {
  ctx.save();
  ctx.globalAlpha = 0.72 + progress * 0.28;
  ctx.fillStyle = "rgba(250,204,21,0.2)";
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 2.4;
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 18;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 10);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fde047";
  ctx.font = "900 16px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`🏁 ${name}`, cx - w / 2 + 9, cy, w - 18);
  ctx.fillStyle = "#a5f3fc";
  ctx.font = "800 10px ui-sans-serif, system-ui";
  ctx.textAlign = "right";
  ctx.fillText(lang === "vi" ? "CHỜ ĐẤU" : "WAITING", cx + w / 2 - 8, cy);
  ctx.restore();
}

function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawTrophy(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 18;
  ctx.font = "900 38px ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🏆", cx, cy);
  ctx.restore();
}

function drawGlassCard(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, stroke: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2,6,23,0.9)";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 22;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 22);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCenteredText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight: number) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = `${weight} ${Math.round(size)}px ui-sans-serif, system-ui`;
  ctx.lineWidth = Math.max(4, size * 0.08);
  ctx.strokeStyle = "rgba(2,6,23,0.82)";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}
