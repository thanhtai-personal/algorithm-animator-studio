import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { Theme } from "@/lib/renderer";
import { AlgorithmGlowSprite3D } from "./AlgorithmGlowSprite3D";

export function AlgorithmStage3D({ theme, graph }: { theme: Theme; graph: boolean }) {
  const palette = useMemo(() => makePalette(theme), [theme]);
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.background, graph ? 22 : 24, graph ? 47 : 52]} />

      <hemisphereLight args={["#dff4ff", palette.deep, 0.42]} />
      <directionalLight
        castShadow
        position={[-8, 13, 9]}
        intensity={2.35}
        color="#fff8ed"
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={14}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={44}
        shadow-bias={-0.00025}
        shadow-normalBias={0.025}
      />
      <spotLight position={[8, 12, 8]} intensity={74} distance={34} angle={0.48} penumbra={0.86} decay={2} color={theme.highlight} />
      <pointLight position={[-8, 4.5, 3]} intensity={19} distance={24} decay={2} color={theme.swap} />
      <pointLight position={[7, 2.2, -5]} intensity={12} distance={20} decay={2} color={theme.sorted} />

      <Environment resolution={96} frames={1}>
        <Lightformer form="rect" intensity={5.2} color="#f4fbff" position={[-6, 9, 7]} rotation={[0, 0.35, 0]} scale={[7.5, 3.2, 1]} />
        <Lightformer form="rect" intensity={3.8} color={theme.highlight} position={[7, 4, -5]} rotation={[0, Math.PI - 0.35, 0]} scale={[5, 8, 1]} />
        <Lightformer form="ring" intensity={2.4} color={theme.swap} position={[0, 5, -7]} scale={[8, 8, 1]} />
      </Environment>

      <AlgorithmGlowSprite3D position={[-6.8, 5.2, -6.8]} scale={[8, 8, 1]} color={theme.highlight} opacity={0.11} />
      <AlgorithmGlowSprite3D position={[7.2, 2.3, -6.6]} scale={[7, 7, 1]} color={theme.swap} opacity={0.085} />
      <StageShell palette={palette} theme={theme} graph={graph} />
    </>
  );
}

function StageShell({ palette, theme, graph }: {
  palette: ReturnType<typeof makePalette>;
  theme: Theme;
  graph: boolean;
}) {
  return (
    <group>
      <RoundedBox position={[0, -0.36, 0]} args={[25.5, 0.62, 16.4]} radius={0.26} smoothness={5} receiveShadow>
        <meshPhysicalMaterial color={palette.platform} roughness={0.34} metalness={0.72} clearcoat={0.48} clearcoatRoughness={0.28} />
      </RoundedBox>
      <RoundedBox position={[0, 0.005, 0]} args={[23.9, 0.14, 14.9]} radius={0.055} smoothness={4} receiveShadow>
        <meshStandardMaterial color={palette.deck} roughness={0.68} metalness={0.34} />
      </RoundedBox>

      <StageRings color={theme.highlight} graph={graph} />
      <RunwayAccents theme={theme} graph={graph} />
      <Backdrop palette={palette} theme={theme} />
      <SidePylons palette={palette} theme={theme} />
    </group>
  );
}

function StageRings({ color, graph }: { color: string; graph: boolean }) {
  const radii = graph ? [3.4, 6.1, 9.2] : [4.8, 8.8];
  return (
    <group position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {radii.map((radius, index) => (
        <mesh key={radius} renderOrder={1}>
          <torusGeometry args={[radius, index === 0 ? 0.022 : 0.014, 8, 96]} />
          <meshBasicMaterial color={color} transparent opacity={index === 0 ? 0.22 : 0.08} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function RunwayAccents({ theme, graph }: { theme: Theme; graph: boolean }) {
  if (graph) {
    return (
      <group position={[0, 0.07, 0]}>
        {[-5.8, 0, 5.8].map((x, i) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.045, 11.6]} />
            <meshBasicMaterial color={i === 1 ? theme.highlight : theme.sorted} transparent opacity={i === 1 ? 0.16 : 0.08} toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={[0, 0.07, 1.2]}>
      {[-3.8, 0, 3.8].map((z, i) => (
        <mesh key={z} position={[0, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20.5, i === 1 ? 0.055 : 0.035]} />
          <meshBasicMaterial color={i === 1 ? theme.highlight : theme.swap} transparent opacity={i === 1 ? 0.18 : 0.07} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Backdrop({ palette, theme }: { palette: ReturnType<typeof makePalette>; theme: Theme }) {
  return (
    <group position={[0, 4.9, -7.4]}>
      <RoundedBox args={[24.2, 10.1, 0.52]} radius={0.22} smoothness={5} receiveShadow>
        <meshStandardMaterial color={palette.backdrop} roughness={0.52} metalness={0.48} />
      </RoundedBox>
      <RoundedBox position={[0, 0, 0.31]} args={[22.9, 8.9, 0.14]} radius={0.055} smoothness={4}>
        <meshStandardMaterial color={palette.panel} roughness={0.44} metalness={0.42} emissive={theme.highlight} emissiveIntensity={0.018} />
      </RoundedBox>
      {[-3.1, -1.55, 0, 1.55, 3.1].map((y, index) => (
        <mesh key={y} position={[0, y, 0.34]}>
          <boxGeometry args={[20.5, index === 2 ? 0.025 : 0.014, 0.018]} />
          <meshBasicMaterial color={index === 2 ? theme.highlight : "#94a3b8"} transparent opacity={index === 2 ? 0.18 : 0.055} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[-10.35, 0, 0.38]}>
        <boxGeometry args={[0.055, 7.4, 0.025]} />
        <meshBasicMaterial color={theme.highlight} transparent opacity={0.72} toneMapped={false} />
      </mesh>
      <mesh position={[10.35, 0, 0.38]}>
        <boxGeometry args={[0.055, 7.4, 0.025]} />
        <meshBasicMaterial color={theme.swap} transparent opacity={0.52} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SidePylons({ palette, theme }: { palette: ReturnType<typeof makePalette>; theme: Theme }) {
  return (
    <>
      {[-11.7, 11.7].map((x) => (
        <group key={x} position={[x, 2.55, -5.6]}>
          <RoundedBox args={[0.42, 5.5, 0.52]} radius={0.17} smoothness={4} castShadow>
            <meshStandardMaterial color={palette.platform} roughness={0.24} metalness={0.78} />
          </RoundedBox>
          <mesh position={[x < 0 ? 0.22 : -0.22, 0, 0.02]}>
            <boxGeometry args={[0.035, 4.7, 0.08]} />
            <meshBasicMaterial color={x < 0 ? theme.highlight : theme.swap} transparent opacity={0.78} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function makePalette(theme: Theme) {
  const bg = new THREE.Color(theme.bg).lerp(new THREE.Color("#02040a"), 0.58);
  const deep = bg.clone().multiplyScalar(0.42);
  return {
    background: `#${bg.getHexString()}`,
    deep: `#${deep.getHexString()}`,
    platform: `#${bg.clone().lerp(new THREE.Color("#263142"), 0.48).getHexString()}`,
    deck: `#${bg.clone().lerp(new THREE.Color("#111827"), 0.62).getHexString()}`,
    backdrop: `#${bg.clone().lerp(new THREE.Color("#1f2937"), 0.54).getHexString()}`,
    panel: `#${bg.clone().lerp(new THREE.Color("#0f172a"), 0.68).getHexString()}`,
  };
}
