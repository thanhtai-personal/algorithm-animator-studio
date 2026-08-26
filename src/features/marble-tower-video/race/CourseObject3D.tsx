import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { CourseObjectId } from '../physics/CourseObjectLifecycle';
import type { RacePhysics } from '../physics/RacePhysics';

const VISIBILITY_CHECK_INTERVAL = 6;

export function CourseObject3D({ physics, id, children }: {
  physics: RacePhysics;
  id: CourseObjectId;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const boxRef = useRef(new THREE.Box3());
  const frustumRef = useRef(new THREE.Frustum());
  const projectionRef = useRef(new THREE.Matrix4());
  const frameRef = useRef(0);
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const active = physics.courseObjectVisible(id);
    group.visible = active;
    if (!active || frameRef.current++ % VISIBILITY_CHECK_INTERVAL !== 0) return;

    projectionRef.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustumRef.current.setFromProjectionMatrix(projectionRef.current);
    boxRef.current.setFromObject(group);
    physics.setCourseObjectInView(id, frustumRef.current.intersectsBox(boxRef.current));
  });

  return <group ref={groupRef}>{children}</group>;
}
