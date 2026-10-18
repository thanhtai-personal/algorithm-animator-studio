/** Deterministic 640x360 battle scene, inspired by a user-supplied gameplay reference.
 * All characters, HUD and effects are drawn procedurally; no third-party sprites.
 */
export const DUEL_WIDTH = 640;
export const DUEL_HEIGHT = 360;
export const DUEL_FPS = 30;
export const DUEL_DURATION = 16;
export const DUEL_FRAMES = DUEL_FPS * DUEL_DURATION;

export type DuelOptions = {
  seed: number;
  glow: number;
  showHud: boolean;
};

const TAU = Math.PI * 2;
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n: number) => { const x = clamp(n); return x * x * (3 - 2 * x); };
const wave = (n: number) => Math.sin(n);
const random = (seed: number) => {
  const value = Math.sin(seed * 129.31 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function line(ctx: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number, color: string, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function background(ctx: CanvasRenderingContext2D, time: number, seed: number) {
  const wall = ctx.createLinearGradient(0, 0, 0, 310);
  wall.addColorStop(0, "#020613");
  wall.addColorStop(0.58, "#031122");
  wall.addColorStop(1, "#051b30");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 640, 360);
  const haze = ctx.createRadialGradient(45, 198, 10, 220, 180, 390);
  haze.addColorStop(0, "rgba(4,85,142,.3)");
  haze.addColorStop(1, "rgba(2,12,30,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, 640, 305);

  // Circuit-board wall and illuminated diamond-shaped reactor lights.
  for (let i = 0; i < 66; i++) {
    const y = 115 + (i % 17) * 10;
    const x = 20 + ((i * 137) % 600);
    const t = (i % 4) * 18 + 8;
    line(ctx, x, y, x + t, y, "rgba(31,102,155,.13)");
    if (i % 3 === 0) line(ctx, x + t, y, x + t, y + 14, "rgba(31,102,155,.15)");
    circle(ctx, x, y, 0.7, "rgba(39,143,195,.2)");
  }
  for (const x of [54, 223, 389, 560]) {
    const y = 131;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = "rgba(37,136,203,.18)";
    for (let ring = 16; ring < 41; ring += 6) ctx.strokeRect(-ring / 2, -ring / 2, ring, ring);
    ctx.restore();
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 43);
    glow.addColorStop(0, "#30e9ff");
    glow.addColorStop(0.18, "rgba(15,161,246,.64)");
    glow.addColorStop(0.55, "rgba(11,71,156,.14)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 47, y - 47, 94, 94);
    circle(ctx, x, y, 5, "#46ddff");
  }

  for (let i = 0; i < 17; i++) {
    const x = random(seed + i * 14) * 640;
    const y = ((random(seed + i * 17 + 8) * 290 + time * (3 + i % 4)) % 290);
    circle(ctx, x, y, i % 4 === 0 ? 2 : 1, "rgba(38,220,237,.56)");
  }
  ctx.fillStyle = "#010208";
  ctx.fillRect(0, 291, 640, 69);
  line(ctx, 0, 290, 640, 290, "#54a8e9", 1.4);
  line(ctx, 0, 293, 640, 293, "rgba(22,104,192,.36)", 2);
  for (let x = 0; x < 640; x += 19) {
    line(ctx, x, 295, x + 2, 302, "rgba(15,61,100,.24)");
  }
  for (let y = 0; y < 360; y += 4) {
    ctx.fillStyle = "rgba(0,0,8,.055)";
    ctx.fillRect(0, y, 640, 1);
  }
}

function robot(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y + wave(time * 7) * 1.3);
  circle(ctx, 0, -1, 11, "rgba(0,182,225,.1)");
  line(ctx, -6, -10, -9, -1, "#fa70a7", 4);
  line(ctx, 6, -10, 9, -1, "#fa70a7", 4);
  line(ctx, -9, -1, -13, 0, "#ec84bf", 3);
  line(ctx, 9, -1, 13, 0, "#ec84bf", 3);
  rounded(ctx, -9, -25, 18, 17, 3, "#6b94a9");
  rounded(ctx, -13, -38, 26, 18, 3, "#86aab9");
  rounded(ctx, -10, -35, 20, 12, 2, "#103b59");
  circle(ctx, -4, -29, 2, "#40d5ff");
  circle(ctx, 4, -29, 2, "#40d5ff");
  line(ctx, -11, -37, 11, -37, "#b4eaff", 1.2);
  line(ctx, -10, -18, 10, -18, "#a4f5ff", 1.5);
  circle(ctx, 0, -12, 3, "#29e7ff");
  ctx.restore();
}

function skeleton(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, stagger: number, hp: number) {
  ctx.save();
  ctx.translate(x, y - stagger * 12 + wave(time * 4) * 1.5);
  ctx.rotate(stagger * 0.1);
  ctx.lineCap = "round";
  const bone = "#a9b5d2";
  line(ctx, -1, -39, -5, -19, bone, 4);
  line(ctx, -5, -19, -10, -9, bone, 3);
  line(ctx, -10, -9, -13, -1, bone, 2);
  line(ctx, -5, -19, 5, -8, bone, 3);
  line(ctx, 5, -8, 4, 0, bone, 2);
  line(ctx, -4, -36, 10, -25, bone, 3);
  line(ctx, 10, -25, 16, -12, bone, 2);
  line(ctx, -4, -34, -12, -22, bone, 3);
  line(ctx, -12, -22, -8, -13, bone, 2);
  for (let i = 0; i < 4; i++) line(ctx, -6, -33 + i * 3, 4, -33 + i * 3, "#bcc7df", 1);
  rounded(ctx, -13, -59, 26, 21, 9, "#a7b4d0");
  circle(ctx, -5, -48, 3.2, "#0b1226");
  circle(ctx, 6, -48, 3.2, "#e34283");
  line(ctx, -3, -41, 6, -41, "#101b31", 1.2);
  for (let i = 0; i < 3; i++) line(ctx, i * 3 - 2, -43, i * 3 - 2, -39, "#293448");
  ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,.8)";
  ctx.fillRect(x - 18, y - 71 - stagger * 12, 36, 4);
  ctx.fillStyle = "#fd5474";
  ctx.fillRect(x - 18, y - 71 - stagger * 12, Math.max(0, 36 * hp), 2);
  ctx.fillStyle = "#e9d992";
  ctx.fillRect(x - 18, y - 71 - stagger * 12, 36, 1);
}

function slash(ctx: CanvasRenderingContext2D, time: number, phase: number, power: number, seed: number) {
  if (power <= 0) return;
  const centerX = 395 + wave(time * 8) * 12;
  const centerY = 257 - wave(time * 14) * 6;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const colors = ["#fff7c5", "#68f7ff", "#ffe19a", "#ffffff"];
  for (let band = 0; band < 9; band++) {
    const start = phase * 14 + band * 0.56;
    const radius = 25 + band * 3;
    ctx.beginPath();
    for (let j = 0; j < 34; j++) {
      const a = start + (j / 33) * (1.25 * Math.PI);
      const r = radius + 8 * wave(a * 3 + band);
      const x = centerX + Math.cos(a) * r * 1.8;
      const y = centerY + Math.sin(a) * r * 0.72;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors[band % colors.length];
    ctx.globalAlpha = power * (band % 3 === 0 ? .92 : .56);
    ctx.lineWidth = band % 3 === 0 ? 1.8 : .8;
    ctx.shadowColor = band % 2 === 0 ? "#ffd46b" : "#0fcaff";
    ctx.shadowBlur = 13;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 75; i++) {
    const angle = random(seed + i * 17) * TAU;
    const distance = random(seed + i * 37) * 105 * (0.3 + phase / 2);
    const x = centerX + Math.cos(angle) * distance * 1.5;
    const y = centerY + Math.sin(angle) * distance * 0.6;
    const a = clamp(power * (0.25 + random(seed + i * 9) * 0.6));
    ctx.globalAlpha = a;
    line(ctx, x, y, x + Math.cos(angle) * 9, y + Math.sin(angle) * 5, i % 3 ? "#6cebf8" : "#ffe6a1", i % 5 === 0 ? 1.6 : .75);
  }
  ctx.restore();
}

function interfaceHud(ctx: CanvasRenderingContext2D, time: number, hits: number, seed: number) {
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1c2553";
  ctx.fillRect(0, 0, 134, 91);
  ctx.strokeStyle = "#8ca3e3";
  ctx.strokeRect(.5, .5, 133, 90);
  circle(ctx, 49 + wave(time * 0.45 + seed) * 8, 49, 2.3, "#e92d65");
  rounded(ctx, 0, 294, 175, 66, 0, "rgba(1,3,16,.87)");
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 2 ? "#b93b50" : "#5696f3";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(20 + i * 29, 314, 10, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = "#d5e7ff";
  ctx.font = "8px monospace";
  ctx.fillText("Power1", 5, 337);
  ctx.fillText("Power2", 33, 337);
  ctx.fillText("Lv.1", 89, 315);
  ctx.fillStyle = "#dc2b41";
  ctx.fillRect(8, 344, 117, 6);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px monospace";
  ctx.fillText("500/500", 99, 340);

  rounded(ctx, 434, 291, 205, 69, 2, "rgba(1,8,22,.88)");
  for (let i = 0; i < 21; i++) {
    ctx.fillStyle = i < 14 ? "rgba(20,194,244,.65)" : "rgba(88,109,152,.65)";
    ctx.fillRect(440 + i * 9, 296, 2, 7);
  }
  const labels = ["Shift", "Q", "E", "R", "X"];
  for (let i = 0; i < 5; i++) {
    const x = 467 + 37 * i;
    ctx.beginPath();
    ctx.strokeStyle = "#6689d2";
    ctx.lineWidth = 1;
    ctx.arc(x, 331, 12.5, 0, TAU);
    ctx.stroke();
    ctx.font = "7px monospace";
    ctx.fillStyle = "#cadbfa";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x, 350);
  }
  ctx.textAlign = "left";
  ctx.font = "9px monospace";
  ctx.fillStyle = "#b7e9ff";
  ctx.fillText("00:" + String(Math.floor(time)).padStart(2, "0"), 433, 312);
  if (hits > 0) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#f4c17e";
    ctx.shadowColor = "#ff821d";
    ctx.shadowBlur = 5;
    ctx.font = "bold 31px Georgia";
    ctx.fillText(String(hits), 605, 62);
    ctx.shadowBlur = 0;
    ctx.font = "italic bold 17px sans-serif";
    ctx.fillStyle = "#eef5ff";
    ctx.fillText("HIT", 629, 79);
  }
  ctx.restore();
}

/** Render a frame entirely from (time, settings), so preview and export match. */
export function drawDuelScene(ctx: CanvasRenderingContext2D, time: number, options: DuelOptions): void {
  const t = clamp(time, 0, DUEL_DURATION);
  const seed = Number.isFinite(options.seed) ? options.seed : 42;
  const phase = t % 3.1;
  const attack = phase > .15 && phase < 2.25;
  const impact = attack ? smooth((phase - .2) / .3) * (1 - smooth((phase - 1.75) / .5)) : 0;
  const hits = t < .25 ? 0 : Math.min(6, 1 + Math.floor(t / 2.25));
  const enemyX = 391 + (phase > 2.2 ? (phase - 2.2) * 20 : 0);
  const enemyY = 289;
  ctx.save();
  ctx.clearRect(0, 0, DUEL_WIDTH, DUEL_HEIGHT);
  background(ctx, t, seed);
  robot(ctx, 206 + wave(t * 1.3) * 1.5, 289, t);
  skeleton(ctx, enemyX + wave(t * 2) * 4, enemyY, t, impact, clamp(1 - Math.floor(t / 3.1) * .13, .17, 1));
  if (attack) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, .4 + options.glow * .5);
    slash(ctx, t, phase, impact * (.7 + options.glow * .45), seed);
    ctx.restore();
    if (impact > .65) {
      const flash = ctx.createRadialGradient(enemyX, 245, 1, enemyX, 245, 65);
      flash.addColorStop(0, "rgba(66,228,255,.55)");
      flash.addColorStop(1, "rgba(66,228,255,0)");
      ctx.fillStyle = flash;
      ctx.fillRect(enemyX - 65, 180, 130, 130);
    }
  }
  if (options.showHud) interfaceHud(ctx, t, hits, seed);
  if (t > 14.8) {
    ctx.fillStyle = "rgba(0,0,6," + String(smooth((t - 14.8) / 1.2) * .93) + ")";
    ctx.fillRect(0, 0, 640, 360);
    ctx.font = "bold 21px Georgia";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(191,221,249," + String(smooth((t - 15.15) / .6)) + ")";
    ctx.fillText("DUEL COMPLETE", 320, 174);
  }
  ctx.restore();
}
