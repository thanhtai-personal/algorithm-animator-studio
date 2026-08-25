import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { MeshProps } from "./RhythmicPlatformMeshes3D";
import { EndBolt, selectedColor } from "./RhythmicPlatformMaterials3D";

export function XylophoneBarMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const bodyH = Math.max(h, 0.12);
  return <group>
    <RoundedBox args={[w, bodyH, d * 0.82]} radius={Math.min(0.07, bodyH * 0.3)} smoothness={5} castShadow receiveShadow>
      <meshPhysicalMaterial color={selectedColor(color, selected)} roughness={0.28} clearcoat={0.62} emissive={color} emissiveIntensity={glow * 0.62} />
    </RoundedBox>
    {[-0.34, 0.34].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.43} color="#f3ead8" />)}
    <mesh position={[0, bodyH * 0.82, -d * 0.34]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.055, 0.055, w * 0.74, 18]} />
      <meshStandardMaterial color="#5b4a3a" roughness={0.38} metalness={0.22} />
    </mesh>
  </group>;
}

export function PianoKeyMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const bright = new THREE.Color(color).getHSL({ h: 0, s: 0, l: 0 }).l > 0.55;
  const base = bright ? selectedColor(color, selected) : selectedColor(new THREE.Color(color).lerp(new THREE.Color("#d8d8d8"), 0.08).getStyle(), selected);
  return <group>
    <RoundedBox args={[w, Math.max(h, 0.13), d * 0.92]} radius={0.035} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={base} roughness={0.22} metalness={bright ? 0.18 : 0.42} clearcoat={0.46} emissive={color} emissiveIntensity={glow * 0.42} />
    </RoundedBox>
    <mesh position={[0, -h * 0.32, d * 0.47]}>
      <boxGeometry args={[w * 0.82, 0.018, 0.012]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
    </mesh>
    <mesh position={[0, h * 0.43, d * 0.47]}>
      <boxGeometry args={[w * 0.68, Math.max(0.014, h * 0.07), 0.014]} />
      <meshBasicMaterial color={color} transparent opacity={0.3 + Math.min(0.42, glow * 0.2)} />
    </mesh>
  </group>;
}

export function PianoKeyboardMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const whiteCount = Math.max(8, Math.min(18, Math.round(w / 0.28)));
  const keyW = w / whiteCount;
  const blackPattern = new Set([0, 1, 3, 4, 5]);
  return <group>
    <RoundedBox position={[0, h * 0.18, -d * 0.22]} args={[w * 1.04, Math.max(0.18, h * 1.8), d * 1.06]} radius={0.055} smoothness={4} castShadow receiveShadow>
      <meshPhysicalMaterial color="#272a30" roughness={0.34} metalness={0.18} clearcoat={0.42} />
    </RoundedBox>
    {Array.from({ length: whiteCount }, (_, index) => {
      const x = -w / 2 + keyW * (index + 0.5);
      return <RoundedBox key={`white-${index}`} position={[x, -h * 0.06, d * 0.33]} args={[keyW * 0.94, Math.max(0.13, h * 0.95), d * 0.44]} radius={0.018} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={selected ? "#ffffff" : "#eeeae2"} roughness={0.24} metalness={0.02} clearcoat={0.34} emissive={color} emissiveIntensity={glow * 0.12} />
      </RoundedBox>;
    })}
    {Array.from({ length: whiteCount - 1 }, (_, index) => {
      if (!blackPattern.has(index % 7)) return null;
      const x = -w / 2 + keyW * (index + 1);
      return <RoundedBox key={`black-${index}`} position={[x, h * 0.2, d * 0.48]} args={[keyW * 0.58, Math.max(0.105, h * 0.72), d * 0.38]} radius={0.016} smoothness={2} castShadow>
        <meshPhysicalMaterial color="#15171b" roughness={0.28} metalness={0.18} clearcoat={0.4} />
      </RoundedBox>;
    })}
  </group>;
}

export function MarimbaBarMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const wood = new THREE.Color(color).lerp(new THREE.Color("#7f492c"), 0.34).getStyle();
  return <group>
    <RoundedBox args={[w, Math.max(h, 0.13), d * 0.82]} radius={0.045} smoothness={4} castShadow receiveShadow>
      <meshPhysicalMaterial color={selectedColor(wood, selected)} roughness={0.38} metalness={0.02} clearcoat={0.34} emissive={color} emissiveIntensity={glow * 0.26} />
    </RoundedBox>
    {[-0.37, 0.37].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.43} color="#bfb8ae" />)}
    <mesh position={[0, h * 0.78, -d * 0.28]} castShadow>
      <boxGeometry args={[w * 0.64, Math.max(0.04, h * 0.28), d * 0.22]} />
      <meshStandardMaterial color="#4b3225" roughness={0.62} metalness={0.02} />
    </mesh>
  </group>;
}

export function PluckPadMesh({ w, h, d, color, selected, glow }: MeshProps) {
  return <group>
    <RoundedBox args={[w * 0.78, Math.max(h, 0.12), d * 0.78]} radius={0.06} smoothness={4} castShadow receiveShadow>
      <meshPhysicalMaterial color={selectedColor(color, selected)} roughness={0.3} clearcoat={0.58} emissive={color} emissiveIntensity={glow * 0.58} />
    </RoundedBox>
    <mesh position={[0, h * 0.7, -d * 0.36]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.025, 0.025, w * 0.58, 12]} />
      <meshStandardMaterial color="#6b6f75" roughness={0.25} metalness={0.78} />
    </mesh>
    <EndBolt x={0} y={0} z={d * 0.42} color="#e8edf2" />
  </group>;
}

export function VibraphoneBarMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const metal = new THREE.Color("#b8bab9").lerp(new THREE.Color(color), 0.12).getStyle();
  return <group>
    <RoundedBox args={[w, Math.max(h, 0.12), d * 0.8]} radius={0.055} smoothness={5} castShadow receiveShadow>
      <meshPhysicalMaterial color={selectedColor(metal, selected)} roughness={0.2} metalness={0.78} clearcoat={0.54} emissive={color} emissiveIntensity={glow * 0.36} />
    </RoundedBox>
    {[-0.34, 0.34].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.42} color="#44484d" />)}
    <mesh position={[0, h * 0.72, -d * 0.3]} castShadow>
      <boxGeometry args={[w * 0.54, Math.max(0.045, h * 0.3), d * 0.18]} />
      <meshStandardMaterial color="#73787d" roughness={0.3} metalness={0.72} />
    </mesh>
  </group>;
}

export function MetallophonePlateMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const bodyH = Math.max(h, 0.12);
  const noteStrength = THREE.MathUtils.clamp((glow - 0.06) * 1.18 + (selected ? 0.22 : 0), 0, 1);
  const face = new THREE.Color("#f4f3ee").lerp(new THREE.Color(color), noteStrength).getStyle();
  const supportY = bodyH * 1.35;
  const rodRadius = Math.max(0.022, bodyH * 0.14);
  return <group>
    <group position={[0, 0, -d * 0.48]}>
      <mesh position={[-w * 0.31, supportY * 0.52, 0]} castShadow>
        <cylinderGeometry args={[rodRadius, rodRadius, supportY, 14]} />
        <meshStandardMaterial color="#22262e" roughness={0.3} metalness={0.72} />
      </mesh>
      <mesh position={[0, supportY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[rodRadius, rodRadius, w * 0.62, 14]} />
        <meshStandardMaterial color="#22262e" roughness={0.3} metalness={0.72} />
      </mesh>
      <mesh position={[w * 0.31, supportY, 0]} castShadow>
        <sphereGeometry args={[rodRadius * 2.15, 16, 10]} />
        <meshStandardMaterial color="#151820" roughness={0.36} metalness={0.58} />
      </mesh>
    </group>
    <RoundedBox args={[w, bodyH, d * 0.82]} radius={Math.min(0.045, bodyH * 0.24)} smoothness={4} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={selectedColor(face, selected)}
        emissive={color}
        emissiveIntensity={noteStrength * (0.72 + glow * 0.36)}
        roughness={0.28}
        metalness={0.22}
        clearcoat={0.54}
        clearcoatRoughness={0.16}
      />
    </RoundedBox>
    {[-0.32, 0.32].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.43} color="#272b32" />)}
  </group>;
}

export function DrumDiscMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const radius = Math.max(0.2, w * 0.38);
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, Math.max(0.08, h), 32]} />
      <meshPhysicalMaterial color={selectedColor("#252525", selected)} roughness={0.5} metalness={0.12} clearcoat={0.28} emissive={color} emissiveIntensity={glow * 0.42} />
    </mesh>
    <mesh position={[0, 0, d * 0.14]}>
      <ringGeometry args={[radius * 0.72, radius * 0.9, 32]} />
      <meshStandardMaterial color={color} roughness={0.32} metalness={0.28} emissive={color} emissiveIntensity={glow * 0.48} />
    </mesh>
  </group>;
}
