import { useMemo } from "react";
import * as THREE from "three";
import type { StudioSettings } from "../types";

function TubeBoardRoom() {
  const rows = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);
  return (
    <group>
      <mesh position={[0, -54, -3.4]} receiveShadow>
        <planeGeometry args={[18, 128]} />
        <meshStandardMaterial color="#16191f" roughness={0.82} metalness={0.2} />
      </mesh>
      {[-7.2, 7.2].map((x) => (
        <mesh key={x} position={[x, -54, -0.6]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[7.2, 128]} />
          <meshStandardMaterial color="#20242b" roughness={0.68} metalness={0.34} />
        </mesh>
      ))}
      {rows.map((row) => (
        <group key={row} position={[0, -row * 7 + 2, -3.05]}>
          <mesh>
            <boxGeometry args={[15.2, 0.065, 0.08]} />
            <meshStandardMaterial color="#454b54" roughness={0.42} metalness={0.64} />
          </mesh>
          {[-5.8, -2.9, 0, 2.9, 5.8].map((x, peg) => (
            <mesh key={x} position={[x, (peg % 2 ? 0.7 : -0.55), 0.18]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.38, 14]} />
              <meshStandardMaterial color={peg === 2 ? "#d34c50" : "#9ca4af"} roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function StarField() {
  const positions = useMemo(() => {
    const data = new Float32Array(240 * 3);
    let seed = 14723;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 240; i += 1) {
      data[i * 3] = (random() - 0.5) * 24;
      data[i * 3 + 1] = -random() * 150 + 12;
      data[i * 3 + 2] = -3 - random() * 12;
    }
    return data;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#b9d8ff" size={0.055} sizeAttenuation transparent opacity={0.82} />
    </points>
  );
}

function CometSpace() {
  const rings = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  return (
    <group>
      <StarField />
      <mesh position={[0, -58, -7]}>
        <planeGeometry args={[25, 145]} />
        <meshBasicMaterial color="#050714" />
      </mesh>
      {rings.map((index) => (
        <group key={index} position={[index % 2 ? 2.7 : -2.4, 5 - index * 10.5, -4.2]} rotation={[0.16, 0.22 * Math.sin(index), 0.2 * Math.cos(index * 0.7)]}>
          <mesh>
            <torusGeometry args={[2.4 + (index % 3) * 0.34, 0.035, 8, 72, Math.PI * 1.5]} />
            <meshStandardMaterial color={index % 2 ? "#5f78ff" : "#e15be8"} emissive={index % 2 ? "#4a68ff" : "#d14ad9"} emissiveIntensity={0.75} roughness={0.28} metalness={0.26} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function XylophoneRoom() {
  const panels = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);
  const accents = ["#d95f59", "#e69a4d", "#d6b94c", "#5ea96d", "#5e91bb", "#8d70bc"];
  return (
    <group>
      <mesh position={[0, -54, -3.6]} receiveShadow>
        <planeGeometry args={[18, 128]} />
        <meshStandardMaterial color="#c8b89f" roughness={0.78} metalness={0.02} />
      </mesh>
      {[-7.5, 7.5].map((x) => (
        <mesh key={x} position={[x, -54, -0.6]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[7, 128]} />
          <meshStandardMaterial color="#897a68" roughness={0.72} metalness={0.04} />
        </mesh>
      ))}
      {panels.map((index) => (
        <group key={index} position={[0, 4 - index * 8.2, -3.12]}>
          <mesh>
            <boxGeometry args={[15.3, 0.1, 0.12]} />
            <meshStandardMaterial color="#7a6c5d" roughness={0.54} metalness={0.08} />
          </mesh>
          <mesh position={[-5.8, 0.65, 0.18]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[2.1, 0.16, 0.18]} />
            <meshStandardMaterial color={accents[index % accents.length]} roughness={0.36} metalness={0.12} />
          </mesh>
          <mesh position={[5.6, -0.52, 0.16]} rotation={[0, 0, 0.05]}>
            <boxGeometry args={[2.6, 0.12, 0.15]} />
            <meshStandardMaterial color={accents[(index + 3) % accents.length]} roughness={0.4} metalness={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NeutralStudio({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -54, -3.5]} receiveShadow>
        <planeGeometry args={[19, 130]} />
        <meshStandardMaterial color={color} roughness={0.86} metalness={0.08} />
      </mesh>
      {[-7.6, 7.6].map((x) => (
        <mesh key={x} position={[x, -54, -0.6]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[7, 130]} />
          <meshStandardMaterial color="#10151f" roughness={0.75} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function RhythmicLightingRig3D({ settings }: { settings: StudioSettings }) {
  if (settings.terrainProfile === "xylophone") {
    return (
      <>
        <hemisphereLight args={["#fff2d4", "#3b332c", 1.25]} />
        <directionalLight position={[-3, 7, 9]} intensity={2.2} castShadow shadow-mapSize-width={768} shadow-mapSize-height={768} />
        <pointLight position={[5, -4, 5]} color="#ffc88c" intensity={16} distance={20} decay={2} />
      </>
    );
  }
  if (settings.terrainProfile === "comet") {
    return (
      <>
        <ambientLight intensity={0.22} />
        <directionalLight position={[4, 6, 8]} intensity={1.4} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
        <pointLight position={[-4, 1, 4]} color="#5474ff" intensity={24} distance={24} decay={2} />
        <pointLight position={[4, -6, 3]} color="#d64ee5" intensity={18} distance={20} decay={2} />
      </>
    );
  }
  if (settings.terrainProfile === "tube-board") {
    return (
      <>
        <hemisphereLight args={["#dce8f6", "#16191e", 0.88]} />
        <directionalLight position={[-5, 8, 9]} intensity={2.35} castShadow shadow-mapSize-width={768} shadow-mapSize-height={768} />
        <pointLight position={[5, -5, 5]} color="#ffcc9d" intensity={12} distance={18} decay={2} />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={0.48} />
      <directionalLight position={[5, 7, 9]} intensity={2} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
      <pointLight position={[-4, 1, 6]} intensity={14} distance={22} decay={2} color="#7dd3fc" />
    </>
  );
}

export function RhythmicEnvironment3D({ settings }: { settings: StudioSettings }) {
  if (settings.terrainProfile === "tube-board") return <TubeBoardRoom />;
  if (settings.terrainProfile === "comet") return <CometSpace />;
  if (settings.terrainProfile === "xylophone") return <XylophoneRoom />;
  return <NeutralStudio color={settings.backgroundColor} />;
}
