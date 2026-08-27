import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { olympicRoadCameraAnchorProgress, olympicRoadCameraShot } from "./olympicRoadCameraPlan";

const focus = new THREE.Vector3();
const desired = new THREE.Vector3();
const look = new THREE.Vector3();
const packCenter = new THREE.Vector3();

export function OlympicRoadCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 28, -25));
  useFrame((_, delta) => {
    const ranked = physics.getRanked();
    const leader = ranked[0];
    if (!leader?.alive) return;
    const samples = physics.course.samples;
    const sample = samples[Math.max(0, Math.min(leader.progressIndex, samples.length - 1))];
    const progress = leader.progressIndex / (samples.length - 1);
    let packLength = 0;
    packCenter.set(0, 0, 0);
    while (packLength < ranked.length && packLength < 8 && ranked[packLength].alive) {
      const marble = ranked[packLength];
      packCenter.x += marble.body.position.x;
      packCenter.y += marble.body.position.y;
      packCenter.z += marble.body.position.z;
      packLength += 1;
    }
    if (packLength) packCenter.multiplyScalar(1 / packLength);
    focus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z).lerp(packCenter, 0.62);
    const shot = olympicRoadCameraShot(progress);
    const anchorProgress = olympicRoadCameraAnchorProgress(shot);
    const anchorSample = samples[Math.round(anchorProgress * (samples.length - 1))];
    const countdownDrift = physics.hasStarted() ? 0 : Math.sin(physics.getTimelineSeconds() * 0.72) * 1.2;
    // Match the tabletop reference: the lens holds one readable position per
    // module while only the pan follows the pack. Chasing the marbles at their
    // exact velocity made otherwise realistic motion look slow and weightless.
    desired.copy(anchorSample.point)
      .addScaledVector(anchorSample.tangent, -shot.behind)
      .addScaledVector(anchorSample.normal, shot.lift)
      .addScaledVector(anchorSample.right, shot.side + countdownDrift);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 3.7));
    look.copy(focus).addScaledVector(sample.tangent, shot.lookAhead).addScaledVector(sample.normal, 0.38);
    lookTarget.current.lerp(look, 1 - Math.exp(-delta * 5.4));
    camera.lookAt(lookTarget.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const nextFov = THREE.MathUtils.lerp(camera.fov, shot.fov, 1 - Math.exp(-delta * 3.2));
      if (Math.abs(nextFov - camera.fov) > 0.015) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
  });
  return null;
}
