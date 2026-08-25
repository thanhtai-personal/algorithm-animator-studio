import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettings } from "../types";
import { environmentKind, ReflectionRig } from "./RhythmicEnvironment3D";
import {
  type RhythmicBackdropBounds,
  SHOWCASE_SHADOW_LIGHT_OFFSET,
  needsDedicatedShadowReceiver,
  shadowReceiverZForSettings,
  shadowRigPose,
} from "./rhythmicSceneMath3D";

type Point3D = { x: number; y: number; z: number };

interface TrackedKeyLightProps {
  focus: THREE.Vector3;
  offset: Point3D;
  intensity: number;
  color?: string;
  mapSize: number;
  bias?: number;
  normalBias?: number;
  radius?: number;
  shadowsEnabled: boolean;
}

function TrackedKeyLight({
  focus,
  offset,
  intensity,
  color = "#ffffff",
  mapSize,
  bias = -0.0003,
  normalBias = 0.03,
  radius = 2.6,
  shadowsEnabled,
}: TrackedKeyLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useFrame(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target) return;
    const pose = shadowRigPose(focus, offset);
    target.position.set(pose.target.x, pose.target.y, pose.target.z);
    light.position.set(pose.light.x, pose.light.y, pose.light.z);
    light.target = target;
    target.updateMatrixWorld();
    light.updateMatrixWorld();
  });

  return (
    <>
      <object3D ref={targetRef} position={[focus.x, focus.y, focus.z]} />
      <directionalLight
        ref={lightRef}
        position={[focus.x + offset.x, focus.y + offset.y, focus.z + offset.z]}
        intensity={intensity}
        color={color}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-left={-5.8}
        shadow-camera-right={5.8}
        shadow-camera-top={5.8}
        shadow-camera-bottom={-5.8}
        shadow-camera-near={0.5}
        shadow-camera-far={32}
        shadow-bias={bias}
        shadow-normalBias={normalBias}
        shadow-radius={radius}
      />
    </>
  );
}

function ShadowReceiver({ settings, opacity, bounds }: { settings: StudioSettings; opacity: number; bounds: RhythmicBackdropBounds }) {
  if (!settings.instrumentShadowsEnabled) return null;
  return (
    <mesh
      position={[0, bounds.centerY, shadowReceiverZForSettings(settings)]}
      receiveShadow
      renderOrder={-18}
    >
      <planeGeometry args={[18.4, bounds.height]} />
      <shadowMaterial transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export function RhythmicLightingRig3D({ settings, focus, bounds }: { settings: StudioSettings; focus: THREE.Vector3; bounds: RhythmicBackdropBounds }) {
  const kind = environmentKind(settings);
  const needsShadowReceiver = needsDedicatedShadowReceiver(kind);
  if (settings.instrumentFamily !== "auto") {
    return (
      <>
        <ReflectionRig settings={settings} />
        {needsShadowReceiver && <ShadowReceiver settings={settings} opacity={0.3} bounds={bounds} />}
        <hemisphereLight args={["#fff9ef", "#6d655e", 0.9]} />
        <TrackedKeyLight focus={focus} offset={SHOWCASE_SHADOW_LIGHT_OFFSET} intensity={2.6} mapSize={1536} bias={-0.00035} normalBias={0.025} radius={3.2} shadowsEnabled={settings.instrumentShadowsEnabled} />
        <directionalLight position={[5, -2, 5]} intensity={0.5} color="#dce7f5" />
      </>
    );
  }
  if (kind === "xylophone") {
    return (
      <>
        <ReflectionRig settings={settings} />
        {needsShadowReceiver && <ShadowReceiver settings={settings} opacity={0.22} bounds={bounds} />}
        <hemisphereLight args={["#fff0d7", "#403529", 0.92]} />
        <TrackedKeyLight focus={focus} offset={{ x: -4.8, y: 6.2, z: 9.5 }} intensity={2.5} mapSize={1024} normalBias={0.035} shadowsEnabled={settings.instrumentShadowsEnabled} />
        <pointLight position={[5, -4, 5]} color="#ffc17f" intensity={12} distance={22} decay={2} />
        <pointLight position={[-5, -8, 3]} color="#7db7ff" intensity={4} distance={18} decay={2} />
      </>
    );
  }
  if (kind === "comet") {
    return (
      <>
        <ReflectionRig settings={settings} />
        {needsShadowReceiver && <ShadowReceiver settings={settings} opacity={0.2} bounds={bounds} />}
        <ambientLight intensity={0.12} />
        <TrackedKeyLight focus={focus} offset={{ x: 4.8, y: 6.2, z: 9 }} intensity={1.45} mapSize={1024} shadowsEnabled={settings.instrumentShadowsEnabled} />
        <pointLight position={[-4.5, 1, 4]} color="#5776ff" intensity={18} distance={25} decay={2} />
        <pointLight position={[4.5, -6, 3]} color="#df54e5" intensity={14} distance={22} decay={2} />
      </>
    );
  }
  if (kind === "tube-board") {
    return (
      <>
        <ReflectionRig settings={settings} />
        {needsShadowReceiver && <ShadowReceiver settings={settings} opacity={0.28} bounds={bounds} />}
        <hemisphereLight args={["#dcecff", "#14171c", 0.72]} />
        <TrackedKeyLight focus={focus} offset={{ x: -4.8, y: 6.4, z: 9.5 }} intensity={2.55} mapSize={1024} bias={-0.00035} normalBias={0.04} shadowsEnabled={settings.instrumentShadowsEnabled} />
        <pointLight position={[5, -5, 5]} color="#ffc28c" intensity={9} distance={19} decay={2} />
        <pointLight position={[-5, -10, 3]} color="#5aa7ff" intensity={5} distance={18} decay={2} />
      </>
    );
  }
  return (
    <>
      <ReflectionRig settings={settings} />
      {needsShadowReceiver && <ShadowReceiver settings={settings} opacity={0.24} bounds={bounds} />}
      <ambientLight intensity={0.28} />
      <TrackedKeyLight focus={focus} offset={{ x: 4.8, y: 6.2, z: 9.5 }} intensity={2.2} mapSize={1024} shadowsEnabled={settings.instrumentShadowsEnabled} />
      <pointLight position={[-4, 1, 6]} intensity={10} distance={22} decay={2} color="#7dd3fc" />
    </>
  );
}
