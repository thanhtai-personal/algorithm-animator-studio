import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RacePhysics } from '../physics/RacePhysics';
import { courseSupportSamples } from '../track/courseSupportLayout';
import { COURSE_SAMPLES, sampleAt } from '../track/towerCourseSampler';
import { RAINBOW_COLORS, SPECIALS, TOWER_DRIVE_BELTS, TRACK_THICKNESS, TRACK_WIDTH } from '../track/towerCourse';
import { PIANO_PAD_LAYOUT } from '../track/pianoPadLayout';
import { CourseObject3D } from './CourseObject3D';

const SEGMENT_COUNT = COURSE_SAMPLES.length - 1;

function StartGridExtension({ depth }: { depth: number }) {
  const sample = COURSE_SAMPLES[0];
  const center = sample.point.clone().addScaledVector(sample.tangent, -depth / 2);
  const stripeWidth = TRACK_WIDTH / RAINBOW_COLORS.length;
  return (
    <group position={center} quaternion={sample.quaternion}>
      <mesh position={[0, -0.17, 0]} receiveShadow castShadow>
        <boxGeometry args={[TRACK_WIDTH + 0.28, TRACK_THICKNESS, depth]} />
        <meshStandardMaterial color="#c3cbd6" roughness={0.28} metalness={0.5} />
      </mesh>
      {RAINBOW_COLORS.map((color, index) => (
        <mesh key={color} position={[-TRACK_WIDTH / 2 + stripeWidth * (index + 0.5), 0.045, 0]} receiveShadow>
          <boxGeometry args={[stripeWidth + 0.035, 0.05, depth]} />
          <meshPhysicalMaterial color={color} roughness={0.16} metalness={0.18} clearcoat={0.86} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (TRACK_WIDTH / 2 - 0.04), 0.84, 0]} castShadow>
          <boxGeometry args={[0.16, 1.68, depth]} />
          <meshPhysicalMaterial color="#9cc4d9" transparent opacity={0.84} roughness={0.2} metalness={0.48} />
        </mesh>
      ))}
    </group>
  );
}

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
      scale.set(TRACK_WIDTH + 0.28, TRACK_THICKNESS, sample.lengthToNext * 1.52);
      matrix.compose(mid, sample.quaternion, scale);
      ref.current.setMatrixAt(index, matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SEGMENT_COUNT]} receiveShadow castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#c3cbd6" roughness={0.28} metalness={0.5} />
    </instancedMesh>
  );
}

function buildRibbonGeometry(lateralMin: number, lateralMax: number, lift = 0.05) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  COURSE_SAMPLES.forEach((sample, index) => {
    const left = sample.point.clone().addScaledVector(sample.right, lateralMin).addScaledVector(sample.normal, lift);
    const right = sample.point.clone().addScaledVector(sample.right, lateralMax).addScaledVector(sample.normal, lift);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    normals.push(sample.normal.x, sample.normal.y, sample.normal.z, sample.normal.x, sample.normal.y, sample.normal.z);
    const v = index / Math.max(1, SEGMENT_COUNT);
    uvs.push(0, v, 1, v);
  });

  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const a = index * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function Stripe({ color, stripeIndex }: { color: string; stripeIndex: number }) {
  const stripeWidth = TRACK_WIDTH / RAINBOW_COLORS.length;
  const overlap = 0.035;
  const lateralMin = -TRACK_WIDTH / 2 + stripeWidth * stripeIndex - overlap;
  const lateralMax = lateralMin + stripeWidth + overlap * 2;
  const geometry = useMemo(() => buildRibbonGeometry(lateralMin, lateralMax), [lateralMax, lateralMin]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.16} metalness={0.18} clearcoat={0.86} clearcoatRoughness={0.12} side={THREE.DoubleSide} />
    </mesh>
  );
}

function buildGuardWallGeometry(side: -1 | 1) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const lateral = side * (TRACK_WIDTH / 2 - 0.04);
  const wallHeight = 1.62;

  COURSE_SAMPLES.forEach((sample) => {
    const lower = sample.point.clone().addScaledVector(sample.right, lateral).addScaledVector(sample.normal, 0.04);
    const upper = lower.clone().addScaledVector(sample.normal, wallHeight);
    positions.push(lower.x, lower.y, lower.z, upper.x, upper.y, upper.z);
    const facing = sample.right.clone().multiplyScalar(-side);
    normals.push(facing.x, facing.y, facing.z, facing.x, facing.y, facing.z);
  });

  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const a = index * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function GuardWalls() {
  const walls = useMemo(() => ([-1, 1] as const).map((side) => ({
    side,
    geometry: buildGuardWallGeometry(side),
    topRail: new THREE.CatmullRomCurve3(
      COURSE_SAMPLES.map((sample) => sample.point.clone()
        .addScaledVector(sample.right, side * (TRACK_WIDTH / 2 - 0.04))
        .addScaledVector(sample.normal, 1.68)),
      false,
      'centripetal',
    ),
  })), []);

  return (
    <group>
      {walls.map(({ side, geometry, topRail }) => (
        <group key={side}>
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshPhysicalMaterial
              color="#9cc4d9"
              transparent
              opacity={0.84}
              roughness={0.2}
              metalness={0.48}
              clearcoat={0.42}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh castShadow>
            <tubeGeometry args={[topRail, 260, 0.14, 8, false]} />
            <meshStandardMaterial color="#edf4fa" metalness={0.92} roughness={0.16} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TrackSupports() {
  const supports = useMemo(() => courseSupportSamples(COURSE_SAMPLES, TRACK_WIDTH), []);
  return (
    <group>
      {supports.map((sample) => {
        const height = Math.max(0.5, sample.point.y - 0.48);
        return (
          <group key={sample.index}>
            <mesh position={[sample.point.x, height / 2, sample.point.z]} castShadow>
              <cylinderGeometry args={[0.22, 0.25, height, 12]} />
              <meshStandardMaterial color="#6e7883" metalness={0.76} roughness={0.32} />
            </mesh>
            <mesh position={[sample.point.x, sample.point.y - 0.8, sample.point.z]} quaternion={sample.quaternion}>
              <boxGeometry args={[TRACK_WIDTH + 1.4, 0.18, 0.28]} />
              <meshStandardMaterial color="#929daa" metalness={0.8} roughness={0.3} />
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
      {PIANO_PAD_LAYOUT.map((pad) => {
        const sample = sampleAt(pad.progress);
        const position = sample.point.clone()
          .addScaledVector(sample.right, pad.lateral)
          .addScaledVector(sample.normal, 0.11);
        return (
          <mesh
            key={pad.index}
            ref={(node) => { refs.current[pad.index] = node; }}
            position={position}
            quaternion={sample.quaternion}
            material={materials[pad.index]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[pad.width, 0.16, pad.depth]} />
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

function DriveBelts() {
  return (
    <group>
      {TOWER_DRIVE_BELTS.flatMap((belt) => Array.from({ length: 7 }, (_, index) => {
        const progress = THREE.MathUtils.lerp(belt.from, belt.to, (index + 0.5) / 7);
        const sample = sampleAt(progress);
        return (
          <group key={`${belt.id}-${index}`} position={sample.point.clone().addScaledVector(sample.normal, 0.105)} quaternion={sample.quaternion}>
            <mesh receiveShadow>
              <boxGeometry args={[TRACK_WIDTH - 1.1, 0.08, Math.max(0.72, sample.lengthToNext * 1.8)]} />
              <meshStandardMaterial color="#174f63" emissive="#0c8fab" emissiveIntensity={0.72} roughness={0.38} />
            </mesh>
            {[-1.7, 0, 1.7].map((x) => (
              <mesh key={x} position={[x, 0.055, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.52, 0.035, 0.52]} />
                <meshBasicMaterial color="#83f2ff" toneMapped={false} />
              </mesh>
            ))}
          </group>
        );
      }))}
    </group>
  );
}

function FinishDeck() {
  const sample = sampleAt(0.985);
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      <mesh position={[0, 0.055, 0]} receiveShadow>
        <boxGeometry args={[TRACK_WIDTH + 1.8, 0.1, 4.8]} />
        <meshStandardMaterial color="#bcc6d1" metalness={0.62} roughness={0.38} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[-TRACK_WIDTH / 2 + index * (TRACK_WIDTH / 9), 0.13, 0]}>
          <boxGeometry args={[TRACK_WIDTH / 9, 0.04, 0.8]} />
          <meshBasicMaterial color={index % 2 ? '#ffffff' : '#6b7a8b'} />
        </mesh>
      ))}
    </group>
  );
}

export function TrackMeshes3D({ physics }: { physics: RacePhysics }) {
  return (
    <group>
      <StartGridExtension depth={physics.startGridDepth} />
      <TrackBase />
      {RAINBOW_COLORS.map((color, index) => <Stripe key={color} color={color} stripeIndex={index} />)}
      <GuardWalls />
      <TrackSupports />
      <CourseObject3D physics={physics} id="piano"><PianoBridge physics={physics} /></CourseObject3D>
      <PrismTunnel />
      <DriveBelts />
      <FinishDeck />
    </group>
  );
}
