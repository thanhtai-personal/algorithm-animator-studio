import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";

export function MarbleBoostTrails3D({ physics }: { physics: RacePhysics }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const steps = physics.marbleCount > 300 ? 3 : 5;
  const count = physics.roster.length * steps;
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const identity = useMemo(() => new THREE.Quaternion(), []);
  const updateElapsed = useRef(0);

  useLayoutEffect(() => {
    if (!ref.current) return;
    physics.roster.forEach((marble, marbleIndex) => {
      const color = new THREE.Color(marble.color).lerp(new THREE.Color("#ffffff"), 0.24);
      for (let step = 0; step < steps; step += 1) ref.current?.setColorAt(marbleIndex * steps + step, color);
    });
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [physics, steps]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    updateElapsed.current += Math.min(0.1, delta);
    const updateFps = physics.marbleCount > 120 ? 20 : 30;
    if (updateElapsed.current < 1 / updateFps) return;
    updateElapsed.current %= 1 / updateFps;
    physics.roster.forEach((config, marbleIndex) => {
      const runtime = physics.getMarble(config.id);
      const strength = runtime?.alive ? physics.pianoTrail(config.id) : 0;
      if (runtime && strength > 0) {
        const body = runtime.body;
        direction.set(body.velocity.x, body.velocity.y, body.velocity.z);
        if (direction.lengthSq() < 0.04) direction.copy(COURSE_SAMPLES[runtime.progressIndex].tangent);
        else direction.normalize();
        for (let step = 0; step < steps; step += 1) {
          const fade = strength * (1 - step / (steps + 0.5));
          position.set(body.position.x, body.position.y, body.position.z)
            .addScaledVector(direction, -physics.marbleRadius * (1.2 + step * 0.82));
          scale.setScalar(physics.marbleRadius * (0.62 - step * 0.075) * fade);
          matrix.compose(position, identity, scale);
          ref.current?.setMatrixAt(marbleIndex * steps + step, matrix);
        }
      } else {
        scale.set(0, 0, 0);
        for (let step = 0; step < steps; step += 1) {
          matrix.compose(position.set(0, 0, 0), identity, scale);
          ref.current?.setMatrixAt(marbleIndex * steps + step, matrix);
        }
      }
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false} userData={{ cameraIgnore: true }}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.44}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
