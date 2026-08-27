import { useMemo } from "react";
import * as THREE from "three";
import {
  korobeinikiReferenceBridgeDecor,
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
  }, [sceneIndex]);
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

function BridgeDecoration({
  courseX,
  courseY,
  width,
  rise,
  rotationRad,
  pins,
}: {
  courseX: number;
  courseY: number;
  width: number;
  rise: number;
  rotationRad: number;
  pins: number;
}) {
  const { curves, pinCenters, pinLengths, pinTips } = useMemo(() => {
    const halfWidth = width * RHYTHMIC_WORLD_SCALE * 0.5;
    const crest = rise * RHYTHMIC_WORLD_SCALE;
    const makeCurve = (offsetY: number) => new THREE.CatmullRomCurve3([
      new THREE.Vector3(-halfWidth, -crest * 0.18 + offsetY, -0.22),
      new THREE.Vector3(-halfWidth * 0.45, crest + offsetY, -0.22),
      new THREE.Vector3(0, crest * 0.82 + offsetY, -0.22),
      new THREE.Vector3(halfWidth * 0.45, crest * 0.92 + offsetY, -0.22),
      new THREE.Vector3(halfWidth, -crest * 0.28 + offsetY, -0.22),
    ], false, "catmullrom", 0.4);

    const upperCurve = makeCurve(0.024);
    const lowerCurve = makeCurve(-0.024);
    const pinCenters: THREE.Vector3[] = [];
    const pinLengths: number[] = [];
    const pinTips: THREE.Vector3[] = [];
    for (let index = 0; index < pins; index += 1) {
      const t = pins === 1 ? 0.5 : (index + 0.35) / (pins - 0.3);
      const top = upperCurve.getPoint(THREE.MathUtils.clamp(t, 0.06, 0.94));
      const foot = top.clone();
      foot.y -= crest * (0.64 + Math.sin(t * Math.PI) * 0.12);
      foot.z = -0.215;
      pinCenters.push(top.clone().lerp(foot, 0.5));
      pinLengths.push(Math.max(0.02, top.distanceTo(foot)));
      pinTips.push(top);
    }
    return { curves: [upperCurve, lowerCurve], pinCenters, pinLengths, pinTips };
  }, [pins, rise, width]);

  return (
    <group
      position={[
        (courseX - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
        -courseY * RHYTHMIC_WORLD_SCALE,
        0,
      ]}
      rotation={[0, 0, -rotationRad]}
    >
      {curves.map((curve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[curve, 26, 0.0105, 7, false]} />
          <meshStandardMaterial color="#2b2930" roughness={0.4} metalness={0.24} />
        </mesh>
      ))}
      {pinCenters.map((center, index) => (
        <group key={index}>
          <mesh position={center} castShadow>
            <cylinderGeometry args={[0.009, 0.009, pinLengths[index], 8]} />
            <meshStandardMaterial color="#26242c" roughness={0.42} metalness={0.18} />
          </mesh>
          <mesh position={pinTips[index]} castShadow>
            <sphereGeometry args={[0.021, 10, 8]} />
            <meshStandardMaterial color="#322f37" roughness={0.34} metalness={0.16} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function KorobeinikiReferenceDecor3D() {
  const bridges = useMemo(() => korobeinikiReferenceBridgeDecor(), []);
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
                    variant={sceneIndex * 5 + tube.index}
                  />
                </group>
              );
            })}
            <EntryWire sceneIndex={sceneIndex} />
          </group>
        );
      })}
      {bridges.map((bridge) => (
        <BridgeDecoration
          key={`bridge-${bridge.sceneIndex}`}
          courseX={bridge.x}
          courseY={bridge.y}
          width={bridge.width}
          rise={bridge.rise}
          rotationRad={bridge.rotationRad}
          pins={bridge.pins}
        />
      ))}
    </group>
  );
}
