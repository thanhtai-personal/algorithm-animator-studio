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
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments;
    if (pose.dragonStage === "coil") {
      const a = pose.dragonAngle - i * .48;
      const radius = 6 + i * .62;
      points.push({
        x: pose.heroX + 12 + Math.cos(a) * (radius + 8),
        y: pose.heroY - 20 + Math.sin(a) * (radius + 9) * .73,
      });
    } else if (pose.dragonStage === "wrap" || pose.dragonStage === "fade") {
      // Tail follows an orbit around the skeleton instead of remaining a straight beam.
      const a = pose.dragonAngle - i * .25;
      points.push({
        x: pose.enemyX + Math.cos(a) * (30 + i * .58),
        y: pose.enemyY - 33 + Math.sin(a) * (22 + i * .40),
      });
    } else {
      // Straight long-kình: the tail grows out of the robot's palm.
      const available = Math.max(9, pose.dragonX - (pose.heroX + 32));
      const bodyLength = Math.min(pose.dragonLength, available);
      points.push({
        x: pose.dragonX - fraction * bodyLength,
        y: pose.dragonY + Math.sin(i * .61 - time * 22) * (1.5 + 5 * fraction)
          + 2.5 * Math.sin(i * .27 + time * 9) * fraction,
      });
    }
  }

  const passes = [
    { width: 23, color: "rgba(23,107,230,.12)", shadow: 19 },
    { width: 7.5, color: "rgba(59,222,245,.51)", shadow: 8 },
    { width: 2.3, color: "#ffedc0", shadow: 1 },
  ];
  for (const pass of passes) {
    ctx.strokeStyle = pass.color;
    ctx.shadowColor = "#48deff";
    ctx.shadowBlur = pass.shadow * glow;
    for (let i = segments; i >= 1; i--) {
      const a = points[i];
      const b = points[i - 1];
      const taper = 0.22 + (1 - i / segments) * .78;
      ctx.lineWidth = pass.width * taper;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Gold/cyan qi filaments wind around the body; avoid a thick laser-beam look.
  for (let ribbon = 0; ribbon < 7; ribbon++) {
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const p = points[i];
      const fraction = i / segments;
      const amplitude = (3 + ribbon * .9) * Math.sin(Math.PI * fraction);
      const offset = Math.sin(i * .58 - time * (17 + ribbon * .4) + ribbon * 1.07) * amplitude;
      const x = p.x + (pose.dragonStage === "wrap" ? offset * .50 : 0);
      const y = p.y + (pose.dragonStage === "wrap" ? offset * .45 : offset);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ribbon % 3 === 0 ? "rgba(255,245,197,.96)"
      : ribbon % 2 === 0 ? "rgba(255,202,139,.75)" : "rgba(105,236,255,.85)";
    ctx.lineWidth = ribbon % 3 === 0 ? 1.25 : .70;
    ctx.shadowColor = ribbon % 2 ? "#27dcf7" : "#ffdab1";
    ctx.shadowBlur = 5 * glow;
    ctx.stroke();
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
  ctx.rotate(pose.dragonStage === "wrap" || pose.dragonStage === "fade"
    ? pose.dragonAngle + Math.PI / 2
    : pose.dragonStage === "coil" ? pose.dragonAngle + Math.PI / 2 : .03);
  const scale = pose.dragonStage === "coil" ? .52 : .77;
  ctx.scale(scale, scale);
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
  const x = pose.heroX + 30 + pose.palmExtension * 6;
  const y = pose.heroY - 24 - pose.palmExtension * 2;
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
