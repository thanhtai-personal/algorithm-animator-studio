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
  return <group position={[0, -height * 0.18, frontDepth + 0.016]}>
    {colors.map((color, index) => (
      <mesh key={`${color}-${index}`} position={[-stripWidth / 2 + segmentWidth * (index + 0.5), 0, 0]}>
        <boxGeometry args={[Math.max(0.025, segmentWidth * 0.84), Math.max(0.018, height * 0.09), 0.018]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.035 + intensity * 2.5}
          roughness={0.16}
          metalness={0.18}
          toneMapped={false}
        />
      </mesh>
    ))}
  </group>;
}
