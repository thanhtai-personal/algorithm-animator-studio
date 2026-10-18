import type { DuelPose } from "./choreography";

const TAU = Math.PI * 2;
const spark = (n: number) => {
  const s = Math.sin(n * 103.91 + 71.4) * 14358.71;
  return s - Math.floor(s);
};

type Point = { x: number; y: number };

/** Animated eastern-style energy dragon: serpent body, horned head, claws, whiskers and mane. */
export function drawFlyingDragon(
  ctx: CanvasRenderingContext2D,
  pose: DuelPose,
  time: number,
  glow: number,
  seed: number,
): void {
  if (pose.dragonPower <= .01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, pose.dragonPower);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const points: Point[] = [];
  const segments = 22;
  for (let i = 0; i <= segments; i++) {
    const tailFraction = i / segments;
    points.push({
      x: pose.dragonX - tailFraction * pose.dragonLength,
      y: pose.dragonY + Math.sin(i * .59 - time * 19) * (2 + 14 * tailFraction)
        + 5 * Math.sin(i * .19 + time * 6) * tailFraction,
    });
  }

  // Three-pass tapered body produces a visible dragon, not a generic light trail.
  const passes = [
    { width: 29, color: "rgba(4,92,185,.32)", shadow: 22 },
    { width: 20, color: "#057ca9", shadow: 8 },
    { width: 12, color: "#32d8ed", shadow: 5 },
    { width: 4, color: "#dcfdc9", shadow: 0 },
  ];
  for (const pass of passes) {
    ctx.shadowColor = "#35d9ff";
    ctx.shadowBlur = pass.shadow * glow;
    ctx.strokeStyle = pass.color;
    for (let i = segments; i >= 1; i--) {
      const from = points[i];
      const to = points[i - 1];
      const taper = Math.max(.14, 1 - i / (segments + 1));
      ctx.lineWidth = pass.width * (.20 + taper * .80);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Scales and dorsal spikes move with the serpentine spine.
  for (let i = 2; i < 20; i += 2) {
    const point = points[i];
    const next = points[i + 1];
    const angle = Math.atan2(point.y - next.y, point.x - next.x);
    const spike = 3.5 + (1 - i / segments) * 5;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.fillStyle = i % 4 === 0 ? "#fff0a2" : "#a3fbe9";
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(0, -spike - 7);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,210,.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(2, 4);
    ctx.stroke();
    ctx.restore();
  }

  // Two separate four-toed claws, anchored to the moving body.
  for (const index of [5, 11]) {
    const { x, y } = points[index];
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#4fe4ee";
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.quadraticCurveTo(x - 8, y + 15, x - 3, y + 21);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ffe9a2";
    for (let toe = 0; toe < 3; toe++) {
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 21);
      ctx.lineTo(x - 10 + toe * 6, y + 24 + (toe % 2) * 4);
      ctx.stroke();
    }
  }

  // Dragon head, always facing its travel direction (+X).
  ctx.save();
  ctx.translate(pose.dragonX, pose.dragonY);
  ctx.rotate(Math.sin(time * 17) * .075);
  ctx.shadowColor = "#3cebfb";
  ctx.shadowBlur = 16 * glow;
  ctx.fillStyle = "#0c96ad";
  ctx.beginPath();
  ctx.moveTo(-23, -8);
  ctx.quadraticCurveTo(-9, -18, 8, -11);
  ctx.quadraticCurveTo(13, -8, 19, -6);
  ctx.lineTo(27, -3);
  ctx.lineTo(29, 5);
  ctx.lineTo(12, 9);
  ctx.quadraticCurveTo(-7, 14, -22, 6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#b4fff1";
  ctx.stroke();
  // Two curved antler-like horns.
  ctx.strokeStyle = "#ffeac0";
  ctx.lineWidth = 3;
  for (const hx of [-12, 2]) {
    ctx.beginPath();
    ctx.moveTo(hx, -11);
    ctx.quadraticCurveTo(hx - 9, -27, hx - 5, -32);
    ctx.quadraticCurveTo(hx - 2, -21, hx + 7, -27);
    ctx.stroke();
  }
  // Flowing mane behind crown.
  ctx.strokeStyle = "#6cefff";
  ctx.lineWidth = 2.3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 4, -9);
    ctx.quadraticCurveTo(-33 - i * 2, -16 - i * 3, -30 - i * 5, -11 - i * 4);
    ctx.stroke();
  }
  // Jaw, fangs, slit eye, nostril and flowing whiskers.
  ctx.fillStyle = "#08364b";
  ctx.beginPath();
  ctx.moveTo(7, 6);
  ctx.lineTo(27, 3);
  ctx.lineTo(18, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f5ffe4";
  for (const fx of [17, 22]) {
    ctx.beginPath();
    ctx.moveTo(fx, 4);
    ctx.lineTo(fx + 2, 9);
    ctx.lineTo(fx + 4, 3.5);
    ctx.fill();
  }
  ctx.fillStyle = "#fff1a0";
  ctx.beginPath();
  ctx.ellipse(5, -5, 4, 2.5, -.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#142c36";
  ctx.fillRect(7, -7, 1.5, 4);
  ctx.fillStyle = "#d8fcff";
  ctx.beginPath();
  ctx.arc(22, -3, 1.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#fff3c0";
  ctx.lineWidth = 1.2;
  for (const direction of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(16, 3);
    ctx.bezierCurveTo(27, direction * 5, 30, direction * 15, 40, direction * 14);
    ctx.stroke();
  }
  ctx.restore();

  // Dissolving glints trail the moving tail.
  for (let i = 0; i < 19; i++) {
    const k = spark(seed + i * 33);
    const x = pose.dragonX - 17 - k * (pose.dragonLength + 18);
    const y = pose.dragonY + Math.sin(i + time * 14) * (6 + 17 * spark(seed + i * 51));
    ctx.fillStyle = i % 3 ? "#6defff" : "#ffdf8b";
    ctx.globalAlpha = pose.dragonPower * (.15 + .65 * spark(seed + i * 4));
    ctx.beginPath();
    ctx.arc(x, y, i % 5 === 0 ? 2 : 1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Energy gathers at the palms before each dragon is released. */
export function drawPalmCharge(ctx: CanvasRenderingContext2D, pose: DuelPose, time: number, glow: number): void {
  const charge = pose.chargePower;
  if (charge <= .01) return;
  const x = pose.heroX + 28 + pose.palmExtension * 7;
  const y = pose.heroY - 34;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const radius = 12 + charge * 18;
  const aura = ctx.createRadialGradient(x, y, 0, x, y, radius);
  aura.addColorStop(0, "rgba(252,255,215,.95)");
  aura.addColorStop(.28, "rgba(82,251,244,.75)");
  aura.addColorStop(1, "rgba(15,100,248,0)");
  ctx.globalAlpha = charge;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#b5f8ff";
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) {
    const a = time * 14 + k * (TAU / 3);
    ctx.beginPath();
    ctx.arc(x, y, 7 + k * 3 + 2 * Math.sin(a), a, a + Math.PI * .9);
    ctx.stroke();
  }
  ctx.restore();
}
