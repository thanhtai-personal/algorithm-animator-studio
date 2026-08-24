import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { CourseItemOverride, CourseLongItem, StudioSettings } from "../types";
import { LONG_GAP_TUBE_MS, longGapTubeGeometry, longGapTubePoint, type MarblePlatform } from "../lib/marbleCourse";
import { guidedCoursePoint, isLongCourseItem, overrideForSegment } from "../lib/courseGuide";
import type { NoteEvent } from "../types";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

function worldPoint(x: number, y: number, z = 0) {
  return new THREE.Vector3(
    (x - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
    -y * RHYTHMIC_WORLD_SCALE,
    z,
  );
}

function segmentCurve(start: MarblePlatform, end: MarblePlatform, style: CourseLongItem, settings: StudioSettings, z = 0) {
  const points: THREE.Vector3[] = [];
  const steps = 18;
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const guided = guidedCoursePoint(start, end, t, style, settings) ?? {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
    points.push(worldPoint(guided.x, guided.y, z));
  }
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.32);
}


function autoTubeCurve(start: MarblePlatform, end: MarblePlatform, settings: StudioSettings) {
  const geometry = longGapTubeGeometry(start, end, settings);
  const points: THREE.Vector3[] = [];
  const steps = 28;
  for (let index = 0; index <= steps; index += 1) {
    const point = longGapTubePoint(geometry, index / steps);
    points.push(worldPoint(point.x, point.y, 0));
  }
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.34);
}

function AutoGlassTubeSegment({ start, end, settings, color }: Omit<SegmentProps, "style">) {
  const curve = useMemo(() => autoTubeCurve(start, end, settings), [end, settings, start]);
  const radius = settings.terrainProfile === "tube-board" ? 0.19 : 0.17;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 64, radius, 18, false]} />
        <meshPhysicalMaterial
          color={color}
          transmission={0.92}
          roughness={0.035}
          thickness={0.42}
          ior={1.46}
          clearcoat={1}
          clearcoatRoughness={0.018}
          attenuationColor={color}
          attenuationDistance={3.2}
          envMapIntensity={1.65}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 64, radius * 0.68, 12, false]} />
        <meshPhysicalMaterial color="#edf9ff" transparent opacity={0.08} roughness={0.04} side={THREE.BackSide} />
      </mesh>
      {[start, end].map((platform, index) => (
        <mesh key={index} position={worldPoint(platform.hitX, platform.hitY, 0)} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[radius * 0.94, radius * 0.1, 10, 24]} />
          <meshStandardMaterial color="#dceaf4" roughness={0.18} metalness={0.74} />
        </mesh>
      ))}
    </group>
  );
}
function GlassTubeSegment({ start, end, style, settings, color }: SegmentProps) {
  const curve = useMemo(() => segmentCurve(start, end, style, settings), [end, settings, start, style]);
  const radius = style === "acrylic-pipe" ? 0.18 : 0.21;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 48, radius, 16, false]} />
        <meshPhysicalMaterial
          color={color}
          transmission={style === "acrylic-pipe" ? 0.78 : 0.93}
          roughness={style === "acrylic-pipe" ? 0.1 : 0.035}
          thickness={0.42}
          ior={style === "acrylic-pipe" ? 1.49 : 1.46}
          clearcoat={1}
          clearcoatRoughness={0.025}
          attenuationColor={color}
          attenuationDistance={3}
          envMapIntensity={1.55}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 48, radius * 0.68, 12, false]} />
        <meshPhysicalMaterial color="#eafaff" transparent opacity={0.055} roughness={0.04} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function GlassChannelSegment({ start, end, style, settings, color }: SegmentProps) {
  const left = useMemo(() => segmentCurve(start, end, style, settings, -0.16), [end, settings, start, style]);
  const right = useMemo(() => segmentCurve(start, end, style, settings, 0.16), [end, settings, start, style]);
  const center = useMemo(() => segmentCurve(start, end, style, settings, 0), [end, settings, start, style]);
  return (
    <group>
      {[left, right].map((curve, index) => (
        <mesh key={index} castShadow receiveShadow>
          <tubeGeometry args={[curve, 44, 0.075, 12, false]} />
          <meshPhysicalMaterial color={color} transmission={0.82} roughness={0.07} thickness={0.36} ior={1.46} clearcoat={1} envMapIntensity={1.5} />
        </mesh>
      ))}
      <mesh>
        <tubeGeometry args={[center, 44, 0.035, 8, false]} />
        <meshStandardMaterial color="#dff7ff" emissive={color} emissiveIntensity={0.3} roughness={0.16} metalness={0.12} />
      </mesh>
    </group>
  );
}

function NeonBridgeSegment({ start, end, style, settings, color }: SegmentProps) {
  const left = useMemo(() => segmentCurve(start, end, style, settings, -0.18), [end, settings, start, style]);
  const right = useMemo(() => segmentCurve(start, end, style, settings, 0.18), [end, settings, start, style]);
  return (
    <group position={[0, -settings.ballSize * RHYTHMIC_WORLD_SCALE * 0.9, 0]}>
      {[left, right].map((curve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[curve, 44, 0.045, 10, false]} />
          <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.72} roughness={0.16} metalness={0.38} clearcoat={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function StairFlightSegment({ start, end, settings, color }: Omit<SegmentProps, "style">) {
  const steps = 8;
  const startPoint = worldPoint(start.hitX, start.hitY);
  const endPoint = worldPoint(end.hitX, end.hitY);
  const direction = endPoint.clone().sub(startPoint);
  const angle = Math.atan2(direction.y, direction.x);
  return (
    <group position={[0, -settings.ballSize * RHYTHMIC_WORLD_SCALE * 0.9, 0]}>
      {Array.from({ length: steps }, (_, index) => {
        const t = index / Math.max(1, steps - 1);
        const point = startPoint.clone().lerp(endPoint, t);
        return (
          <RoundedBox
            key={index}
            position={[point.x, point.y, point.z]}
            rotation={[0, 0, angle]}
            args={[0.52, 0.13, 0.5]}
            radius={0.045}
            smoothness={3}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial color={color} roughness={0.24} metalness={0.38} clearcoat={0.6} />
          </RoundedBox>
        );
      })}
    </group>
  );
}

interface SegmentProps {
  start: MarblePlatform;
  end: MarblePlatform;
  style: CourseLongItem;
  settings: StudioSettings;
  color: string;
}

function LongSegment(props: SegmentProps) {
  if (props.style === "glass-channel") return <GlassChannelSegment {...props} />;
  if (props.style === "neon-bridge") return <NeonBridgeSegment {...props} />;
  if (props.style === "stair-flight") return <StairFlightSegment start={props.start} end={props.end} settings={props.settings} color={props.color} />;
  return <GlassTubeSegment {...props} />;
}

export function RhythmicCourseItems3D({ platforms, overrides, settings, focusIndex, events, resolveSettings }: {
  platforms: MarblePlatform[];
  overrides: CourseItemOverride[];
  settings: StudioSettings;
  focusIndex: number;
  events: NoteEvent[];
  resolveSettings?: StudioSettingsResolver;
}) {
  const visibleOverrides = useMemo(() => overrides.filter((override) => {
    if (!isLongCourseItem(override.style)) return false;
    const start = Math.max(0, override.startIndex);
    const end = Math.min(platforms.length - 1, override.startIndex + Math.max(1, override.span) - 1);
    return end >= focusIndex - 20 && start <= focusIndex + 20;
  }), [focusIndex, overrides, platforms.length]);

  const autoTubeSegments = useMemo(() => {
    const segments: { start: MarblePlatform; end: MarblePlatform; color: string; key: string; settings: StudioSettings }[] = [];
    for (let index = 0; index < platforms.length - 1; index += 1) {
      const segmentSettings = resolveSettings?.(index) ?? settings;
      if (segmentSettings.terrainProfile === "comet" || segmentSettings.terrainProfile === "xylophone") continue;
      const span = events[index + 1].timeMs - events[index].timeMs;
      if (span < LONG_GAP_TUBE_MS || overrideForSegment(index, overrides)) continue;
      const start = platforms[index];
      const end = platforms[index + 1];
      if (!start || !end) continue;
      if (index < focusIndex - 18 || index > focusIndex + 18) continue;
      const color = `#${new THREE.Color(start.color).lerp(new THREE.Color(end.color), 0.5).getHexString()}`;
      segments.push({ start, end, color, key: `auto-gap:${index}`, settings: segmentSettings });
    }
    return segments;
  }, [events, focusIndex, overrides, platforms, resolveSettings, settings]);

  return (
    <group>
      {autoTubeSegments.map((segment) => <AutoGlassTubeSegment key={segment.key} start={segment.start} end={segment.end} settings={segment.settings} color={segment.color} />)}
      {visibleOverrides.flatMap((override) => {
        if (!isLongCourseItem(override.style)) return [];
        const startIndex = Math.max(0, Math.min(platforms.length - 1, override.startIndex));
        const endIndex = Math.max(startIndex, Math.min(platforms.length - 1, override.startIndex + Math.max(1, override.span) - 1));
        const segments = [];
        for (let index = startIndex; index < endIndex; index += 1) {
          const start = platforms[index];
          const end = platforms[index + 1];
          if (!start || !end) continue;
          const color = `#${new THREE.Color(start.color).lerp(new THREE.Color(end.color), 0.5).getHexString()}`;
          const segmentSettings = resolveSettings?.(index) ?? settings;
          segments.push(
            <LongSegment key={`${override.id}:${index}`} start={start} end={end} style={override.style} settings={segmentSettings} color={color} />,
          );
        }
        return segments;
      })}
    </group>
  );
}
