import { useMemo } from "react";
import * as THREE from "three";
import {
  korobeinikiReferenceDecorForScene,
  korobeinikiReferenceLabelForScene,
  korobeinikiReferenceSceneHit,
  korobeinikiReferenceTubeDepth,
  KOROBEINIKI_REFERENCE_SCENE_STARTS,
} from "../lib/korobeinikiReferenceLayout";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { WallBoomwhackerMesh } from "./RhythmicWallBoomwhacker3D";
import { KorobeinikiWallLabel3D } from "./KorobeinikiWallLabel3D";

function worldPoint(x: number, y: number, z = 0) {
  return new THREE.Vector3(
    (x - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
    -y * RHYTHMIC_WORLD_SCALE,
    z,
  );
}

function EntryWire({ sceneIndex }: { sceneIndex: number }) {
  const curves = useMemo(() => {
    const decor = korobeinikiReferenceDecorForScene(sceneIndex);
    const hit = korobeinikiReferenceSceneHit(sceneIndex);
    if (!decor.length || !hit) return [];
    const from = worldPoint(decor.at(-1)!.x + 18, decor.at(-1)!.y + 8, -0.2);
    const to = worldPoint(hit.x - 20, hit.y - 6, -0.2);
    const delta = to.clone().sub(from);
    const planarLength = Math.max(0.001, Math.hypot(delta.x, delta.y));
    const normal = new THREE.Vector3(-delta.y / planarLength, delta.x / planarLength, 0);
    return [-0.018, 0.018].map((strand) => {
      const strandOffset = normal.clone().multiplyScalar(strand);
      return new THREE.CatmullRomCurve3([
        from.clone().add(strandOffset),
        from.clone().lerp(to, 0.32).addScaledVector(normal, 0.09 + strand),
        from.clone().lerp(to, 0.68).addScaledVector(normal, -0.05 + strand),
        to.clone().add(strandOffset),
      ], false, "catmullrom", 0.38);
    });
  }, [sceneIndex]);
  if (!curves.length) return null;
  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[curve, 28, 0.01, 7, false]} />
          <meshStandardMaterial color="#1d1b20" roughness={0.42} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function KorobeinikiReferenceDecor3D() {
  return (
    <group>
      {KOROBEINIKI_REFERENCE_SCENE_STARTS.map((_, sceneIndex) => {
        const label = korobeinikiReferenceLabelForScene(sceneIndex)!;
        return (
          <group key={sceneIndex}>
            <KorobeinikiWallLabel3D courseX={label.x} courseY={label.y} />
            {korobeinikiReferenceDecorForScene(sceneIndex).map((tube) => {
              const tubeDepth = korobeinikiReferenceTubeDepth(tube.index);
              const position = worldPoint(tube.x, tube.y, -tubeDepth / 2);
              return (
                <group key={tube.index} position={position} rotation={[0, 0, ((tube.index % 3) - 1) * 0.015]}>
                  <WallBoomwhackerMesh
                    w={0.92}
                    h={0.48}
                    d={tubeDepth}
                    color={tube.color}
                    style="wall-boomwhacker-tube"
                    selected={false}
                    glow={0.04}
                    detail={1}
                    variant={sceneIndex * 5 + tube.index}
                  />
                </group>
              );
            })}
            <EntryWire sceneIndex={sceneIndex} />
          </group>
        );
      })}
    </group>
  );
}
