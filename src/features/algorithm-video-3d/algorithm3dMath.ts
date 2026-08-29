import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";

export type BarMotion = {
  index: number;
  value: number;
  fromIndex: number;
  targetIndex: number;
  color: string;
  emissive: string;
  emphasized: boolean;
};

export type BarPose3D = {
  position: [number, number, number];
  rotation: [number, number, number];
};

export type CraneSwapPose3D = {
  building: BarPose3D;
  truckX: number;
  laneZ: number;
  boomReachZ: number;
  hookHeight: number;
  cableSlack: number;
  rigDeploy: number;
  phaseProgress: number;
  truckYaw: number;
  phase: "approach" | "align" | "hook" | "lift" | "transport" | "lower" | "release" | "return";
};

export function getBarMotion(frame: Frame, previousFrame: Frame | null | undefined, theme: Theme): BarMotion[] {
  const swapPair = getSwapPair(frame, previousFrame);
  return frame.arr.map((value, index) => {
    let fromIndex = index;
    if (swapPair) {
      if (index === swapPair[0]) fromIndex = swapPair[1];
      else if (index === swapPair[1]) fromIndex = swapPair[0];
    }
    const state = barState(frame, index, theme);
    return { index, value, fromIndex, targetIndex: index, ...state };
  });
}

export function barState(frame: Frame, index: number, theme: Theme) {
  if (frame.pivot === index) return { color: theme.pivot, emissive: theme.pivot, emphasized: true };
  if (frame.swap.includes(index)) return { color: theme.swap, emissive: theme.swap, emphasized: true };
  if (frame.highlight.includes(index)) return { color: theme.highlight, emissive: theme.highlight, emphasized: true };
  if (frame.sorted.includes(index)) return { color: theme.sorted, emissive: theme.sorted, emphasized: false };
  return { color: theme.bar, emissive: theme.bar, emphasized: false };
}

export function arrayLayout(values: number[]) {
  const count = Math.max(1, values.length);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = Math.max(1, max - min);
  const span = Math.min(20, Math.max(8, count * 0.82));
  const step = span / count;
  const width = Math.max(0.22, step * 0.68);
  const maxHeight = 8.2;
  const heightFor = (value: number) => Math.max(0.28, ((value - min) / range) * (maxHeight - 0.4) + 0.4);
  const xFor = (index: number) => -span / 2 + step * (index + 0.5);
  return { count, min, max, range, span, step, width, maxHeight, heightFor, xFor };
}

export function getSwapPair(frame: Frame, previousFrame: Frame | null | undefined): [number, number] | null {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return null;
  const [a, b] = frame.swap;
  if (a < 0 || b < 0 || a >= frame.arr.length || b >= frame.arr.length) return null;
  if (previousFrame.arr.length !== frame.arr.length) return null;
  if (previousFrame.arr[a] !== frame.arr[b] || previousFrame.arr[b] !== frame.arr[a]) return null;
  return [a, b];
}

/**
 * Physical swap choreography used by both the suspended buildings and the mobile cranes.
 * One building always travels on the near lane, the other on the far lane, so they never
 * visually intersect. The building does not start translating until the hook has lifted it.
 */
export function craneSwapPose3D(fromX: number, targetX: number, progress: number, parkingX?: number): CraneSwapPose3D {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  if (Math.abs(targetX - fromX) < 0.0001) {
    return {
      building: { position: [targetX, 0, 0], rotation: [0, 0, 0] },
      truckX: parkingX ?? targetX,
      laneZ: 0,
      boomReachZ: 0,
      hookHeight: 0,
      cableSlack: 0,
      rigDeploy: 0,
      phaseProgress: 1,
      truckYaw: 0,
      phase: "return",
    };
  }

  const direction = targetX > fromX ? 1 : -1;
  const laneZ = direction > 0 ? 3.35 : -3.35;
  const transportZ = direction > 0 ? 0.82 : -0.82;
  const parkX = parkingX ?? fromX - direction * 2.8;
  const travel = Math.abs(targetX - fromX);
  const liftHeight = 1.22 + Math.min(0.56, travel * 0.04);
  const travelYaw = direction > 0 ? 0 : Math.PI;
  const returnYaw = direction > 0 ? Math.PI : 0;

  let x = fromX;
  let y = 0;
  let z = 0;
  let truckX = parkX;
  let phase: CraneSwapPose3D["phase"] = "approach";
  let phaseProgress = 0;
  let rigDeploy = 0;
  let truckYaw = travelYaw;

  if (t < 0.18) {
    phase = "approach";
    phaseProgress = smootherStep(t / 0.18);
    truckX = THREE.MathUtils.lerp(parkX, fromX, phaseProgress);
  } else if (t < 0.24) {
    phase = "align";
    phaseProgress = smooth01((t - 0.18) / 0.06);
    truckX = fromX;
    rigDeploy = phaseProgress;
  } else if (t < 0.31) {
    phase = "hook";
    phaseProgress = smooth01((t - 0.24) / 0.07);
    truckX = fromX;
    rigDeploy = 1;
  } else if (t < 0.43) {
    phase = "lift";
    phaseProgress = smooth01((t - 0.31) / 0.12);
    truckX = fromX;
    rigDeploy = 1;
    y = THREE.MathUtils.lerp(0, liftHeight, phaseProgress);
    z = THREE.MathUtils.lerp(0, transportZ, phaseProgress * 0.92);
  } else if (t < 0.68) {
    phase = "transport";
    phaseProgress = smootherStep((t - 0.43) / 0.25);
    x = THREE.MathUtils.lerp(fromX, targetX, phaseProgress);
    truckX = x;
    rigDeploy = 1;
    y = liftHeight + Math.sin(phaseProgress * Math.PI) * 0.035;
    z = transportZ;
  } else if (t < 0.80) {
    phase = "lower";
    phaseProgress = smooth01((t - 0.68) / 0.12);
    x = targetX;
    truckX = targetX;
    rigDeploy = 1;
    y = THREE.MathUtils.lerp(liftHeight, 0, phaseProgress);
    z = THREE.MathUtils.lerp(transportZ, 0, phaseProgress);
  } else if (t < 0.85) {
    phase = "release";
    phaseProgress = smooth01((t - 0.80) / 0.05);
    x = targetX;
    truckX = targetX;
    rigDeploy = 1;
    y = Math.sin(phaseProgress * Math.PI) * 0.022;
  } else {
    phase = "return";
    phaseProgress = smootherStep((t - 0.85) / 0.15);
    x = targetX;
    truckX = THREE.MathUtils.lerp(targetX, parkX, phaseProgress);
    rigDeploy = 1 - phaseProgress;
    truckYaw = returnYaw;
  }

  const moving = phase === "transport";
  const sway = moving ? Math.sin(phaseProgress * Math.PI * 2) * 0.018 : 0;
  return {
    building: {
      position: [x, y, z],
      rotation: [0, direction * sway * 0.45, -direction * sway],
    },
    truckX,
    laneZ,
    boomReachZ: THREE.MathUtils.lerp(laneZ, z, 0.82),
    hookHeight: y,
    cableSlack: phase === "hook" || phase === "release" ? 0.10 : 0.025,
    rigDeploy,
    phaseProgress,
    truckYaw,
    phase,
  };
}

/** Backwards-compatible alias used by tests and older callers. */
export function swapPose3D(fromX: number, targetX: number, progress: number): BarPose3D {
  return craneSwapPose3D(fromX, targetX, progress).building;
}

export function graphNodePosition(node: { x: number; y: number }) {
  return {
    x: (node.x - 0.5) * 13.5,
    y: 1.15,
    z: (node.y - 0.5) * 10.5,
  };
}

export function eventLabel(frame: Frame | null | undefined) {
  if (!frame) return "READY";
  if (frame.event === "swap") return "SWAP";
  if (frame.event === "compare") return "COMPARE";
  if (frame.event === "visit") return "VISIT";
  if (frame.event === "found") return "FOUND";
  if (frame.event) return String(frame.event).toUpperCase();
  return "STEP";
}

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function smootherStep(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
