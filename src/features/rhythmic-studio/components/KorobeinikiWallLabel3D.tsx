import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";

function makeWallLabelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width * 0.5, canvas.height * 0.52);
  context.rotate(-0.035);
  context.font = "italic 600 92px 'Comic Sans MS', 'Segoe Print', cursive";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(32, 30, 34, 0.86)";
  context.fillText("Korobeiniki", 0, 0);
  context.lineWidth = 4;
  context.lineCap = "round";
  context.strokeStyle = "rgba(32, 30, 34, 0.68)";
  context.beginPath();
  context.moveTo(-225, 73);
  context.quadraticCurveTo(18, 91, 236, 66);
  context.stroke();
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
  return (
    <sprite
      position={[
        (courseX - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
        -courseY * RHYTHMIC_WORLD_SCALE,
        -3.98,
      ]}
      scale={[4.15, 1.04, 1]}
      renderOrder={-10}
    >
      <spriteMaterial map={texture} transparent depthWrite={false} opacity={0.9} />
    </sprite>
  );
}
