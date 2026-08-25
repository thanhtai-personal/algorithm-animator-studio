import { mixHex } from "./marbleCourse";

export interface DrumGeometry2D {
  faceRx: number;
  faceRy: number;
  headRx: number;
  headRy: number;
  shellDepth: number;
  lugCount: number;
}

export function drumGeometry2D(width: number, thickness: number): DrumGeometry2D {
  const faceRx = Math.max(18, width * 0.44);
  const faceRy = Math.max(7, Math.min(faceRx * 0.34, thickness * 0.72));
  return {
    faceRx,
    faceRy,
    headRx: faceRx * 0.86,
    headRy: faceRy * 0.78,
    shellDepth: Math.max(faceRy * 1.7, faceRx * 0.42),
    lugCount: 8,
  };
}

interface DrumRenderInput {
  width: number;
  thickness: number;
  color: string;
}

export function drawDrum2D(
  ctx: CanvasRenderingContext2D,
  platform: DrumRenderInput,
  impact: number,
  lowPower: boolean,
) {
  const drum = drumGeometry2D(platform.width, platform.thickness);
  const faceY = drum.faceRy;
  const bottomY = faceY + drum.shellDepth;
  const light = Math.max(0, Math.min(1, impact));
  const shellColor = mixHex("#14171c", platform.color, light * 0.12);

  ctx.save();
  ctx.shadowColor = platform.color;
  ctx.shadowBlur = lowPower ? 0 : 3 + light * 15;

  const shell = ctx.createLinearGradient(-drum.faceRx, 0, drum.faceRx, 0);
  shell.addColorStop(0, "#080a0e");
  shell.addColorStop(0.18, "#3f454d");
  shell.addColorStop(0.34, shellColor);
  shell.addColorStop(0.62, "#0c0f14");
  shell.addColorStop(0.82, "#59606a");
  shell.addColorStop(1, "#090b0f");
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.moveTo(-drum.faceRx, faceY);
  ctx.lineTo(-drum.faceRx, bottomY);
  ctx.quadraticCurveTo(0, bottomY + drum.faceRy, drum.faceRx, bottomY);
  ctx.lineTo(drum.faceRx, faceY);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(225,230,236,.82)";
  ctx.lineWidth = Math.max(1.1, drum.faceRx * 0.026);
  for (let index = 0; index < drum.lugCount; index += 1) {
    const ratio = index / (drum.lugCount - 1);
    const x = (-0.78 + ratio * 1.56) * drum.faceRx;
    const rodTop = faceY + drum.faceRy * 0.34;
    const rodBottom = bottomY - drum.faceRy * 0.1;
    ctx.strokeRect(x - 1, rodTop, 2, Math.max(2, rodBottom - rodTop));
    ctx.fillStyle = "#d9dde2";
    ctx.fillRect(x - 2.7, rodTop - 1.5, 5.4, 3.5);
    ctx.fillRect(x - 2.7, rodBottom - 1.5, 5.4, 3.5);
  }

  ctx.fillStyle = "#11151a";
  ctx.beginPath();
  ctx.ellipse(0, bottomY, drum.faceRx, drum.faceRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d9dde2";
  ctx.lineWidth = Math.max(2, drum.faceRx * 0.05);
  ctx.stroke();

  ctx.fillStyle = "#171a1f";
  ctx.beginPath();
  ctx.ellipse(0, faceY, drum.faceRx, drum.faceRy, 0, 0, Math.PI * 2);
  ctx.fill();
  const head = ctx.createRadialGradient(
    -drum.headRx * 0.22,
    faceY - drum.headRy * 0.28,
    1,
    0,
    faceY,
    drum.headRx,
  );
  head.addColorStop(0, mixHex("#ffffff", platform.color, light * 0.2));
  head.addColorStop(0.72, mixHex("#e9e7e1", platform.color, light * 0.12));
  head.addColorStop(1, "#c7c8c7");
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.ellipse(0, faceY, drum.headRx, drum.headRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = light > 0.05 ? mixHex("#e4e7eb", platform.color, light * 0.58) : "#d5d9de";
  ctx.lineWidth = Math.max(2.2, drum.faceRx * 0.055);
  ctx.beginPath();
  ctx.ellipse(0, faceY, drum.faceRx * 0.95, drum.faceRy * 0.94, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
