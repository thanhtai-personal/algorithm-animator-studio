import * as THREE from "three";
import type { StudioSettings } from "../types";
import type { TerminalMarbleGoal } from "../lib/terminalMarbleGoal";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { shadowReceiverZForSettings } from "./rhythmicSceneMath3D";

function worldPoint(x: number, y: number): [number, number, number] {
  return [
    (x - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
    -y * RHYTHMIC_WORLD_SCALE,
    -0.16,
  ];
}

function FunnelBeam({ from, to, color }: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, from[2]]}
      rotation={[0, 0, Math.atan2(dy, dx)]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, 0.075, 0.24]} />
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.78} />
    </mesh>
  );
}

export function RhythmicTerminalGoal3D({ goal, settings }: {
  goal: TerminalMarbleGoal;
  settings: StudioSettings;
}) {
  const halfMouth = goal.mouthWidth * RHYTHMIC_WORLD_SCALE / 2;
  const halfBottom = Math.max(0.18, halfMouth * 0.38);
  const mouth = worldPoint(goal.centerX, goal.mouthY);
  const bottom = worldPoint(goal.centerX, goal.bottomY);
  const leftMouth: [number, number, number] = [mouth[0] - halfMouth, mouth[1], mouth[2]];
  const rightMouth: [number, number, number] = [mouth[0] + halfMouth, mouth[1], mouth[2]];
  const leftBottom: [number, number, number] = [bottom[0] - halfBottom, bottom[1], bottom[2]];
  const rightBottom: [number, number, number] = [bottom[0] + halfBottom, bottom[1], bottom[2]];
  const receiverZ = shadowReceiverZForSettings(settings);
  const mountDepth = Math.max(0.4, Math.abs(receiverZ - mouth[2]));
  const metalColor = new THREE.Color(settings.prismEnd).lerp(new THREE.Color("#aeb8c4"), 0.62).getStyle();

  return (
    <group name="terminal-goal">
      <group name="terminal-goal-funnel">
        <FunnelBeam from={leftMouth} to={leftBottom} color={metalColor} />
        <FunnelBeam from={rightMouth} to={rightBottom} color={metalColor} />
        <mesh position={mouth} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[halfMouth, 0.045, 12, 48]} />
          <meshStandardMaterial color="#dce4ec" roughness={0.2} metalness={0.82} />
        </mesh>
      </group>
      <mesh name="terminal-goal-cradle" position={bottom} rotation={[0, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[halfBottom, 0.055, 12, 36, Math.PI]} />
        <meshStandardMaterial color={settings.prismEnd} emissive={settings.prismEnd} emissiveIntensity={0.28} roughness={0.24} metalness={0.7} />
      </mesh>
      <group name="terminal-goal-wall-mount" position={[bottom[0], (mouth[1] + bottom[1]) / 2, mouth[2] - mountDepth / 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, mountDepth, 12]} />
          <meshStandardMaterial color="#535d69" roughness={0.34} metalness={0.72} />
        </mesh>
        <mesh position={[0, 0, -mountDepth / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.08, 20]} />
          <meshStandardMaterial color="#303740" roughness={0.45} metalness={0.58} />
        </mesh>
      </group>
    </group>
  );
}
