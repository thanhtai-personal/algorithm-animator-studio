import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmGlowSprite3D } from "./AlgorithmGlowSprite3D";
import { AlgorithmTextSprite3D } from "./AlgorithmTextSprite3D";
import { arrayLayout, getBarMotion } from "./algorithm3dMath";

export function AlgorithmBars3D({ frame, previousFrame, theme, deterministicProgress }: {
  frame: Frame;
  previousFrame?: Frame | null;
  theme: Theme;
  deterministicProgress?: number;
}) {
  const layout = arrayLayout(frame.arr);
  const bars = getBarMotion(frame, previousFrame, theme);
  return (
    <group position={[0, 0, 0.55]}>
      <BarRunway3D layout={layout} theme={theme} />
      {bars.map((bar) => (
        <AnimatedBar3D
          key={`${frame.line}-${frame.event ?? "step"}-${bar.index}-${bar.value}`}
          bar={bar}
          layout={layout}
          showLabel={frame.arr.length <= 32}
          deterministicProgress={deterministicProgress}
        />
      ))}
    </group>
  );
}

type Layout = ReturnType<typeof arrayLayout>;
type Motion = ReturnType<typeof getBarMotion>[number];

function AnimatedBar3D({ bar, layout, showLabel, deterministicProgress }: {
  bar: Motion;
  layout: Layout;
  showLabel: boolean;
  deterministicProgress?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(deterministicProgress ?? 0);
  const height = layout.heightFor(bar.value);
  const targetX = layout.xFor(bar.targetIndex);
  const fromX = layout.xFor(bar.fromIndex);
  const moving = bar.fromIndex !== bar.targetIndex;
  const depth = Math.max(0.48, layout.width * 1.04);
  const radius = Math.min(0.14, layout.width * 0.22, height * 0.08);

  useFrame(({ clock }, delta) => {
    const group = ref.current;
    if (!group) return;
    if (deterministicProgress != null) {
      applyPose(group, fromX, targetX, deterministicProgress, moving);
      return;
    }
    progress.current = Math.min(1, progress.current + delta * (moving ? 3.45 : 6.5));
    applyPose(group, fromX, targetX, progress.current, moving);
    if (!moving && bar.emphasized) group.position.y += Math.sin(clock.elapsedTime * 4.2 + bar.index * 0.7) * 0.035;
  });

  const initialProgress = deterministicProgress ?? (moving ? 0 : 1);
  const faceOpacity = bar.emphasized ? 0.96 : 0.72;
  return (
    <group ref={ref} position={poseFor(fromX, targetX, initialProgress, moving).position} rotation={poseFor(fromX, targetX, initialProgress, moving).rotation}>
      {bar.emphasized ? (
        <AlgorithmGlowSprite3D
          position={[0, height * 0.56, -0.06]}
          scale={[Math.max(1.15, layout.width * 2.2), Math.max(1.8, height * 0.78), 1]}
          color={bar.color}
          opacity={0.14}
          renderOrder={1}
        />
      ) : null}

      <RoundedBox position={[0, height / 2, 0]} args={[layout.width, height, depth]} radius={radius} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={darken(bar.color, bar.emphasized ? 0.26 : 0.42)}
          roughness={bar.emphasized ? 0.16 : 0.23}
          metalness={0.68}
          clearcoat={0.92}
          clearcoatRoughness={0.13}
          emissive={bar.color}
          emissiveIntensity={bar.emphasized ? 0.12 : 0.018}
        />
      </RoundedBox>

      <RoundedBox
        position={[0, height / 2, depth / 2 + 0.021]}
        args={[layout.width * 0.66, Math.max(0.18, height * 0.88), 0.034]}
        radius={Math.min(0.075, layout.width * 0.14)}
        smoothness={4}
        renderOrder={5}
      >
        <meshBasicMaterial color={bar.color} transparent opacity={faceOpacity} toneMapped={false} />
      </RoundedBox>

      <RoundedBox position={[0, height + 0.045, 0]} args={[layout.width * 0.88, 0.09, depth * 0.86]} radius={Math.min(0.055, layout.width * 0.12)} smoothness={4} castShadow>
        <meshPhysicalMaterial color={lighten(bar.color, 0.22)} roughness={0.14} metalness={0.52} clearcoat={1} emissive={bar.color} emissiveIntensity={bar.emphasized ? 0.18 : 0.045} />
      </RoundedBox>

      <BarPedestal3D width={layout.width} depth={depth} color={bar.color} emphasized={bar.emphasized} />
      {showLabel ? <AlgorithmTextSprite3D text={String(bar.value)} position={[0, height + 0.62, 0.08]} color={bar.color} scale={0.58} /> : null}
    </group>
  );
}

function BarPedestal3D({ width, depth, color, emphasized }: { width: number; depth: number; color: string; emphasized: boolean }) {
  return (
    <group>
      <RoundedBox position={[0, 0.09, 0]} args={[width * 1.26, 0.18, depth * 1.26]} radius={Math.min(0.1, width * 0.16)} smoothness={4} receiveShadow castShadow>
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.195, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
        <torusGeometry args={[Math.max(0.18, width * 0.5), 0.018, 8, 36]} />
        <meshBasicMaterial color={color} transparent opacity={emphasized ? 0.94 : 0.22} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BarRunway3D({ layout, theme }: { layout: Layout; theme: Theme }) {
  if (layout.count > 40) return null;
  return (
    <group position={[0, 0.082, 0]}>
      {Array.from({ length: layout.count }, (_, index) => (
        <group key={index} position={[layout.xFor(index), 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[Math.max(0.04, layout.width * 0.18), 3.4]} />
            <meshBasicMaterial color={index % 2 ? theme.highlight : theme.sorted} transparent opacity={0.045} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, 1.63]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[Math.max(0.028, layout.width * 0.12), 18]} />
            <meshBasicMaterial color={theme.highlight} transparent opacity={0.18} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function poseFor(fromX: number, targetX: number, progress: number, moving: boolean) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  if (!moving) return { position: [targetX, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] };
  const eased = smootherStep(t);
  const direction = targetX >= fromX ? 1 : -1;
  const travel = Math.abs(targetX - fromX);
  const anticipation = t < 0.12 ? Math.sin((t / 0.12) * Math.PI) * -direction * Math.min(0.12, travel * 0.035) : 0;
  const x = THREE.MathUtils.lerp(fromX, targetX, eased) + anticipation;
  const arc = Math.sin(Math.PI * eased);
  const y = arc * (1.15 + Math.min(0.9, travel * 0.075));
  const z = arc * direction * (0.92 + Math.min(0.5, travel * 0.045));
  const yaw = -direction * arc * 0.12;
  const roll = direction * Math.sin(Math.PI * 2 * eased) * 0.025;
  return {
    position: [x, y, z] as [number, number, number],
    rotation: [0, yaw, roll] as [number, number, number],
  };
}

function applyPose(group: THREE.Group, fromX: number, targetX: number, progress: number, moving: boolean) {
  const pose = poseFor(fromX, targetX, progress, moving);
  group.position.set(...pose.position);
  group.rotation.set(...pose.rotation);
}

function smootherStep(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function darken(color: string, amount: number) {
  return `#${new THREE.Color(color).lerp(new THREE.Color("#060b14"), amount).getHexString()}`;
}

function lighten(color: string, amount: number) {
  return `#${new THREE.Color(color).lerp(new THREE.Color("#ffffff"), amount).getHexString()}`;
}
