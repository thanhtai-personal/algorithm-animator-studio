import * as THREE from 'three';
import type * as CANNON from 'cannon-es';
import type { CourseSample } from '../track/towerCourseSampler';

const SOLID_SPHERE_ROLL_FACTOR = 5 / 7;

export function rollingSphereAcceleration(
  downhillSlopeSin: number,
  rollingResistance = 0.012,
  gravity = 9.81,
) {
  const slopeSin = THREE.MathUtils.clamp(downhillSlopeSin, -1, 1);
  const slopeCos = Math.sqrt(Math.max(0, 1 - slopeSin * slopeSin));
  return SOLID_SPHERE_ROLL_FACTOR * gravity * (slopeSin - rollingResistance * slopeCos);
}

export function launchImpulse(sample: CourseSample, mass: number, driveMultiplier: number) {
  const gateNudge = THREE.MathUtils.clamp(driveMultiplier, 0.6, 1.5);
  return sample.tangent.clone().multiplyScalar(mass * gateNudge);
}

export function jumpImpulse(sample: CourseSample, mass: number, driveMultiplier: number) {
  const gateNudge = THREE.MathUtils.clamp(driveMultiplier, 0.6, 1.5);
  return sample.tangent.clone().multiplyScalar(mass * (0.55 + gateNudge * 0.2))
    .addScaledVector(sample.normal, mass * 2.0);
}

export function recoveryImpulse(sample: CourseSample, mass: number, driveMultiplier: number, gravity: number) {
  const rollingAcceleration = Math.max(0, rollingSphereAcceleration(-sample.tangent.y, 0.012, gravity));
  const gateNudge = THREE.MathUtils.clamp(driveMultiplier, 0.6, 1.5);
  const deltaV = Math.max(0.8, rollingAcceleration * 0.9 + gateNudge * 0.08);
  return sample.tangent.clone().multiplyScalar(mass * deltaV)
    .addScaledVector(sample.normal, mass * 0.12);
}

export function pianoBoostImpulse(sample: CourseSample, mass: number, boostDeltaV: number) {
  return sample.tangent.clone().multiplyScalar(mass * boostDeltaV);
}

export function driveBeltForce(
  sample: CourseSample,
  mass: number,
  tangentSpeed: number,
  targetSpeed: number,
  maxAcceleration: number,
) {
  const acceleration = THREE.MathUtils.clamp((targetSpeed - tangentSpeed) * 2.2, 0, maxAcceleration);
  return sample.tangent.clone().multiplyScalar(mass * acceleration);
}

export function chimeBounceImpulse(
  sample: CourseSample,
  body: CANNON.Body,
  chimePosition: CANNON.Vec3,
  mass: number,
  index: number,
) {
  const speed = body.velocity.length();
  const away = new THREE.Vector3(
    body.position.x - chimePosition.x,
    body.position.y - chimePosition.y,
    body.position.z - chimePosition.z,
  );
  away.addScaledVector(sample.normal, -away.dot(sample.normal));
  away.addScaledVector(sample.tangent, -away.dot(sample.tangent));
  if (away.lengthSq() > 1e-6) away.normalize();
  else away.copy(sample.right).multiplyScalar(index % 2 ? 1 : -1);
  const forwardDeltaV = 0.45 + Math.min(0.4, speed * 0.03);
  const outwardDeltaV = 0.78 + Math.min(0.25, speed * 0.02);
  return sample.tangent.clone().multiplyScalar(mass * forwardDeltaV)
    .addScaledVector(away, mass * outwardDeltaV)
    .addScaledVector(sample.normal, mass * 0.06);
}
