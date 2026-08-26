import { useEffect, useMemo } from 'react';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function StarField() {
  const positions = useMemo(() => {
    const count = 900;
    const data = new Float32Array(count * 3);
    let seed = 91827;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i += 1) {
      data[i * 3] = (random() - 0.5) * 42;
      data[i * 3 + 1] = 4 + random() * 30;
      data[i * 3 + 2] = -18 + random() * 245;
    }
    return data;
  }, []);
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#cdeaff" size={0.065} transparent opacity={0.78} depthWrite={false} />
    </points>
  );
}

export function StudioEnvironment3D() {
  const { scene } = useThree();
  useEffect(() => {
    const background = new THREE.Color('#050912');
    scene.background = background;
    scene.fog = new THREE.Fog(background, 24, 82);
    return () => { scene.fog = null; };
  }, [scene]);

  return (
    <>
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={4.8} color="#eaf5ff" position={[-4, 7, 6]} scale={[5, 2.2, 1]} />
        <Lightformer form="rect" intensity={3.4} color="#63d7ff" position={[5, 0, 4]} scale={[3, 5, 1]} />
        <Lightformer form="ring" intensity={3.4} color="#c55cff" position={[0, 8, -5]} scale={[7, 7, 1]} />
      </Environment>
      <hemisphereLight args={['#dcecff', '#11151d', 0.72]} />
      <directionalLight position={[-5, 11, -4]} intensity={2.6} color="#f4fbff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[5, 14, 58]} color="#4bdfff" intensity={28} distance={32} decay={2} />
      <pointLight position={[-5, 12, 168]} color="#d05cff" intensity={24} distance={36} decay={2} />
      <StarField />
      <RoundedBox position={[0, 12, 105]} args={[24, 28, 232]} radius={0.35} smoothness={4} renderOrder={-30}>
        <meshStandardMaterial color="#0b111b" roughness={0.9} metalness={0.08} side={THREE.BackSide} />
      </RoundedBox>
      {[-10.5, 10.5].map((x) => (
        <mesh key={x} position={[x, 13, 105]}>
          <boxGeometry args={[0.16, 17, 220]} />
          <meshStandardMaterial color="#203449" metalness={0.72} roughness={0.28} emissive="#11334b" emissiveIntensity={0.22} />
        </mesh>
      ))}
    </>
  );
}
