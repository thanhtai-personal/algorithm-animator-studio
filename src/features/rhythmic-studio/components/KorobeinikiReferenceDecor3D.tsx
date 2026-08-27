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
  const curve = useMemo(() => {
    const decor = korobeinikiReferenceDecorForScene(sceneIndex);
    const hit = korobeinikiReferenceSceneHit(sceneIndex);
    if (!decor.length || !hit) return null;
    const from = worldPoint(decor.at(-1)!.x + 18, decor.at(-1)!.y + 8, -0.2);
    const to = worldPoint(hit.x - 20, hit.y - 6, -0.2);
    const delta = to.clone().sub(from);
    const normal = new THREE.Vector3(-delta.y, delta.x, 0).normalize();
    return new THREE.CatmullRomCurve3([
      from,
      from.clone().lerp(to, 0.34).addScaledVector(normal, 0.11),
      from.clone().lerp(to, 0.68).addScaledVector(normal, -0.08),
      to,
    ], false, "catmullrom", 0.34);
  }, [sceneIndex]);
  if (!curve) return null;
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 32, 0.014, 7, false]} />
      <meshStandardMaterial color="#151419" roughness={0.44} metalness={0.34} />
    </mesh>
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
                <group key={tube.index} position={position} rotation={[0, 0, ((tube.index % 3) - 1) * 0.012]}>
                  <WallBoomwhackerMesh
                    w={0.72}
                    h={0.36}
                    d={tubeDepth}
                    color={tube.color}
                    style="wall-boomwhacker-tube"
                    selected={false}
                    glow={0.1}
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
