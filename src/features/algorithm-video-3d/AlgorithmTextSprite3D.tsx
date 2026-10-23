import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function AlgorithmTextSprite3D({ text, position, color = "#f8fafc", scale = 1, subtle = false }: {
  text: string;
  position: [number, number, number];
  color?: string;
  scale?: number;
  subtle?: boolean;
}) {
  const texture = useMemo(() => makeTextTexture(text, color, subtle), [text, color, subtle]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[2.55 * scale, 0.76 * scale, 1]} renderOrder={24}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

function makeTextTexture(text: string, color: string, subtle: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 192;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pillX = 76;
  const pillY = 35;
  const pillW = 488;
  const pillH = 120;
  roundedRect(ctx, pillX, pillY, pillW, pillH, 48);
  ctx.fillStyle = subtle ? "rgba(6,12,24,0.70)" : "rgba(6,12,24,0.84)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = withAlpha(color, subtle ? 0.34 : 0.62);
  ctx.stroke();

  roundedRect(ctx, pillX + 18, pillY + 21, 8, pillH - 42, 4);
  ctx.fillStyle = color;
  ctx.globalAlpha = subtle ? 0.65 : 0.95;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `${subtle ? 700 : 850} 68px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.62)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = subtle ? "#e2e8f0" : "#f8fafc";
  ctx.fillText(text, 328, 98, 430);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function withAlpha(color: string, alpha: number) {
  const c = new THREE.Color(color);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${alpha})`;
}
