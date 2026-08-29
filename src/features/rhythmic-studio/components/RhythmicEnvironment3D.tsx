import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettings } from "../types";
import { RhythmicBackplate3D } from "./RhythmicBackplate3D";
import { RhythmicBrickWall3D } from "./RhythmicBrickWall3D";
import { RHYTHMIC_ROOM_BACKDROP_WIDTH, RHYTHMIC_ROOM_SIDE_X, type RhythmicBackdropBounds } from "./rhythmicSceneMath3D";
import { isKorobeinikiWallLayout } from "../lib/korobeinikiReferenceLayout";
import { sampledBackdropRepeatIndices } from "../lib/backdropRepeatLayout";

export type EnvironmentKind = "tube-board" | "comet" | "xylophone" | "brick" | "stage" | "sunrise" | "neutral";

export function environmentKind(settings: StudioSettings): EnvironmentKind {
  if (settings.backgroundPreset === "brick-wall") return "brick";
  if (settings.backgroundPreset === "velvet-stage") return "stage";
  if (settings.backgroundPreset === "tube-board-dark") return "tube-board";
  if (settings.backgroundPreset === "comet-void" || settings.backgroundPreset === "deep-space") return "comet";
  if (settings.backgroundPreset === "sunrise-panels") return "sunrise";
  if (settings.backgroundPreset === "xylophone-room" || settings.backgroundPreset === "instrument-room") return "xylophone";
  if (settings.backgroundPreset === "spotlight") return "neutral";
  if (settings.terrainProfile === "tube-board" || settings.terrainProfile === "comet" || settings.terrainProfile === "xylophone") return settings.terrainProfile;
  return "neutral";
}

function artBackgroundColor(settings: StudioSettings) {
  const kind = environmentKind(settings);
  const artColor = kind === "comet" ? new THREE.Color("#040611")
    : kind === "xylophone" ? new THREE.Color("#b9afa2")
      : kind === "tube-board" ? new THREE.Color("#10141a")
        : kind === "brick" ? new THREE.Color("#08090a")
          : kind === "stage" ? new THREE.Color("#14060d")
            : kind === "sunrise" ? new THREE.Color("#ecd7c0")
            : new THREE.Color(settings.backgroundColor);
  if (kind !== "neutral") artColor.lerp(new THREE.Color(settings.backgroundColor), 0.22);
  return artColor;
}

function radialTexture() {
  const size = 96;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5) / size * 2 - 1;
      const dy = (y + 0.5) / size * 2 - 1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.pow(Math.max(0, 1 - distance), 2.2);
      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function GlowSprite({ position, scale, color, opacity = 0.32 }: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity?: number;
}) {
  const texture = useMemo(() => radialTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={scale}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

function SceneAtmosphere({ settings }: { settings: StudioSettings }) {
  const { scene } = useThree();
  useEffect(() => {
    const previousBackground = scene.background;
    const previousFog = scene.fog;
    const kind = environmentKind(settings);
    const background = artBackgroundColor(settings);
    scene.background = background;
    scene.fog = kind === "comet"
      ? new THREE.FogExp2(background.clone().lerp(new THREE.Color("#07091a"), 0.62), 0.024)
      : new THREE.Fog(background, kind === "brick" ? 18 : kind === "xylophone" || kind === "sunrise" ? 15 : kind === "stage" ? 14 : 13, kind === "brick" ? 38 : kind === "xylophone" || kind === "sunrise" ? 34 : kind === "stage" ? 32 : 30);
    return () => {
      scene.background = previousBackground;
      scene.fog = previousFog;
    };
  }, [scene, settings.backgroundColor, settings.backgroundPreset, settings.terrainProfile]);
  return null;
}

export function ReflectionRig({ settings }: { settings: StudioSettings }) {
  const kind = environmentKind(settings);
  const warm = kind === "xylophone" || kind === "sunrise" || kind === "stage";
  const comet = kind === "comet";
  return (
    <Environment resolution={64} frames={1}>
      <Lightformer form="rect" intensity={4.8} color={warm ? "#fff0d2" : "#eaf5ff"} position={[-4, 4, 6]} rotation={[0, 0.38, 0]} scale={[5, 2.2, 1]} />
      <Lightformer form="rect" intensity={3.4} color={comet ? "#536fff" : warm ? "#ffc47a" : "#7fc7ff"} position={[5, -3, 4]} rotation={[0, -0.45, 0]} scale={[3, 5, 1]} />
      <Lightformer form="ring" intensity={comet ? 5.4 : 2.4} color={comet ? "#e95aea" : "#ffffff"} position={[0, 1, -5]} scale={[6, 6, 1]} />
    </Environment>
  );
}

function BackgroundMotion({ settings, children }: { settings: StudioSettings; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    const kind = environmentKind(settings);
    const motion = THREE.MathUtils.clamp(settings.backgroundMotion, 0, 1.5);
    const strength = kind === "comet" ? 1 : kind === "tube-board" ? 0.16 : kind === "xylophone" || kind === "sunrise" ? 0.06 : kind === "stage" ? 0.04 : kind === "brick" ? 0.02 : 0.1;
    const time = clock.elapsedTime;
    group.position.x = Math.sin(time * 0.11) * 0.12 * motion * strength;
    group.position.z = Math.cos(time * 0.08) * 0.05 * motion * strength;
    group.rotation.z = Math.sin(time * 0.07) * 0.003 * motion * strength;
  });
  return <group ref={ref}>{children}</group>;
}

function TubeBoardRoom({ bounds }: { bounds: RhythmicBackdropBounds }) {
  const sections = useMemo(() => sampledBackdropRepeatIndices(bounds.height, 11.2, 48), [bounds.height]);
  return (
    <group>
      <RoundedBox position={[0, bounds.centerY, -4.45]} args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.56]} radius={0.14} smoothness={4} receiveShadow renderOrder={-30}>
        <meshStandardMaterial color="#111a25" roughness={0.78} metalness={0.16} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0, bounds.centerY, -4.08]} args={[64, Math.max(1, bounds.height - 10), 0.12]} radius={0.1} smoothness={4} receiveShadow renderOrder={-28}>
        <meshStandardMaterial color="#1a2d40" roughness={0.7} metalness={0.08} depthWrite={false} />
      </RoundedBox>
      {[-RHYTHMIC_ROOM_SIDE_X, RHYTHMIC_ROOM_SIDE_X].map((x) => (
        <mesh key={x} position={[x, bounds.centerY, -4.06]} rotation={[0, x < 0 ? Math.PI / 2.86 : -Math.PI / 2.86, 0]} receiveShadow renderOrder={-26}>
          <planeGeometry args={[5.4, bounds.height]} />
          <meshStandardMaterial color="#1d2a36" roughness={0.7} metalness={0.22} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {[-6.95, 6.95].map((x) => (
        <mesh key={x} position={[x, bounds.centerY, -3.84]} castShadow renderOrder={-24}>
          <cylinderGeometry args={[0.065, 0.065, bounds.height, 16]} />
          <meshStandardMaterial color="#41515f" roughness={0.26} metalness={0.82} depthWrite={false} />
        </mesh>
      ))}
      {sections.map((index) => {
        const y = bounds.topY - 9 - index * 11.2;
        const accent = index % 4 === 0 ? "#dc5058" : "#98a4b3";
        return (
          <group key={index} position={[0, y, -3.7]} renderOrder={-22}>
            {[-4.75, 4.75].map((x, side) => (
              <RoundedBox key={`rail-${x}`} position={[x, 0, 0]} args={[3.55, 0.14, 0.14]} radius={0.05} smoothness={3} castShadow>
                <meshStandardMaterial color={side === 0 ? "#526579" : "#46586a"} roughness={0.34} metalness={0.68} depthWrite={false} />
              </RoundedBox>
            ))}
            {[-5.55, -3.9, 3.9, 5.55].map((x, peg) => (
              <group key={x} position={[x, peg % 2 ? 0.52 : -0.5, 0.24]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.085, 0.085, 0.38, 18]} />
                  <meshStandardMaterial color={peg === 1 ? accent : "#a7b0ba"} roughness={0.22} metalness={0.74} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                  <sphereGeometry args={[0.04, 12, 8]} />
                  <meshStandardMaterial color="#e9eef3" roughness={0.2} metalness={0.72} depthWrite={false} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
      <GlowSprite position={[-5.4, -22, -3.0]} scale={[8, 18, 1]} color="#4b8fd8" opacity={0.18} />
      <GlowSprite position={[5.8, -72, -3.05]} scale={[7, 16, 1]} color="#ffb064" opacity={0.12} />
      <GlowSprite position={[0, -60, -4.0]} scale={[11, 30, 1]} color="#2b6da8" opacity={0.17} />
    </group>
  );
}

function StarField({ bounds }: { bounds: RhythmicBackdropBounds }) {
  const positions = useMemo(() => {
    const count = Math.min(3600, Math.max(360, Math.round(bounds.height * 3.2)));
    const data = new Float32Array(count * 3);
    let seed = 14723;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i += 1) {
      data[i * 3] = (random() - 0.5) * 28;
      data[i * 3 + 1] = bounds.bottomY + random() * bounds.height;
      data[i * 3 + 2] = -2.5 - random() * 15;
    }
    return data;
  }, [bounds.bottomY, bounds.height]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cce5ff" size={0.045} sizeAttenuation transparent opacity={0.86} depthWrite={false} />
    </points>
  );
}

function CometSpace({ bounds }: { bounds: RhythmicBackdropBounds }) {
  const rings = useMemo(() => sampledBackdropRepeatIndices(bounds.height, 14.4, 64), [bounds.height]);
  return (
    <group>
      <StarField bounds={bounds} />
      <mesh position={[0, bounds.centerY, -9]}>
        {/* The camera follows the marble laterally by several world units. A 34u
            comet backdrop exposed its hard vertical edge in portrait exports as a
            giant black strip sliding across the frame. Oversize the star-space
            plate so it remains a background, not a foreground-looking obstacle. */}
        <planeGeometry args={[80, bounds.height + 34]} />
        <meshBasicMaterial color="#040611" />
      </mesh>
      {rings.map((index) => {
        const left = index % 2 === 0;
        return (
          <group key={index} position={[left ? -5.2 : 5.4, bounds.topY - 7 - index * 14.4, -6 - (index % 3) * 0.84]} rotation={[0.08, left ? -0.18 : 0.18, left ? -0.36 : 0.36]}>
            <mesh>
              <torusGeometry args={[2.2 + (index % 3) * 0.28, 0.038, 10, 72, Math.PI * 1.3]} />
              <meshStandardMaterial
                color={left ? "#6680ff" : "#e35fe8"}
                emissive={left ? "#526eff" : "#d74cdf"}
                emissiveIntensity={0.95}
                roughness={0.24}
                metalness={0.36}
              />
            </mesh>
          </group>
        );
      })}
      <GlowSprite position={[-5.6, -24, -6.5]} scale={[12, 24, 1]} color="#365cff" opacity={0.2} />
      <GlowSprite position={[5.9, -64, -7]} scale={[13, 28, 1]} color="#da45e9" opacity={0.18} />
      <GlowSprite position={[0, -112, -8]} scale={[18, 24, 1]} color="#49b8ff" opacity={0.12} />
    </group>
  );
}

function XylophoneRoom({ bounds }: { bounds: RhythmicBackdropBounds }) {
  const floorSlats = useMemo(() => sampledBackdropRepeatIndices(bounds.height, 10.4, 48), [bounds.height]);
  const shelfItems = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const accents = ["#f2b457", "#ef6d7a", "#59c7a3", "#74b6ff", "#9d7bf2", "#ff9f6b"];
  return (
    <group>
      <RoundedBox position={[0, bounds.centerY, -4.45]} args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.55]} radius={0.18} smoothness={4} receiveShadow renderOrder={-30}>
        <meshStandardMaterial color="#d8d1c8" roughness={0.82} metalness={0.02} depthWrite={false} />
      </RoundedBox>
      {[-RHYTHMIC_ROOM_SIDE_X, RHYTHMIC_ROOM_SIDE_X].map((x) => (
        <mesh key={x} position={[x, bounds.centerY, -4.1]} rotation={[0, x < 0 ? Math.PI / 2.82 : -Math.PI / 2.82, 0]} receiveShadow renderOrder={-28}>
          <planeGeometry args={[5.2, bounds.height]} />
          <meshStandardMaterial color="#958778" roughness={0.78} metalness={0.02} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <RoundedBox position={[0, bounds.centerY, -4.08]} args={[64, Math.max(1, bounds.height - 40), 0.16]} radius={0.12} smoothness={4} receiveShadow renderOrder={-26}>
        <meshStandardMaterial color="#f2eee8" roughness={0.7} metalness={0.02} depthWrite={false} />
      </RoundedBox>
      {[-4.15, 4.15].map((x, index) => (
        <RoundedBox key={`accent-panel-${x}`} position={[x, bounds.centerY, -3.96]} args={[1.7, Math.max(1, bounds.height - 44), 0.14]} radius={0.08} smoothness={4} receiveShadow renderOrder={-24}>
          <meshStandardMaterial color={index === 0 ? "#d9cec2" : "#cfd4da"} roughness={0.64} metalness={0.02} depthWrite={false} />
        </RoundedBox>
      ))}
      <RoundedBox position={[0, 9.1, -3.72]} args={[8.6, 1.05, 0.22]} radius={0.08} smoothness={4} receiveShadow renderOrder={-22}>
        <meshStandardMaterial color="#9f744b" roughness={0.58} metalness={0.06} depthWrite={false} />
      </RoundedBox>
      {shelfItems.map((index) => (
        <mesh key={index} position={[-3.2 + index * 1.08, 9.95, -3.54]} castShadow renderOrder={-20}>
          <boxGeometry args={[0.34, 0.7 + (index % 3) * 0.18, 0.24]} />
          <meshStandardMaterial color={index % 2 ? "#8cd4ff" : "#f2cc7a"} roughness={0.34} metalness={0.06} depthWrite={false} />
        </mesh>
      ))}
      <RoundedBox position={[0, bounds.centerY - 1, -3.02]} args={[60, Math.max(1, bounds.height - 44), 0.32]} radius={0.08} smoothness={4} receiveShadow>
        <meshStandardMaterial color="#9f724d" roughness={0.74} metalness={0.02} />
      </RoundedBox>
      {floorSlats.map((index) => (
        <mesh key={index} position={[0, bounds.topY - 6 - index * 10.4, -2.82]} castShadow>
          <boxGeometry args={[10.3 - Math.min(index, 6) * 0.16, 0.2, 0.06]} />
          <meshStandardMaterial color={index % 2 ? "#b9865d" : "#986945"} roughness={0.64} metalness={0.02} />
        </mesh>
      ))}
      {[0, 1].map((line) => (
        <mesh key={`rail-${line}`} position={[0.18 + line * 0.62, -16.2 + line * 2.2, -2.56]} rotation={[0, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 7.2, 16]} />
          <meshStandardMaterial color="#9c784f" roughness={0.28} metalness={0.58} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <RoundedBox key={`key-${index}`} position={[-3.9 + index * 1.4, -16.4 + index * 1.02, -2.42]} args={[1.5 - index * 0.07, 0.4, 0.24]} radius={0.08} smoothness={4} castShadow>
          <meshPhysicalMaterial color={accents[index]} roughness={0.28} clearcoat={0.78} />
        </RoundedBox>
      ))}
      {[-3.6, -1.6, 0.4, 2.4].map((x, index) => (
        <mesh key={`resonator-${x}`} position={[x, -17.35 + index * 0.98, -2.68]} castShadow>
          <boxGeometry args={[0.2, 0.46 - index * 0.04, 0.18]} />
          <meshStandardMaterial color="#6a4b31" roughness={0.52} metalness={0.08} />
        </mesh>
      ))}
      <mesh position={[4.65, -7.6, -2.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 5.8, 14]} />
        <meshStandardMaterial color="#9098a5" roughness={0.3} metalness={0.58} />
      </mesh>
      <mesh position={[4.65, -4.7, -2.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.94, 0.06, 12, 48]} />
        <meshStandardMaterial color="#d8b36f" roughness={0.22} metalness={0.78} />
      </mesh>
      <mesh position={[-4.85, -8.8, -2.28]} rotation={[0.55, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 2.7, 12]} />
        <meshStandardMaterial color="#c79d63" roughness={0.26} metalness={0.28} />
      </mesh>
      <mesh position={[-4.15, -9.2, -2.26]} rotation={[0.55, 0, 0.16]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 2.55, 12]} />
        <meshStandardMaterial color="#c79d63" roughness={0.26} metalness={0.28} />
      </mesh>
      <mesh position={[-5.3, -7.65, -1.96]} castShadow>
        <sphereGeometry args={[0.13, 18, 12]} />
        <meshStandardMaterial color="#7c93ff" roughness={0.16} metalness={0.4} />
      </mesh>
      <mesh position={[-3.72, -8.08, -1.94]} castShadow>
        <sphereGeometry args={[0.13, 18, 12]} />
        <meshStandardMaterial color="#ff9db9" roughness={0.16} metalness={0.4} />
      </mesh>
      <GlowSprite position={[-5.2, -22, -2.8]} scale={[9, 18, 1]} color="#ffe0a5" opacity={0.13} />
      <GlowSprite position={[5.3, -70, -2.5]} scale={[8, 18, 1]} color="#ffb179" opacity={0.1} />
      <GlowSprite position={[0, -56, -3.5]} scale={[11, 34, 1]} color="#fff0d0" opacity={0.08} />
    </group>
  );
}


function ShowcaseWall({ color, bounds }: { color: string; bounds: RhythmicBackdropBounds }) {
  const wall = new THREE.Color(color).lerp(new THREE.Color("#d7d1ca"), 0.38).getStyle();
  return (
    <group>
      <RoundedBox position={[0, bounds.centerY, -4.45]} args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.42]} radius={0.12} smoothness={4} receiveShadow>
        <meshStandardMaterial color={wall} roughness={0.86} metalness={0.01} />
      </RoundedBox>
      {[-8.85, 8.85].map((x) => (
        <RoundedBox key={x} position={[x, bounds.centerY, -4.62]} args={[0.34, bounds.height, 0.18]} radius={0.08} smoothness={3} receiveShadow>
          <meshStandardMaterial color="#b8b1aa" roughness={0.9} metalness={0.01} />
        </RoundedBox>
      ))}
      <GlowSprite position={[-5.8, -28, -3.95]} scale={[10, 22, 1]} color="#fff4e8" opacity={0.12} />
      <GlowSprite position={[5.5, -82, -4.0]} scale={[9, 24, 1]} color="#e8eef5" opacity={0.08} />
    </group>
  );
}

function KorobeinikiReferenceWall({ color, bounds }: { color: string; bounds: RhythmicBackdropBounds }) {
  return (
    <RoundedBox
      position={[0, bounds.centerY, -4.45]}
      args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.42]}
      radius={0.1}
      smoothness={4}
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.88} metalness={0.015} />
    </RoundedBox>
  );
}

function VelvetStage({ color, bounds }: { color: string; bounds: RhythmicBackdropBounds }) {
  return (
    <group>
      <RoundedBox position={[0, bounds.centerY, -4.2]} args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.6]} radius={0.14} smoothness={4} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.94} metalness={0.03} />
      </RoundedBox>
      {[-5.6, -2.8, 0, 2.8, 5.6].map((x) => (
        <RoundedBox key={x} position={[x, bounds.centerY, -3.82]} args={[0.4, bounds.height, 0.16]} radius={0.08} smoothness={3}>
          <meshStandardMaterial color="#5f1b31" roughness={0.82} metalness={0.02} />
        </RoundedBox>
      ))}
      <mesh position={[0, bounds.bottomY + 1.2, -2.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16.8, 4.4]} />
        <meshStandardMaterial color="#7c4524" roughness={0.44} metalness={0.08} />
      </mesh>
      <GlowSprite position={[0, bounds.centerY + bounds.height * 0.22, -2.4]} scale={[10, 18, 1]} color="#ffd28d" opacity={0.18} />
      <GlowSprite position={[0, bounds.bottomY + 2.3, -1.9]} scale={[13, 7, 1]} color="#ffb14f" opacity={0.16} />
    </group>
  );
}

function SunrisePanels({ bounds }: { bounds: RhythmicBackdropBounds }) {
  return (
    <group>
      <RoundedBox position={[0, bounds.centerY, -4.1]} args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.56]} radius={0.14} smoothness={4} receiveShadow>
        <meshStandardMaterial color="#f1dcc7" roughness={0.8} metalness={0.04} />
      </RoundedBox>
      <RoundedBox position={[0, bounds.centerY + 0.4, -3.86]} args={[10.6, Math.max(4, bounds.height - 8), 0.08]} radius={0.12} smoothness={3}>
        <meshStandardMaterial color="#ffffff" roughness={0.52} metalness={0.02} transparent opacity={0.18} />
      </RoundedBox>
      {[-3.2, -1.05, 1.05, 3.2].map((x) => (
        <mesh key={x} position={[x, bounds.centerY + 0.4, -3.76]}>
          <boxGeometry args={[0.06, Math.max(4, bounds.height - 8), 0.08]} />
          <meshStandardMaterial color="#9c7e6a" roughness={0.52} metalness={0.08} />
        </mesh>
      ))}
      <mesh position={[0, bounds.bottomY + 1.1, -2.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15.2, 4.8]} />
        <meshStandardMaterial color="#99644a" roughness={0.56} metalness={0.06} />
      </mesh>
      <GlowSprite position={[0, bounds.topY - 4.2, -3.15]} scale={[12, 10, 1]} color="#ffe3ab" opacity={0.22} />
    </group>
  );
}

function NeutralStudio({ color, bounds }: { color: string; bounds: RhythmicBackdropBounds }) {
  return (
    <group>
      <RoundedBox position={[0, bounds.centerY, -4]} args={[RHYTHMIC_ROOM_BACKDROP_WIDTH, bounds.height, 0.65]} radius={0.14} smoothness={4} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.76} metalness={0.14} />
      </RoundedBox>
      {[-RHYTHMIC_ROOM_SIDE_X, RHYTHMIC_ROOM_SIDE_X].map((x) => (
        <mesh key={x} position={[x, bounds.centerY, -0.75]} rotation={[0, x < 0 ? Math.PI / 2.55 : -Math.PI / 2.55, 0]} receiveShadow>
          <planeGeometry args={[7.8, bounds.height]} />
          <meshStandardMaterial color="#111722" roughness={0.72} metalness={0.22} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <GlowSprite position={[-4.8, -42, -2.8]} scale={[9, 22, 1]} color="#65a6ff" opacity={0.12} />
    </group>
  );
}

export function RhythmicEnvironment3D({ settings, backgroundUrl, bounds, children }: { settings: StudioSettings; backgroundUrl?: string; bounds: RhythmicBackdropBounds; children?: ReactNode }) {
  const kind = environmentKind(settings);
  return (
    <>
      <SceneAtmosphere settings={settings} />
      {backgroundUrl ? <Suspense fallback={null}><RhythmicBackplate3D url={backgroundUrl} settings={settings} /></Suspense> : null}
      <BackgroundMotion settings={settings}>
        {kind === "brick" && <RhythmicBrickWall3D bounds={bounds} />}
        {kind === "tube-board" && <TubeBoardRoom bounds={bounds} />}
        {kind === "comet" && <CometSpace bounds={bounds} />}
        {kind === "xylophone" && <XylophoneRoom bounds={bounds} />}
        {kind === "stage" && <VelvetStage color={settings.backgroundColor} bounds={bounds} />}
        {kind === "sunrise" && <SunrisePanels bounds={bounds} />}
        {kind === "neutral" && (isKorobeinikiWallLayout(settings)
          ? <KorobeinikiReferenceWall color={settings.backgroundColor} bounds={bounds} />
          : settings.instrumentFamily !== "auto"
            ? <ShowcaseWall color={settings.backgroundColor} bounds={bounds} />
            : <NeutralStudio color={settings.backgroundColor} bounds={bounds} />)}
        {children}
      </BackgroundMotion>
    </>
  );
}
