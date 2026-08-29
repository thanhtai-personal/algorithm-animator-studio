import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Theme } from "@/lib/renderer";
import { AlgorithmBranding3D } from "./AlgorithmBranding3D";

import { createDefaultAlgorithmVideoAds, type AlgorithmVideoAdSelection } from "@/lib/algorithmVideoAds";

export function AlgorithmStage3D({ theme, graph, ads = createDefaultAlgorithmVideoAds() }: { theme: Theme; graph: boolean; ads?: AlgorithmVideoAdSelection }) {
  const palette = useMemo(() => makePalette(theme), [theme]);
  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.haze, graph ? 24 : 27, graph ? 58 : 64]} />

      <hemisphereLight args={["#dce8ef", "#33312a", 1.05]} />
      <directionalLight position={[-14, 22, 10]} intensity={2.6} color="#ffe3b0" />
      <directionalLight position={[10, 8, -14]} intensity={0.75} color="#92b8d8" />

      <OpenConstructionGround palette={palette} theme={theme} graph={graph} />
      <DistantCity palette={palette} />
      {!graph ? <AlgorithmBranding3D ads={ads} /> : null}
      {!graph ? <TransportLanes theme={theme} palette={palette} /> : null}
      <SiteFurniture palette={palette} theme={theme} graph={graph} />
    </>
  );
}

function OpenConstructionGround({ palette, theme, graph }: {
  palette: ReturnType<typeof makePalette>;
  theme: Theme;
  graph: boolean;
}) {
  return (
    <group>
      <mesh position={[0, -0.18, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[82, 72]} />
        <meshStandardMaterial color={palette.ground} roughness={0.97} metalness={0.02} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[graph ? 26 : 23.5, graph ? 16 : 4.5]} />
        <meshStandardMaterial color={palette.apron} roughness={0.78} metalness={0.12} />
      </mesh>
      <mesh position={[0, -0.018, graph ? 0 : 2.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[graph ? 25 : 22.8, 0.035]} />
        <meshBasicMaterial color={theme.highlight} transparent opacity={0.18} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.016, graph ? 0 : -2.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[graph ? 25 : 22.8, 0.035]} />
        <meshBasicMaterial color={theme.swap} transparent opacity={0.10} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function TransportLanes({ theme, palette }: { theme: Theme; palette: ReturnType<typeof makePalette> }) {
  return (
    <group>
      <RoadStrip z={3.35} color={palette.road} accent={theme.highlight} front />
      <RoadStrip z={-3.35} color={palette.road} accent={theme.swap} />
      <mesh position={[0, 0.012, 5.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 0.06]} />
        <meshBasicMaterial color="#d8b34e" transparent opacity={0.30} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.012, -5.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 0.06]} />
        <meshBasicMaterial color="#d8b34e" transparent opacity={0.22} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RoadStrip({ z, color, accent, front = false }: { z: number; color: string; accent: string; front?: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[27, 2.35]} />
        <meshStandardMaterial color={color} roughness={0.90} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26.3, 0.032]} />
        <meshBasicMaterial color="#e8ddb8" transparent opacity={front ? 0.30 : 0.22} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.011, z + (front ? -0.98 : 0.98)]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26.3, 0.025]} />
        <meshBasicMaterial color={accent} transparent opacity={0.16} toneMapped={false} />
      </mesh>
    </group>
  );
}

function DistantCity({ palette }: { palette: ReturnType<typeof makePalette> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const buildings = useMemo(() => makeCityBlocks(), []);
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    buildings.forEach((b, index) => {
      position.set(b.x, b.h / 2 - 0.12, b.z);
      scale.set(b.w, b.h, b.d);
      matrix.compose(position, quaternion, scale);
      meshRef.current!.setMatrixAt(index, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, buildings.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palette.city} roughness={0.94} metalness={0.06} />
      </instancedMesh>
      <mesh position={[0, 0.3, -18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[46, 18]} />
        <meshBasicMaterial color={palette.haze} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SiteFurniture({ palette, theme, graph }: {
  palette: ReturnType<typeof makePalette>;
  theme: Theme;
  graph: boolean;
}) {
  const posts = graph ? [-11.6, 11.6] : [-11.7, 11.7];
  return (
    <>
      {posts.map((x) => (
        <group key={x} position={[x, 0, graph ? 5.8 : 5.7]}>
          <mesh position={[0, 1.55, 0]}>
            <cylinderGeometry args={[0.045, 0.065, 3.1, 8]} />
            <meshStandardMaterial color={palette.steel} roughness={0.56} metalness={0.72} />
          </mesh>
          <mesh position={[x < 0 ? 0.38 : -0.38, 3.02, 0]}>
            <boxGeometry args={[0.82, 0.08, 0.08]} />
            <meshStandardMaterial color={palette.steel} roughness={0.5} metalness={0.72} />
          </mesh>
          <pointLight position={[x < 0 ? 0.72 : -0.72, 2.95, 0]} intensity={0.7} distance={8} decay={2} color={x < 0 ? theme.highlight : theme.swap} />
        </group>
      ))}
    </>
  );
}

function makeCityBlocks() {
  const blocks: Array<{ x: number; z: number; w: number; d: number; h: number }> = [];
  const rows = [-13.5, -18.5, -23.5];
  rows.forEach((z, row) => {
    for (let i = 0; i < 12; i += 1) {
      const seed = (i + 1) * (row + 3) * 17;
      const w = 1.2 + ((seed * 13) % 9) * 0.16;
      const d = 1.2 + ((seed * 7) % 7) * 0.17;
      const h = 1.8 + ((seed * 5) % 19) * 0.34 + row * 0.55;
      blocks.push({ x: -18.5 + i * 3.35 + (row % 2) * 0.8, z, w, d, h });
    }
  });
  return blocks;
}

function makePalette(theme: Theme) {
  const base = new THREE.Color(theme.bg).lerp(new THREE.Color("#111821"), 0.28);
  return {
    sky: `#${new THREE.Color("#6f8391").lerp(base, 0.42).getHexString()}`,
    haze: `#${new THREE.Color("#80909a").lerp(base, 0.48).getHexString()}`,
    ground: `#${new THREE.Color("#555149").lerp(base, 0.54).getHexString()}`,
    apron: `#${new THREE.Color("#4a4f52").lerp(base, 0.52).getHexString()}`,
    road: `#${new THREE.Color("#25292d").lerp(base, 0.34).getHexString()}`,
    city: `#${new THREE.Color("#3c4650").lerp(base, 0.34).getHexString()}`,
    steel: "#5d666d",
  };
}
