import { useMemo } from "react";
import * as THREE from "three";
import type { MarblePlatform } from "../lib/marbleCourse";
import type { StudioSettings } from "../types";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import {
  isKorobeinikiWallLayout,
  wallScoreRailSegments,
  wallScoreTubeContactDepth3D,
} from "../lib/korobeinikiReferenceLayout";
import { usesSharedWallScore } from "../lib/wallScoreLayout";
import { resolvePlatformStyle } from "../lib/platformStyles";
import {
  isAutomaticLongGapRail,
  longGapRailPoints,
  longGapRailSupportPoints,
} from "../lib/longGapRail";
import { instrumentMarbleContactDepth3D } from "./instrumentPlayingSurface3D";

function worldPoint(point: Pick<MarblePlatform, "hitX" | "hitY"> | { x: number; y: number }, z = -0.2) {
  const x = "hitX" in point ? point.hitX : point.x;
  const y = "hitY" in point ? point.hitY : point.y;
  return new THREE.Vector3(
    (x - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
    -y * RHYTHMIC_WORLD_SCALE,
    z,
  );
}

interface GuideRailGroup3D {
  points: THREE.Vector3[];
  halfGap: number;
  offsetAxis: "depth" | "surface-normal";
}

function RailSegment({ points, offset, offsetAxis }: {
  points: THREE.Vector3[];
  offset: number;
  offsetAxis: GuideRailGroup3D["offsetAxis"];
}) {
  const curve = useMemo(() => {
    const shifted = points.map((point, index) => {
      if (offsetAxis === "depth") {
        return point.clone().add(new THREE.Vector3(0, 0, offset));
      }
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      const tangent = next.clone().sub(previous);
      const length = Math.max(0.001, Math.hypot(tangent.x, tangent.y));
      return point.clone().add(new THREE.Vector3(-tangent.y / length * offset, tangent.x / length * offset, 0));
    });
    return new THREE.CatmullRomCurve3(shifted, false, "catmullrom", 0.34);
  }, [offset, offsetAxis, points]);
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, Math.max(24, points.length * 12), 0.012, 8, false]} />
      <meshStandardMaterial color="#35383b" roughness={0.28} metalness={0.76} />
    </mesh>
  );
}

function railContactDepth(platform: MarblePlatform, settings: StudioSettings) {
  const style = platform.visualStyle ?? resolvePlatformStyle(platform.index, settings);
  if (style === "wall-boomwhacker-tube" && isKorobeinikiWallLayout(settings)) {
    return wallScoreTubeContactDepth3D(platform.index, settings);
  }
  return instrumentMarbleContactDepth3D(style, settings.ballSize * RHYTHMIC_WORLD_SCALE);
}

export function wallScoreGuideRailGroups3D(
  platforms: MarblePlatform[],
  settings: StudioSettings,
  focusIndex: number,
) {
  if (!settings.showcaseRails || platforms.length < 2 || !usesSharedWallScore(settings)) {
    return [] as THREE.Vector3[][];
  }
  return wallScoreRailSegments(platforms, settings.ballSize)
    .filter((segment) => Math.abs(segment.afterIndex - focusIndex) <= 24)
    .map((segment) => {
      const start = platforms[segment.afterIndex];
      const end = platforms[segment.afterIndex + 1];
      const startZ = railContactDepth(start, settings);
      const endZ = railContactDepth(end, settings);
      return segment.points.map((point, pointIndex) => worldPoint(
        point,
        THREE.MathUtils.lerp(startZ, endZ, pointIndex / Math.max(1, segment.points.length - 1)),
      ));
    });
}

export function automaticLongGapRailGroups3D(
  platforms: MarblePlatform[],
  settings: StudioSettings,
  focusIndex: number,
): GuideRailGroup3D[] {
  const result: GuideRailGroup3D[] = [];
  for (let index = 0; index < platforms.length - 1; index += 1) {
    const start = platforms[index];
    const end = platforms[index + 1];
    if (!isAutomaticLongGapRail(start, end) || Math.abs(index - focusIndex) > 24) continue;
    const startZ = railContactDepth(start, settings);
    const endZ = railContactDepth(end, settings);
    const physicalSupport = start.longRouteKind === "horizontal-rail";
    const routePoints = physicalSupport
      ? longGapRailSupportPoints(start, end, settings.ballSize, 10)
      : longGapRailPoints(start, end, 10);
    const points = routePoints
      .map((point, pointIndex, all) => worldPoint(
        point,
        THREE.MathUtils.lerp(startZ, endZ, pointIndex / Math.max(1, all.length - 1)),
      ));
    result.push({
      points,
      halfGap: Math.max(0.05, settings.ballSize * RHYTHMIC_WORLD_SCALE * 0.48),
      offsetAxis: physicalSupport ? "depth" : "surface-normal",
    });
  }
  return result;
}

export function RhythmicGuideRails3D({ platforms, settings, focusIndex }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  focusIndex: number;
}) {
  const groups = useMemo(() => {
    const result = automaticLongGapRailGroups3D(platforms, settings, focusIndex);

    if (!settings.showcaseRails || platforms.length < 2) return result;
    const showcaseGroups = usesSharedWallScore(settings)
      ? wallScoreGuideRailGroups3D(platforms, settings, focusIndex)
      : (() => {
          if (platforms.length < 4) return [] as THREE.Vector3[][];
          const visible = platforms.filter((platform) => Math.abs(platform.index - focusIndex) <= 24);
          const stride = Math.max(4, Math.round(10 - settings.showcaseRailDensity * 5));
          const groupLength = Math.max(4, Math.round(4 + settings.showcaseRailDensity * 3));
          const decorated: THREE.Vector3[][] = [];
          for (let start = 1; start < visible.length - 2; start += stride) {
            const slice = visible.slice(start, Math.min(visible.length, start + groupLength));
            if (slice.length < 4) continue;
            decorated.push(slice.map((platform) => worldPoint(platform)));
          }
          return decorated;
        })();
    showcaseGroups.forEach((points) => result.push({
      points,
      halfGap: 0.035,
      offsetAxis: "surface-normal",
    }));
    return result;
  }, [focusIndex, platforms, settings]);

  if (!groups.length) return null;
  return (
    <group renderOrder={-2}>
      {groups.map((group, index) => (
        <group key={index}>
          <RailSegment points={group.points} offset={-group.halfGap} offsetAxis={group.offsetAxis} />
          <RailSegment points={group.points} offset={group.halfGap} offsetAxis={group.offsetAxis} />
          {group.points.filter((_, pointIndex) => pointIndex % 3 === 0).map((point, pointIndex) => (
            <group key={pointIndex} position={point}>
              <mesh position={[0, 0, -0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.42, 8]} />
                <meshStandardMaterial color="#45484b" roughness={0.3} metalness={0.72} />
              </mesh>
              <mesh position={[0, 0, -0.56]}>
                <sphereGeometry args={[0.018, 10, 7]} />
                <meshStandardMaterial color="#5c6063" roughness={0.25} metalness={0.74} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
