import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

function makeTitleTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 220;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "700 68px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 16;
  ctx.strokeStyle = "rgba(0,0,0,.52)";
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function RhythmicTitle3D({ text }: { text: string }) {
  const { camera } = useThree();
  const trimmed = text.trim();
  const texture = useMemo(() => trimmed ? makeTitleTexture(trimmed) : null, [trimmed]);
  const sprite = useMemo(() => {
    if (!texture) return null;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const value = new THREE.Sprite(material);
    value.renderOrder = 1000;
    value.position.set(0, 3.5, -8.6);
    value.scale.set(6.4, 1.38, 1);
    return value;
  }, [texture]);

  useEffect(() => {
    if (!sprite) return;
    camera.add(sprite);
    return () => {
      camera.remove(sprite);
      sprite.material.dispose();
      texture?.dispose();
    };
  }, [camera, sprite, texture]);

  return null;
}
