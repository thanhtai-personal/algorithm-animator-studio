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
  const top = y + h * 0.1;
  const bracketX = x + w * 0.055;
  const bracketY = y + h * 0.22;
  const bracketW = w * 0.89;
  const bracketH = h * 0.64;
  ctx.save();
  drawCenteredText(ctx, title, cx, top, Math.min(46, w * 0.05), "#fde047", 1000);
  drawCenteredText(ctx, label(lang, "Đội thắng tiến vào vòng trong", "Winner advances to the next round"), cx, top + 42, 23, "#a5f3fc", 900);
  drawBracketConnectors(ctx, tournament, bracketX, bracketY, bracketW, bracketH, theme.highlight, progress);
  tournament.rounds.forEach((round, roundIndex) => {
    const colX = bracketX + roundIndex * (bracketW / 2);
    const colW = Math.min(270, bracketW * 0.28);
    const roundLabel = [label(lang, "Tứ kết", "Quarterfinals"), label(lang, "Bán kết", "Semifinals"), label(lang, "Chung kết", "Final")][roundIndex];
    drawCenteredText(ctx, roundLabel, colX + colW / 2, bracketY - 28, 20, "#cbd5e1", 900);
    round.forEach((match, matchIndex) => {
      const pos = bracketMatchPosition(roundIndex, matchIndex, bracketX, bracketY, bracketW, bracketH, colW);
      drawBracketMatch(ctx, match, pos.x, pos.y, colW, pos.h, theme.highlight, lang, progress);
    });
  });
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
      const fromA = bracketMatchPosition(round, i, x, y, w, h, Math.min(270, w * 0.28));
      const fromB = bracketMatchPosition(round, i + 1, x, y, w, h, Math.min(270, w * 0.28));
      const to = bracketMatchPosition(round + 1, i / 2, x, y, w, h, Math.min(270, w * 0.28));
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
  const counts = [4, 2, 1];
  const count = counts[round] ?? 1;
  const colX = x + round * (w / 2);
  const matchH = Math.min(84, h / (count * 1.25));
  const gap = count === 1 ? 0 : (h - count * matchH) / (count - 1);
  return { x: colX, y: y + match * (matchH + gap), w: colW, h: matchH };
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
  drawTeamRow(ctx, match.left?.name ?? "—", match.winner?.name === match.left?.name, x + 10, y + 10, w - 20, h / 2 - 12, lang);
  drawTeamRow(ctx, match.right?.name ?? "—", match.winner?.name === match.right?.name, x + 10, y + h / 2 + 2, w - 20, h / 2 - 12, lang);
  if (match.winner) {
    ctx.fillStyle = "#fde047";
    ctx.font = "900 15px ui-sans-serif, system-ui";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("➜", x + w - 12, y + h / 2);
  }
  ctx.restore();
}

function drawTeamRow(ctx: CanvasRenderingContext2D, name: string, winner: boolean, x: number, y: number, w: number, h: number, lang: Lang) {
  ctx.save();
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
