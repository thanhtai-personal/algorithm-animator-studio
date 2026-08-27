import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";
import { cameraAnchorProgress, cameraShotForSection } from "./raceCameraPlan";
import { FINISH_MAX_CAMERA_HEIGHT_ABOVE_LEADER, finishCameraBlend, finishCameraShot } from "./finishCameraFraming";

const leaderFocus = new THREE.Vector3();
const packFocus = new THREE.Vector3();
const desired = new THREE.Vector3();
const look = new THREE.Vector3();

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 65, -5));

  useFrame((_, delta) => {
    const ranked = physics.getRanked();
    const leader = ranked[0];
    if (!leader?.alive) return;
    let packLength = 0;
    while (packLength < ranked.length && packLength < 4 && ranked[packLength].alive) packLength += 1;

    const sample = COURSE_SAMPLES[leader.progressIndex];
    const progress = leader.progressIndex / Math.max(1, COURSE_SAMPLES.length - 1);
    const finishBlend = finishCameraBlend(progress);
    const baseShot = cameraShotForSection(sample.section.id, physics.getTimelineSeconds(), physics.hasStarted());
    const shot = finishCameraShot(baseShot, progress);
    const anchorIndex = Math.round(cameraAnchorProgress(sample.section) * (COURSE_SAMPLES.length - 1));
    const anchorSample = COURSE_SAMPLES[anchorIndex];
    leaderFocus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z);
    packFocus.set(0, 0, 0);
    for (let index = 0; index < packLength; index += 1) {
      const marble = ranked[index];
      packFocus.x += marble.body.position.x;
      packFocus.y += marble.body.position.y;
      packFocus.z += marble.body.position.z;
    }
    packFocus.multiplyScalar(1 / Math.max(1, packLength)).lerp(leaderFocus, 0.58);

    // The remaining leaders may still be one or two floors above the winner.
    // Blend fully to the winner before the finish so the upper deck cannot pull
    // the camera upward and block the final lane.
    if (finishBlend > 0) packFocus.lerp(leaderFocus, finishBlend);

    // Hold one camera position per section, like the real tabletop reference.
    // The camera pans with the pack but does not chase it, so rolling speed stays
    // visible against the road and the marble reads as a heavy moving object.
    desired.copy(anchorSample.point)
      .addScaledVector(anchorSample.tangent, -shot.behind)
      .addScaledVector(anchorSample.normal, shot.lift)
      .addScaledVector(anchorSample.right, shot.side);

    // Hard finish clearance: keep the lens below the preceding deck while the
    // large outside offset keeps it clear of the finish guard wall.
    if (finishBlend > 0) {
      const maxHeight = THREE.MathUtils.lerp(4.2, FINISH_MAX_CAMERA_HEIGHT_ABOVE_LEADER, finishBlend);
      desired.y = Math.min(desired.y, leaderFocus.y + maxHeight);
    }

    const positionAlpha = 1 - Math.exp(-delta * (finishBlend > 0 ? 4.8 : 2.8));
    const lookAlpha = 1 - Math.exp(-delta * 6.2);
    camera.position.lerp(desired, positionAlpha);
    look.copy(packFocus)
      .addScaledVector(sample.tangent, THREE.MathUtils.lerp(2.8, 1.7, finishBlend))
      .addScaledVector(sample.normal, THREE.MathUtils.lerp(0.55, 0.3, finishBlend));
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const nextFov = THREE.MathUtils.lerp(camera.fov, shot.fov, 1 - Math.exp(-delta * 3));
      if (Math.abs(nextFov - camera.fov) > 0.015) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}
