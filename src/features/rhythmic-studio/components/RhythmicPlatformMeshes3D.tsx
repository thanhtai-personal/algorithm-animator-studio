import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { PlatformStyle } from "../types";
import { EndBolt, selectedColor, SurfaceMaterial } from "./RhythmicPlatformMaterials3D";

interface MeshProps {
  w: number;
  h: number;
  d: number;
  color: string;
  style: PlatformStyle;
  selected: boolean;
  glow: number;
  detail: number;
}

function StandardBarMesh({ w, h, d, color, style, selected, glow }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={Math.min(0.11, h * 0.36)} smoothness={4} castShadow receiveShadow>
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </RoundedBox>
      <mesh position={[0, -h * 0.34, d * 0.505]}>
        <boxGeometry args={[w * 0.82, Math.max(0.018, h * 0.08), 0.012]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.22} roughness={0.15} metalness={0.22} />
      </mesh>
    </group>
  );
}

function NeonTubeMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.075, h * 0.42);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, w, Math.round(18 + detail * 14), 1]} />
        <meshPhysicalMaterial color="#d9efff" transparent opacity={0.2} roughness={0.08} transmission={0.58} thickness={0.22} clearcoat={1} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.58, radius * 0.58, w * 0.95, Math.round(14 + detail * 12), 1]} />
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * w * 0.49, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[radius * 1.16, radius * 1.16, Math.min(0.16, w * 0.12), 24]} />
            <meshStandardMaterial color="#171d27" roughness={0.3} metalness={0.76} />
          </mesh>
          <mesh position={[0, 0, d * 0.3]}>
            <sphereGeometry args={[radius * 0.22, 12, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GlassBarMesh(props: MeshProps) {
  const { w, h, d, color, style, selected, glow } = props;
  const optic = style === "glass-optic";
  const tempered = style === "glass-tempered";
  const acrylic = style === "glass-acrylic";
  const bodyHeight = acrylic ? h * 1.18 : h;
  const bodyDepth = acrylic ? d * 0.86 : d;
  return (
    <group>
      <RoundedBox args={[w, bodyHeight, bodyDepth]} radius={acrylic ? Math.min(0.16, bodyHeight * 0.48) : Math.min(0.1, h * 0.3)} smoothness={5} castShadow receiveShadow>
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </RoundedBox>
      <mesh position={[0, -h * 0.33, d * 0.506]}>
        <boxGeometry args={[w * 0.86, Math.max(0.012, h * 0.07), 0.012]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={style === "glass-frosted" ? 0.16 : 0.42} />
      </mesh>
      {(optic || tempered) && (
        <mesh position={[0, h * 0.35, d * 0.51]}>
          <boxGeometry args={[w * 0.9, Math.max(0.016, h * 0.09), 0.016]} />
          <meshBasicMaterial color={optic ? color : "#dff6ff"} transparent opacity={optic ? 0.78 : 0.32} />
        </mesh>
      )}
      {tempered && <>
        <EndBolt x={-w * 0.39} y={0} z={d * 0.52} />
        <EndBolt x={w * 0.39} y={0} z={d * 0.52} />
      </>}
    </group>
  );
}

function GlassTubeMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.09, h * 0.43);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, w, Math.round(22 + detail * 18), 1, true]} />
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.68, radius * 0.68, w * 1.012, Math.round(18 + detail * 16), 1, true]} />
        <meshPhysicalMaterial color="#dff7ff" transparent opacity={0.12} roughness={0.05} transmission={0.45} side={THREE.BackSide} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.49, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[radius * 0.92, radius * 0.09, 8, 24]} />
          <meshStandardMaterial color="#d9e6ec" roughness={0.2} metalness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function CurvedRail({ w, y, radius, color, style, selected, glow, bend = 0.035 }: {
  w: number; y: number; radius: number; color: string; style: PlatformStyle; selected: boolean; glow: number; bend?: number;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w / 2, y, 0),
    new THREE.Vector3(-w * 0.22, y - bend, 0.02),
    new THREE.Vector3(w * 0.22, y + bend, 0.02),
    new THREE.Vector3(w / 2, y, 0),
  ]), [bend, w, y]);
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 28, radius, 10, false]} />
      <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
    </mesh>
  );
}

function RailMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  const wire = style === "instrument-wire";
  const pipe = style === "pipe-rail";
  const dual = style === "dual-rail" || style === "instrument-rail" || wire;
  const radius = wire ? 0.026 : pipe ? Math.max(0.065, h * 0.24) : Math.max(0.045, h * 0.18);
  const gap = dual ? Math.max(0.1, h * 0.5) : 0;
  const strands = dual ? [-gap, gap] : [0];
  return (
    <group>
      {strands.map((y) => <CurvedRail key={y} w={w} y={y} radius={radius} color={color} style={style} selected={selected} glow={glow} bend={wire ? 0.018 : 0.035} />)}
      {[-w * 0.37, 0, w * 0.37].map((x) => (
        <group key={x} position={[x, 0, -d * 0.18]}>
          <RoundedBox args={[Math.max(0.045, radius * 1.2), dual ? gap * 2.5 : Math.max(h * 0.7, 0.12), d * 0.42]} radius={0.018} smoothness={3} castShadow>
            <meshStandardMaterial color="#252c36" roughness={0.34} metalness={0.76} />
          </RoundedBox>
          <EndBolt x={0} y={0} z={d * 0.24} color="#aeb8c4" />
        </group>
      ))}
    </group>
  );
}

function LightPodsMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const count = Math.max(4, Math.min(7, Math.round(w / 0.32)));
  const positions = Array.from({ length: count }, (_, index) => -w * 0.42 + (w * 0.84 * index) / Math.max(1, count - 1));
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.12), d]} radius={0.075} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#151b24" roughness={0.3} metalness={0.62} />
      </RoundedBox>
      {positions.map((x, index) => (
        <mesh key={x} position={[x, 0, d * 0.49]} scale={index % 2 ? 0.92 : 1}>
          <sphereGeometry args={[Math.min(0.09, h * 0.3), 18, 12]} />
          <meshPhysicalMaterial color={selectedColor(color, selected)} emissive={color} emissiveIntensity={(selected ? 1.05 : 0.04) + THREE.MathUtils.clamp(glow, 0, 1.5) * 0.88} roughness={0.14} clearcoat={1} />
        </mesh>
      ))}
    </group>
  );
}

function TechPadMesh({ w, h, d, color, style, selected, glow }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.13), d]} radius={0.09} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial color="#111823" roughness={0.24} metalness={0.62} clearcoat={0.4} />
      </RoundedBox>
      <RoundedBox position={[0, -h * 0.12, d * 0.515]} args={[w * 0.72, h * 0.34, 0.035]} radius={0.022} smoothness={3}>
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </RoundedBox>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sy) => (
        <EndBolt key={`${sx}:${sy}`} x={sx * w * 0.39} y={sy * h * 0.25} z={d * 0.515} />
      )))}
    </group>
  );
}

function KeyMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.11), d]} radius={Math.min(0.085, h * 0.32)} smoothness={5} castShadow receiveShadow>
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </RoundedBox>
      <mesh position={[0, h * 0.76, -d * 0.18]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[Math.min(0.08, h * 0.28), Math.min(0.08, h * 0.28), w * 0.72, 18]} />
        <meshStandardMaterial color="#31343a" roughness={0.38} metalness={0.7} />
      </mesh>
      <mesh position={[0, -h * 0.32, d * 0.51]}>
        <boxGeometry args={[w * 0.72, Math.max(0.014, h * 0.065), 0.012]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.34} />
      </mesh>
      <EndBolt x={-w * 0.36} y={0} z={d * 0.52} color="#f1e8d5" />
      <EndBolt x={w * 0.36} y={0} z={d * 0.52} color="#f1e8d5" />
    </group>
  );
}

const CYMBAL_PROFILE = [
  new THREE.Vector2(0.02, 0.09),
  new THREE.Vector2(0.1, 0.11),
  new THREE.Vector2(0.18, 0.07),
  new THREE.Vector2(0.42, 0.018),
  new THREE.Vector2(0.76, -0.005),
  new THREE.Vector2(1, 0.028),
  new THREE.Vector2(0.98, -0.018),
  new THREE.Vector2(0.7, -0.035),
  new THREE.Vector2(0.36, -0.03),
  new THREE.Vector2(0.08, 0.035),
  new THREE.Vector2(0.02, 0.09),
];

function CymbalMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.24, w * 0.44);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[radius, Math.max(0.22, h * 1.2), radius]} castShadow receiveShadow>
        <latheGeometry args={[CYMBAL_PROFILE, Math.round(28 + detail * 24)]} />
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </mesh>
      <mesh position={[0, 0, -d * 0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, Math.max(0.22, d * 0.9), 18]} />
        <meshStandardMaterial color="#72664f" roughness={0.2} metalness={0.82} />
      </mesh>
      <mesh position={[0, 0, d * 0.14]}>
        <sphereGeometry args={[0.065, 18, 12]} />
        <meshStandardMaterial color="#f4df9e" roughness={0.18} metalness={0.88} />
      </mesh>
    </group>
  );
}

function TubeMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  const radius = Math.max(h * 0.5, 0.11);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, w, Math.round(22 + detail * 18), 1]} />
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -radius * 0.18, d * 0.34]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, w * 0.96, 28, 1]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.17} roughness={0.12} metalness={0.42} clearcoat={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.43, radius * 0.7, -d * 0.12]} castShadow>
          <boxGeometry args={[Math.max(0.07, w * 0.06), radius * 0.62, d * 0.55]} />
          <meshStandardMaterial color="#2d333a" roughness={0.36} metalness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function ToyPegMesh({ w, h, d, color, style, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.12, h * 0.56);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, Math.max(w * 0.72, 0.28), Math.round(20 + detail * 16)]} />
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </mesh>
      <mesh position={[0, 0, d * 0.36]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius * 0.72, radius * 0.09, 8, 28]} />
        <meshStandardMaterial color="#fff5e9" roughness={0.26} metalness={0.08} />
      </mesh>
    </group>
  );
}

function CometPadMesh({ w, h, d, color, style, selected, glow }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.12), d]} radius={Math.min(0.16, Math.max(h * 0.48, 0.08))} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial color="#15162a" roughness={0.2} metalness={0.5} clearcoat={0.8} clearcoatRoughness={0.08} />
      </RoundedBox>
      <RoundedBox position={[0, 0, d * 0.515]} args={[w * 0.77, h * 0.46, 0.035]} radius={0.035} smoothness={4}>
        <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.4, 0, d * 0.51]}>
          <sphereGeometry args={[Math.max(0.04, h * 0.16), 16, 10]} />
          <meshBasicMaterial color="#e9f8ff" />
        </mesh>
      ))}
    </group>
  );
}

function StairStepMesh({ w, h, d, color, style, selected, glow }: MeshProps) {
  return (
    <group>
      {[0, 1, 2].map((index) => {
        const stepW = w / 3.1;
        return (
          <RoundedBox key={index} position={[-w * 0.32 + index * stepW, index * h * 0.13, 0]} args={[stepW * 0.94, h * (0.75 + index * 0.13), d]} radius={0.045} smoothness={3} castShadow receiveShadow>
            <SurfaceMaterial style={style} color={color} selected={selected} glow={glow} />
          </RoundedBox>
        );
      })}
    </group>
  );
}


function BoomwhackerMesh({ w, h, color, selected, glow, detail }: MeshProps) {
  const radius = Math.max(0.11, h * 0.5);
  const segments = Math.round(24 + detail * 18);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, w, segments, 1, true]} />
        <meshPhysicalMaterial
          color={selectedColor(color, selected)}
          roughness={0.24}
          metalness={0.02}
          clearcoat={0.72}
          clearcoatRoughness={0.12}
          emissive={color}
          emissiveIntensity={THREE.MathUtils.clamp(glow, 0, 1.5) * 0.72}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.72, radius * 0.72, w * 1.012, segments, 1, true]} />
        <meshStandardMaterial color="#191919" roughness={0.76} side={THREE.BackSide} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.505, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[radius * 0.87, radius * 0.055, 10, 30]} />
          <meshStandardMaterial color={selectedColor(color, selected)} roughness={0.2} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

function XylophoneBarMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const bodyH = Math.max(h, 0.12);
  return (
    <group>
      <RoundedBox args={[w, bodyH, d * 0.82]} radius={Math.min(0.07, bodyH * 0.3)} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial color={selectedColor(color, selected)} roughness={0.28} clearcoat={0.62} emissive={color} emissiveIntensity={glow * 0.62} />
      </RoundedBox>
      {[-0.34, 0.34].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.43} color="#f3ead8" />)}
      <mesh position={[0, bodyH * 0.82, -d * 0.34]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, w * 0.74, 18]} />
        <meshStandardMaterial color="#5b4a3a" roughness={0.38} metalness={0.22} />
      </mesh>
    </group>
  );
}

function PianoKeyMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const bright = new THREE.Color(color).getHSL({ h: 0, s: 0, l: 0 }).l > 0.55;
  const base = bright ? selectedColor(color, selected) : selectedColor(new THREE.Color(color).lerp(new THREE.Color("#d8d8d8"), 0.08).getStyle(), selected);
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.13), d * 0.92]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={base} roughness={0.22} metalness={bright ? 0.18 : 0.42} clearcoat={0.46} emissive={color} emissiveIntensity={glow * 0.42} />
      </RoundedBox>
      <mesh position={[0, -h * 0.32, d * 0.47]}>
        <boxGeometry args={[w * 0.82, 0.018, 0.012]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, h * 0.52, -d * 0.25]} castShadow>
        <boxGeometry args={[w * 0.72, Math.max(0.035, h * 0.22), d * 0.3]} />
        <meshStandardMaterial color="#242424" roughness={0.36} metalness={0.5} />
      </mesh>
    </group>
  );
}

function PianoKeyboardMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const whiteCount = Math.max(8, Math.min(18, Math.round(w / 0.28)));
  const keyW = w / whiteCount;
  const blackPattern = new Set([0, 1, 3, 4, 5]);
  return (
    <group>
      <RoundedBox position={[0, h * 0.18, -d * 0.22]} args={[w * 1.04, Math.max(0.18, h * 1.8), d * 1.06]} radius={0.055} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#272a30" roughness={0.34} metalness={0.18} clearcoat={0.42} />
      </RoundedBox>
      {Array.from({ length: whiteCount }, (_, index) => {
        const x = -w / 2 + keyW * (index + 0.5);
        return <RoundedBox key={`white-${index}`} position={[x, -h * 0.06, d * 0.33]} args={[keyW * 0.94, Math.max(0.13, h * 0.95), d * 0.44]} radius={0.018} smoothness={2} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={selected ? "#ffffff" : "#eeeae2"}
            roughness={0.24}
            metalness={0.02}
            clearcoat={0.34}
            emissive={color}
            emissiveIntensity={glow * 0.12}
          />
        </RoundedBox>;
      })}
      {Array.from({ length: whiteCount - 1 }, (_, index) => {
        if (!blackPattern.has(index % 7)) return null;
        const x = -w / 2 + keyW * (index + 1);
        return <RoundedBox key={`black-${index}`} position={[x, h * 0.2, d * 0.48]} args={[keyW * 0.58, Math.max(0.105, h * 0.72), d * 0.38]} radius={0.016} smoothness={2} castShadow>
          <meshPhysicalMaterial color="#15171b" roughness={0.28} metalness={0.18} clearcoat={0.4} />
        </RoundedBox>;
      })}
    </group>
  );
}

function MarimbaBarMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const wood = new THREE.Color(color).lerp(new THREE.Color("#7f492c"), 0.34).getStyle();
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.13), d * 0.82]} radius={0.045} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={selectedColor(wood, selected)} roughness={0.38} metalness={0.02} clearcoat={0.34} emissive={color} emissiveIntensity={glow * 0.26} />
      </RoundedBox>
      {[-0.37, 0.37].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.43} color="#bfb8ae" />)}
      <mesh position={[0, h * 0.78, -d * 0.28]} castShadow>
        <boxGeometry args={[w * 0.64, Math.max(0.04, h * 0.28), d * 0.22]} />
        <meshStandardMaterial color="#4b3225" roughness={0.62} metalness={0.02} />
      </mesh>
    </group>
  );
}

function PluckPadMesh({ w, h, d, color, selected, glow }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[w * 0.78, Math.max(h, 0.12), d * 0.78]} radius={0.06} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={selectedColor(color, selected)} roughness={0.3} clearcoat={0.58} emissive={color} emissiveIntensity={glow * 0.58} />
      </RoundedBox>
      <mesh position={[0, h * 0.7, -d * 0.36]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, w * 0.58, 12]} />
        <meshStandardMaterial color="#6b6f75" roughness={0.25} metalness={0.78} />
      </mesh>
      <EndBolt x={0} y={0} z={d * 0.42} color="#e8edf2" />
    </group>
  );
}

function VibraphoneBarMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const metal = new THREE.Color("#b8bab9").lerp(new THREE.Color(color), 0.12).getStyle();
  return (
    <group>
      <RoundedBox args={[w, Math.max(h, 0.12), d * 0.8]} radius={0.055} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial color={selectedColor(metal, selected)} roughness={0.2} metalness={0.78} clearcoat={0.54} emissive={color} emissiveIntensity={glow * 0.36} />
      </RoundedBox>
      {[-0.34, 0.34].map((ratio) => <EndBolt key={ratio} x={w * ratio} y={0} z={d * 0.42} color="#44484d" />)}
      <mesh position={[0, h * 0.72, -d * 0.3]} castShadow>
        <boxGeometry args={[w * 0.54, Math.max(0.045, h * 0.3), d * 0.18]} />
        <meshStandardMaterial color="#73787d" roughness={0.3} metalness={0.72} />
      </mesh>
    </group>
  );
}

function DrumDiscMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const radius = Math.max(0.2, w * 0.38);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, Math.max(0.08, h), 32]} />
        <meshPhysicalMaterial color={selectedColor("#252525", selected)} roughness={0.5} metalness={0.12} clearcoat={0.28} emissive={color} emissiveIntensity={glow * 0.42} />
      </mesh>
      <mesh position={[0, 0, d * 0.14]}>
        <ringGeometry args={[radius * 0.72, radius * 0.9, 32]} />
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.28} emissive={color} emissiveIntensity={glow * 0.48} />
      </mesh>
    </group>
  );
}

function CowbellBlockMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const bodyColor = new THREE.Color("#2f3338").lerp(new THREE.Color(color), 0.12).getStyle();
  return (
    <group>
      <RoundedBox args={[w * 0.88, Math.max(h * 1.16, 0.18), d]} radius={0.055} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={selectedColor(bodyColor, selected)} roughness={0.32} metalness={0.68} clearcoat={0.35} emissive={color} emissiveIntensity={glow * 0.16} />
      </RoundedBox>
      <RoundedBox position={[0, -h * 0.05, d * 0.505]} args={[w * 0.68, Math.max(h * 0.7, 0.11), 0.025]} radius={0.035} smoothness={3}>
        <meshStandardMaterial color="#090b0e" roughness={0.52} metalness={0.38} />
      </RoundedBox>
      <mesh position={[0, h * 0.72, -d * 0.2]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, Math.max(0.18, h * 0.9), 12]} />
        <meshStandardMaterial color="#7b858f" roughness={0.24} metalness={0.82} />
      </mesh>
    </group>
  );
}

function BellConeMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const radius = Math.max(0.14, Math.min(w * 0.34, h * 0.95));
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.42, radius, Math.max(d, 0.34), 28, 1, true]} />
        <meshPhysicalMaterial color={selectedColor(color, selected)} roughness={0.28} metalness={0.52} clearcoat={0.48} emissive={color} emissiveIntensity={glow * 0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, d * 0.49]}>
        <torusGeometry args={[radius * 0.82, radius * 0.08, 10, 28]} />
        <meshStandardMaterial color="#e4e7eb" roughness={0.2} metalness={0.74} />
      </mesh>
      <mesh position={[0, 0, -d * 0.32]} castShadow>
        <sphereGeometry args={[radius * 0.18, 16, 10]} />
        <meshStandardMaterial color="#252a30" roughness={0.3} metalness={0.62} />
      </mesh>
    </group>
  );
}

function ArcadePadMesh({ w, h, d, color, selected, glow }: MeshProps) {
  const side = Math.max(0.36, Math.min(w * 0.78, 0.92));
  return (
    <group>
      <RoundedBox args={[side, side * 0.8, d]} radius={0.12} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial color={selectedColor("#17251d", selected)} roughness={0.34} metalness={0.28} clearcoat={0.5} />
      </RoundedBox>
      <RoundedBox position={[0, 0, d * 0.51]} args={[side * 0.68, side * 0.52, 0.035]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.15 + glow * 0.72} roughness={0.24} metalness={0.16} clearcoat={0.75} />
      </RoundedBox>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sy) => <EndBolt key={`${sx}:${sy}`} x={sx * side * 0.36} y={sy * side * 0.28} z={d * 0.515} color="#87938d" />))}
    </group>
  );
}

export function PlatformMesh(props: MeshProps) {
  const style = props.style;
  if (style === "neon-tube") return <NeonTubeMesh {...props} />;
  if (style === "neon-bar") return <StandardBarMesh {...props} />;
  if (style === "glass-borosilicate") return <GlassTubeMesh {...props} />;
  if (style.startsWith("glass") || style === "glass") return <GlassBarMesh {...props} />;
  if (style === "metal-rail" || style === "dual-rail" || style === "pipe-rail" || style === "instrument-rail" || style === "instrument-wire") return <RailMesh {...props} />;
  if (style === "light-pods") return <LightPodsMesh {...props} />;
  if (style === "tech-pad") return <TechPadMesh {...props} />;
  if (style === "prism") return <StandardBarMesh {...props} />;
  if (style === "stair-step") return <StairStepMesh {...props} />;
  if (style === "toy-peg") return <ToyPegMesh {...props} />;
  if (style === "tube-cylinder" || style === "toy-tube") return <TubeMesh {...props} />;
  if (style === "instrument-key" || style === "xylophone-key" || style === "instrument-pad") return <KeyMesh {...props} />;
  if (style === "instrument-cymbal") return <CymbalMesh {...props} />;
  if (style === "boomwhacker-tube") return <BoomwhackerMesh {...props} />;
  if (style === "xylophone-bar") return <XylophoneBarMesh {...props} />;
  if (style === "piano-key") return <PianoKeyMesh {...props} />;
  if (style === "piano-keyboard") return <PianoKeyboardMesh {...props} />;
  if (style === "marimba-bar") return <MarimbaBarMesh {...props} />;
  if (style === "pluck-pad") return <PluckPadMesh {...props} />;
  if (style === "vibraphone-bar") return <VibraphoneBarMesh {...props} />;
  if (style === "drum-disc") return <DrumDiscMesh {...props} />;
  if (style === "cowbell-block") return <CowbellBlockMesh {...props} />;
  if (style === "bell-cone") return <BellConeMesh {...props} />;
  if (style === "arcade-pad") return <ArcadePadMesh {...props} />;
  if (style === "comet-pad") return <CometPadMesh {...props} />;
  return <StandardBarMesh {...props} />;
}
