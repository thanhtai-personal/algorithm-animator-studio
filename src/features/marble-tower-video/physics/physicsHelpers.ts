import * as CANNON from 'cannon-es';
import { TRACK_THICKNESS, segmentPose, surfaceYAt } from '../track/trackLayout';
import type { TrackSegment } from '../track/trackTypes';

export function addTrackBody(world: CANNON.World, segment: TrackSegment, material: CANNON.Material) {
  const pose = segmentPose(segment);
  const body = new CANNON.Body({ mass: 0, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(segment.width / 2, TRACK_THICKNESS / 2, pose.length / 2)));
  body.position.set(...pose.position);
  body.quaternion.setFromEuler(pose.rotationX, 0, 0);
  world.addBody(body);
  return body;
}

export function addRailBodies(world: CANNON.World, segment: TrackSegment, material: CANNON.Material) {
  const pose = segmentPose(segment);
  const railHeight = 0.72;
  const railWidth = 0.16;
  return [-1, 1].map((side) => {
    const body = new CANNON.Body({ mass: 0, material });
    body.addShape(new CANNON.Box(new CANNON.Vec3(railWidth / 2, railHeight / 2, pose.length / 2)));
    body.position.set(
      side * (segment.width / 2 + railWidth / 2),
      pose.position[1] + pose.normal[1] * (TRACK_THICKNESS / 2 + railHeight / 2),
      pose.position[2] + pose.normal[2] * (TRACK_THICKNESS / 2 + railHeight / 2)
    );
    body.quaternion.setFromEuler(pose.rotationX, 0, 0);
    world.addBody(body);
    return body;
  });
}

export function makeBarrier(world: CANNON.World, z: number, half: [number, number, number], material: CANNON.Material) {
  const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(...half)));
  body.position.set(0, surfaceYAt(z) + half[1] + 0.15, z);
  world.addBody(body);
  return body;
}

export function bodySpeed(body: CANNON.Body) {
  return Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z);
}
