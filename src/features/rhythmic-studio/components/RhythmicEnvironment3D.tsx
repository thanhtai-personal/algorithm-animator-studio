import { Suspense, useEffect, useMemo } from "react";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettings } from "../types";
import { RhythmicBackplate3D } from "./RhythmicBackplate3D";

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
    const background = settings.terrainProfile === "comet" ? "#040611"
      : settings.terrainProfile === "xylophone" ? "#8d775f"
        : settings.terrainProfile === "tube-board" ? "#10141a"
          : settings.backgroundColor;
    scene.background = new THREE.Color(background);
    scene.fog = settings.terrainProfile === "comet"
      ? new THREE.FogExp2("#07091a", 0.027)
      : new THREE.Fog(background, 13, 28);
    return () => {
      scene.background = previousBackground;
      scene.fog = previousFog;
    };
  }, [scene, settings.backgroundColor, settings.terrainProfile]);
  return null;
}

function ReflectionRig({ settings }: { settings: StudioSettings }) {
  const warm = settings.terrainProfile === "xylophone";
  const comet = settings.terrainProfile === "comet";
  return (
    <Environment resolution={64} frames={1}>
      <Lightformer form="rect" intensity={4.8} color={warm ? "#fff0d2" : "#eaf5ff"} position={[-4, 4, 6]} rotation={[0, 0.38, 0]} scale={[5, 2.2, 1]} />
      <Lightformer form="rect" intensity={3.4} color={comet ? "#536fff" : warm ? "#ffc47a" : "#7fc7ff"} position={[5, -3, 4]} rotation={[0, -0.45, 0]} scale={[3, 5, 1]} />
      <Lightformer form="ring" intensity={comet ? 5.4 : 2.4} color={comet ? "#e95aea" : "#ffffff"} position={[0, 1, -5]} scale={[6, 6, 1]} />
    </Environment>
  );
}

function TubeBoardRoom() {
  const sections = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <group>
      <RoundedBox position={[0, -54, -4.45]} args={[16.9, 136, 0.56]} radius={0.14} smoothness={4} receiveShadow renderOrder={-30}>
        <meshStandardMaterial color="#111a25" roughness={0.78} metalness={0.16} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0, -54, -4.08]} args={[12.9, 126, 0.12]} radius={0.1} smoothness={4} receiveShadow renderOrder={-28}>
        <meshStandardMaterial color="#1a2d40" roughness={0.7} metalness={0.08} depthWrite={false} />
      </RoundedBox>
      {[-8.9, 8.9].map((x) => (
        <mesh key={x} position={[x, -54, -4.06]} rotation={[0, x < 0 ? Math.PI / 2.86 : -Math.PI / 2.86, 0]} receiveShadow renderOrder={-26}>
          <planeGeometry args={[5.4, 136]} />
          <meshStandardMaterial color="#1d2a36" roughness={0.7} metalness={0.22} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {[-6.95, 6.95].map((x) => (
        <mesh key={x} position={[x, -54, -3.84]} castShadow renderOrder={-24}>
          <cylinderGeometry args={[0.065, 0.065, 136, 16]} />
          <meshStandardMaterial color="#41515f" roughness={0.26} metalness={0.82} depthWrite={false} />
        </mesh>
      ))}
      {sections.map((index) => {
        const y = 5 - index * 11.2;
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

function StarField() {
  const positions = useMemo(() => {
    const data = new Float32Array(360 * 3);
    let seed = 14723;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 360; i += 1) {
      data[i * 3] = (random() - 0.5) * 28;
      data[i * 3 + 1] = -random() * 155 + 14;
      data[i * 3 + 2] = -2.5 - random() * 15;
    }
    return data;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cce5ff" size={0.045} sizeAttenuation transparent opacity={0.86} depthWrite={false} />
    </points>
  );
}

function CometSpace() {
  const rings = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <group>
      <StarField />
      <mesh position={[0, -58, -9]}>
        <planeGeometry args={[34, 155]} />
        <meshBasicMaterial color="#040611" />
      </mesh>
      {rings.map((index) => {
        const left = index % 2 === 0;
        return (
          <group key={index} position={[left ? -3.1 : 3.3, 7 - index * 12.4, -5 - (index % 3) * 0.7]} rotation={[0.08, left ? -0.14 : 0.14, left ? -0.28 : 0.28]}>
            <mesh>
              <torusGeometry args={[2.8 + (index % 3) * 0.34, 0.045, 10, 80, Math.PI * 1.55]} />
              <meshStandardMaterial
                color={left ? "#6680ff" : "#e35fe8"}
                emissive={left ? "#526eff" : "#d74cdf"}
                emissiveIntensity={1.15}
                roughness={0.24}
                metalness={0.36}
              />
            </mesh>
          </group>
        );
      })}
      <GlowSprite position={[-4.7, -24, -6.5]} scale={[13, 26, 1]} color="#365cff" opacity={0.25} />
      <GlowSprite position={[5.2, -64, -7]} scale={[14, 30, 1]} color="#da45e9" opacity={0.22} />
      <GlowSprite position={[0, -112, -8]} scale={[18, 24, 1]} color="#49b8ff" opacity={0.12} />
    </group>
  );
}

function XylophoneRoom() {
  const floorSlats = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  const shelfItems = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const accents = ["#f2b457", "#ef6d7a", "#59c7a3", "#74b6ff", "#9d7bf2", "#ff9f6b"];
  return (
    <group>
      <RoundedBox position={[0, -54, -4.45]} args={[17.6, 136, 0.55]} radius={0.18} smoothness={4} receiveShadow renderOrder={-30}>
        <meshStandardMaterial color="#d6c0a6" roughness={0.82} metalness={0.02} depthWrite={false} />
      </RoundedBox>
      {[-8.9, 8.9].map((x) => (
        <mesh key={x} position={[x, -54, -4.1]} rotation={[0, x < 0 ? Math.PI / 2.82 : -Math.PI / 2.82, 0]} receiveShadow renderOrder={-28}>
          <planeGeometry args={[5.2, 136]} />
          <meshStandardMaterial color="#8c725c" roughness={0.78} metalness={0.02} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <RoundedBox position={[0, -54, -4.08]} args={[12.8, 96, 0.16]} radius={0.12} smoothness={4} receiveShadow renderOrder={-26}>
        <meshStandardMaterial color="#f4eadc" roughness={0.7} metalness={0.02} depthWrite={false} />
      </RoundedBox>
      {[-4.15, 4.15].map((x, index) => (
        <RoundedBox key={`accent-panel-${x}`} position={[x, -54, -3.96]} args={[1.7, 92, 0.14]} radius={0.08} smoothness={4} receiveShadow renderOrder={-24}>
          <meshStandardMaterial color={index === 0 ? "#e3d1be" : "#ddd9e2"} roughness={0.64} metalness={0.02} depthWrite={false} />
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
      <RoundedBox position={[0, -55, -2.72]} args={[11.8, 92, 0.32]} radius={0.08} smoothness={4} receiveShadow>
        <meshStandardMaterial color="#aa7648" roughness={0.74} metalness={0.02} />
      </RoundedBox>
      {floorSlats.map((index) => (
        <mesh key={index} position={[0, 8 - index * 10.4, -2.5]} castShadow>
          <boxGeometry args={[10.3 - Math.min(index, 6) * 0.16, 0.2, 0.06]} />
          <meshStandardMaterial color={index % 2 ? "#c38d58" : "#a26e42"} roughness={0.64} metalness={0.02} />
        </mesh>
      ))}
      {[0, 1].map((line) => (
        <mesh key={`rail-${line}`} position={[0.18 + line * 0.62, -16.2 + line * 2.2, -2.3]} rotation={[0, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 7.2, 16]} />
          <meshStandardMaterial color="#9c784f" roughness={0.28} metalness={0.58} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <RoundedBox key={`key-${index}`} position={[-3.9 + index * 1.4, -16.4 + index * 1.02, -2.16]} args={[1.5 - index * 0.07, 0.4, 0.24]} radius={0.08} smoothness={4} castShadow>
          <meshPhysicalMaterial color={accents[index]} roughness={0.28} clearcoat={0.78} />
        </RoundedBox>
      ))}
      {[-3.6, -1.6, 0.4, 2.4].map((x, index) => (
        <mesh key={`resonator-${x}`} position={[x, -17.35 + index * 0.98, -2.42]} castShadow>
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

function NeutralStudio({ color }: { color: string }) {
  return (
    <group>
      <RoundedBox position={[0, -54, -4]} args={[17, 136, 0.65]} radius={0.14} smoothness={4} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.76} metalness={0.14} />
      </RoundedBox>
      {[-7.9, 7.9].map((x) => (
        <mesh key={x} position={[x, -54, -0.75]} rotation={[0, x < 0 ? Math.PI / 2.55 : -Math.PI / 2.55, 0]} receiveShadow>
          <planeGeometry args={[7.8, 136]} />
          <meshStandardMaterial color="#111722" roughness={0.72} metalness={0.22} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <GlowSprite position={[-4.8, -42, -2.8]} scale={[9, 22, 1]} color="#65a6ff" opacity={0.12} />
    </group>
  );
}

export function RhythmicLightingRig3D({ settings }: { settings: StudioSettings }) {
  if (settings.terrainProfile === "xylophone") {
    return (
      <>
        <ReflectionRig settings={settings} />
        <hemisphereLight args={["#fff0d7", "#403529", 1.05]} />
        <directionalLight
          position={[-4, 7, 9]}
          intensity={2.35}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0003}
          shadow-normalBias={0.035}
        />
        <pointLight position={[5, -4, 5]} color="#ffc17f" intensity={14} distance={22} decay={2} />
        <pointLight position={[-5, -8, 3]} color="#7db7ff" intensity={4.5} distance={18} decay={2} />
      </>
    );
  }
  if (settings.terrainProfile === "comet") {
    return (
      <>
        <ReflectionRig settings={settings} />
        <ambientLight intensity={0.16} />
        <directionalLight position={[4, 6, 8]} intensity={1.25} castShadow shadow-mapSize-width={768} shadow-mapSize-height={768} shadow-bias={-0.0003} />
        <pointLight position={[-4.5, 1, 4]} color="#5776ff" intensity={20} distance={25} decay={2} />
        <pointLight position={[4.5, -6, 3]} color="#df54e5" intensity={16} distance={22} decay={2} />
      </>
    );
  }
  if (settings.terrainProfile === "tube-board") {
    return (
      <>
        <ReflectionRig settings={settings} />
        <hemisphereLight args={["#dcecff", "#14171c", 0.82]} />
        <directionalLight
          position={[-5, 8, 9]}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.00035}
          shadow-normalBias={0.04}
        />
        <pointLight position={[5, -5, 5]} color="#ffc28c" intensity={10} distance={19} decay={2} />
        <pointLight position={[-5, -10, 3]} color="#5aa7ff" intensity={6} distance={18} decay={2} />
      </>
    );
  }
  return (
    <>
      <ReflectionRig settings={settings} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[5, 7, 9]} intensity={2.05} castShadow shadow-mapSize-width={768} shadow-mapSize-height={768} />
      <pointLight position={[-4, 1, 6]} intensity={12} distance={22} decay={2} color="#7dd3fc" />
    </>
  );
}

export function RhythmicEnvironment3D({ settings, backgroundUrl }: { settings: StudioSettings; backgroundUrl?: string }) {
  return (
    <>
      <SceneAtmosphere settings={settings} />
      {backgroundUrl ? <Suspense fallback={null}><RhythmicBackplate3D url={backgroundUrl} settings={settings} /></Suspense> : null}
      {settings.terrainProfile === "tube-board" && <TubeBoardRoom />}
      {settings.terrainProfile === "comet" && <CometSpace />}
      {settings.terrainProfile === "xylophone" && <XylophoneRoom />}
      {settings.terrainProfile === "balanced" && <NeutralStudio color={settings.backgroundColor} />}
    </>
  );
}
