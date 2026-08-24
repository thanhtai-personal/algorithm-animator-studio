import { useMemo } from "react";
import type { CourseItemOverride, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { resolvePlatformStyle } from "../lib/platformStyles";
import { isPlatformCourseItem, overrideForNode } from "../lib/courseItems";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { PlatformMesh } from "./RhythmicPlatformMeshes3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

function PhysicalMount({ terrain, w, h, detail }: {
  terrain: StudioSettings["terrainProfile"];
  w: number;
  h: number;
  detail: number;
}) {
  if (terrain === "tube-board") {
    const length = 3.05;
    return (
      <group>
        <mesh position={[0, h * 0.16, -length * 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035 + detail * 0.012, 0.035 + detail * 0.012, length, 12]} />
          <meshStandardMaterial color="#65717e" roughness={0.27} metalness={0.84} />
        </mesh>
        <mesh position={[0, h * 0.16, -length - 0.04]} castShadow receiveShadow>
          <boxGeometry args={[Math.min(0.72, Math.max(0.32, w * 0.28)), Math.max(0.18, h * 0.82), 0.075]} />
          <meshStandardMaterial color="#202832" roughness={0.42} metalness={0.7} />
        </mesh>
      </group>
    );
  }
  if (terrain === "xylophone") {
    const supportX = Math.min(w * 0.3, 0.52);
    return (
      <group>
        {[-supportX, supportX].map((x) => (
          <group key={x} position={[x, h * 0.35, 0]}>
            <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.028, 0.028, 2.35, 12]} />
              <meshStandardMaterial color="#77634f" roughness={0.34} metalness={0.48} />
            </mesh>
            <mesh position={[0, 0, -0.16]} castShadow>
              <cylinderGeometry args={[0.065, 0.065, 0.08, 16]} />
              <meshStandardMaterial color="#29231f" roughness={0.72} metalness={0.06} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  return null;
}

export function RhythmicPlatformField3D({ platforms, settings, courseOverrides, focusIndex, selectedNodeIndex, onSelectNode, resolveSettings, impactIndex, impactStrength, timeMs }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  courseOverrides: CourseItemOverride[];
  focusIndex: number;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  resolveSettings?: StudioSettingsResolver;
  impactIndex: number;
  impactStrength: number;
  timeMs: number;
}) {
  const visible = useMemo(() => {
    const focusSettings = resolveSettings?.(focusIndex) ?? settings;
    const radius = focusSettings.terrainProfile === "xylophone" ? 20 : 18;
    return platforms.filter((platform) => Math.abs(platform.index - focusIndex) <= radius);
  }, [focusIndex, platforms, resolveSettings, settings]);

  return (
    <group>
      {visible.map((platform) => {
        const override = overrideForNode(platform.index, courseOverrides);
        if (override && !isPlatformCourseItem(override.style) && override.span > 1) return null;
        const platformSettings = resolveSettings?.(platform.index) ?? settings;
        const style = override && isPlatformCourseItem(override.style) ? override.style : resolvePlatformStyle(platform.index, platformSettings);
        const w = Math.max(0.3, platform.width * RHYTHMIC_WORLD_SCALE);
        const h = Math.max(0.09, platform.thickness * RHYTHMIC_WORLD_SCALE);
        const d = style === "instrument-cymbal" ? 0.5 : style.includes("rail") ? 0.46 : style === "tube-cylinder" ? 0.62 : 0.54;
        const normalInset = platform.contactMode === "surface"
          ? Math.max(0.04, platform.thickness * 0.5) * RHYTHMIC_WORLD_SCALE
          : 0;
        const worldX = ((platform.x - platform.normalX * normalInset / RHYTHMIC_WORLD_SCALE) - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE;
        const worldY = -(platform.y - platform.normalY * normalInset / RHYTHMIC_WORLD_SCALE) * RHYTHMIC_WORLD_SCALE;
        const hasBeenHit = platform.event.timeMs <= timeMs;
        const immediateHit = platform.index === impactIndex ? Math.max(0, impactStrength) : 0;
        const latchedHit = platformSettings.impactPlatformLight && hasBeenHit
          ? 0.62 + immediateHit * 0.38
          : 0;
        const effectiveGlow = platformSettings.impactPlatformLight
          ? latchedHit * (0.82 + platformSettings.platformGlow * 0.98)
          : platformSettings.platformGlow;
        const depth = d * (0.92 + platformSettings.platformDetail * 0.12);
        return (
          <group
            key={platform.index}
            position={[worldX, worldY, 0]}
            rotation={[0, 0, -platform.tiltRad]}
            onClick={(event) => {
              event.stopPropagation();
              onSelectNode(platform.index);
            }}
          >
            <PhysicalMount terrain={platformSettings.terrainProfile} w={w} h={h} detail={platformSettings.platformDetail} />
            <PlatformMesh w={w} h={h} d={depth} color={platform.color} style={style} selected={platform.index === selectedNodeIndex} glow={effectiveGlow} detail={platformSettings.platformDetail} />
          </group>
        );
      })}
    </group>
  );
}
