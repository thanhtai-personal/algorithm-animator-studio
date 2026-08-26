import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { COURSE_SAMPLES, type CourseSample } from '../track/towerCourseSampler';
import { SPECIALS, TRACK_WIDTH } from '../track/towerCourse';
import { marbleStartGrid } from '../marble/marbleGrid';
import { PIANO_PAD_LAYOUT } from '../track/pianoPadLayout';
import { STUDIO_SOLIDS } from '../race/studioStructure';
import type { OlympicRoadObstacle } from '../track/olympicRoadCourse';

function cannonVec(v: THREE.Vector3) { return new CANNON.Vec3(v.x, v.y, v.z); }
function cannonQuat(q: THREE.Quaternion) { return new CANNON.Quaternion(q.x, q.y, q.z, q.w); }

function createContinuousTrackSurface(
  material: CANNON.Material,
  samples: readonly CourseSample[],
  trackWidth: number,
) {
  const vertices: number[] = [];
  const indices: number[] = [];
  samples.forEach((sample) => {
    const left = sample.point.clone().addScaledVector(sample.right, -trackWidth / 2);
    const right = sample.point.clone().addScaledVector(sample.right, trackWidth / 2);
    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
  });
  for (let index = 0; index < samples.length - 1; index += 1) {
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

export function buildTrackBodies(
  world: CANNON.World,
  material: CANNON.Material,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  trackWidth = TRACK_WIDTH,
) {
  const surface = createContinuousTrackSurface(material, samples, trackWidth);
  world.addBody(surface);

  const chunkSize = 12;
  for (let start = 0; start < samples.length - 1; start += chunkSize) {
    const body = new CANNON.Body({ mass: 0, material });
    const end = Math.min(samples.length - 1, start + chunkSize);
    for (let index = start; index < end; index += 1) {
      const sample = samples[index];
      const next = samples[index + 1];
      const mid = sample.point.clone().lerp(next.point, 0.5);
      const length = Math.max(0.32, sample.lengthToNext * 1.7);
      for (const side of [-1, 1]) {
        const wallHalfHeight = 0.92;
        const wallCenter = mid.clone()
          .addScaledVector(sample.right, side * (trackWidth / 2 - 0.04))
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

export function createStartGridBody(
  world: CANNON.World,
  material: CANNON.Material,
  marbleCount: number,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  trackWidth = TRACK_WIDTH,
) {
  const grid = marbleStartGrid(marbleCount);
  const sample = samples[0];
  const body = new CANNON.Body({ mass: 0, material });
  const floorCenter = sample.point.clone()
    .addScaledVector(sample.tangent, -grid.depth / 2)
    .addScaledVector(sample.normal, -0.12);
  body.addShape(
    new CANNON.Box(new CANNON.Vec3(trackWidth / 2, 0.12, grid.depth / 2)),
    cannonVec(floorCenter),
    cannonQuat(sample.quaternion),
  );
  for (const side of [-1, 1]) {
    const wallCenter = sample.point.clone()
      .addScaledVector(sample.tangent, -grid.depth / 2)
      .addScaledVector(sample.right, side * (trackWidth / 2 - 0.05))
      .addScaledVector(sample.normal, 0.92);
    body.addShape(
      new CANNON.Box(new CANNON.Vec3(0.18, 0.92, grid.depth / 2)),
      cannonVec(wallCenter),
      cannonQuat(sample.quaternion),
    );
  }
  world.addBody(body);
  return body;
}

export function createSupportBodies(
  world: CANNON.World,
  material: CANNON.Material,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
) {
  const bodies: CANNON.Body[] = [];
  samples.filter((_, index) => index % 12 === 6 && index > 5).forEach((sample) => {
    const height = Math.max(1, sample.point.y);
    const body = new CANNON.Body({ mass: 0, material });
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.26, height / 2, 0.26)));
    body.position.set(sample.point.x, height / 2, sample.point.z);
    world.addBody(body);
    bodies.push(body);
  });
  return bodies;
}

export function createCourseObstacleBodies(
  world: CANNON.World,
  material: CANNON.Material,
  samples: readonly CourseSample[],
  obstacles: readonly OlympicRoadObstacle[],
) {
  return obstacles.map((obstacle) => {
    const sample = samples[Math.round(obstacle.progress * (samples.length - 1))];
    const [width, height, depth] = obstacle.collider;
    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      material,
      shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)),
    });
    const position = sample.point.clone()
      .addScaledVector(sample.right, obstacle.lateral)
      .addScaledVector(sample.normal, height / 2 + 0.08);
    body.position.copy(cannonVec(position));
    body.quaternion.copy(cannonQuat(sample.quaternion));
    world.addBody(body);
    return body;
  });
}

export function createStudioStructureBodies(world: CANNON.World, material: CANNON.Material) {
  return STUDIO_SOLIDS.map((solid) => {
    const body = new CANNON.Body({ mass: 0, material });
    if (solid.kind === 'cylinder') {
      body.addShape(new CANNON.Cylinder(solid.radiusTop + 0.08, solid.radiusBottom + 0.08, solid.height, 24));
    } else {
      body.addShape(new CANNON.Box(new CANNON.Vec3(
        solid.size[0] / 2 + 0.08,
        solid.size[1] / 2,
        solid.size[2] / 2 + 0.08,
      )));
    }
    body.position.set(...solid.position);
    world.addBody(body);
    return body;
  });
}

export function createBarrier(
  world: CANNON.World,
  material: CANNON.Material,
  progress: number,
  halfHeight = 0.72,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  trackWidth = TRACK_WIDTH,
) {
  const index = Math.round(progress * (samples.length - 1));
  const sample = samples[index];
  const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(trackWidth / 2, halfHeight, 0.18)));
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
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  trackWidth = TRACK_WIDTH,
) {
  const index = Math.round(progress * (samples.length - 1));
  const sample = samples[index];
  const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(trackWidth * 0.43, 0.14, 0.17)));
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
  samples: readonly CourseSample[] = COURSE_SAMPLES,
  specials: { chimeStart: number; chimeEnd: number } = SPECIALS,
) {
  const bodies: CANNON.Body[] = [];
  const count = 16;
  for (let i = 0; i < count; i += 1) {
    const progress = THREE.MathUtils.lerp(specials.chimeStart, specials.chimeEnd, i / (count - 1));
    const sample = samples[Math.round(progress * (samples.length - 1))];
    const lane = ((i * 3) % 7) - 3;
    const body = new CANNON.Body({ mass: 0, material });
    const columnShape = new CANNON.Sphere(0.34);
    body.addShape(columnShape, new CANNON.Vec3(0, -0.52, 0));
    body.addShape(columnShape, new CANNON.Vec3(0, 0, 0));
    body.addShape(columnShape, new CANNON.Vec3(0, 0.52, 0));
    const pos = sample.point.clone().addScaledVector(sample.right, lane * 0.92).addScaledVector(sample.normal, 0.42);
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
  samples: readonly CourseSample[] = COURSE_SAMPLES,
) {
  const keys: CANNON.Body[] = [];
  PIANO_PAD_LAYOUT.forEach((pad) => {
    const sample = samples[Math.round(pad.progress * (samples.length - 1))];
    const body = new CANNON.Body({ mass: 0, material });
    body.addShape(new CANNON.Box(new CANNON.Vec3(pad.width / 2, 0.055, pad.depth / 2)));
    const pos = sample.point.clone().addScaledVector(sample.right, pad.lateral).addScaledVector(sample.normal, 0.055);
    body.position.copy(cannonVec(pos));
    body.quaternion.copy(cannonQuat(sample.quaternion));
    body.addEventListener('collide', (event: { body: CANNON.Body; contact?: CANNON.ContactEquation }) => onHit(pad.index, event.body, event.contact));
    world.addBody(body);
    keys.push(body);
  });
  return keys;
}

export function spawnPoint(
  index: number,
  marbleCount: number,
  radius: number,
  samples: readonly CourseSample[] = COURSE_SAMPLES,
) {
  const grid = marbleStartGrid(marbleCount);
  const sample = samples[0];
  const lane = index % grid.lanes;
  const row = Math.floor(index / grid.lanes);
  const rowCount = Math.min(grid.lanes, grid.count - row * grid.lanes);
  const rowWidth = Math.max(0, (rowCount - 1) * grid.spacing);
  const lateral = -rowWidth / 2 + lane * grid.spacing;
  const backward = radius * 1.4 + row * grid.spacing;
  return sample.point.clone()
    .addScaledVector(sample.right, lateral)
    .addScaledVector(sample.normal, radius + 0.14)
    .addScaledVector(sample.tangent, -backward);
}
