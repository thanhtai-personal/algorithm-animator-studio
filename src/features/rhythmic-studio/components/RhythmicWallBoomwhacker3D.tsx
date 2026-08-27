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
  const dark = color.toLowerCase() === "#18191d";
  // Reference pipes are mounted almost perfectly perpendicular to the wall.
  // Let perspective create the apparent fan instead of rotating each pipe.
  const yaw = ((variant % 5) - 2) * 0.0015;
  const pitch = (((variant * 3) % 5) - 2) * 0.0012;
  const baseZ = -geometry.length + geometry.radius * 0.16;

  return (
    <group position={[0, 0, geometry.mouthZ]} rotation={[pitch, yaw, 0]}>
      <mesh position={[0, 0, -geometry.length * 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[geometry.radius, geometry.radius, geometry.length, segments, 1, true]} />
        {dark
          ? <meshPhysicalMaterial
              color="#17181d"
              roughness={0.28}
              metalness={0.08}
              clearcoat={0.82}
              clearcoatRoughness={0.18}
              envMapIntensity={1.15}
            />
          : <meshPhysicalMaterial
              color={bodyColor}
              roughness={0.25}
              metalness={0.015}
              clearcoat={0.72}
              clearcoatRoughness={0.14}
              emissive={color}
              emissiveIntensity={0.24 + THREE.MathUtils.clamp(glow, 0, 1.5) * 0.32}
              envMapIntensity={1.12}
            />}
      </mesh>

      <mesh position={[0, 0, -geometry.length * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[geometry.radius * 0.76, geometry.radius * 0.76, geometry.length * 1.008, segments, 1, true]} />
        <meshStandardMaterial color="#090a0d" roughness={0.78} side={THREE.BackSide} />
      </mesh>

      {dark ? (
        <mesh position={[0, 0, -geometry.radius * 0.62]}>
          <circleGeometry args={[geometry.radius * 0.69, segments]} />
          <meshStandardMaterial color="#07080a" roughness={0.92} />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0.008]}>
          <circleGeometry args={[geometry.radius * 0.79, segments]} />
          <meshPhysicalMaterial
            color={bodyColor}
            roughness={0.2}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            emissive={color}
            emissiveIntensity={0.12 + THREE.MathUtils.clamp(glow, 0, 1.5) * 0.22}
          />
        </mesh>
      )}

      <mesh>
        <torusGeometry args={[geometry.radius * 0.9, geometry.radius * 0.085, 10, segments]} />
        <meshPhysicalMaterial color="#29282e" roughness={0.24} metalness={0.18} clearcoat={0.65} />
      </mesh>
      {!dark && (
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[geometry.radius * 0.76, geometry.radius * 0.035, 8, segments]} />
          <meshPhysicalMaterial color={bodyColor} roughness={0.18} clearcoat={0.8} />
        </mesh>
      )}

      <mesh position={[0, 0, baseZ]} castShadow receiveShadow>
        <circleGeometry args={[geometry.radius * 1.28, segments]} />
        <meshPhysicalMaterial color="#28282d" roughness={0.34} metalness={0.12} clearcoat={0.55} />
      </mesh>
      <mesh position={[0, 0, baseZ + 0.018]} castShadow>
        <torusGeometry args={[geometry.radius * 1.13, geometry.radius * 0.13, 10, segments]} />
        <meshPhysicalMaterial color="#3a3a40" roughness={0.3} metalness={0.2} clearcoat={0.58} />
      </mesh>
      <mesh position={[0, 0, baseZ + geometry.radius * 0.13]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[geometry.radius * 1.04, geometry.radius * 1.04, geometry.radius * 0.25, segments]} />
        <meshStandardMaterial color="#23242a" roughness={0.38} metalness={0.12} />
      </mesh>
    </group>
  );
}
