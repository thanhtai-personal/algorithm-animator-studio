import * as THREE from "three";
import type { InstrumentPlayingSurface3D } from "./instrumentPlayingSurface3D";

export function RhythmicInstrumentNoteLights3D({ width, height, surface, colors, glow }: {
  width: number;
  height: number;
  surface: InstrumentPlayingSurface3D;
  colors: string[];
  glow: number;
}) {
  const count = Math.max(1, colors.length);
  const stripWidth = Math.max(0.18, width * 0.68);
  const segmentWidth = stripWidth / count;
  const intensity = THREE.MathUtils.clamp(glow, 0, 1.5);
  const onTopFace = surface.faceKind === "top";
  const position: [number, number, number] = onTopFace
    ? [0, surface.localStrikeY + 0.012, surface.localStrikeZ]
    : [0, -height * 0.18, surface.localStrikeZ + 0.02];
  return <group position={position}>
    {colors.map((color, index) => (
      <mesh key={`${color}-${index}`} position={[-stripWidth / 2 + segmentWidth * (index + 0.5), 0, 0]}>
        <boxGeometry args={onTopFace
          ? [Math.max(0.025, segmentWidth * 0.88), 0.022, Math.max(0.04, height * 0.32)]
          : [Math.max(0.025, segmentWidth * 0.88), Math.max(0.024, height * 0.16), 0.022]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.24 + Math.min(1, intensity) * 0.76}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    ))}
  </group>;
}
