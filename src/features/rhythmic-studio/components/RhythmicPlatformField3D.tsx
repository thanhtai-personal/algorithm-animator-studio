import { useMemo } from "react";
import * as THREE from "three";
import type { PlatformStyle, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { resolvePlatformStyle } from "../lib/platformStyles";

const WORLD_SCALE = 0.012;
const COURSE_WIDTH = 720;

function Material({ style, color, selected }: { style: PlatformStyle; color: string; selected: boolean }) {
  const value = selected ? "#ffffff" : color;
  if (style.startsWith("glass")) {
    return <meshPhysicalMaterial color={value} transmission={0.58} opacity={0.84} transparent roughness={0.08} metalness={0.04} thickness={0.5} ior={1.42} clearcoat={1} />;
  }
  if (style.includes("neon") || style === "comet-pad") {
    return <meshStandardMaterial color={value} emissive={value} emissiveIntensity={selected ? 1.1 : 0.42} roughness={0.24} metalness={0.16} />;
  }
  if (style.includes("rail") || style === "instrument-cymbal" || style === "instrument-wire") {
    return <meshStandardMaterial color={value} roughness={0.22} metalness={0.78} />;
  }
  return <meshPhysicalMaterial color={value} roughness={0.3} metalness={0.18} clearcoat={0.36} clearcoatRoughness={0.18} />;
}

function KeyMesh({ w, h, d, color, style, selected }: MeshProps) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <Material style={style} color={color} selected={selected} />
      </mesh>
      <mesh position={[0, h * 0.43, d * 0.05]} castShadow>
        <boxGeometry args={[w * 0.9, Math.max(0.018, h * 0.12), d * 1.035]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={selected ? 0.48 : 0.2} roughness={0.18} metalness={0.15} />
      </mesh>
      <mesh position={[0, -h * 0.55, -d * 0.18]}>
        <boxGeometry args={[w * 0.76, h * 0.22, d * 0.5]} />
        <meshStandardMaterial color="#171a20" roughness={0.64} metalness={0.34} />
      </mesh>
    </>
  );
}

function TubeMesh({ w, h, d, color, style, selected }: MeshProps) {
  const radius = Math.max(h * 0.52, 0.11);
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, w, 28, 1]} />
        <Material style={style} color={color} selected={selected} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, d * 0.34]}>
        <cylinderGeometry args={[radius * 0.72, radius * 0.72, w * 1.015, 24, 1]} />
        <meshStandardMaterial color="#f6fbff" transparent opacity={0.18} roughness={0.18} metalness={0.62} />
      </mesh>
    </>
  );
}

function RailMesh({ w, h, d, color, style, selected, wire = false }: MeshProps & { wire?: boolean }) {
  const radius = wire ? Math.max(0.026, h * 0.15) : Math.max(0.045, h * 0.2);
  const gap = wire ? d * 0.1 : Math.max(h * 0.42, 0.12);
  return (
    <>
      {[-gap, gap].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radius, radius, w, 16, 1]} />
          <Material style={style} color={color} selected={selected} />
        </mesh>
      ))}
      {!wire && [-w * 0.38, 0, w * 0.38].map((x) => (
        <mesh key={x} position={[x, 0, -d * 0.12]}>
          <boxGeometry args={[radius * 1.2, gap * 2.45, d * 0.45]} />
          <meshStandardMaterial color="#303640" roughness={0.5} metalness={0.65} />
        </mesh>
      ))}
    </>
  );
}

function CymbalMesh({ w, h, d, color, style, selected }: MeshProps) {
  const radius = Math.max(w * 0.28, 0.22);
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.88, radius, Math.max(0.055, h * 0.36), 36, 2]} />
        <Material style={style} color={color} selected={selected} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, d * 0.08]}>
        <torusGeometry args={[radius * 0.73, Math.max(0.018, radius * 0.04), 8, 40]} />
        <meshStandardMaterial color="#fff1b8" roughness={0.18} metalness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, d * 0.12]}>
        <cylinderGeometry args={[radius * 0.13, radius * 0.19, Math.max(0.08, h * 0.58), 20]} />
        <meshStandardMaterial color="#8b784f" roughness={0.24} metalness={0.78} />
      </mesh>
    </>
  );
}

function CometPadMesh({ w, h, d, color, style, selected }: MeshProps) {
  const endRadius = Math.max(h * 0.55, 0.12);
  const bodyWidth = Math.max(0.08, w - endRadius * 1.5);
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[bodyWidth, h, d]} />
        <Material style={style} color={color} selected={selected} />
      </mesh>
      {[-bodyWidth / 2, bodyWidth / 2].map((x) => (
        <mesh key={x} position={[x, 0, 0]} scale={[endRadius, h * 0.52, d * 0.52]} castShadow>
          <sphereGeometry args={[1, 22, 14]} />
          <Material style={style} color={color} selected={selected} />
        </mesh>
      ))}
      <mesh position={[0, 0, d * 0.52]}>
        <boxGeometry args={[bodyWidth * 0.68, Math.max(0.025, h * 0.16), 0.025]} />
        <meshBasicMaterial color="#dff8ff" transparent opacity={0.65} />
      </mesh>
    </>
  );
}

interface MeshProps {
  w: number;
  h: number;
  d: number;
  color: string;
  style: PlatformStyle;
  selected: boolean;
}

function PlatformMesh(props: MeshProps) {
  if (props.style === "tube-cylinder" || props.style === "toy-tube") return <TubeMesh {...props} />;
  if (props.style === "instrument-key" || props.style === "xylophone-key") return <KeyMesh {...props} />;
  if (props.style === "instrument-cymbal") return <CymbalMesh {...props} />;
  if (props.style === "instrument-rail") return <RailMesh {...props} />;
  if (props.style === "instrument-wire") return <RailMesh {...props} wire />;
  if (props.style === "comet-pad") return <CometPadMesh {...props} />;
  if (props.style === "instrument-pad") return <KeyMesh {...props} />;
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[props.w, props.h, props.d]} />
      <Material style={props.style} color={props.color} selected={props.selected} />
    </mesh>
  );
}

export function RhythmicPlatformField3D({ platforms, settings, focusIndex, selectedNodeIndex, onSelectNode }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  focusIndex: number;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
}) {
  const visible = useMemo(() => {
    const radius = settings.terrainProfile === "xylophone" ? 22 : 18;
    return platforms.filter((platform) => Math.abs(platform.index - focusIndex) <= radius);
  }, [focusIndex, platforms, settings.terrainProfile]);

  return (
    <group>
      {visible.map((platform) => {
        const style = resolvePlatformStyle(platform.index, settings);
        const w = Math.max(0.3, platform.width * WORLD_SCALE);
        const h = Math.max(0.09, platform.thickness * WORLD_SCALE);
        const d = style === "instrument-cymbal" ? 0.42 : (style === "tube-cylinder" ? 0.58 : 0.5);
        return (
          <group
            key={platform.index}
            position={[(platform.x - COURSE_WIDTH / 2) * WORLD_SCALE, -platform.y * WORLD_SCALE, 0]}
            rotation={[0, 0, -platform.tiltRad]}
            onClick={(event) => {
              event.stopPropagation();
              onSelectNode(platform.index);
            }}
          >
            <PlatformMesh w={w} h={h} d={d} color={platform.color} style={style} selected={platform.index === selectedNodeIndex} />
          </group>
        );
      })}
    </group>
  );
}
