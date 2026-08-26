import * as THREE from "three";
import type { MeshProps } from "./RhythmicPlatformMeshes3D";
import { selectedColor } from "./RhythmicPlatformMaterials3D";

export interface DrumGeometry3D {
  radius: number;
  shellDepth: number;
  headRadius: number;
  hoopRadius: number;
  hoopTubeRadius: number;
  playingFaceZ: number;
  lugCount: number;
}

export function drumGeometry3D(width: number, height: number, depth: number, compact = false): DrumGeometry3D {
  const radius = compact ? width * 0.42 : Math.max(0.2, width * 0.42);
  const shellDepth = THREE.MathUtils.clamp(
    radius * 0.9,
    compact ? Math.max(0.024, height) : Math.max(0.16, height * 1.25),
    compact ? Math.max(0.036, depth * 0.72) : Math.max(0.18, depth * 0.72),
  );
  const hoopTubeRadius = THREE.MathUtils.clamp(radius * 0.045, compact ? 0.006 : 0.018, compact ? 0.018 : 0.038);
  return {
    radius,
    shellDepth,
    headRadius: radius * 0.86,
    hoopRadius: radius * 0.94,
    hoopTubeRadius,
    playingFaceZ: shellDepth * 0.5 + hoopTubeRadius * 0.55 + 0.008,
    lugCount: 8,
  };
}

export function DrumDiscMesh({ w, h, d, color, selected, glow, detail, compact }: MeshProps) {
  const drum = drumGeometry3D(w, h, d, compact);
  const segments = Math.round(32 + detail * 16);
  const noteStrength = THREE.MathUtils.clamp(glow * 0.58 + (selected ? 0.22 : 0), 0, 1);
  const shellColor = new THREE.Color("#12151a").lerp(new THREE.Color(color), noteStrength * 0.12).getStyle();
  const headColor = new THREE.Color("#eeeae1").lerp(new THREE.Color(color), noteStrength * 0.16).getStyle();

  return <group name="snare-drum">
    <mesh name="drum-shell" rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[drum.radius * 0.965, drum.radius * 0.965, drum.shellDepth, segments, 1]} />
      <meshPhysicalMaterial
        color={selectedColor(shellColor, selected)}
        roughness={0.18}
        metalness={0.78}
        clearcoat={0.82}
        clearcoatRoughness={0.12}
        emissive={color}
        emissiveIntensity={noteStrength * 0.16}
      />
    </mesh>
    {[-1, 1].map((side) => (
      <mesh
        key={side}
        name="drum-hoop"
        position={[0, 0, side * drum.shellDepth * 0.5]}
        castShadow
      >
        <torusGeometry args={[drum.hoopRadius, drum.hoopTubeRadius, 10, segments]} />
        <meshStandardMaterial color="#d9dde2" roughness={0.16} metalness={0.92} />
      </mesh>
    ))}
    <mesh name="drum-head" position={[0, 0, drum.playingFaceZ]} receiveShadow>
      <circleGeometry args={[drum.headRadius, segments]} />
      <meshPhysicalMaterial
        color={headColor}
        roughness={0.48}
        metalness={0.02}
        clearcoat={0.28}
        emissive={color}
        emissiveIntensity={noteStrength * 0.34}
      />
    </mesh>
    {Array.from({ length: drum.lugCount }, (_, index) => {
      const angle = index * Math.PI * 2 / drum.lugCount;
      const lugRadius = drum.radius * 0.91;
      return (
        <mesh
          key={index}
          name="drum-lug"
          position={[Math.cos(angle) * lugRadius, Math.sin(angle) * lugRadius, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[drum.hoopTubeRadius * 0.42, drum.hoopTubeRadius * 0.42, drum.shellDepth * 0.78, 8]} />
          <meshStandardMaterial color="#eef1f4" roughness={0.2} metalness={0.9} />
        </mesh>
      );
    })}
  </group>;
}
