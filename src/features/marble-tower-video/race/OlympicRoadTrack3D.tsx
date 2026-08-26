import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import type { CourseSample } from "../track/towerCourseSampler";

function ribbon(samples: readonly CourseSample[], min: number, max: number, lift = 0.04) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  samples.forEach((sample) => {
    for (const lateral of [min, max]) {
      const point = sample.point.clone().addScaledVector(sample.right, lateral).addScaledVector(sample.normal, lift);
      positions.push(point.x, point.y, point.z);
      normals.push(sample.normal.x, sample.normal.y, sample.normal.z);
    }
  });
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = index * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function sideWall(samples: readonly CourseSample[], side: -1 | 1, trackWidth: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const lateral = side * (trackWidth / 2 - 0.04);
  samples.forEach((sample) => {
    const low = sample.point.clone().addScaledVector(sample.right, lateral).addScaledVector(sample.normal, 0.08);
    const high = low.clone().addScaledVector(sample.normal, 1.18);
    positions.push(low.x, low.y, low.z, high.x, high.y, high.z);
  });
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = index * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function StartDeck({ physics }: { physics: RacePhysics }) {
  const sample = physics.course.samples[0];
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      <mesh position={[0, -0.12, -physics.startGridDepth / 2]} receiveShadow castShadow>
        <boxGeometry args={[physics.course.trackWidth, 0.24, physics.startGridDepth]} />
        <meshStandardMaterial color="#454d55" roughness={0.7} metalness={0.18} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (physics.course.trackWidth / 2 - 0.06), 0.75, -physics.startGridDepth / 2]} castShadow>
          <boxGeometry args={[0.14, 1.5, physics.startGridDepth]} />
          <meshStandardMaterial color="#d9e1e8" metalness={0.75} roughness={0.26} />
        </mesh>
      ))}
    </group>
  );
}

function RoadBase({ physics }: { physics: RacePhysics }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const samples = physics.course.samples;
  const count = samples.length - 1;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();
    for (let index = 0; index < count; index += 1) {
      const sample = samples[index];
      const next = samples[index + 1];
      const mid = sample.point.clone().lerp(next.point, 0.5).addScaledVector(sample.normal, -0.16);
      scale.set(physics.course.trackWidth + 0.3, 0.3, sample.lengthToNext * 1.52);
      matrix.compose(mid, sample.quaternion, scale);
      ref.current.setMatrixAt(index, matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, physics.course.trackWidth, samples]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#434950" roughness={0.72} metalness={0.18} />
    </instancedMesh>
  );
}

function CurbsAndRoad({ physics }: { physics: RacePhysics }) {
  const { samples, trackWidth } = physics.course;
  const road = useMemo(() => ribbon(samples, -trackWidth / 2 + 0.42, trackWidth / 2 - 0.42, 0.05), [samples, trackWidth]);
  const left = useMemo(() => ribbon(samples, -trackWidth / 2, -trackWidth / 2 + 0.42, 0.07), [samples, trackWidth]);
  const right = useMemo(() => ribbon(samples, trackWidth / 2 - 0.42, trackWidth / 2, 0.07), [samples, trackWidth]);
  return (
    <group>
      <mesh geometry={road} receiveShadow><meshStandardMaterial color="#5c6268" roughness={0.82} metalness={0.06} side={THREE.DoubleSide} /></mesh>
      {[left, right].map((geometry, index) => (
        <mesh key={index} geometry={geometry} receiveShadow>
          <meshStandardMaterial color="#e2454f" roughness={0.56} metalness={0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function RoadDetails({ physics }: { physics: RacePhysics }) {
  const { samples, trackWidth } = physics.course;
  const dashes = samples.filter((_, index) => index > 3 && index % 8 === 2);
  const supports = samples.filter((_, index) => index > 8 && index % 18 === 8);
  const rails = useMemo(() => ([-1, 1] as const).map((side) => new THREE.CatmullRomCurve3(
    samples.map((sample) => sample.point.clone().addScaledVector(sample.right, side * (trackWidth / 2 - 0.08)).addScaledVector(sample.normal, 1.22)),
    false,
    "centripetal",
  )), [samples, trackWidth]);
  const walls = useMemo(() => ([-1, 1] as const).map((side) => sideWall(samples, side, trackWidth)), [samples, trackWidth]);
  return (
    <group>
      {dashes.map((sample) => (
        <mesh key={`dash-${sample.index}`} position={sample.point.clone().addScaledVector(sample.normal, 0.09)} quaternion={sample.quaternion}>
          <boxGeometry args={[0.11, 0.035, Math.max(0.7, sample.lengthToNext * 2.3)]} />
          <meshBasicMaterial color="#f5f7f8" toneMapped={false} />
        </mesh>
      ))}
      {samples.filter((_, index) => index % 10 === 5).flatMap((sample) => ([-1, 1] as const).map((side) => (
        <mesh key={`curb-${sample.index}-${side}`} position={sample.point.clone().addScaledVector(sample.right, side * (trackWidth / 2 - 0.2)).addScaledVector(sample.normal, 0.105)} quaternion={sample.quaternion}>
          <boxGeometry args={[0.38, 0.04, Math.max(0.65, sample.lengthToNext * 2.5)]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      )))}
      {walls.map((geometry, index) => (
        <mesh key={`wall-${index}`} geometry={geometry} castShadow receiveShadow>
          <meshPhysicalMaterial color="#b7d6e5" transparent opacity={0.27} roughness={0.18} metalness={0.28} clearcoat={0.65} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {rails.map((curve, index) => (
        <mesh key={`rail-${index}`} castShadow>
          <tubeGeometry args={[curve, 300, 0.095, 8, false]} />
          <meshStandardMaterial color={index ? "#62dcff" : "#ff6382"} emissive={index ? "#1ca5d0" : "#c22649"} emissiveIntensity={1.4} metalness={0.65} roughness={0.18} />
        </mesh>
      ))}
      {supports.map((sample) => {
        const height = Math.max(1, sample.point.y);
        return <mesh key={`support-${sample.index}`} position={[sample.point.x, height / 2, sample.point.z]} castShadow>
          <cylinderGeometry args={[0.18, 0.24, height, 10]} />
          <meshStandardMaterial color="#737d87" metalness={0.8} roughness={0.28} />
        </mesh>;
      })}
    </group>
  );
}

function NeonSpiralBasin() {
  return (
    <group position={[0, 6.8, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[8.4, 4.2, 1.1, 64, 1, true]} />
        <meshPhysicalMaterial color="#1a8ed1" transparent opacity={0.2} roughness={0.14} metalness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {[4.6, 5.8, 7.1, 8.3].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2 + index * 0.18, 0]}>
          <torusGeometry args={[radius, 0.075, 8, 72]} />
          <meshStandardMaterial color="#45c8ff" emissive="#168fd0" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function FinishMark({ physics }: { physics: RacePhysics }) {
  const sample = physics.course.samples[Math.round(physics.course.specials.finish * (physics.course.samples.length - 1))];
  const width = physics.course.trackWidth;
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={index} position={[-width / 2 + (index + 0.5) * width / 12, 0.12, 0]}>
          <boxGeometry args={[width / 12, 0.045, 1.05]} />
          <meshBasicMaterial color={index % 2 ? "#ffffff" : "#15181d"} />
        </mesh>
      ))}
    </group>
  );
}

export function OlympicRoadTrack3D({ physics }: { physics: RacePhysics }) {
  return <group><StartDeck physics={physics} /><RoadBase physics={physics} /><CurbsAndRoad physics={physics} /><RoadDetails physics={physics} /><NeonSpiralBasin /><FinishMark physics={physics} /></group>;
}
