import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { PlatformStyle } from "../types";
import { EndBolt, selectedColor, SurfaceMaterial } from "./RhythmicPlatformMaterials3D";
import { InstrumentPaddleMesh3D } from "./RhythmicInstrumentPaddle3D";
import {
  DrumDiscMesh,
  MarimbaBarMesh,
  PianoKeyboardMesh,
  PianoKeyMesh,
  PluckPadMesh,
  VibraphoneBarMesh,
  XylophoneBarMesh,
} from "./RhythmicShowcaseInstrumentMeshes3D";

export interface MeshProps {
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
  if (style === "instrument-key" || style === "xylophone-key") return <KeyMesh {...props} />;
  if (style === "instrument-pad") return <InstrumentPaddleMesh3D {...props} />;
  if (style === "instrument-cymbal") return <CymbalMesh {...props} />;
  if (style === "boomwhacker-tube") return <BoomwhackerMesh {...props} />;
  if (style === "xylophone-bar") return <XylophoneBarMesh {...props} />;
  if (style === "piano-key") return <PianoKeyMesh {...props} />;
  if (style === "piano-keyboard") return <PianoKeyboardMesh {...props} />;
  if (style === "marimba-bar") return <MarimbaBarMesh {...props} />;
  if (style === "pluck-pad") return <PluckPadMesh {...props} />;
  if (style === "vibraphone-bar") return <VibraphoneBarMesh {...props} />;
  if (style === "drum-disc") return <DrumDiscMesh {...props} />;
  if (style === "comet-pad") return <CometPadMesh {...props} />;
  return <StandardBarMesh {...props} />;
}
