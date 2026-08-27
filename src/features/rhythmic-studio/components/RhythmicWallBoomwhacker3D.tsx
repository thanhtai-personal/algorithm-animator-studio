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
  const yaw = ((variant % 5) - 2) * 0.0012;
  const pitch = (((variant * 3) % 5) - 2) * 0.001;
  const baseZ = -geometry.length + geometry.radius * 0.16;

  return (
    <group position={[0, 0, geometry.mouthZ]} rotation={[pitch, yaw, 0]}>
      <mesh position={[0, 0, -geometry.length * 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[geometry.radius, geometry.radius, geometry.length, segments, 1, true]} />
        {dark
          ? <meshPhysicalMaterial
              color="#2a2c32"
              roughness={0.42}
              metalness={0.05}
              clearcoat={0.46}
              clearcoatRoughness={0.22}
              envMapIntensity={1}
            />
          : <meshPhysicalMaterial
              color={bodyColor}
              roughness={0.36}
              metalness={0.01}
              clearcoat={0.48}
              clearcoatRoughness={0.2}
              emissive={bodyColor}
              emissiveIntensity={0.03 + THREE.MathUtils.clamp(glow, 0, 1.5) * 0.09}
              envMapIntensity={1.05}
            />}
      </mesh>

      <mesh position={[0, 0, -geometry.length * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[geometry.radius * 0.76, geometry.radius * 0.76, geometry.length * 1.008, segments, 1, true]} />
        <meshStandardMaterial color="#0f1115" roughness={0.82} side={THREE.BackSide} />
      </mesh>

      {dark ? (
        <mesh position={[0, 0, -geometry.radius * 0.62]}>
          <circleGeometry args={[geometry.radius * 0.69, segments]} />
          <meshStandardMaterial color="#090a0d" roughness={0.94} />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0.008]}>
          <circleGeometry args={[geometry.radius * 0.79, segments]} />
          <meshPhysicalMaterial
            color={bodyColor}
            roughness={0.24}
            clearcoat={0.56}
            clearcoatRoughness={0.18}
            emissive={bodyColor}
            emissiveIntensity={0.02 + THREE.MathUtils.clamp(glow, 0, 1.5) * 0.06}
          />
        </mesh>
      )}

      <mesh>
        <torusGeometry args={[geometry.radius * 0.9, geometry.radius * 0.085, 10, segments]} />
        <meshPhysicalMaterial color="#4a4d56" roughness={0.32} metalness={0.12} clearcoat={0.36} />
      </mesh>
      {!dark && (
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[geometry.radius * 0.76, geometry.radius * 0.035, 8, segments]} />
          <meshPhysicalMaterial color={bodyColor} roughness={0.2} clearcoat={0.46} clearcoatRoughness={0.18} />
        </mesh>
      )}

      <mesh position={[0, 0, baseZ]} castShadow receiveShadow>
        <circleGeometry args={[geometry.radius * 1.28, segments]} />
        <meshPhysicalMaterial color="#55575f" roughness={0.44} metalness={0.06} clearcoat={0.22} />
      </mesh>
      <mesh position={[0, 0, baseZ + 0.018]} castShadow>
        <torusGeometry args={[geometry.radius * 1.13, geometry.radius * 0.13, 10, segments]} />
        <meshPhysicalMaterial color="#666972" roughness={0.36} metalness={0.1} clearcoat={0.2} />
      </mesh>
      <mesh position={[0, 0, baseZ + geometry.radius * 0.13]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[geometry.radius * 1.04, geometry.radius * 1.04, geometry.radius * 0.25, segments]} />
        <meshStandardMaterial color="#454850" roughness={0.46} metalness={0.1} />
      </mesh>
    </group>
  );
}
