import * as THREE from "three";
import type { MeshProps } from "./RhythmicPlatformMeshes3D";
import { selectedColor } from "./RhythmicPlatformMaterials3D";

function bronzeStarShape() {
  const shape = new THREE.Shape();
  for (let point = 0; point < 16; point += 1) {
    const angle = -Math.PI / 2 + point * Math.PI / 8;
    const radius = point % 2 === 0 ? 0.19 : 0.075;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

const BRONZE_STAR = bronzeStarShape();

export function TrumpetHornMesh({ w, h, d, color, selected, glow, detail }: MeshProps) {
  const bellRadius = Math.max(0.19, w * 0.23);
  const tubeRadius = Math.max(0.028, h * 0.18);
  const segments = Math.round(24 + detail * 16);
  return <group name="trumpet-horn">
    <mesh name="trumpet-bell" position={[w * 0.22, 0, d * 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[bellRadius, tubeRadius * 1.5, d * 0.72, segments, 1, true]} />
      <meshPhysicalMaterial color={selectedColor("#d6a62f", selected)} roughness={0.2} metalness={0.88} clearcoat={0.62} emissive={color} emissiveIntensity={glow * 0.16} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[-w * 0.12, 0, -d * 0.13]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[tubeRadius, tubeRadius, w * 0.58, 18]} />
      <meshStandardMaterial color="#d9aa35" roughness={0.22} metalness={0.9} />
    </mesh>
    {[-0.12, 0, 0.12].map((ratio) => <group key={ratio} position={[ratio * w, h * 0.16, -d * 0.08]}>
      <mesh castShadow><cylinderGeometry args={[tubeRadius * 1.25, tubeRadius * 1.25, h * 0.58, 14]} /><meshStandardMaterial color="#b98420" roughness={0.25} metalness={0.86} /></mesh>
      <mesh position={[0, h * 0.34, 0]}><cylinderGeometry args={[tubeRadius * 1.7, tubeRadius * 1.7, h * 0.1, 14]} /><meshStandardMaterial color="#f5d56a" roughness={0.18} metalness={0.9} /></mesh>
    </group>)}
    <mesh position={[-w * 0.43, 0, -d * 0.13]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[tubeRadius * 0.9, tubeRadius * 1.3, w * 0.13, 16]} />
      <meshStandardMaterial color="#ead47a" roughness={0.16} metalness={0.92} />
    </mesh>
  </group>;
}

export function GuitarBodyMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const wood = selectedColor("#a85d28", selected);
  return <group name="guitar-body">
    <mesh position={[-w * 0.17, h * 0.04, 0]} scale={[w * 0.31, Math.max(0.2, w * 0.27), d * 0.78]} castShadow receiveShadow>
      <sphereGeometry args={[0.72, 28, 18]} />
      <meshPhysicalMaterial color={wood} roughness={0.38} clearcoat={0.45} emissive={color} emissiveIntensity={glow * 0.08} />
    </mesh>
    <mesh position={[w * 0.06, -h * 0.01, 0]} scale={[w * 0.24, Math.max(0.16, w * 0.21), d * 0.72]} castShadow receiveShadow>
      <sphereGeometry args={[0.7, 28, 18]} />
      <meshPhysicalMaterial color={wood} roughness={0.38} clearcoat={0.45} />
    </mesh>
    <mesh position={[w * 0.31, 0, 0]} castShadow>
      <boxGeometry args={[w * 0.52, Math.max(0.075, h * 0.5), d * 0.34]} />
      <meshStandardMaterial color="#7b431f" roughness={0.42} />
    </mesh>
    <mesh name="guitar-sound-hole" position={[-w * 0.08, 0, d * 0.4]}>
      <circleGeometry args={[Math.max(0.065, w * 0.09), 28]} />
      <meshStandardMaterial color="#24130b" roughness={0.82} />
    </mesh>
    {[-1, 0, 1].map((string) => <mesh key={string} position={[w * 0.17, string * h * 0.12, d * 0.42]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.004, 0.004, w * 0.78, 6]} />
      <meshStandardMaterial color="#f5e7bd" metalness={0.72} roughness={0.2} />
    </mesh>)}
  </group>;
}

export function BronzeDrumMesh({ w, h, d, color, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.25, w * 0.4);
  const segments = Math.round(32 + detail * 24);
  return <group name="bronze-drum">
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius * 0.82, radius, Math.max(0.16, d * 0.78), segments]} />
      <meshPhysicalMaterial color={selectedColor("#806022", selected)} roughness={0.34} metalness={0.82} clearcoat={0.24} emissive={color} emissiveIntensity={glow * 0.08} />
    </mesh>
    <mesh position={[0, 0, d * 0.405]}>
      <circleGeometry args={[radius, segments]} />
      <meshPhysicalMaterial color="#b98931" roughness={0.3} metalness={0.86} />
    </mesh>
    {[0.38, 0.62, 0.83].map((ratio) => <mesh key={ratio} position={[0, 0, d * 0.414]}>
      <ringGeometry args={[radius * ratio - 0.012, radius * ratio, segments]} />
      <meshStandardMaterial color="#4f3818" roughness={0.4} metalness={0.72} />
    </mesh>)}
    <mesh name="bronze-drum-star" position={[0, 0, d * 0.422]} scale={radius * 1.7}>
      <shapeGeometry args={[BRONZE_STAR]} />
      <meshStandardMaterial color="#f0c65a" emissive={color} emissiveIntensity={glow * 0.35} roughness={0.26} metalness={0.82} />
    </mesh>
    {Array.from({ length: 8 }, (_, index) => {
      const angle = index * Math.PI / 4;
      return <mesh key={index} position={[Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72, d * 0.424]}>
        <circleGeometry args={[radius * 0.035, 10]} />
        <meshStandardMaterial color="#4a3214" metalness={0.72} />
      </mesh>;
    })}
  </group>;
}
