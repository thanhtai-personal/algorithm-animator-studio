import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
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
    <group>
      {bars.map((bar) => (
        <AnimatedBar3D
          key={`${frame.line}-${frame.event ?? "step"}-${bar.index}-${bar.value}`}
          bar={bar}
          layout={layout}
          showLabel={frame.arr.length <= 28}
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

  useFrame((_, delta) => {
    if (!ref.current || deterministicProgress != null) return;
    progress.current = Math.min(1, progress.current + delta * (moving ? 4.4 : 7));
    applyPose(ref.current, fromX, targetX, progress.current, moving);
  });

  const initialProgress = deterministicProgress ?? (moving ? 0 : 1);
  return (
    <group
      ref={ref}
      position={poseFor(fromX, targetX, initialProgress, moving)}
      rotation={[0, 0, moving ? (1 - initialProgress) * 0.05 : 0]}
    >
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[layout.width, height, Math.max(0.42, layout.width * 0.86)]} />
        <meshPhysicalMaterial
          color={bar.color}
          roughness={0.2}
          metalness={0.32}
          clearcoat={0.92}
          clearcoatRoughness={0.14}
          emissive={bar.emissive}
          emissiveIntensity={bar.emphasized ? 0.42 : 0.045}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[layout.width * 0.58, layout.width * 0.72, 0.1, 18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.58} roughness={0.24} />
      </mesh>
      {showLabel ? <AlgorithmTextSprite3D text={String(bar.value)} position={[0, height + 0.56, 0.1]} color={bar.color} scale={0.62} /> : null}
    </group>
  );
}

function poseFor(fromX: number, targetX: number, progress: number, moving: boolean): [number, number, number] {
  const eased = progress * progress * (3 - 2 * progress);
  const x = THREE.MathUtils.lerp(fromX, targetX, eased);
  const lift = moving ? Math.sin(Math.PI * eased) * 1.2 : 0;
  const z = moving ? Math.sin(Math.PI * eased) * (targetX >= fromX ? 0.72 : -0.72) : 0;
  return [x, lift, z];
}

function applyPose(group: THREE.Group, fromX: number, targetX: number, progress: number, moving: boolean) {
  const [x, y, z] = poseFor(fromX, targetX, progress, moving);
  group.position.set(x, y, z);
  group.rotation.z = moving ? (1 - progress) * 0.05 : 0;
}
