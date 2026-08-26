import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CHECKPOINTS, JUMP_PAD_Z, TRACK_SEGMENTS, TRACK_THICKNESS, TRACK_WIDTH, TURBO_PAD_Z, segmentPose, surfaceYAt } from '../track/trackLayout';
import type { RacePhysics } from '../physics/RacePhysics';

function RoadSegment({ id }: { id: string }) {
  const segment = TRACK_SEGMENTS.find((item) => item.id === id)!;
  const pose = segmentPose(segment);
  const emissive = segment.kind === 'final' ? '#44195f'
    : segment.kind === 'boost' ? '#04566b'
      : segment.kind === 'tube' ? '#0b3b5b'
        : '#0a2a3d';
  return (
    <group position={pose.position} rotation={[pose.rotationX, 0, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[segment.width, TRACK_THICKNESS, pose.length]} />
        <meshPhysicalMaterial color={segment.color} roughness={0.34} metalness={0.5} clearcoat={0.65} clearcoatRoughness={0.18} emissive={emissive} emissiveIntensity={0.16} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (segment.width / 2 + 0.08), 0.56, 0]} castShadow>
          <boxGeometry args={[0.16, 0.72, pose.length]} />
          <meshStandardMaterial color="#7c8b97" roughness={0.22} metalness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

function PianoRun({ physics }: { physics: RacePhysics }) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const materials = useMemo(() => Array.from({ length: 14 }, (_, index) => new THREE.MeshPhysicalMaterial({
    color: index % 2 ? '#17212b' : '#e6edf2',
    roughness: 0.18,
    metalness: index % 2 ? 0.55 : 0.18,
    clearcoat: 0.82,
    emissive: new THREE.Color(index % 2 ? '#0b2d3f' : '#18435a'),
    emissiveIntensity: 0.08
  })), []);
  useFrame(() => {
    const now = performance.now() / 1000;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const material = materials[index];
      const shimmer = Math.sin(now * 3.4 + index * 0.7) > 0.985;
      const active = physics.pianoGlow(index);
      material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, active ? 1.15 : shimmer ? 0.18 : 0.08, 0.18);
    });
  });
  const start = 36;
  const end = 55;
  const depth = (end - start) / 14;
  return (
    <group>
      {Array.from({ length: 14 }, (_, index) => {
        const z = start + depth * (index + 0.5);
        return (
          <mesh key={index} ref={(node) => { refs.current[index] = node; }} position={[0, 11.78, z]} material={materials[index]} receiveShadow castShadow>
            <boxGeometry args={[TRACK_WIDTH, 0.4, depth * 0.96]} />
          </mesh>
        );
      })}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (TRACK_WIDTH / 2 + 0.08), 12.34, 45.5]}>
          <boxGeometry args={[0.16, 0.72, 19]} />
          <meshStandardMaterial color="#8b949c" roughness={0.22} metalness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function TubeArches() {
  return (
    <group>
      {Array.from({ length: 8 }, (_, index) => {
        const z = 75 + index * 2.35;
        const y = surfaceYAt(z) + 2.3;
        return (
          <mesh key={index} position={[0, y, z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[4.55, 0.075, 10, 34]} />
            <meshStandardMaterial color="#79e6ff" emissive="#2aa8cf" emissiveIntensity={0.7} metalness={0.55} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

function Pad({ z, color }: { z: number; color: string }) {
  return (
    <mesh position={[0, surfaceYAt(z) + 0.07, z]} rotation={[-0.03, 0, 0]} receiveShadow>
      <boxGeometry args={[TRACK_WIDTH - 0.9, 0.12, 2.2]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.15} roughness={0.28} metalness={0.48} />
    </mesh>
  );
}

export function TrackMeshes3D({ physics }: { physics: RacePhysics }) {
  return (
    <group>
      {TRACK_SEGMENTS.filter((segment) => segment.kind !== 'piano').map((segment) => <RoadSegment key={segment.id} id={segment.id} />)}
      <PianoRun physics={physics} />
      <TubeArches />
      <Pad z={JUMP_PAD_Z} color="#ffd84a" />
      <Pad z={TURBO_PAD_Z} color="#39e6ff" />
      {CHECKPOINTS.map((checkpoint) => (
        <group key={checkpoint.id} position={[0, surfaceYAt(checkpoint.z) + 1.9, checkpoint.z]}>
          {[-4.35, 4.35].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.16, 3.8, 0.16]} />
              <meshStandardMaterial color="#ff4f84" emissive="#ff255f" emissiveIntensity={0.78} metalness={0.62} roughness={0.25} />
            </mesh>
          ))}
          <mesh position={[0, 1.85, 0]}>
            <boxGeometry args={[8.85, 0.14, 0.14]} />
            <meshStandardMaterial color="#ff4f84" emissive="#ff255f" emissiveIntensity={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
