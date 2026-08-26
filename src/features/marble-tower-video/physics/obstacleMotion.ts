import * as THREE from 'three';
import type * as CANNON from 'cannon-es';
import { COURSE_SAMPLES, type CourseSample } from '../track/towerCourseSampler';
import { SPECIALS } from '../track/towerCourse';

const BPM = 126;
const BEAT_SECONDS = 60 / BPM;

export function updateStartGate(
  body: CANNON.Body,
  opened: boolean,
  dt: number,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  progress = SPECIALS.startGate,
) {
  const sample = samples[Math.round(progress * (samples.length - 1))];
  const closed = sample.point.clone().addScaledVector(sample.normal, 0.95);
  const target = opened ? closed.clone().addScaledVector(sample.normal, 4.0) : closed;
  const current = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
  const velocity = target.sub(current).multiplyScalar(Math.min(8, 5.4 / Math.max(dt, 0.001)) * dt);
  body.velocity.set(
    velocity.x / Math.max(dt, 0.001),
    velocity.y / Math.max(dt, 0.001),
    velocity.z / Math.max(dt, 0.001),
  );
}

export function updateBeatSpinners(
  raceTime: number,
  opened: boolean,
  previousBeat: number,
  spinners: Array<{ body: CANNON.Body; sample: { normal: THREE.Vector3 }; speed: number }>,
) {
  const beat = opened ? Math.floor(raceTime / BEAT_SECONDS) : previousBeat;
  const pulse = beat % 4 === 3 ? 1.32 : 1;
  for (const spinner of spinners) {
    const speed = spinner.speed * pulse;
    const normal = spinner.sample.normal;
    spinner.body.angularVelocity.set(normal.x * speed, normal.y * speed, normal.z * speed);
  }
  return beat;
}
