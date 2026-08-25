import * as THREE from "three";
import type { MeshProps } from "./RhythmicPlatformMeshes3D";
import { selectedColor } from "./RhythmicPlatformMaterials3D";

export function GongDiscMesh({ w, h, d, color, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.25, w * 0.42);
  const segments = Math.round(32 + detail * 24);
  const light = THREE.MathUtils.clamp(glow, 0, 1.5);
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 0.98, Math.max(0.045, h * 0.42), segments]} />
      <meshPhysicalMaterial color={selectedColor("#8a6935", selected)} roughness={0.24} metalness={0.88} clearcoat={0.42} />
    </mesh>
    <mesh position={[0, 0, d * 0.055]}>
      <ringGeometry args={[radius * 0.69, radius * 0.92, segments]} />
      <meshStandardMaterial color="#4a3822" roughness={0.3} metalness={0.86} />
    </mesh>
    <mesh position={[0, 0, d * 0.07]}>
      <ringGeometry args={[radius * 0.52, radius * 0.64, segments]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.03 + light * 2.25} roughness={0.18} metalness={0.38} />
    </mesh>
    <mesh position={[0, 0, d * 0.085]}>
      <circleGeometry args={[radius * 0.24, segments]} />
      <meshPhysicalMaterial color="#c79a51" roughness={0.2} metalness={0.9} emissive={color} emissiveIntensity={light * 0.34} />
    </mesh>
    {[-0.34, 0.34].map((ratio) => <mesh key={ratio} position={[radius * ratio, radius * 0.88, -d * 0.06]}>
      <torusGeometry args={[0.045, 0.012, 8, 18]} />
      <meshStandardMaterial color="#30343a" roughness={0.34} metalness={0.82} />
    </mesh>)}
  </group>;
}

export function FlutePipeMesh({ w, h, d, color, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.085, h * 0.38);
  const segments = Math.round(22 + detail * 18);
  const holes = Array.from({ length: 6 }, (_, index) => -w * 0.29 + index * w * 0.115);
  const light = THREE.MathUtils.clamp(glow, 0, 1.5);
  return <group>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, w, segments]} />
      <meshPhysicalMaterial color={selectedColor("#c5ccd2", selected)} roughness={0.18} metalness={0.82} clearcoat={0.7} />
    </mesh>
    <mesh position={[0, 0, radius + d * 0.015]}>
      <boxGeometry args={[w * 0.72, radius * 0.18, 0.022]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.025 + light * 2.4} roughness={0.16} metalness={0.22} />
    </mesh>
    {holes.map((x) => <mesh key={x} position={[x, 0, radius + d * 0.03]}>
      <circleGeometry args={[radius * 0.27, 16]} />
      <meshStandardMaterial color="#20252b" roughness={0.52} metalness={0.35} />
    </mesh>)}
    {[-1, 1].map((side) => <mesh key={side} position={[side * w * 0.49, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[radius * 0.9, radius * 0.08, 8, 22]} />
      <meshStandardMaterial color="#e5ebef" roughness={0.15} metalness={0.9} />
    </mesh>)}
  </group>;
}
