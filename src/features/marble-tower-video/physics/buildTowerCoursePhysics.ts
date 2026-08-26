import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { COURSE_SAMPLES } from '../track/towerCourseSampler';
import { MARBLE_RADIUS, SPECIALS, TRACK_WIDTH } from '../track/towerCourse';

function cannonVec(v: THREE.Vector3) { return new CANNON.Vec3(v.x, v.y, v.z); }
function cannonQuat(q: THREE.Quaternion) { return new CANNON.Quaternion(q.x, q.y, q.z, q.w); }

function createContinuousTrackSurface(material: CANNON.Material) {
  const vertices: number[] = [];
  const indices: number[] = [];
  COURSE_SAMPLES.forEach((sample) => {
    const left = sample.point.clone().addScaledVector(sample.right, -TRACK_WIDTH / 2);
    const right = sample.point.clone().addScaledVector(sample.right, TRACK_WIDTH / 2);
    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
  });
  for (let index = 0; index < COURSE_SAMPLES.length - 1; index += 1) {
    const a = index * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  const body = new CANNON.Body({ mass: 0, material });
  body.addShape(new CANNON.Trimesh(vertices, indices));
  return body;
}

export function buildTrackBodies(world: CANNON.World, material: CANNON.Material) {
  // One continuous collision ribbon removes the tiny forward-facing seams made
  // by hundreds of rotated floor boxes. Those seams were stealing speed and
  // could pin a sphere even though the rendered ribbon looked smooth.
  const surface = createContinuousTrackSurface(material);
  world.addBody(surface);

  const chunkSize = 12;
  for (let start = 0; start < COURSE_SAMPLES.length - 1; start += chunkSize) {
    const body = new CANNON.Body({ mass: 0, material });
    const end = Math.min(COURSE_SAMPLES.length - 1, start + chunkSize);
    for (let index = start; index < end; index += 1) {
      const sample = COURSE_SAMPLES[index];
      const next = COURSE_SAMPLES[index + 1];
      const mid = sample.point.clone().lerp(next.point, 0.5);
      const length = Math.max(0.32, sample.lengthToNext * 1.7);
      for (const side of [-1, 1]) {
        const wallHalfHeight = 0.92;
        const wallCenter = mid.clone()
          .addScaledVector(sample.right, side * (TRACK_WIDTH / 2 - 0.04))
          .addScaledVector(sample.normal, wallHalfHeight + 0.03);
        body.addShape(
          new CANNON.Box(new CANNON.Vec3(0.18, wallHalfHeight, length / 2)),
          cannonVec(wallCenter),
          cannonQuat(sample.quaternion),
        );
      }
    }
    world.addBody(body);
  }
}

export function createSupportBodies(world: CANNON.World, material: CANNON.Material) {
  const bodies: CANNON.Body[] = [];
  COURSE_SAMPLES.filter((_, index) => index % 12 === 6 && index > 5).forEach((sample) => {
    const height = Math.max(1, sample.point.y);
    const body = new CANNON.Body({ mass: 0, material });
    // Slightly wider than the visible post so fast marbles cannot tunnel through
    // a pencil-thin collider between simulation steps.
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.26, height / 2, 0.26)));
    body.position.set(sample.point.x, height / 2, sample.point.z);
    world.addBody(body);
    bodies.push(body);
  });
  return bodies;
}

export function createBarrier(
  world: CANNON.World,
  material: CANNON.Material,
  progress: number,
  halfHeight = 0.72,
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
  speed: number,
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

export function createChimeBumpers(
  world: CANNON.World,
  material: CANNON.Material,
  onHit?: (index: number, other: CANNON.Body, contact?: CANNON.ContactEquation) => void,
) {
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
    if (onHit) body.addEventListener('collide', (event: { body: CANNON.Body; contact?: CANNON.ContactEquation }) => onHit(i, event.body, event.contact));
    world.addBody(body);
    bodies.push(body);
  }
  return bodies;
}

export function createPianoBodies(
  world: CANNON.World,
  material: CANNON.Material,
  onHit: (index: number, other: CANNON.Body, contact?: CANNON.ContactEquation) => void,
) {
  const keys: CANNON.Body[] = [];
  const count = 12;
  for (let i = 0; i < count; i += 1) {
    const progress = THREE.MathUtils.lerp(SPECIALS.pianoStart, SPECIALS.pianoEnd, (i + 0.5) / count);
    const sample = COURSE_SAMPLES[Math.round(progress * (COURSE_SAMPLES.length - 1))];
    const body = new CANNON.Body({ mass: 0, material });
    body.addShape(new CANNON.Box(new CANNON.Vec3(TRACK_WIDTH / 2 - 0.12, 0.055, 0.62)));
    const pos = sample.point.clone().addScaledVector(sample.normal, 0.055);
    body.position.copy(cannonVec(pos));
    body.quaternion.copy(cannonQuat(sample.quaternion));
    body.addEventListener('collide', (event: { body: CANNON.Body; contact?: CANNON.ContactEquation }) => onHit(i, event.body, event.contact));
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
    .addScaledVector(sample.normal, MARBLE_RADIUS + 0.12)
    .addScaledVector(sample.tangent, -laneIndex * 0.12);
}
