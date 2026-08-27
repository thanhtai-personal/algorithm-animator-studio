import { useMemo } from "react";
import * as THREE from "three";
import type { MarblePlatform } from "../lib/marbleCourse";
import type { StudioSettings } from "../types";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { isKorobeinikiWallLayout, korobeinikiBridgeAfterIndices } from "../lib/korobeinikiReferenceLayout";

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

function ReferenceWireBridge({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const geometry = useMemo(() => {
    const center = from.clone().lerp(to, 0.53);
    const delta = to.clone().sub(from);
    const planarLength = Math.max(0.001, Math.hypot(delta.x, delta.y));
    const tangent = new THREE.Vector3(delta.x / planarLength, delta.y / planarLength, 0);
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
    const halfSpan = Math.min(0.82, Math.max(0.58, planarLength * 0.17));
    const pointAt = (t: number, strand: number) => center.clone()
      .addScaledVector(tangent, (t - 0.5) * halfSpan * 2)
      .addScaledVector(normal, strand + Math.sin(t * Math.PI) * 0.1)
      .setZ(-0.31);
    const curves = [-0.05, 0.05].map((strand) => new THREE.CatmullRomCurve3(
      [0, 0.25, 0.5, 0.75, 1].map((t) => pointAt(t, strand)),
      false,
      "catmullrom",
      0.42,
    ));
    const pins = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => {
      const foot = pointAt(t, 0);
      return {
        foot,
        top: foot.clone().addScaledVector(normal, 0.16 + Math.sin(t * Math.PI) * 0.06).setZ(-0.23),
      };
    });
    return { curves, pins };
  }, [from, to]);
  return (
    <group>
      {geometry.curves.map((curve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[curve, 32, 0.014, 7, false]} />
          <meshStandardMaterial color="#1a191e" roughness={0.42} metalness={0.24} />
        </mesh>
      ))}
      {geometry.pins.map(({ foot, top }, index) => {
        const axis = top.clone().sub(foot);
        const length = Math.max(0.001, axis.length());
        const center = foot.clone().lerp(top, 0.5);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          axis.clone().normalize(),
        );
        return (
          <group key={`pin-${index}`}>
            <mesh position={center} quaternion={quaternion} castShadow>
              <cylinderGeometry args={[0.012, 0.012, length, 8]} />
              <meshStandardMaterial color="#26242b" roughness={0.4} metalness={0.22} />
            </mesh>
            <mesh position={top} castShadow>
              <sphereGeometry args={[0.026, 10, 8]} />
              <meshStandardMaterial color="#302e35" roughness={0.34} metalness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function RhythmicGuideRails3D({ platforms, settings, focusIndex }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  focusIndex: number;
}) {
  const referenceBridges = useMemo(() => {
    if (!settings.showcaseRails || !isKorobeinikiWallLayout(settings)) return [];
    return korobeinikiBridgeAfterIndices(platforms.map((platform) => platform.event))
      .filter((index) => index >= focusIndex - 24 && index <= focusIndex + 24)
      .flatMap((index) => {
        const start = platforms[index];
        const end = platforms[index + 1];
        return start && end
          ? [{ index, from: worldPoint(start, -0.34), to: worldPoint(end, -0.34) }]
          : [];
      });
  }, [focusIndex, platforms, settings]);
  const groups = useMemo(() => {
    if (isKorobeinikiWallLayout(settings) || !settings.showcaseRails || platforms.length < 4) return [] as THREE.Vector3[][];
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
  }, [focusIndex, platforms, settings]);

  if (referenceBridges.length) {
    return <group renderOrder={-2}>{referenceBridges.map((bridge) => (
      <ReferenceWireBridge key={bridge.index} from={bridge.from} to={bridge.to} />
    ))}</group>;
  }
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
