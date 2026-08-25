import * as THREE from "three";

export function RhythmicInstrumentNoteLights3D({ width, height, frontDepth, colors, glow }: {
  width: number;
  height: number;
  frontDepth: number;
  colors: string[];
  glow: number;
}) {
  const count = Math.max(1, colors.length);
  const stripWidth = Math.max(0.18, width * 0.68);
  const segmentWidth = stripWidth / count;
  const intensity = THREE.MathUtils.clamp(glow, 0, 1.5);
  return <group position={[0, -height * 0.18, frontDepth + 0.02]}>
    {colors.map((color, index) => (
      <mesh key={`${color}-${index}`} position={[-stripWidth / 2 + segmentWidth * (index + 0.5), 0, 0]}>
        <boxGeometry args={[Math.max(0.025, segmentWidth * 0.88), Math.max(0.024, height * 0.16), 0.022]} />
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
