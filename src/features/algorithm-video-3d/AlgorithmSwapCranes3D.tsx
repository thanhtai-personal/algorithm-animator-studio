import { useMemo } from "react";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { arrayLayout, craneSwapPose3D, getBarMotion, type CraneSwapPose3D } from "./algorithm3dMath";

export function AlgorithmSwapCranes3D({ frame, previousFrame, theme, progress }: {
  frame: Frame;
  previousFrame?: Frame | null;
  theme: Theme;
  progress: number;
}) {
  const layout = arrayLayout(frame.arr);
  const parkingExtent = layout.span / 2 + 2.35;
  const moving = frame.event === "swap" && previousFrame
    ? getBarMotion(frame, previousFrame, theme).filter((bar) => bar.fromIndex !== bar.targetIndex)
    : [];

  if (moving.length !== 2) {
    return (
      <group>
        <ParkedCrane3D truckX={-parkingExtent} laneZ={3.35} yaw={0} accent={theme.highlight} />
        <ParkedCrane3D truckX={parkingExtent} laneZ={-3.35} yaw={Math.PI} accent={theme.swap} />
      </group>
    );
  }

  return (
    <group>
      {moving.map((bar) => {
        const fromX = layout.xFor(bar.fromIndex);
        const targetX = layout.xFor(bar.targetIndex);
        const direction = targetX > fromX ? 1 : -1;
        const parkingX = direction > 0 ? -parkingExtent : parkingExtent;
        const pose = craneSwapPose3D(fromX, targetX, progress, parkingX);
        return (
          <MobileCrane3D
            key={`crane-${direction > 0 ? "front" : "rear"}`}
            pose={pose}
            buildingHeight={layout.heightFor(bar.value)}
            buildingColor={bar.color}
            accent={direction > 0 ? theme.highlight : theme.swap}
          />
        );
      })}
    </group>
  );
}

function ParkedCrane3D({ truckX, laneZ, yaw, accent }: { truckX: number; laneZ: number; yaw: number; accent: string }) {
  return (
    <group position={[truckX, 0.08, laneZ]} rotation={[0, yaw, 0]}>
      <TruckChassis accent={accent} motionGlow={0.08} />
      <FoldedBoom accent={accent} />
    </group>
  );
}

function MobileCrane3D({ pose, buildingHeight, buildingColor, accent }: {
  pose: CraneSwapPose3D;
  buildingHeight: number;
  buildingColor: string;
  accent: string;
}) {
  const buildingX = pose.building.position[0];
  const buildingY = pose.building.position[1];
  const buildingZ = pose.building.position[2];
  const base = useMemo(() => new THREE.Vector3(pose.truckX, 1.12, pose.laneZ), [pose.truckX, pose.laneZ]);
  const foldedTip = useMemo(() => new THREE.Vector3(
    pose.truckX + (Math.cos(pose.truckYaw) >= 0 ? -1.15 : 1.15),
    1.72,
    pose.laneZ,
  ), [pose.truckX, pose.laneZ, pose.truckYaw]);
  const deployedTip = useMemo(() => new THREE.Vector3(
    buildingX,
    Math.max(4.7, buildingHeight + buildingY + 2.0),
    THREE.MathUtils.lerp(pose.laneZ, buildingZ, 0.84),
  ), [buildingX, buildingY, buildingZ, buildingHeight, pose.laneZ]);
  const boomTip = useMemo(() => foldedTip.clone().lerp(deployedTip, pose.rigDeploy), [foldedTip, deployedTip, pose.rigDeploy]);
  const hookTargetY = buildingHeight + buildingY + 0.16;
  const hookY = getHookY(pose, boomTip.y, hookTargetY);
  const showCable = pose.phase !== "approach" && pose.phase !== "align" && pose.phase !== "return";
  const hookTop = useMemo(() => new THREE.Vector3(buildingX, boomTip.y - 0.05, buildingZ), [buildingX, buildingZ, boomTip.y]);
  const hookBottom = useMemo(() => new THREE.Vector3(buildingX, hookY, buildingZ), [buildingX, buildingZ, hookY]);
  const moving = pose.phase === "approach" || pose.phase === "transport" || pose.phase === "return";
  const motionGlow = moving ? 0.50 : pose.phase === "lift" || pose.phase === "lower" ? 0.36 : 0.18;

  return (
    <group>
      <group position={[pose.truckX, 0.08, pose.laneZ]} rotation={[0, pose.truckYaw, 0]}>
        <TruckChassis accent={accent} motionGlow={motionGlow} />
      </group>
      <BeamBetween from={base} to={boomTip} thickness={0.15} color="#d1a84e" emissive={accent} emissiveIntensity={0.025} />
      {showCable ? (
        <>
          <BeamBetween from={hookTop} to={hookBottom} thickness={0.022} color="#252a2f" />
          <HookAndSpreader position={hookBottom} color={buildingColor} accent={accent} />
        </>
      ) : null}
      <mesh position={[pose.truckX, 0.032, pose.laneZ]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <circleGeometry args={[1.12, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.018 + motionGlow * 0.045} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function getHookY(pose: CraneSwapPose3D, boomY: number, targetY: number) {
  if (pose.phase === "hook") return THREE.MathUtils.lerp(boomY - 0.28, targetY, pose.phaseProgress);
  if (pose.phase === "release") return THREE.MathUtils.lerp(targetY, boomY - 0.32, pose.phaseProgress);
  return targetY;
}

function FoldedBoom({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[-0.45, 1.18, 0]} rotation={[0, 0, -0.43]}>
        <boxGeometry args={[1.55, 0.13, 0.13]} />
        <meshStandardMaterial color="#d1a84e" roughness={0.48} metalness={0.62} emissive={accent} emissiveIntensity={0.018} />
      </mesh>
    </group>
  );
}

function TruckChassis({ accent, motionGlow }: { accent: string; motionGlow: number }) {
  return (
    <group>
      <mesh position={[0, 0.48, 0]}><boxGeometry args={[2.35, 0.34, 1.12]} /><meshStandardMaterial color="#30353a" roughness={0.62} metalness={0.52} /></mesh>
      <mesh position={[0.73, 0.84, 0]}><boxGeometry args={[0.72, 0.68, 1.02]} /><meshStandardMaterial color="#c9aa55" roughness={0.46} metalness={0.44} /></mesh>
      <mesh position={[0.82, 0.89, 0.515]}><planeGeometry args={[0.42, 0.30]} /><meshStandardMaterial color="#577181" roughness={0.22} metalness={0.46} /></mesh>
      <mesh position={[-0.62, 0.92, 0]}><boxGeometry args={[0.88, 0.44, 0.92]} /><meshStandardMaterial color="#555e64" roughness={0.54} metalness={0.58} /></mesh>
      <mesh position={[-0.28, 1.13, 0]}><cylinderGeometry args={[0.25, 0.31, 0.24, 14]} /><meshStandardMaterial color="#737b80" roughness={0.46} metalness={0.64} /></mesh>
      {[-0.82, 0.84].flatMap((x) => [-0.57, 0.57].map((z) => (
        <group key={`${x}-${z}`} position={[x, 0.28, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.24, 0.24, 0.18, 12]} /><meshStandardMaterial color="#111418" roughness={0.9} metalness={0.1} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.195, 10]} /><meshStandardMaterial color="#8f969c" roughness={0.44} metalness={0.68} /></mesh>
        </group>
      )))}
      <mesh position={[0, 0.61, 0.58]} renderOrder={5}><boxGeometry args={[1.95, 0.045, 0.026]} /><meshBasicMaterial color={accent} transparent opacity={0.22 + motionGlow * 0.36} toneMapped={false} /></mesh>
    </group>
  );
}

function HookAndSpreader({ position, color, accent }: { position: THREE.Vector3; color: string; accent: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.95, 0.10, 0.36]} /><meshStandardMaterial color="#d9b45c" roughness={0.48} metalness={0.58} /></mesh>
      <mesh position={[0, -0.06, 0]}><torusGeometry args={[0.12, 0.035, 8, 16, Math.PI * 1.6]} /><meshStandardMaterial color="#2b3035" roughness={0.48} metalness={0.66} /></mesh>
      {[-0.38, 0.38].map((x) => <mesh key={x} position={[x, -0.20, 0]}><cylinderGeometry args={[0.015, 0.015, 0.42, 6]} /><meshBasicMaterial color={color} transparent opacity={0.58} toneMapped={false} /></mesh>)}
      <mesh position={[0, 0.13, 0.19]} renderOrder={6}><boxGeometry args={[0.60, 0.025, 0.015]} /><meshBasicMaterial color={accent} transparent opacity={0.54} toneMapped={false} /></mesh>
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
    const length = Math.max(0.001, direction.length());
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return { length, midpoint, quaternion };
  }, [from, to]);
  return (
    <mesh position={transform.midpoint} quaternion={transform.quaternion}>
      <boxGeometry args={[thickness, transform.length, thickness]} />
      <meshStandardMaterial color={color} roughness={0.52} metalness={0.64} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}
