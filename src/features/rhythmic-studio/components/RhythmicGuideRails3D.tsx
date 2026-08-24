import { useMemo } from "react";
import * as THREE from "three";
import type { MarblePlatform } from "../lib/marbleCourse";
import type { StudioSettings } from "../types";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";

function worldPoint(platform: MarblePlatform, z = -0.2) {
  return new THREE.Vector3(
    (platform.hitX - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
    -platform.hitY * RHYTHMIC_WORLD_SCALE,
    z,
  );
}

function RailSegment({ points, offset }: { points: THREE.Vector3[]; offset: number }) {
  const curve = useMemo(() => {
    const shifted = points.map((point, index) => point.clone().add(new THREE.Vector3(offset * (index % 2 ? 0.82 : 1), 0, 0)));
    return new THREE.CatmullRomCurve3(shifted, false, "catmullrom", 0.34);
  }, [offset, points]);
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, Math.max(24, points.length * 12), 0.022, 8, false]} />
      <meshStandardMaterial color="#7d858b" roughness={0.2} metalness={0.86} />
    </mesh>
  );
}

export function RhythmicGuideRails3D({ platforms, settings, focusIndex }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  focusIndex: number;
}) {
  const groups = useMemo(() => {
    if (!settings.showcaseRails || platforms.length < 4) return [] as THREE.Vector3[][];
    const visible = platforms.filter((platform) => Math.abs(platform.index - focusIndex) <= 24);
    const stride = Math.max(4, Math.round(10 - settings.showcaseRailDensity * 5));
    const length = Math.max(4, Math.round(4 + settings.showcaseRailDensity * 3));
    const result: THREE.Vector3[][] = [];
    for (let start = 1; start < visible.length - 2; start += stride) {
      const slice = visible.slice(start, Math.min(visible.length, start + length));
      if (slice.length < 4) continue;
      result.push(slice.map((platform) => worldPoint(platform)));
    }
    return result;
  }, [focusIndex, platforms, settings.showcaseRailDensity, settings.showcaseRails]);

  if (!groups.length) return null;
  return (
    <group renderOrder={-2}>
      {groups.map((points, index) => (
        <group key={index}>
          <RailSegment points={points} offset={-0.055} />
          <RailSegment points={points} offset={0.055} />
          {points.filter((_, pointIndex) => pointIndex % 2 === 0).map((point, pointIndex) => (
            <group key={pointIndex} position={point}>
              <mesh position={[0, 0, -0.58]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 1.05, 10]} />
                <meshStandardMaterial color="#8a9198" roughness={0.26} metalness={0.82} />
              </mesh>
              <mesh position={[0, 0, -1.1]}>
                <sphereGeometry args={[0.035, 12, 8]} />
                <meshStandardMaterial color="#b6bcc0" roughness={0.2} metalness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
