import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RacePhysics } from '../physics/RacePhysics';
import { COURSE_SAMPLES, sampleAt } from '../track/towerCourseSampler';
import { CUTS, SPECIALS, TRACK_WIDTH } from '../track/towerCourse';
import { CourseObject3D } from './CourseObject3D';

function SyncBody({ body, children }: { body: { position: { x: number; y: number; z: number }; quaternion: { x: number; y: number; z: number; w: number } }; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(body.position.x, body.position.y, body.position.z);
    ref.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  });
  return <group ref={ref}>{children}</group>;
}

function Spinner({ body, color = '#16191e' }: { body: RacePhysics['spinnerA']['body']; color?: string }) {
  return (
    <SyncBody body={body}>
      <mesh castShadow>
        <boxGeometry args={[TRACK_WIDTH * 0.86, 0.28, 0.34]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.24} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.38, 0.42, 1.0, 18]} />
        <meshStandardMaterial color="#c0c8cf" metalness={0.92} roughness={0.14} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * TRACK_WIDTH * 0.38, 0, 0]}>
          <sphereGeometry args={[0.25, 16, 12]} />
          <meshStandardMaterial color="#ff7a42" emissive="#c63a13" emissiveIntensity={0.65} />
        </mesh>
      ))}
    </SyncBody>
  );
}

function StartGate({ physics }: { physics: RacePhysics }) {
  return (
    <SyncBody body={physics.startGate}>
      <mesh castShadow>
        <boxGeometry args={[TRACK_WIDTH, 1.6, 0.36]} />
        <meshStandardMaterial color="#15181c" metalness={0.84} roughness={0.22} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[-TRACK_WIDTH / 2 + 0.65 + index * 1.25, 0, -0.2]}>
          <boxGeometry args={[0.78, 0.11, 0.04]} />
          <meshBasicMaterial color={['#ff3155', '#ff8c22', '#ffd938', '#47db69', '#2bd6d9', '#4777ff', '#a653ff'][index]} />
        </mesh>
      ))}
    </SyncBody>
  );
}

function ChimeGauntlet({ physics }: { physics: RacePhysics }) {
  return (
    <group>
      {physics.chimeBodies.map((body, index) => {
        const color = ['#ff425f', '#ff9a35', '#ffe145', '#4ce57a', '#36dce4', '#5983ff', '#b15fff'][index % 7];
        return (
          <group key={body.id} position={[body.position.x, body.position.y, body.position.z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.22, 0.27, 1.7, 12]} />
              <meshStandardMaterial color="#adb7c0" metalness={0.94} roughness={0.16} />
            </mesh>
            <mesh position={[0, 0.68, 0]}>
              <torusGeometry args={[0.38, 0.08, 8, 20]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function JumpRamp() {
  const sample = sampleAt(SPECIALS.jump);
  return (
    <group position={sample.point.clone().addScaledVector(sample.normal, 0.16)} quaternion={sample.quaternion}>
      <mesh castShadow receiveShadow rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[TRACK_WIDTH - 1.0, 0.22, 2.8]} />
        <meshStandardMaterial color="#1478bf" emissive="#0d5c9e" emissiveIntensity={0.75} metalness={0.45} roughness={0.25} />
      </mesh>
      {[-2.4, 0, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]}>
          <boxGeometry args={[1.35, 0.06, 2.1]} />
          <meshBasicMaterial color="#85eaff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function CutGate({ progress, keep, label }: { progress: number; keep: number; label: string }) {
  const sample = sampleAt(progress);
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (TRACK_WIDTH / 2 + 0.7), 1.6, 0]} castShadow>
          <boxGeometry args={[0.34, 3.2, 0.34]} />
          <meshStandardMaterial color="#191c21" metalness={0.86} roughness={0.22} />
        </mesh>
      ))}
      <mesh position={[0, 3.08, 0]}>
        <boxGeometry args={[TRACK_WIDTH + 1.7, 0.28, 0.34]} />
        <meshStandardMaterial color="#ff2f66" emissive="#ff174f" emissiveIntensity={0.82} metalness={0.55} />
      </mesh>
      <mesh position={[0, 2.64, 0.01]}>
        <boxGeometry args={[keep * 0.6, 0.08, 0.06]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function FinishArch() {
  const sample = sampleAt(SPECIALS.finish);
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (TRACK_WIDTH / 2 + 0.8), 2.2, 0]}>
          <boxGeometry args={[0.42, 4.4, 0.42]} />
          <meshStandardMaterial color="#111318" metalness={0.8} roughness={0.24} />
        </mesh>
      ))}
      <mesh position={[0, 4.18, 0]}>
        <boxGeometry args={[TRACK_WIDTH + 2.0, 0.48, 0.48]} />
        <meshStandardMaterial color="#15171b" metalness={0.82} roughness={0.2} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-TRACK_WIDTH / 2 + index * (TRACK_WIDTH / 8), 4.2, -0.26]}>
          <boxGeometry args={[0.5, 0.16, 0.05]} />
          <meshBasicMaterial color={index % 2 ? '#ffffff' : '#ff3155'} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function ObstacleMeshes3D({ physics }: { physics: RacePhysics }) {
  const finalSample = useMemo(() => COURSE_SAMPLES[Math.round(SPECIALS.finalCross * (COURSE_SAMPLES.length - 1))], []);
  return (
    <group>
      <CourseObject3D physics={physics} id="start-gate"><StartGate physics={physics} /></CourseObject3D>
      <CourseObject3D physics={physics} id="spinner-a"><Spinner body={physics.spinnerA.body} /></CourseObject3D>
      <CourseObject3D physics={physics} id="spinner-b"><Spinner body={physics.spinnerB.body} color="#20242a" /></CourseObject3D>
      <CourseObject3D physics={physics} id="chimes"><ChimeGauntlet physics={physics} /></CourseObject3D>
      <JumpRamp />
      <CourseObject3D physics={physics} id="final-cross">
        <SyncBody body={physics.finalCross.body}>
          <mesh castShadow>
            <boxGeometry args={[TRACK_WIDTH * 0.86, 0.28, 0.34]} />
            <meshStandardMaterial color="#11141a" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.28, TRACK_WIDTH * 0.86]} />
            <meshStandardMaterial color="#11141a" metalness={0.85} roughness={0.2} />
          </mesh>
          <pointLight color="#ff486e" intensity={18} distance={7} position={[0, 1.1, 0]} />
        </SyncBody>
        <pointLight position={finalSample.point.clone().addScaledVector(finalSample.normal, 3)} intensity={26} distance={10} color="#ff3c76" />
      </CourseObject3D>
      {CUTS.map((cut) => <CutGate key={cut.progress} progress={cut.progress} keep={cut.keep} label={cut.label} />)}
      <FinishArch />
    </group>
  );
}
