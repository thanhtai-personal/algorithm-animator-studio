import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { COURSE_SAMPLES } from '../track/towerCourseSampler';
import { MARBLE_RADIUS, SPECIALS, TRACK_THICKNESS, TRACK_WIDTH } from '../track/towerCourse';

function cannonVec(v: THREE.Vector3) { return new CANNON.Vec3(v.x, v.y, v.z); }
function cannonQuat(q: THREE.Quaternion) { return new CANNON.Quaternion(q.x, q.y, q.z, q.w); }

export function buildTrackBodies(world: CANNON.World, material: CANNON.Material) {
  const chunkSize = 12;
  for (let start = 0; start < COURSE_SAMPLES.length - 1; start += chunkSize) {
    const body = new CANNON.Body({ mass: 0, material });
    const end = Math.min(COURSE_SAMPLES.length - 1, start + chunkSize);
    for (let index = start; index < end; index += 1) {
      const sample = COURSE_SAMPLES[index];
      const next = COURSE_SAMPLES[index + 1];
      const mid = sample.point.clone().lerp(next.point, 0.5);
      const length = Math.max(0.32, sample.lengthToNext * 1.62);
      body.addShape(
        new CANNON.Box(new CANNON.Vec3(TRACK_WIDTH / 2 + 0.22, TRACK_THICKNESS / 2, length / 2)),
        cannonVec(mid.clone().addScaledVector(sample.normal, -TRACK_THICKNESS / 2)),
        cannonQuat(sample.quaternion)
      );
      for (const side of [-1, 1]) {
        const wallHalfHeight = 0.9;
        const wallCenter = mid.clone()
          .addScaledVector(sample.right, side * (TRACK_WIDTH / 2 - 0.04))
          .addScaledVector(sample.normal, wallHalfHeight + 0.03);
        body.addShape(
          new CANNON.Box(new CANNON.Vec3(0.16, wallHalfHeight, length / 2)),
          cannonVec(wallCenter),
          cannonQuat(sample.quaternion)
        );
      }
    }
    world.addBody(body);
  }
}

export function createBarrier(
  world: CANNON.World,
  material: CANNON.Material,
  progress: number,
  halfHeight = 0.72
) {
  const index = Math.round(progress * (COURSE_SAMPLES.length - 1));
  const sample = COURSE_SAMPLES[index];
  const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(TRACK_WIDTH / 2, halfHeight, 0.18)));
  const pos = sample.point.clone().addScaledVector(sample.normal, halfHeight + 0.14);
  body.position.copy(cannonVec(pos));
  body.quaternion.copy(cannonQuat(sample.quaternion));
  world.addBody(body);
  return body;
}

export function createSpinner(
  world: CANNON.World,
  material: CANNON.Material,
  progress: number,
  speed: number
) {
  const index = Math.round(progress * (COURSE_SAMPLES.length - 1));
  const sample = COURSE_SAMPLES[index];
  const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(TRACK_WIDTH * 0.43, 0.14, 0.17)));
  const pos = sample.point.clone().addScaledVector(sample.normal, 0.62);
  body.position.copy(cannonVec(pos));
  body.quaternion.copy(cannonQuat(sample.quaternion));
  body.angularVelocity.copy(cannonVec(sample.normal.clone().multiplyScalar(speed)));
  world.addBody(body);
  return { body, sample, speed };
}

export function createChimeBumpers(world: CANNON.World, material: CANNON.Material) {
  const bodies: CANNON.Body[] = [];
  const count = 16;
  for (let i = 0; i < count; i += 1) {
    const progress = THREE.MathUtils.lerp(SPECIALS.chimeStart, SPECIALS.chimeEnd, i / (count - 1));
    const sample = COURSE_SAMPLES[Math.round(progress * (COURSE_SAMPLES.length - 1))];
    const lane = ((i * 3) % 7) - 3;
    const body = new CANNON.Body({ mass: 0, material });
    body.addShape(new CANNON.Sphere(0.42));
    const pos = sample.point.clone()
      .addScaledVector(sample.right, lane * 0.92)
      .addScaledVector(sample.normal, 0.42);
    body.position.copy(cannonVec(pos));
    world.addBody(body);
    bodies.push(body);
  }
  return bodies;
}

export function createPianoBodies(
  world: CANNON.World,
  material: CANNON.Material,
  onHit: (index: number, other: CANNON.Body) => void
) {
  const keys: CANNON.Body[] = [];
  const count = 12;
  for (let i = 0; i < count; i += 1) {
    const progress = THREE.MathUtils.lerp(SPECIALS.pianoStart, SPECIALS.pianoEnd, (i + 0.5) / count);
    const sample = COURSE_SAMPLES[Math.round(progress * (COURSE_SAMPLES.length - 1))];
    const body = new CANNON.Body({ mass: 0, material });
    body.addShape(new CANNON.Box(new CANNON.Vec3(TRACK_WIDTH / 2 - 0.12, 0.055, 0.62)));
    const pos = sample.point.clone().addScaledVector(sample.normal, 0.045);
    body.position.copy(cannonVec(pos));
    body.quaternion.copy(cannonQuat(sample.quaternion));
    body.addEventListener('collide', (event: { body: CANNON.Body }) => onHit(i, event.body));
    world.addBody(body);
    keys.push(body);
  }
  return keys;
}

export function spawnPoint(laneIndex: number) {
  const sample = COURSE_SAMPLES[1];
  const laneSpacing = (TRACK_WIDTH - MARBLE_RADIUS * 2.5) / 8;
  const lateral = -TRACK_WIDTH / 2 + MARBLE_RADIUS * 1.4 + laneSpacing * (laneIndex + 0.5);
  return sample.point.clone()
    .addScaledVector(sample.right, lateral)
    .addScaledVector(sample.normal, MARBLE_RADIUS + 0.1)
    .addScaledVector(sample.tangent, -laneIndex * 0.12);
}
