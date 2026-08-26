import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { RacePhysics } from '../physics/RacePhysics';

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const body = physics.getPlayerBody();
    if (!body) return;
    target.set(body.position.x, body.position.y, body.position.z);
    const z = body.position.z;
    const offset = z < 20 ? [0, 7.8, -13.5]
      : z < 55 ? [0, 5.3, -9.5]
        : z < 73 ? [6.6, 5.0, -7.6]
          : z < 95 ? [0, 4.2, -8.2]
            : z < 160 ? [-4.8, 5.4, -8.6]
              : [4.6, 4.1, -7.2];
    desired.set(target.x + offset[0], target.y + offset[1], target.z + offset[2]);
    const smooth = 1 - Math.exp(-delta * 4.2);
    camera.position.lerp(desired, smooth);
    look.set(target.x * 0.5, target.y + 0.35, target.z + 4.5);
    camera.lookAt(look);
  });

  return null;
}
