import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmGlowSprite3D } from "./AlgorithmGlowSprite3D";
import { AlgorithmTextSprite3D } from "./AlgorithmTextSprite3D";
import { arrayLayout, getBarMotion, swapPose3D, type BarPose3D } from "./algorithm3dMath";

export function AlgorithmBars3D({ frame, previousFrame, theme, deterministicProgress = 1 }: {
  frame: Frame;
  previousFrame?: Frame | null;
  theme: Theme;
  deterministicProgress?: number;
}) {
  const layout = arrayLayout(frame.arr);
  const bars = getBarMotion(frame, previousFrame, theme);
  const moving = bars.filter((bar) => bar.fromIndex !== bar.targetIndex);
  return (
    <group position={[0, 0, 0.42]}>
      <BarFloorMarkers count={layout.count} layout={layout} theme={theme} />
      <InstancedBuildingField bars={bars} layout={layout} />
      {moving.map((bar) => (
        <MovingBuilding3D key={`moving-${bar.index}`} bar={bar} layout={layout} progress={deterministicProgress} />
      ))}
      {bars.filter((bar) => bar.emphasized).map((bar) => (
        <ActiveBuildingMarker key={`active-${bar.index}`} bar={bar} layout={layout} progress={deterministicProgress} />
      ))}
      <BarLabels bars={bars} layout={layout} progress={deterministicProgress} swapping={moving.length > 0} />
    </group>
  );
}

type Layout = ReturnType<typeof arrayLayout>;
type Motion = ReturnType<typeof getBarMotion>[number];

function InstancedBuildingField({ bars, layout }: { bars: Motion[]; layout: Layout }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const faceRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const baseRef = useRef<THREE.InstancedMesh>(null);
  const depth = Math.max(0.42, layout.width * 0.94);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const face = faceRef.current;
    const roof = roofRef.current;
    const base = baseRef.current;
    if (!body || !face || !roof || !base) return;
    const color = new THREE.Color();
    bars.forEach((bar, index) => {
      const height = layout.heightFor(bar.value);
      const x = layout.xFor(bar.targetIndex);
      const moving = bar.fromIndex !== bar.targetIndex;
      setStaticInstance(body, index, [x, height / 2, 0], moving ? [0, 0, 0] : [layout.width, height, depth]);
      setStaticInstance(face, index, [x, height / 2, depth / 2 + 0.011], moving ? [0, 0, 0] : [layout.width * 0.58, Math.max(0.16, height * 0.82), 0.022]);
      setStaticInstance(roof, index, [x, height + 0.035, 0], moving ? [0, 0, 0] : [layout.width * 0.90, 0.07, depth * 0.86]);
      setStaticInstance(base, index, [x, 0.055, 0], [layout.width * 1.10, 0.11, depth * 1.12]);
      body.setColorAt(index, color.set(darken(bar.color, bar.emphasized ? 0.18 : 0.40)));
      face.setColorAt(index, color.set(bar.color));
      roof.setColorAt(index, color.set(lighten(bar.color, 0.15)));
      base.setColorAt(index, color.set(bar.emphasized ? darken(bar.color, 0.56) : "#23292e"));
    });
    [body, face, roof, base].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [bars, layout, depth]);

  return (
    <>
      <instancedMesh ref={baseRef} args={[undefined, undefined, bars.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.70} metalness={0.30} />
      </instancedMesh>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, bars.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.38} metalness={0.48} />
      </instancedMesh>
      <instancedMesh ref={faceRef} args={[undefined, undefined, bars.length]} frustumCulled={false} renderOrder={3}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.54} toneMapped={false} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, bars.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.32} metalness={0.54} />
      </instancedMesh>
    </>
  );
}

function MovingBuilding3D({ bar, layout, progress }: { bar: Motion; layout: Layout; progress: number }) {
  const pose = poseForBar(bar, layout, progress);
  const height = layout.heightFor(bar.value);
  const depth = Math.max(0.42, layout.width * 0.94);
  return (
    <group position={pose.position} rotation={pose.rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[layout.width, height, depth]} />
        <meshStandardMaterial color={darken(bar.color, 0.16)} roughness={0.34} metalness={0.50} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2 + 0.012]} renderOrder={5}>
        <boxGeometry args={[layout.width * 0.60, Math.max(0.16, height * 0.84), 0.024]} />
        <meshBasicMaterial color={bar.color} transparent opacity={0.76} toneMapped={false} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <boxGeometry args={[layout.width * 0.92, 0.08, depth * 0.88]} />
        <meshStandardMaterial color={lighten(bar.color, 0.18)} roughness={0.30} metalness={0.56} />
      </mesh>
      <AlgorithmGlowSprite3D
        position={[0, height * 0.52, -0.05]}
        scale={[Math.max(0.80, layout.width * 1.8), Math.max(1.1, height * 0.54), 1]}
        color={bar.color}
        opacity={0.08}
      />
    </group>
  );
}

function ActiveBuildingMarker({ bar, layout, progress }: { bar: Motion; layout: Layout; progress: number }) {
  const pose = poseForBar(bar, layout, progress);
  const moving = bar.fromIndex !== bar.targetIndex;
  const pulse = moving ? Math.sin(Math.PI * progress) : 0.35;
  return (
    <group position={pose.position} rotation={pose.rotation}>
      <mesh position={[0, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
        <torusGeometry args={[Math.max(0.16, layout.width * 0.56), 0.016, 6, 24]} />
        <meshBasicMaterial color={bar.color} transparent opacity={0.42 + pulse * 0.32} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BarLabels({ bars, layout, progress, swapping }: { bars: Motion[]; layout: Layout; progress: number; swapping: boolean }) {
  const stride = Math.max(1, Math.ceil(bars.length / 12));
  return (
    <>
      {bars.map((bar) => {
        if (swapping && !bar.emphasized) return null;
        if (!bar.emphasized && bars.length > 18 && bar.index % stride !== 0) return null;
        const pose = poseForBar(bar, layout, progress);
        const height = layout.heightFor(bar.value);
        return (
          <AlgorithmTextSprite3D
            key={`label-${bar.index}`}
            text={String(bar.value)}
            position={[pose.position[0], pose.position[1] + height + 0.42, pose.position[2] + 0.02]}
            color={bar.emphasized ? bar.color : "#e4e8ea"}
            scale={bar.emphasized ? 0.54 : 0.40}
            subtle={!bar.emphasized}
          />
        );
      })}
    </>
  );
}

function BarFloorMarkers({ count, layout, theme }: { count: number; layout: Layout; theme: Theme }) {
  if (count > 28) return null;
  return (
    <group position={[0, 0.064, 0]}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[layout.xFor(index), 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(0.025, layout.width * 0.10), 1.4]} />
          <meshBasicMaterial color={theme.highlight} transparent opacity={0.028} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function poseForBar(bar: Motion, layout: Layout, progress: number): BarPose3D {
  if (bar.fromIndex === bar.targetIndex) return { position: [layout.xFor(bar.targetIndex), 0, 0], rotation: [0, 0, 0] };
  return swapPose3D(layout.xFor(bar.fromIndex), layout.xFor(bar.targetIndex), progress);
}

function setStaticInstance(mesh: THREE.InstancedMesh, index: number, position: [number, number, number], scale: [number, number, number]) {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion(),
    new THREE.Vector3(...scale),
  );
  mesh.setMatrixAt(index, matrix);
}

function darken(color: string, amount: number) {
  return `#${new THREE.Color(color).lerp(new THREE.Color("#12171b"), amount).getHexString()}`;
}

function lighten(color: string, amount: number) {
  return `#${new THREE.Color(color).lerp(new THREE.Color("#f7fbff"), amount).getHexString()}`;
}
