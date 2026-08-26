import { Trail, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { RhythmicMarble3D } from "@/features/rhythmic-studio/components/RhythmicMarble3D";
import { marbleAvatarEntry } from "@/features/rhythmic-studio/lib/marbleAvatars";
import type { StudioSettings } from "@/features/rhythmic-studio/types";
import { TOWER_BALL_RADIUS, towerRacerPose } from "./towerMotion";

const RACER_COLORS = ["#58efff", "#ff5ab4", "#8d73ff", "#ffd34e", "#69f59a", "#ff785e", "#4d8cff", "#f4f7ff"];

function AvatarSprite({ settings }: { settings: StudioSettings }) {
  const entry = marbleAvatarEntry(settings.marbleAvatar);
  if (!entry) return null;
  return <AvatarSpriteTexture src={entry.src} />;
}

function AvatarSpriteTexture({ src }: { src: string }) {
  const source = useTexture(src);
  const texture = useMemo(() => {
    const next = source.clone();
    const image = source.image as HTMLImageElement | undefined;
    const width = image?.naturalWidth || image?.width || 1440;
    const height = image?.naturalHeight || image?.height || 1024;
    next.wrapS = THREE.ClampToEdgeWrapping;
    next.wrapT = THREE.ClampToEdgeWrapping;
    next.repeat.set(340 / width, 485 / height);
    next.offset.set(70 / width, 1 - (45 + 485) / height);
    next.colorSpace = THREE.SRGBColorSpace;
    next.needsUpdate = true;
    return next;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={[0, 1.72, 0]} scale={[1.15, 1.62, 1]} renderOrder={12}>
    <spriteMaterial map={texture} transparent alphaTest={0.08} depthWrite={false} />
  </sprite>;
}

function Racer({
  index,
  settings,
  timeRef,
  durationMs,
  drive,
}: {
  index: number;
  settings: StudioSettings;
  timeRef: MutableRefObject<number>;
  durationMs: number;
  drive: number;
}) {
  const root = useRef<THREE.Group>(null);
  const rolling = useRef<THREE.Group>(null);
  const isPlayer = index === 0;
  const appearance = useMemo<StudioSettings>(() => {
    if (isPlayer) return settings;
    const base = RACER_COLORS[index % RACER_COLORS.length];
    const stripe = RACER_COLORS[(index + 3) % RACER_COLORS.length];
    return { ...settings, marbleAvatar: "ball", ballBaseColor: base, ballStripeColor: stripe };
  }, [index, isPlayer, settings]);

  useFrame(() => {
    const pose = towerRacerPose(timeRef.current, durationMs, index, drive);
    if (root.current) root.current.position.set(pose.x, pose.y, pose.z);
    if (rolling.current) rolling.current.rotation.x = pose.roll;
  });

  const color = isPlayer ? settings.ballBaseColor : RACER_COLORS[index % RACER_COLORS.length];
  const marbleScale = TOWER_BALL_RADIUS * Math.max(0.7, Math.min(1.5, settings.ballSize / 15));
  const trailLength = Math.max(0.25, settings.trailLength * (isPlayer ? 0.38 : 0.2));
  return <Trail width={isPlayer ? 0.72 : 0.34} length={trailLength} color={color} attenuation={(t) => t * t}>
    <group ref={root}>
      <group ref={rolling} scale={marbleScale}>
        <RhythmicMarble3D settings={appearance} />
      </group>
      {isPlayer ? <>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.88, 0]}>
          <torusGeometry args={[0.62, 0.045, 8, 32]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.16, 0.36, 3]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <AvatarSprite settings={settings} />
      </> : null}
    </group>
  </Trail>;
}

export function TowerMarbles3D({
  settings,
  timeRef,
  durationMs,
  drive,
}: {
  settings: StudioSettings;
  timeRef: MutableRefObject<number>;
  durationMs: number;
  drive: number;
}) {
  return <group>{Array.from({ length: 8 }, (_, index) => <Racer key={index} index={index} settings={settings} timeRef={timeRef} durationMs={durationMs} drive={drive} />)}</group>;
}
