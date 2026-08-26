import * as THREE from 'three';
import type * as CANNON from 'cannon-es';
import type { CourseSample } from '../track/towerCourseSampler';

export function launchImpulse(sample: CourseSample, mass: number, driveMultiplier: number) {
  return sample.tangent.clone().multiplyScalar(mass * driveMultiplier * 2.15)
    .addScaledVector(sample.normal, mass * 0.05);
}

export function jumpImpulse(sample: CourseSample, mass: number, driveMultiplier: number) {
  return sample.tangent.clone().multiplyScalar(mass * (2 + driveMultiplier * 0.18))
    .addScaledVector(sample.normal, mass * 2.0);
}

export function recoveryImpulse(sample: CourseSample, mass: number, driveMultiplier: number, gravity: number) {
  const grade = Math.max(0.04, -sample.tangent.y);
  const rollingAcceleration = gravity * grade * (5 / 7);
  const deltaV = Math.max(1.15, rollingAcceleration * 0.9 + driveMultiplier * 0.08);
  return sample.tangent.clone().multiplyScalar(mass * deltaV)
    .addScaledVector(sample.normal, mass * 0.12);
}

export function pianoBoostImpulse(sample: CourseSample, mass: number, boostDeltaV: number) {
  return sample.tangent.clone().multiplyScalar(mass * boostDeltaV);
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
