import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";

export function MarbleField3D({ physics }: { physics: RacePhysics }) {
  const balls = useRef<THREE.InstancedMesh>(null);
  const stripes = useRef<THREE.InstancedMesh>(null);
  const striped = useMemo(
    () => physics.roster.filter((marble) => marble.stripeColor),
    [physics],
  );
  const stripedIndex = useMemo(
    () => new Map(striped.map((marble, index) => [marble.id, index])),
    [striped],
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    if (balls.current) {
      physics.roster.forEach((marble, index) => balls.current?.setColorAt(index, new THREE.Color(marble.color)));
      if (balls.current.instanceColor) balls.current.instanceColor.needsUpdate = true;
    }
    if (stripes.current) {
      striped.forEach((marble, index) => stripes.current?.setColorAt(index, new THREE.Color(marble.stripeColor!)));
      if (stripes.current.instanceColor) stripes.current.instanceColor.needsUpdate = true;
    }
  }, [physics, striped]);

  useFrame(() => {
    if (!balls.current) return;
    physics.roster.forEach((config, index) => {
      const runtime = physics.getMarble(config.id);
      if (!runtime?.alive) {
        matrix.makeScale(0, 0, 0);
        balls.current?.setMatrixAt(index, matrix);
        const stripeSlot = stripedIndex.get(config.id);
        if (stripeSlot !== undefined) stripes.current?.setMatrixAt(stripeSlot, matrix);
        return;
      }
      const body = runtime.body;
      position.set(body.position.x, body.position.y, body.position.z);
      quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      scale.setScalar(physics.marbleRadius);
      matrix.compose(position, quaternion, scale);
      balls.current?.setMatrixAt(index, matrix);
      const stripeSlot = stripedIndex.get(config.id);
      if (stripeSlot !== undefined) stripes.current?.setMatrixAt(stripeSlot, matrix);
    });
    balls.current.instanceMatrix.needsUpdate = true;
    if (stripes.current) stripes.current.instanceMatrix.needsUpdate = true;
  });

  const shadow = physics.marbleCount <= 220;
  return (
    <group>
      <instancedMesh ref={balls} args={[undefined, undefined, physics.roster.length]} castShadow={shadow} frustumCulled={false} userData={{ cameraIgnore: true }}>
        <sphereGeometry args={[1, physics.marbleCount > 300 ? 14 : 22, physics.marbleCount > 300 ? 10 : 16]} />
        <meshPhysicalMaterial vertexColors metalness={0.16} roughness={0.13} clearcoat={0.92} clearcoatRoughness={0.06} />
      </instancedMesh>
      {striped.length ? (
        <instancedMesh ref={stripes} args={[undefined, undefined, striped.length]} castShadow={false} frustumCulled={false} userData={{ cameraIgnore: true }}>
          <torusGeometry args={[0.72, 0.115, 8, 20]} />
          <meshPhysicalMaterial vertexColors roughness={0.15} metalness={0.12} clearcoat={0.8} />
        </instancedMesh>
      ) : null}
    </group>
  );
}
