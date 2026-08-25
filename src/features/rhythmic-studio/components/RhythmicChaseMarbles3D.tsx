import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { settingsForChaseOwner } from "../engine/chaseCoursePlanner";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { ChaseOwner } from "../engine/chaseStrikeOwnership";
import type { ChaseCoursePlan } from "../lib/chaseCourse";
import type { StudioSettings } from "../types";
import {
  impactSquash,
  RHYTHMIC_WORLD_SCALE,
  setWorldPoint,
  visualChaseMarbleAtTime,
} from "./RhythmicMotion3D";
import { RhythmicMarble3D } from "./RhythmicMarble3D";

export interface RhythmicChaseMarblesHandle {
  update: (timeMs: number) => void;
}

interface Props {
  plan: ChaseCoursePlan;
  settings: StudioSettings;
  resolveSettings?: StudioSettingsResolver;
}

interface PerformerMotionState {
  initialized: boolean;
  previousTimeMs: number;
  previousWorld: THREE.Vector3;
  world: THREE.Vector3;
  displacement: THREE.Vector3;
  rollAxis: THREE.Vector3;
  roll: THREE.Quaternion;
  deltaRoll: THREE.Quaternion;
}

function motionState(): PerformerMotionState {
  return {
    initialized: false,
    previousTimeMs: 0,
    previousWorld: new THREE.Vector3(),
    world: new THREE.Vector3(),
    displacement: new THREE.Vector3(),
    rollAxis: new THREE.Vector3(),
    roll: new THREE.Quaternion(),
    deltaRoll: new THREE.Quaternion(),
  };
}

function updatePerformer(
  owner: ChaseOwner,
  timeMs: number,
  props: Props,
  motionGroup: THREE.Group | null,
  marbleGroup: THREE.Group | null,
  state: PerformerMotionState,
) {
  if (!motionGroup || !marbleGroup) return;
  const sample = visualChaseMarbleAtTime(owner, timeMs, props.plan, props.settings, props.resolveSettings);
  const frameSettings = settingsForChaseOwner(
    props.resolveSettings?.(sample.segmentIndex) ?? props.settings,
    owner,
  );
  setWorldPoint(state.world, sample);
  const radius = Math.max(0.06, frameSettings.ballSize * RHYTHMIC_WORLD_SCALE);
  const timeDelta = timeMs - state.previousTimeMs;
  state.displacement.copy(state.world).sub(state.previousWorld);
  const distance = state.displacement.length();
  if (state.initialized && timeDelta > 0 && timeDelta < 120 && distance > 0.0001 && distance < 2.5) {
    state.rollAxis.set(state.displacement.y, -state.displacement.x, 0);
    if (state.rollAxis.lengthSq() > 1e-7) {
      state.rollAxis.normalize();
      state.deltaRoll.setFromAxisAngle(state.rollAxis, Math.min(1.18, distance / radius));
      state.roll.premultiply(state.deltaRoll).normalize();
    }
  }
  const squash = frameSettings.pulseAnimation
    ? impactSquash(sample.impactAgeMs) * THREE.MathUtils.clamp(frameSettings.animationSensitivity, 0, 1.5)
    : 0;
  motionGroup.position.copy(state.world);
  motionGroup.scale.set(radius * (1 + squash * 0.32), radius * (1 - squash), radius * (1 + squash * 0.32));
  marbleGroup.quaternion.copy(state.roll);
  state.previousWorld.copy(state.world);
  state.previousTimeMs = timeMs;
  state.initialized = true;
}

export const RhythmicChaseMarbles3D = forwardRef<RhythmicChaseMarblesHandle, Props>(
  function RhythmicChaseMarbles3D(props, ref) {
    const motionA = useRef<THREE.Group>(null);
    const motionB = useRef<THREE.Group>(null);
    const marbleA = useRef<THREE.Group>(null);
    const marbleB = useRef<THREE.Group>(null);
    const stateA = useRef(motionState());
    const stateB = useRef(motionState());
    const settingsA = settingsForChaseOwner(props.settings, "A");
    const settingsB = settingsForChaseOwner(props.settings, "B");

    useImperativeHandle(ref, () => ({
      update: (timeMs) => {
        updatePerformer("A", timeMs, props, motionA.current, marbleA.current, stateA.current);
        updatePerformer("B", timeMs, props, motionB.current, marbleB.current, stateB.current);
      },
    }), [props]);

    return <>
      <group ref={motionA} name={`chase-marble-A-${settingsA.ballStyle}`} userData={{ chaseOwner: "A", ballStyle: settingsA.ballStyle }}>
        <RhythmicMarble3D ref={marbleA} settings={settingsA} />
      </group>
      <group ref={motionB} name={`chase-marble-B-${settingsB.ballStyle}`} userData={{ chaseOwner: "B", ballStyle: settingsB.ballStyle }}>
        <RhythmicMarble3D ref={marbleB} settings={settingsB} />
      </group>
    </>;
  },
);
