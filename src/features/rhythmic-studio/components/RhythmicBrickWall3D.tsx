import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildBrickPattern } from "../lib/brickWallPattern";
import { RHYTHMIC_ROOM_BACKDROP_WIDTH, type RhythmicBackdropBounds } from "./rhythmicSceneMath3D";

function brickCanvas(bump: boolean) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = bump ? "#2c2c2c" : "#08090a";
  ctx.fillRect(0, 0, size, size);

  for (const brick of buildBrickPattern(size, size, 88, 38)) {
    const x = brick.x + 3;
    const y = brick.y + 3;
    const width = brick.width - 5;
    const height = brick.height - 5;
    if (bump) {
      const level = 124 + brick.tone * 3;
      ctx.fillStyle = `rgb(${level},${level},${level})`;
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "rgba(255,255,255,.2)";
      ctx.fillRect(x + 1, y + 1, width - 2, 2);
      ctx.fillStyle = "rgba(0,0,0,.24)";
      ctx.fillRect(x + 1, y + height - 3, width - 2, 2);
    } else {
      const level = 18 + brick.tone;
      const face = ctx.createLinearGradient(x, y, x, y + height);
      face.addColorStop(0, `rgb(${level + 11},${level + 11},${level + 12})`);
      face.addColorStop(0.46, `rgb(${level + 3},${level + 4},${level + 5})`);
      face.addColorStop(1, `rgb(${level - 5},${level - 4},${level - 3})`);
      ctx.fillStyle = face;
      ctx.fillRect(x, y, width, height);
    }
    if (brick.wear > 0.68) {
      ctx.fillStyle = bump ? "rgba(30,30,30,.32)" : "rgba(0,0,0,.16)";
      ctx.fillRect(x + width * brick.wear * 0.55, y + height * 0.28, width * 0.2, Math.max(2, height * 0.1));
    }
  }
  return canvas;
}

function glowTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5) / size * 2 - 1;
      const dy = (y + 0.5) / size * 2 - 1;
      const alpha = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy)), 2.1);
      const index = (y * size + x) * 4;
      data[index] = 255;
      data[index + 1] = 30;
      data[index + 2] = 24;
      data[index + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function RhythmicBrickWall3D({ bounds }: { bounds: RhythmicBackdropBounds }) {
  const textures = useMemo(() => {
    const map = new THREE.CanvasTexture(brickCanvas(false));
    const bumpMap = new THREE.CanvasTexture(brickCanvas(true));
    for (const texture of [map, bumpMap]) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, Math.max(1, bounds.height / 26));
      texture.anisotropy = 8;
    }
    map.colorSpace = THREE.SRGBColorSpace;
    return { map, bumpMap, glow: glowTexture() };
  }, [bounds.height]);
  useEffect(() => () => {
    textures.map.dispose();
    textures.bumpMap.dispose();
    textures.glow.dispose();
  }, [textures]);
  const glows = useMemo(() => Array.from(
    { length: Math.max(2, Math.ceil(bounds.height / 17)) },
    (_, index) => ({
      x: index % 2 === 0 ? -3.5 : 3.2,
      y: bounds.bottomY + 7 + index * 17,
    }),
  ), [bounds.bottomY, bounds.height]);

  return <group>
    <mesh position={[0, bounds.centerY, -4.08]} receiveShadow renderOrder={-30}>
      <planeGeometry args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height]} />
      <meshStandardMaterial map={textures.map} bumpMap={textures.bumpMap} bumpScale={0.16} roughness={0.94} metalness={0.02} />
    </mesh>
    {glows.map((glow, index) => <sprite key={index} position={[glow.x, glow.y, -3.86]} scale={[11, 11, 1]} renderOrder={-24}>
      <spriteMaterial map={textures.glow} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>)}
  </group>;
}
