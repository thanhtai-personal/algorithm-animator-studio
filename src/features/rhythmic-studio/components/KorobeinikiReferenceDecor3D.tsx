import { useMemo } from "react";
import * as THREE from "three";
import {
  korobeinikiReferenceTubeDepth,
  wallScoreEntryDecor,
  wallScoreLabelPosition,
  wallScoreSceneStartIndices,
} from "../lib/korobeinikiReferenceLayout";
import type { MarblePlatform } from "../lib/marbleCourse";
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

interface CoursePoint {
  x: number;
  y: number;
}

function EntryWire({ decor, hit }: { decor: CoursePoint[]; hit: CoursePoint }) {
  const curves = useMemo(() => {
    if (!decor.length) return [];
    const finalTube = decor.at(-1)!;
    const from = worldPoint(finalTube.x + 28, finalTube.y + 8, -0.21);
    const to = worldPoint(hit.x - 12, hit.y + 2, -0.2);
    const delta = to.clone().sub(from);
    const planarLength = Math.max(0.001, Math.hypot(delta.x, delta.y));
    const tangent = new THREE.Vector3(delta.x / planarLength, delta.y / planarLength, 0);
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
    return [-0.018, 0.018].map((strand) => {
      const strandOffset = normal.clone().multiplyScalar(strand);
      return new THREE.CatmullRomCurve3([
        from.clone().add(strandOffset),
        from.clone().addScaledVector(tangent, planarLength * 0.28).addScaledVector(normal, 0.024 + strand),
        from.clone().addScaledVector(tangent, planarLength * 0.58).addScaledVector(normal, -0.034 + strand),
        to.clone().add(strandOffset),
      ], false, "catmullrom", 0.32);
    });
  }, [decor, hit]);
  if (!curves.length) return null;
  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[curve, 22, 0.0085, 7, false]} />
          <meshStandardMaterial color="#1c1a20" roughness={0.44} metalness={0.24} />
        </mesh>
      ))}
    </group>
  );
}

export function KorobeinikiReferenceDecor3D({ platforms }: { platforms: MarblePlatform[] }) {
  const sceneStarts = useMemo(
    () => wallScoreSceneStartIndices(platforms.map((platform) => platform.event)),
    [platforms],
  );
  const first = platforms[0];
  if (!first) return null;
  const entryOrigin = { x: first.visualX ?? first.hitX, y: first.visualY ?? first.hitY };
  const entryDecor = wallScoreEntryDecor(entryOrigin);
  return (
    <group>
      {sceneStarts.map((platformIndex, sceneIndex) => {
        const platform = platforms[platformIndex];
        const origin = { x: platform.visualX ?? platform.hitX, y: platform.visualY ?? platform.hitY };
        const label = wallScoreLabelPosition(origin, sceneIndex);
        return (
          <group key={sceneIndex}>
            <KorobeinikiWallLabel3D courseX={label.x} courseY={label.y} />
          </group>
        );
      })}
      {entryDecor.map((tube) => {
        const tubeDepth = korobeinikiReferenceTubeDepth(tube.index);
        const position = worldPoint(tube.x, tube.y, -tubeDepth / 2);
        return (
          <group key={tube.index} position={position} rotation={[0, 0, ((tube.index % 3) - 1) * 0.01]}>
            <WallBoomwhackerMesh
              w={0.92}
              h={0.48}
              d={tubeDepth}
              color={tube.color}
              style="wall-boomwhacker-tube"
              selected={false}
              glow={0.02}
              detail={1}
              variant={tube.index}
            />
          </group>
        );
      })}
      <EntryWire decor={entryDecor} hit={{ x: first.hitX, y: first.hitY }} />
    </group>
  );
}
