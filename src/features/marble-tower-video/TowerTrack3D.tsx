import { DoubleSide } from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import type { Group } from "three";
import {
  TOWER_BASE_FINISH_Z,
  TOWER_ROAD_WIDTH,
  TOWER_TRACK,
  towerTrackY,
  type TowerCourseMetrics,
  type TowerTrackPiece,
} from "./towerMotion";

const ROAD_THICKNESS = 0.42;

function Rail({ x, length }: { x: number; length: number }) {
  return <mesh position={[x, 0.72, 0]}>
    <boxGeometry args={[0.26, 1.44, length]} />
    <meshStandardMaterial color="#65ecff" emissive="#27dfff" emissiveIntensity={1.25} roughness={0.3} metalness={0.2} transparent opacity={0.48} />
  </mesh>;
}

function PianoRoad({ piece, metrics }: { piece: TowerTrackPiece; metrics: TowerCourseMetrics }) {
  const startZ = piece.startZ * metrics.zScale;
  const endZ = piece.endZ * metrics.zScale;
  const startY = piece.startY * metrics.yScale;
  const endY = piece.endY * metrics.yScale;
  const zLength = endZ - startZ;
  const drop = startY - endY;
  const slopeLength = Math.hypot(zLength, drop);
  const angle = Math.atan2(drop, zLength);
  const keyCount = Math.max(12, Math.round(12 * metrics.zScale));
  const keyLength = slopeLength / keyCount;
  return <group position={[0, (startY + endY) / 2 - ROAD_THICKNESS / 2, (startZ + endZ) / 2]} rotation={[angle, 0, 0]}>
    {Array.from({ length: keyCount }, (_, index) => {
      const z = -slopeLength / 2 + keyLength * (index + 0.5);
      const dark = [1, 3, 6, 8, 10].includes(index % 12);
      return <group key={index} position={[0, 0, z]}>
        <mesh receiveShadow>
          <boxGeometry args={[TOWER_ROAD_WIDTH, ROAD_THICKNESS, keyLength * 0.94]} />
          <meshStandardMaterial color={dark ? "#20253a" : "#edeffc"} emissive={dark ? "#6b42ff" : "#52dcff"} emissiveIntensity={dark ? 0.2 : 0.08} roughness={0.34} metalness={0.08} />
        </mesh>
        <mesh position={[0, ROAD_THICKNESS / 2 + 0.018, 0]}><boxGeometry args={[0.11, 0.02, keyLength * 0.82]} /><meshBasicMaterial color={index % 2 ? "#d758ff" : "#5cf2ff"} /></mesh>
      </group>;
    })}
    <Rail x={-TOWER_ROAD_WIDTH / 2 - 0.08} length={slopeLength} />
    <Rail x={TOWER_ROAD_WIDTH / 2 + 0.08} length={slopeLength} />
  </group>;
}

function RoadPiece({ piece, metrics }: { piece: TowerTrackPiece; metrics: TowerCourseMetrics }) {
  if (piece.piano) return <PianoRoad piece={piece} metrics={metrics} />;
  const startZ = piece.startZ * metrics.zScale;
  const endZ = piece.endZ * metrics.zScale;
  const startY = piece.startY * metrics.yScale;
  const endY = piece.endY * metrics.yScale;
  const zLength = endZ - startZ;
  const drop = startY - endY;
  const slopeLength = Math.hypot(zLength, drop);
  const angle = Math.atan2(drop, zLength);
  const color = piece.name === "FINISH" ? "#233b55" : piece.name === "FINAL CHAOS" ? "#352052" : "#141b38";
  return <group position={[0, (startY + endY) / 2 - ROAD_THICKNESS / 2, (startZ + endZ) / 2]} rotation={[angle, 0, 0]}>
    <mesh receiveShadow><boxGeometry args={[TOWER_ROAD_WIDTH, ROAD_THICKNESS, slopeLength]} /><meshStandardMaterial color={color} roughness={0.58} metalness={0.26} emissive="#18285a" emissiveIntensity={0.18} /></mesh>
    <Rail x={-TOWER_ROAD_WIDTH / 2 - 0.08} length={slopeLength} />
    <Rail x={TOWER_ROAD_WIDTH / 2 + 0.08} length={slopeLength} />
    <mesh position={[0, ROAD_THICKNESS / 2 + 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[TOWER_ROAD_WIDTH - 0.8, slopeLength]} /><meshBasicMaterial color="#4c65ff" transparent opacity={0.055} side={DoubleSide} /></mesh>
  </group>;
}

function MovingObstacles({ metrics, timeRef }: { metrics: TowerCourseMetrics; timeRef: MutableRefObject<number> }) {
  const spinnerA = useRef<Group>(null);
  const spinnerB = useRef<Group>(null);
  const beatGate = useRef<Group>(null);
  const hammerA = useRef<Group>(null);
  const hammerB = useRef<Group>(null);
  useFrame(() => {
    const seconds = timeRef.current / 1000;
    if (spinnerA.current) spinnerA.current.rotation.y = seconds * 2.25;
    if (spinnerB.current) spinnerB.current.rotation.y = -seconds * 2.05;
    if (beatGate.current) beatGate.current.position.y = towerTrackY(99) * metrics.yScale + 1.2 + Math.max(0, Math.sin(seconds * Math.PI * 4)) * 2.5;
    if (hammerA.current) hammerA.current.rotation.z = Math.sin(seconds * 2.1) * 0.85;
    if (hammerB.current) hammerB.current.rotation.z = Math.sin(seconds * 2.1 + Math.PI) * 0.85;
  });
  const z = (base: number) => base * metrics.zScale;
  const y = (base: number) => towerTrackY(base) * metrics.yScale;
  return <group>
    <group ref={spinnerA} position={[0, y(48) + 1.15, z(48)]}><mesh><boxGeometry args={[TOWER_ROAD_WIDTH * 0.86, 0.36, 0.48]} /><meshStandardMaterial color="#55edff" emissive="#55edff" emissiveIntensity={0.72} metalness={0.48} roughness={0.24} /></mesh></group>
    <group ref={spinnerB} position={[0, y(53) + 1.15, z(53)]}><mesh><boxGeometry args={[TOWER_ROAD_WIDTH * 0.86, 0.36, 0.48]} /><meshStandardMaterial color="#d85cff" emissive="#d85cff" emissiveIntensity={0.72} metalness={0.48} roughness={0.24} /></mesh></group>
    <group ref={beatGate} position={[0, y(99) + 1.2, z(99)]}><mesh><boxGeometry args={[TOWER_ROAD_WIDTH - 0.8, 0.66, 0.5]} /><meshStandardMaterial color="#9b62ff" emissive="#6d36ff" emissiveIntensity={1.15} /></mesh></group>
    <group ref={hammerA} position={[-3.2, y(143) + 5.1, z(143)]}><mesh position={[0, -2.5, 0]}><boxGeometry args={[0.36, 5.2, 0.64]} /><meshStandardMaterial color="#58617e" metalness={0.72} roughness={0.25} /></mesh><mesh position={[0, -5.2, 0]}><sphereGeometry args={[0.72, 18, 14]} /><meshStandardMaterial color="#ff5f91" emissive="#ff5f91" emissiveIntensity={0.78} /></mesh></group>
    <group ref={hammerB} position={[3.2, y(148) + 5.1, z(148)]}><mesh position={[0, -2.5, 0]}><boxGeometry args={[0.36, 5.2, 0.64]} /><meshStandardMaterial color="#58617e" metalness={0.72} roughness={0.25} /></mesh><mesh position={[0, -5.2, 0]}><sphereGeometry args={[0.72, 18, 14]} /><meshStandardMaterial color="#55eaff" emissive="#55eaff" emissiveIntensity={0.78} /></mesh></group>
  </group>;
}

function StaticDecor({ metrics }: { metrics: TowerCourseMetrics }) {
  const z = (base: number) => base * metrics.zScale;
  const y = (base: number) => towerTrackY(base) * metrics.yScale;
  const pegs = [[-3.6, 14.3], [-1.2, 14.9], [2.2, 15.2], [4, 16], [-4.3, 17], [-2.1, 17.7], [0.4, 17.2], [2.8, 18.3], [-3.1, 19.3], [-0.7, 20], [1.8, 19.6], [4.1, 20.6]] as const;
  return <group>
    {pegs.map(([x, baseZ], index) => <mesh key={`${x}-${baseZ}`} position={[x, y(baseZ) + 0.52, z(baseZ)]}><sphereGeometry args={[0.34, 16, 12]} /><meshStandardMaterial color={index % 2 ? "#ff65bd" : "#59efff"} emissive={index % 2 ? "#ff328f" : "#27dfff"} emissiveIntensity={0.9} /></mesh>)}
    <group position={[0, y(63.5) + 1.6, z(63.5)]} rotation={[Math.PI / 2, 0, 0]}><mesh><cylinderGeometry args={[6.25, 6.25, 13 * metrics.zScale, 28, 1, true]} /><meshPhysicalMaterial color="#72e8ff" transparent opacity={0.075} roughness={0.08} transmission={0.2} side={DoubleSide} /></mesh></group>
    {[82.5, 120, 128].map((baseZ, index) => <group key={baseZ} position={[0, y(baseZ) + 0.13, z(baseZ)]}><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[TOWER_ROAD_WIDTH * 0.84, (index ? 2.4 : 1.4) * metrics.zScale]} /><meshBasicMaterial color={index ? "#55f4ff" : "#ffd84d"} transparent opacity={0.82} /></mesh></group>)}
    {[18, 48, 78, 108, 138, 160].map((baseZ, index) => <group key={baseZ} position={[0, y(baseZ) + 1.7, z(baseZ)]}><mesh position={[-TOWER_ROAD_WIDTH / 2 - 1.2, 2.3, 0]}><boxGeometry args={[0.18, 4.6, 0.18]} /><meshBasicMaterial color={index % 2 ? "#d754ff" : "#51edff"} /></mesh><mesh position={[TOWER_ROAD_WIDTH / 2 + 1.2, 2.3, 0]}><boxGeometry args={[0.18, 4.6, 0.18]} /><meshBasicMaterial color={index % 2 ? "#51edff" : "#d754ff"} /></mesh><mesh position={[0, 4.5, 0]}><boxGeometry args={[TOWER_ROAD_WIDTH + 2.6, 0.12, 0.16]} /><meshBasicMaterial color="#6c79ff" /></mesh></group>)}
    <group position={[0, y(TOWER_BASE_FINISH_Z) + 2.1, metrics.finishZ]}><mesh position={[-6.6, 1.8, 0]}><boxGeometry args={[0.35, 4.2, 0.35]} /><meshStandardMaterial color="#f2f6ff" emissive="#4ceaff" emissiveIntensity={1} /></mesh><mesh position={[6.6, 1.8, 0]}><boxGeometry args={[0.35, 4.2, 0.35]} /><meshStandardMaterial color="#f2f6ff" emissive="#d34fff" emissiveIntensity={1} /></mesh><mesh position={[0, 3.8, 0]}><boxGeometry args={[13.5, 0.4, 0.5]} /><meshStandardMaterial color="#ffffff" emissive="#7b68ff" emissiveIntensity={1.2} /></mesh></group>
  </group>;
}

export function TowerTrack3D({ metrics, timeRef }: { metrics: TowerCourseMetrics; timeRef: MutableRefObject<number> }) {
  return <group>
    {TOWER_TRACK.map((piece) => <RoadPiece key={piece.name} piece={piece} metrics={metrics} />)}
    <StaticDecor metrics={metrics} />
    <MovingObstacles metrics={metrics} timeRef={timeRef} />
  </group>;
}
