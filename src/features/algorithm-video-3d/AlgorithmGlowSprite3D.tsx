import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function AlgorithmGlowSprite3D({ position, scale, color, opacity = 0.24, renderOrder = 2 }: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity?: number;
  renderOrder?: number;
}) {
  const texture = useMemo(() => radialTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={scale} renderOrder={renderOrder}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

function radialTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5) / size * 2 - 1;
      const dy = (y + 0.5) / size * 2 - 1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.pow(Math.max(0, 1 - distance), 2.5);
      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
