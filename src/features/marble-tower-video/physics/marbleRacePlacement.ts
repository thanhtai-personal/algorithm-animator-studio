import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { MarbleRuntime } from "./physicsTypes";
import type { CourseSample } from "../track/towerCourseSampler";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";
import { SPECIALS, TRACK_WIDTH } from "../track/towerCourse";

export function vec3(value: THREE.Vector3) {
  return new CANNON.Vec3(value.x, value.y, value.z);
}

export function recoverMarbleToCourse(
  marble: MarbleRuntime,
  sample: CourseSample,
  marbleRadius: number,
  trackWidth = TRACK_WIDTH,
) {
  const body = marble.body;
  const dx = body.position.x - sample.point.x;
  const dy = body.position.y - sample.point.y;
  const dz = body.position.z - sample.point.z;
  const lateral = THREE.MathUtils.clamp(
    dx * sample.right.x + dy * sample.right.y + dz * sample.right.z,
    -trackWidth * 0.32,
    trackWidth * 0.32,
  );
  const safePoint = sample.point.clone()
    .addScaledVector(sample.right, lateral)
    .addScaledVector(sample.normal, marbleRadius + 0.22);
  const forwardSpeed = Math.max(3.2,
    body.velocity.x * sample.tangent.x
    + body.velocity.y * sample.tangent.y
    + body.velocity.z * sample.tangent.z);

  body.position.copy(vec3(safePoint));
  body.previousPosition.copy(body.position);
  body.interpolatedPosition.copy(body.position);
  body.velocity.copy(vec3(sample.tangent.clone().multiplyScalar(forwardSpeed)));
  body.angularVelocity.scale(0.35, body.angularVelocity);
  body.force.setZero();
  body.torque.setZero();
  body.wakeUp();
  marble.stuckFor = 0;
}

export function freezeWinnerAtFinish(
  winner: MarbleRuntime,
  marbleRadius: number,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  finishProgress: number = SPECIALS.finish,
) {
  const finishIndex = Math.round(finishProgress * (samples.length - 1));
  const finish = samples[finishIndex];
  const anchor = vec3(finish.point.clone().addScaledVector(finish.normal, marbleRadius + 0.2));

  winner.progressIndex = finishIndex;
  winner.previousProgress = finishProgress;
  winner.body.type = CANNON.Body.KINEMATIC;
  winner.body.collisionResponse = false;
  winner.body.collisionFilterMask = 0;
  holdWinnerAtFinish(winner, anchor);
  winner.body.wakeUp();
  return anchor;
}

export function holdWinnerAtFinish(winner: MarbleRuntime, anchor: CANNON.Vec3) {
  winner.body.position.copy(anchor);
  winner.body.previousPosition.copy(anchor);
  winner.body.interpolatedPosition.copy(anchor);
  winner.body.velocity.setZero();
  winner.body.angularVelocity.setZero();
  winner.body.force.setZero();
  winner.body.torque.setZero();
}
