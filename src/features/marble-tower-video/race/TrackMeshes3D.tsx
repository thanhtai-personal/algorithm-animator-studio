import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RacePhysics } from '../physics/RacePhysics';
import { COURSE_SAMPLES, sampleAt } from '../track/towerCourseSampler';
import { RAINBOW_COLORS, SPECIALS, TRACK_THICKNESS, TRACK_WIDTH } from '../track/towerCourse';

const SEGMENT_COUNT = COURSE_SAMPLES.length - 1;

function TrackBase() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const sample = COURSE_SAMPLES[index];
      const next = COURSE_SAMPLES[index + 1];
      const mid = sample.point.clone().lerp(next.point, 0.5).addScaledVector(sample.normal, -0.18);
      scale.set(TRACK_WIDTH + 0.5, TRACK_THICKNESS, sample.lengthToNext * 1.12);
      matrix.compose(mid, sample.quaternion, scale);
      ref.current.setMatrixAt(index, matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SEGMENT_COUNT]} receiveShadow castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#14171c" roughness={0.34} metalness={0.72} />
    </instancedMesh>
  );
}

function Stripe({ color, stripeIndex }: { color: string; stripeIndex: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();
    const stripeWidth = TRACK_WIDTH / RAINBOW_COLORS.length;
    const lateral = -TRACK_WIDTH / 2 + stripeWidth * (stripeIndex + 0.5);
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const sample = COURSE_SAMPLES[index];
      const next = COURSE_SAMPLES[index + 1];
      const mid = sample.point.clone().lerp(next.point, 0.5)
        .addScaledVector(sample.right, lateral)
        .addScaledVector(sample.normal, 0.018);
      scale.set(stripeWidth * 0.965, 0.075, sample.lengthToNext * 1.13);
      matrix.compose(mid, sample.quaternion, scale);
      ref.current.setMatrixAt(index, matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [stripeIndex]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SEGMENT_COUNT]} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.22} clearcoat={0.72} clearcoatRoughness={0.15} />
    </instancedMesh>
  );
}

function Rails() {
  const curves = useMemo(() => [-1, 1].map((side) => new THREE.CatmullRomCurve3(
    COURSE_SAMPLES.map((sample) => sample.point.clone()
      .addScaledVector(sample.right, side * (TRACK_WIDTH / 2 + 0.16))
      .addScaledVector(sample.normal, 0.7)),
    false,
    'centripetal'
  )), []);
  return (
    <>
      {curves.map((curve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[curve, 260, 0.11, 8, false]} />
          <meshStandardMaterial color="#aeb9c2" metalness={0.9} roughness={0.18} />
        </mesh>
      ))}
    </>
  );
}

function TrackSupports() {
  const supports = useMemo(() => COURSE_SAMPLES.filter((_, index) => index % 12 === 6 && index > 5), []);
  return (
    <group>
      {supports.map((sample) => {
        const height = Math.max(1, sample.point.y);
        return (
          <group key={sample.index}>
            <mesh position={[sample.point.x, height / 2, sample.point.z]} castShadow>
              <cylinderGeometry args={[0.16, 0.2, height, 10]} />
              <meshStandardMaterial color="#22272d" metalness={0.76} roughness={0.32} />
            </mesh>
            <mesh position={[sample.point.x, sample.point.y - 0.8, sample.point.z]} quaternion={sample.quaternion}>
              <boxGeometry args={[TRACK_WIDTH + 1.4, 0.18, 0.28]} />
              <meshStandardMaterial color="#252a30" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function PianoBridge({ physics }: { physics: RacePhysics }) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const materials = useMemo(() => Array.from({ length: 12 }, (_, index) => new THREE.MeshPhysicalMaterial({
    color: index % 2 === 0 ? '#f0eee8' : '#17191d',
    roughness: 0.24,
    metalness: index % 2 === 0 ? 0.08 : 0.45,
    clearcoat: 0.6,
    emissive: new THREE.Color(index % 2 === 0 ? '#7edbff' : '#2448a8'),
    emissiveIntensity: 0.02
  })), []);
  useFrame(() => {
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const material = materials[index];
      const target = physics.pianoGlow(index) ? 1.35 : 0.02;
      material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, target, 0.2);
    });
  });
  return (
    <group>
      {Array.from({ length: 12 }, (_, index) => {
        const progress = THREE.MathUtils.lerp(SPECIALS.pianoStart, SPECIALS.pianoEnd, (index + 0.5) / 12);
        const sample = sampleAt(progress);
        return (
          <mesh
            key={index}
            ref={(node) => { refs.current[index] = node; }}
            position={sample.point.clone().addScaledVector(sample.normal, 0.11)}
            quaternion={sample.quaternion}
            material={materials[index]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[TRACK_WIDTH - 0.28, 0.16, 1.18]} />
          </mesh>
        );
      })}
    </group>
  );
}

function PrismTunnel() {
  const arches = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const progress = THREE.MathUtils.lerp(SPECIALS.tunnelStart, SPECIALS.tunnelEnd, i / 13);
    return sampleAt(progress);
  }), []);
  return (
    <group>
      {arches.map((sample, index) => (
        <mesh key={index} position={sample.point.clone().addScaledVector(sample.normal, 2.25)} quaternion={sample.quaternion}>
          <torusGeometry args={[4.45, 0.075, 8, 42]} />
          <meshStandardMaterial
            color={RAINBOW_COLORS[index % RAINBOW_COLORS.length]}
            emissive={RAINBOW_COLORS[index % RAINBOW_COLORS.length]}
            emissiveIntensity={0.85}
            metalness={0.55}
            roughness={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

function FinishDeck() {
  const sample = sampleAt(0.985);
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      <mesh position={[0, 0.055, 0]} receiveShadow>
        <boxGeometry args={[TRACK_WIDTH + 1.8, 0.1, 4.8]} />
        <meshStandardMaterial color="#0b0c0f" metalness={0.62} roughness={0.38} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[-TRACK_WIDTH / 2 + index * (TRACK_WIDTH / 9), 0.13, 0]}>
          <boxGeometry args={[TRACK_WIDTH / 9, 0.04, 0.8]} />
          <meshBasicMaterial color={index % 2 ? '#ffffff' : '#101114'} />
        </mesh>
      ))}
    </group>
  );
}

export function TrackMeshes3D({ physics }: { physics: RacePhysics }) {
  return (
    <group>
      <TrackBase />
      {RAINBOW_COLORS.map((color, index) => <Stripe key={color} color={color} stripeIndex={index} />)}
      <Rails />
      <TrackSupports />
      <PianoBridge physics={physics} />
      <PrismTunnel />
      <FinishDeck />
    </group>
  );
}
