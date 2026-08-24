import { useMemo } from "react";
import type { CourseItemOverride, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { resolvePlatformStyle } from "../lib/platformStyles";
import { isPlatformCourseItem, overrideForNode } from "../lib/courseItems";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { PlatformMesh } from "./RhythmicPlatformMeshes3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

export function RhythmicPlatformField3D({ platforms, settings, courseOverrides, focusIndex, selectedNodeIndex, onSelectNode, resolveSettings }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  courseOverrides: CourseItemOverride[];
  focusIndex: number;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  resolveSettings?: StudioSettingsResolver;
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
            <PlatformMesh w={w} h={h} d={d * (0.92 + platformSettings.platformDetail * 0.12)} color={platform.color} style={style} selected={platform.index === selectedNodeIndex} glow={platformSettings.platformGlow} detail={platformSettings.platformDetail} />
          </group>
        );
      })}
    </group>
  );
}
