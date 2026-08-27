import * as THREE from "three";
import { selectedColor } from "./RhythmicPlatformMaterials3D";
import type { MeshProps } from "./RhythmicPlatformMeshes3D";
import { wallBoomwhackerGeometry } from "./wallBoomwhackerGeometry3D";

export function WallBoomwhackerMesh({
  w,
  h,
  d,
  color,
  selected,
  glow,
  detail,
  compact,
  variant = 0,
}: MeshProps) {
  const geometry = wallBoomwhackerGeometry(w, h, d, Boolean(compact));
  const segments = Math.round(28 + detail * 20);
  const bodyColor = selectedColor(color, selected);
  const played = color.toLowerCase() === "#18191d";
  const yaw = -0.055 + ((variant % 5) - 2) * 0.012;
  const pitch = (((variant * 3) % 5) - 2) * 0.009;

  return (
    <group position={[0, 0, geometry.mouthZ]} rotation={[pitch, yaw, 0]}>
      <mesh position={[0, 0, -geometry.length * 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[geometry.radius, geometry.radius, geometry.length, segments, 1, true]} />
        {played
          ? <meshStandardMaterial color="#17181c" roughness={0.62} metalness={0.015} />
          : <meshPhysicalMaterial
              color={bodyColor}
              roughness={0.27}
              metalness={0.015}
              clearcoat={0.62}
              clearcoatRoughness={0.16}
              emissive={color}
              emissiveIntensity={0.55 + THREE.MathUtils.clamp(glow, 0, 1.5) * 0.55}
            />}
      </mesh>
      <mesh position={[0, 0, -geometry.length * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[geometry.radius * 0.76, geometry.radius * 0.76, geometry.length * 1.008, segments, 1, true]} />
        <meshStandardMaterial color="#121316" roughness={0.88} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 0, -geometry.length * 0.965]}>
        <circleGeometry args={[geometry.radius * 0.73, segments]} />
        <meshStandardMaterial color="#08090a" roughness={0.94} />
      </mesh>
      <mesh>
        <torusGeometry args={[geometry.radius * 0.89, geometry.radius * 0.075, 10, segments]} />
        {played
          ? <meshStandardMaterial color="#111216" roughness={0.7} />
          : <meshPhysicalMaterial color={bodyColor} roughness={0.22} clearcoat={0.7} />}
      </mesh>
      <mesh position={[0, 0, -geometry.length * 0.92]}>
        <torusGeometry args={[geometry.radius * 1.08, geometry.radius * 0.07, 8, segments]} />
        <meshStandardMaterial color="#2b2c30" roughness={0.55} metalness={0.18} />
      </mesh>
    </group>
  );
}
