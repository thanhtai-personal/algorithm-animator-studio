import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import {
  drawSubscribeButtonFace2D,
  subscribeReminderFrameAt,
  subscribeWallMount,
} from "../lib/subscribeReminder";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { shadowReceiverZForSettings } from "./rhythmicSceneMath3D";

const TEXTURE_WIDTH = 1_128;
const TEXTURE_HEIGHT = 240;
const FACE_WIDTH = 1_070;
const FACE_HEIGHT = FACE_WIDTH / 4.7;

interface RhythmicSubscribeReminder3DProps {
  timeRef: MutableRefObject<number>;
  platforms: MarblePlatform[];
  settings: StudioSettings;
}

function makeSubscribeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d")!;
  context.translate(canvas.width / 2, canvas.height / 2);
  drawSubscribeButtonFace2D(context, FACE_WIDTH, FACE_HEIGHT);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function HangingCord({ endX, topY, endY, z }: {
  endX: number;
  topY: number;
  endY: number;
  z: number;
}) {
  const length = Math.hypot(endX, topY - endY);
  const angle = Math.atan2(endX, topY - endY);
  return (
    <mesh position={[endX / 2, (topY + endY) / 2, z]} rotation={[0, 0, angle]} castShadow>
      <cylinderGeometry args={[0.018, 0.018, length, 10]} />
      <meshStandardMaterial color="#aeb8c0" roughness={0.31} metalness={0.72} />
    </mesh>
  );
}

export function RhythmicSubscribeReminder3D({
  timeRef,
  platforms,
  settings,
}: RhythmicSubscribeReminder3DProps) {
  const faceMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const texture = useMemo(makeSubscribeTexture, []);
  const mount = useMemo(() => {
    if (!platforms.length) return null;
    return subscribeWallMount(platforms.map((platform) => ({
      x: platform.visualX ?? platform.x,
      y: platform.visualY ?? platform.y,
      timeMs: platform.event.timeMs,
    })), RHYTHMIC_COURSE_WIDTH);
  }, [platforms]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const material = faceMaterialRef.current;
    if (!material) return;
    const frame = subscribeReminderFrameAt(timeRef.current, mount?.cueTimeMs);
    material.emissiveIntensity = 0.08 + (frame.visible ? frame.opacity : 0) * 0.62;
  });

  if (!mount) return null;
  const x = (mount.x - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE;
  const y = -mount.y * RHYTHMIC_WORLD_SCALE;
  const faceWidth = mount.width * RHYTHMIC_WORLD_SCALE;
  const faceHeight = mount.height * RHYTHMIC_WORLD_SCALE;
  const plateWidth = faceWidth + faceHeight * 0.28;
  const plateHeight = faceHeight * 1.26;
  const topY = plateHeight * 0.98;
  const cordEndY = plateHeight * 0.48;
  const receiverZ = shadowReceiverZForSettings(settings);

  return (
    <group position={[x, y, receiverZ]}>
      <HangingCord endX={-plateWidth * 0.34} topY={topY} endY={cordEndY} z={0.08} />
      <HangingCord endX={plateWidth * 0.34} topY={topY} endY={cordEndY} z={0.08} />
      <mesh position={[0, topY, 0.085]} castShadow>
        <sphereGeometry args={[faceHeight * 0.075, 16, 12]} />
        <meshStandardMaterial color="#dce3e8" roughness={0.28} metalness={0.76} />
      </mesh>
      <RoundedBox
        position={[0, 0, 0.12]}
        args={[plateWidth, plateHeight, 0.2]}
        radius={faceHeight * 0.24}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#242a31" roughness={0.46} metalness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0, 0.225]} castShadow>
        <planeGeometry args={[faceWidth, faceHeight]} />
        <meshStandardMaterial
          ref={faceMaterialRef}
          map={texture}
          emissive="#5c0718"
          emissiveMap={texture}
          emissiveIntensity={0.08}
          transparent
          alphaTest={0.02}
          roughness={0.32}
          metalness={0.08}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
