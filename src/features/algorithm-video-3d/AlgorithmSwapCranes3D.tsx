import { useMemo } from "react";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { arrayLayout, craneSwapPose3D, getBarMotion } from "./algorithm3dMath";

export function AlgorithmSwapCranes3D({ frame, previousFrame, theme, progress }: {
  frame: Frame;
  previousFrame?: Frame | null;
  theme: Theme;
  progress: number;
}) {
  if (frame.event !== "swap" || !previousFrame) return null;
  const layout = arrayLayout(frame.arr);
  const moving = getBarMotion(frame, previousFrame, theme).filter((bar) => bar.fromIndex !== bar.targetIndex);
  if (moving.length !== 2) return null;

  return (
    <group>
      {moving.map((bar) => {
        const fromX = layout.xFor(bar.fromIndex);
        const targetX = layout.xFor(bar.targetIndex);
        const pose = craneSwapPose3D(fromX, targetX, progress);
        const buildingHeight = layout.heightFor(bar.value);
        return (
          <MobileCrane3D
            key={`crane-${bar.index}`}
            truckX={pose.truckX}
            laneZ={pose.laneZ}
            hookZ={pose.building.position[2]}
            hookY={buildingHeight + pose.building.position[1] + 0.14}
            phase={pose.phase}
            color={bar.color}
            accent={pose.laneZ > 0 ? theme.highlight : theme.swap}
          />
        );
      })}
    </group>
  );
}

type CranePhase = ReturnType<typeof craneSwapPose3D>["phase"];

function MobileCrane3D({ truckX, laneZ, hookZ, hookY, phase, color, accent }: {
  truckX: number;
  laneZ: number;
  hookZ: number;
  hookY: number;
  phase: CranePhase;
  color: string;
  accent: string;
}) {
  const near = laneZ > 0;
  const boomBase = useMemo(() => new THREE.Vector3(truckX + (near ? -0.18 : 0.18), 1.12, laneZ), [truckX, laneZ, near]);
  const boomTip = useMemo(() => new THREE.Vector3(truckX, Math.max(4.8, hookY + 2.0), THREE.MathUtils.lerp(laneZ, hookZ, 0.82)), [truckX, laneZ, hookZ, hookY]);
  const hookTop = useMemo(() => new THREE.Vector3(truckX, boomTip.y - 0.08, hookZ), [truckX, boomTip.y, hookZ]);
  const hookBottom = useMemo(() => new THREE.Vector3(truckX, Math.max(hookY + 0.12, 0.45), hookZ), [truckX, hookY, hookZ]);
  const motionGlow = phase === "transport" ? 0.88 : phase === "lift" || phase === "lower" ? 0.62 : 0.34;

  return (
    <group>
      <group position={[truckX, 0.08, laneZ]} rotation={[0, near ? 0 : Math.PI, 0]}>
        <TruckChassis accent={accent} motionGlow={motionGlow} />
      </group>
      <BeamBetween from={boomBase} to={boomTip} thickness={0.16} color="#d6a844" emissive={accent} emissiveIntensity={0.04} />
      <BeamBetween from={hookTop} to={hookBottom} thickness={0.026} color="#25303a" />
      <HookAndSpreader position={hookBottom} color={color} accent={accent} />
      <mesh position={[truckX, 0.035, laneZ]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <circleGeometry args={[1.25, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.035 + motionGlow * 0.035} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function TruckChassis({ accent, motionGlow }: { accent: string; motionGlow: number }) {
  return (
    <group>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[2.35, 0.34, 1.12]} />
        <meshStandardMaterial color="#2f3438" roughness={0.58} metalness={0.56} />
      </mesh>
      <mesh position={[0.73, 0.84, 0]}>
        <boxGeometry args={[0.72, 0.68, 1.02]} />
        <meshStandardMaterial color="#cfb15a" roughness={0.42} metalness={0.48} />
      </mesh>
      <mesh position={[0.82, 0.89, 0.515]}>
        <planeGeometry args={[0.42, 0.30]} />
        <meshStandardMaterial color="#537080" roughness={0.18} metalness={0.52} />
      </mesh>
      <mesh position={[-0.62, 0.92, 0]}>
        <boxGeometry args={[0.88, 0.44, 0.92]} />
        <meshStandardMaterial color="#565f65" roughness={0.50} metalness={0.60} />
      </mesh>
      <mesh position={[-0.28, 1.13, 0]}>
        <cylinderGeometry args={[0.25, 0.31, 0.24, 16]} />
        <meshStandardMaterial color="#737b80" roughness={0.42} metalness={0.68} />
      </mesh>
      {[-0.82, 0.84].flatMap((x) => [-0.57, 0.57].map((z) => (
        <group key={`${x}-${z}`} position={[x, 0.28, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.18, 14]} />
            <meshStandardMaterial color="#111418" roughness={0.88} metalness={0.12} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.195, 12]} />
            <meshStandardMaterial color="#8f969c" roughness={0.4} metalness={0.7} />
          </mesh>
        </group>
      )))}
      <mesh position={[0, 0.61, 0.58]} renderOrder={5}>
        <boxGeometry args={[1.95, 0.045, 0.026]} />
        <meshBasicMaterial color={accent} transparent opacity={0.36 + motionGlow * 0.42} toneMapped={false} />
      </mesh>
    </group>
  );
}

function HookAndSpreader({ position, color, accent }: { position: THREE.Vector3; color: string; accent: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.95, 0.10, 0.36]} />
        <meshStandardMaterial color="#e1b95b" roughness={0.42} metalness={0.62} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <torusGeometry args={[0.12, 0.035, 8, 18, Math.PI * 1.6]} />
        <meshStandardMaterial color="#2b3035" roughness={0.44} metalness={0.7} />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, -0.20, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.42, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.68} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.13, 0.19]} renderOrder={6}>
        <boxGeometry args={[0.60, 0.025, 0.015]} />
        <meshBasicMaterial color={accent} transparent opacity={0.72} toneMapped={false} />
      </mesh>
    </group>
  );
}

function BeamBetween({ from, to, thickness, color, emissive, emissiveIntensity = 0 }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  thickness: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const transform = useMemo(() => {
    const direction = to.clone().sub(from);
    const length = direction.length();
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return { length, midpoint, quaternion };
  }, [from, to]);
  return (
    <mesh position={transform.midpoint} quaternion={transform.quaternion}>
      <boxGeometry args={[thickness, transform.length, thickness]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.66} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}
