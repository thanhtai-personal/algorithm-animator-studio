import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { courseSupportSamples } from "../track/courseSupportLayout";
import { OLYMPIC_SPIRAL_CENTER } from "../track/olympicRoadCourse";
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

function TabletopDisplayBase() {
  return (
    <group>
      <mesh position={[0, -0.28, 11]} receiveShadow>
        <boxGeometry args={[118, 0.28, 158]} />
        <meshStandardMaterial color="#aa9c88" roughness={0.96} metalness={0} />
      </mesh>
      <mesh position={[0, -0.04, 11]} receiveShadow castShadow>
        <boxGeometry args={[82, 0.3, 146]} />
        <meshStandardMaterial color="#0874bd" roughness={0.72} metalness={0.08} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 40.75, 0.13, 11]}>
          <boxGeometry args={[0.18, 0.12, 145]} />
          <meshBasicMaterial color={side > 0 ? "#5aeaff" : "#ff74ce"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function StartDeck({ physics }: { physics: RacePhysics }) {
  const sample = physics.course.samples[0];
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      <mesh position={[0, -0.12, -physics.startGridDepth / 2]} receiveShadow castShadow>
        <boxGeometry args={[physics.course.trackWidth, 0.24, physics.startGridDepth]} />
        <meshStandardMaterial color="#727d84" roughness={0.66} metalness={0.16} />
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

function LaunchArch({ physics }: { physics: RacePhysics }) {
  const sample = physics.course.samples[Math.round(0.015 * (physics.course.samples.length - 1))];
  const width = physics.course.trackWidth;
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (width / 2 + 0.48), 1.72, 0]} castShadow>
            <boxGeometry args={[0.42, 3.44, 0.48]} />
            <meshStandardMaterial color="#e7edf0" metalness={0.58} roughness={0.28} />
          </mesh>
          <mesh position={[side * (width / 2 + 0.48), 1.72, -0.27]}>
            <boxGeometry args={[0.16, 2.8, 0.04]} />
            <meshBasicMaterial color={side > 0 ? "#39d8ff" : "#ffcf2f"} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.34, 0]} castShadow>
        <boxGeometry args={[width + 1.4, 0.52, 0.5]} />
        <meshStandardMaterial color="#18242d" metalness={0.52} roughness={0.32} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[-2.7 + index * 0.9, 3.34, -0.28]}>
          <circleGeometry args={[0.14, 16]} />
          <meshBasicMaterial color={index < 3 ? "#ff3f52" : index === 3 ? "#ffca2b" : "#42e77a"} toneMapped={false} />
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
      <meshStandardMaterial color="#6f7579" roughness={0.78} metalness={0.08} />
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
      <mesh geometry={road} receiveShadow><meshStandardMaterial color="#858a8e" roughness={0.84} metalness={0.02} side={THREE.DoubleSide} /></mesh>
      {[left, right].map((geometry, index) => (
        <mesh key={index} geometry={geometry} receiveShadow>
          <meshStandardMaterial color="#d8dde0" roughness={0.66} metalness={0.03} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function RoadDetails({ physics }: { physics: RacePhysics }) {
  const { samples, trackWidth } = physics.course;
  const dashes = samples.filter((_, index) => index > 3 && index % 8 === 2);
  const supports = courseSupportSamples(samples, trackWidth, 18, 8);
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
          <meshBasicMaterial color={Math.floor(sample.index / 10) % 2 ? "#e33e43" : "#f5f5f2"} toneMapped={false} />
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
          <meshStandardMaterial color={index ? "#62e8ff" : "#ff7ad9"} emissive={index ? "#1597b7" : "#a72985"} emissiveIntensity={1.4} metalness={0.65} roughness={0.18} />
        </mesh>
      ))}
      {supports.map((sample) => {
        const height = Math.max(0.5, sample.point.y - 0.48);
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
    <group position={OLYMPIC_SPIRAL_CENTER}>
      <mesh>
        <cylinderGeometry args={[10.8, 4.2, 5.8, 64, 1, true]} />
        <meshPhysicalMaterial color="#26a9e8" transparent opacity={0.22} roughness={0.12} metalness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2.76, 0]}>
        <cylinderGeometry args={[3.85, 3.85, 0.22, 64]} />
        <meshStandardMaterial color="#1285c8" emissive="#0c69a4" emissiveIntensity={0.7} roughness={0.28} />
      </mesh>
      {[4.8, 6.4, 8.1, 10.2].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, -2 + index * 1.48, 0]}>
          <torusGeometry args={[radius, 0.075, 8, 72]} />
          <meshStandardMaterial color="#45c8ff" emissive="#168fd0" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function RoadDriveBelts({ physics }: { physics: RacePhysics }) {
  const samples = physics.course.samples;
  return (
    <group>
      {physics.course.driveBelts.flatMap((belt) => Array.from({ length: 6 }, (_, index) => {
        const progress = THREE.MathUtils.lerp(belt.from, belt.to, (index + 0.5) / 6);
        const sample = samples[Math.round(progress * (samples.length - 1))];
        return (
          <group key={`${belt.id}-${index}`} position={sample.point.clone().addScaledVector(sample.normal, 0.105)} quaternion={sample.quaternion}>
            <mesh receiveShadow>
              <boxGeometry args={[physics.course.trackWidth - 0.9, 0.08, Math.max(0.65, sample.lengthToNext * 1.75)]} />
              <meshStandardMaterial color="#b44e24" emissive="#e36629" emissiveIntensity={0.55} roughness={0.56} />
            </mesh>
            {[-1.5, 0, 1.5].map((x) => (
              <mesh key={x} position={[x, 0.055, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.44, 0.035, 0.44]} />
                <meshBasicMaterial color="#ffd84a" toneMapped={false} />
              </mesh>
            ))}
          </group>
        );
      }))}
    </group>
  );
}

function FinishChute({ physics }: { physics: RacePhysics }) {
  const sample = physics.course.samples[Math.round(physics.course.specials.finish * (physics.course.samples.length - 1))];
  const width = physics.course.trackWidth;
  const laneCount = 6;
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      <mesh position={[0, -0.08, 3.2]} receiveShadow castShadow>
        <boxGeometry args={[width + 1.2, 0.2, 8.2]} />
        <meshStandardMaterial color="#d9dde0" roughness={0.74} />
      </mesh>
      {Array.from({ length: laneCount + 1 }, (_, index) => (
        <mesh key={`lane-${index}`} position={[-width / 2 + index * width / laneCount, 0.04, 3.15]}>
          <boxGeometry args={[0.055, 0.03, 7.6]} />
          <meshBasicMaterial color="#f8fafb" toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: laneCount }, (_, index) => (
        <group key={`rank-${index}`} position={[-width / 2 + (index + 0.5) * width / laneCount, 0.07, 5.65]}>
          <mesh>
            <boxGeometry args={[0.72, 0.035, 0.32]} />
            <meshBasicMaterial color={index % 2 ? "#202428" : "#c53038"} />
          </mesh>
          <mesh position={[0, 0, -0.65]}>
            <boxGeometry args={[0.72, 0.035, 0.18]} />
            <meshBasicMaterial color="#f5f7f8" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 0.48), 1.78, 2.35]} castShadow>
          <boxGeometry args={[0.42, 3.55, 0.52]} />
          <meshStandardMaterial color="#e8ecee" metalness={0.48} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 3.42, 2.35]} castShadow>
        <boxGeometry args={[width + 1.35, 0.58, 0.56]} />
        <meshStandardMaterial color="#e95b77" emissive="#8d243a" emissiveIntensity={0.7} roughness={0.38} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={`finish-${index}`} position={[-width / 2 + (index + 0.5) * width / 12, 0.105, 0.1]}>
          <boxGeometry args={[width / 12, 0.04, 0.82]} />
          <meshBasicMaterial color={index % 2 ? "#ffffff" : "#17191d"} />
        </mesh>
      ))}
    </group>
  );
}

export function OlympicRoadTrack3D({ physics }: { physics: RacePhysics }) {
  return <group><TabletopDisplayBase /><StartDeck physics={physics} /><LaunchArch physics={physics} /><RoadBase physics={physics} /><CurbsAndRoad physics={physics} /><RoadDetails physics={physics} /><NeonSpiralBasin /><RoadDriveBelts physics={physics} /><FinishChute physics={physics} /></group>;
}
