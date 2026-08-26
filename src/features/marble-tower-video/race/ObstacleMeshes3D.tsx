import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type * as CANNON from 'cannon-es';
import { surfaceYAt } from '../track/trackLayout';
import type { RacePhysics } from '../physics/RacePhysics';

function SyncBody({ body, children }: { body: CANNON.Body; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.set(body.position.x, body.position.y, body.position.z);
    group.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  });
  return <group ref={group}>{children}</group>;
}

function NeonBar({ color = '#ff4f84', length = 7.8 }: { color?: string; length?: number }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[length, 0.32, 0.44]} />
      <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.82} metalness={0.68} roughness={0.2} clearcoat={0.7} />
    </mesh>
  );
}

export function ObstacleMeshes3D({ physics }: { physics: RacePhysics }) {
  const { startGate, spinnerA, spinnerB, beatGate, finalCross } = physics.obstacles;
  return (
    <group>
      <SyncBody body={startGate}>
        <mesh castShadow><boxGeometry args={[9, 1.5, 0.36]} /><meshStandardMaterial color="#dce8ef" metalness={0.82} roughness={0.22} emissive="#31617c" emissiveIntensity={0.22} /></mesh>
      </SyncBody>
      <SyncBody body={spinnerA}><NeonBar color="#39e6ff" /></SyncBody>
      <SyncBody body={spinnerB}><NeonBar color="#ffd84a" /></SyncBody>
      <SyncBody body={beatGate}>
        <mesh castShadow><boxGeometry args={[9, 1.6, 0.32]} /><meshStandardMaterial color="#b75cff" emissive="#7427d9" emissiveIntensity={0.72} metalness={0.64} roughness={0.24} /></mesh>
      </SyncBody>
      <SyncBody body={finalCross}>
        <NeonBar color="#ff4f84" length={7.2} />
        <mesh castShadow><boxGeometry args={[0.4, 0.32, 7.2]} /><meshPhysicalMaterial color="#9b5cff" emissive="#7a2ce0" emissiveIntensity={0.8} metalness={0.7} roughness={0.18} clearcoat={0.6} /></mesh>
      </SyncBody>
      {physics.bumpers.map((body, index) => (
        <mesh key={body.id} position={[body.position.x, body.position.y, body.position.z]} castShadow>
          <sphereGeometry args={[0.7, 24, 18]} />
          <meshPhysicalMaterial color={index % 2 ? '#ffcf4a' : '#66e3ff'} emissive={index % 2 ? '#b9790a' : '#138bb2'} emissiveIntensity={0.58} metalness={0.42} roughness={0.2} clearcoat={0.9} />
        </mesh>
      ))}
      {[63, 177].map((z) => (
        <pointLight key={z} position={[0, surfaceYAt(z) + 5, z]} intensity={12} distance={14} color={z < 100 ? '#59dcff' : '#d45cff'} />
      ))}
    </group>
  );
}
