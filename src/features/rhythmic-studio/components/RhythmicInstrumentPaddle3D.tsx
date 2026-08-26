import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { MeshProps } from "./RhythmicPlatformMeshes3D";
import { EndBolt, selectedColor } from "./RhythmicPlatformMaterials3D";

export function InstrumentPaddleMesh3D({ w, h, d, color, selected, glow, compact }: MeshProps) {
  const faceColor = new THREE.Color("#3b3b3e").lerp(new THREE.Color(color), 0.1).getStyle();
  const edge = selectedColor("#cbd5e1", selected);
  return (
    <group>
      <RoundedBox args={[w, compact ? h : Math.max(h, 0.13), d]} radius={Math.min(0.065, w * 0.08, h * 0.08)} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={selectedColor(faceColor, selected)} roughness={0.72} metalness={0.08} emissive={color} emissiveIntensity={glow * 0.16} />
      </RoundedBox>
      <RoundedBox position={[0, 0, d * 0.505]} args={[w * 0.91, compact ? h * 0.82 : Math.max(0.08, h * 0.89), 0.028]} radius={Math.min(0.035, w * 0.05, h * 0.05)} smoothness={3}>
        <meshStandardMaterial color={faceColor} roughness={0.8} metalness={0.04} emissive={color} emissiveIntensity={glow * 0.34} />
      </RoundedBox>
      <mesh position={[0, -h * 0.43, d * 0.525]}>
        <boxGeometry args={[w * 0.76, Math.max(0.012, h * 0.025), 0.014]} />
        <meshStandardMaterial color={edge} roughness={0.28} metalness={0.64} />
      </mesh>
      {!compact && <><EndBolt x={-w * 0.37} y={-h * 0.37} z={d * 0.53} color="#202226" /><EndBolt x={w * 0.37} y={-h * 0.37} z={d * 0.53} color="#202226" /></>}
    </group>
  );
}
