import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";

function makeWallLabelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 384;
  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width * 0.5, canvas.height * 0.55);
  context.rotate(-0.035);
  context.font = "italic 500 122px 'Segoe Print', 'Comic Sans MS', cursive";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeStyle = "rgba(30, 28, 35, 0.22)";
  context.lineWidth = 18;
  context.lineJoin = "round";
  context.shadowColor = "rgba(20, 18, 26, 0.16)";
  context.shadowBlur = 16;
  context.shadowOffsetY = 5;
  context.strokeText("Korobeiniki", 0, 0);
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.fillStyle = "rgba(31, 28, 37, 0.92)";
  context.fillText("Korobeiniki", 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function KorobeinikiWallLabel3D({ courseX, courseY }: { courseX: number; courseY: number }) {
  const texture = useMemo(makeWallLabelTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const x = (courseX - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE;
  const y = -courseY * RHYTHMIC_WORLD_SCALE;
  return (
    <group position={[x, y, -4.16]} rotation={[0, 0, -0.035]} renderOrder={-8}>
      <mesh position={[0.028, -0.02, -0.018]}>
        <planeGeometry args={[2.94, 0.74]} />
        <meshBasicMaterial map={texture} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[2.94, 0.74]} />
        <meshBasicMaterial map={texture} transparent opacity={0.96} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
