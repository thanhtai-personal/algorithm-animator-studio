import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function AlgorithmTextSprite3D({ text, position, color = "#f8fafc", scale = 1 }: {
  text: string;
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  const texture = useMemo(() => makeTextTexture(text, color), [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[2.3 * scale, 0.72 * scale, 1]} renderOrder={20}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

function makeTextTexture(text: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "800 72px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(2,6,23,0.86)";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(2,6,23,0.8)";
  ctx.strokeText(text, 256, 82);
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
