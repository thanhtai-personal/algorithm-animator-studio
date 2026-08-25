import { useMemo } from "react";
import type { CourseItemOverride, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { resolvePlatformStyle } from "../lib/platformStyles";
import { isPlatformCourseItem, overrideForNode } from "../lib/courseItems";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { PlatformMesh } from "./RhythmicPlatformMeshes3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import { wallMountProfile } from "./rhythmicSceneMath3D";
import { instrumentLightAtTime } from "../lib/instrumentLight";
import { isNoteLitInstrumentStyle, noteLightColorsForPlatform } from "../lib/instrumentLightsModel";
import { RhythmicInstrumentNoteLights3D } from "./RhythmicInstrumentNoteLights3D";
import { platformsMountedFor3D } from "../lib/platformViewport";

function PhysicalMount({ terrain, w, h, detail, showcase, frontDepth, style }: {
  terrain: StudioSettings["terrainProfile"];
  w: number;
  h: number;
  detail: number;
  showcase: boolean;
  frontDepth: number;
  style: string;
}) {
  if (showcase) {
    const supportX = Math.min(w * 0.3, 0.46);
    const supportPositions = style === "instrument-pad" ? [0] : [-supportX, supportX];
    const mount = wallMountProfile(frontDepth);
    return (
      <group>
        {supportPositions.map((x) => (
          <group key={x} position={[x, h * 0.28, 0]}>
            <mesh position={[0, 0, mount.stemCenterZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, mount.stemLength, 12]} />
              <meshStandardMaterial color="#5c6066" roughness={0.3} metalness={0.74} />
            </mesh>
            <mesh position={[0, 0, mount.anchorCenterZ]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.072, 0.072, mount.anchorThickness, 16]} />
              <meshStandardMaterial color="#33363b" roughness={0.48} metalness={0.46} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  if (terrain === "tube-board") {
    // Auto-generated scenes do not have a visible wall exactly three world units
    // behind every obstacle. Long stems therefore read as black spikes floating in
    // space. Use a compact self-contained bracket; showcase instruments keep their
    // dedicated mounting treatment above.
    const length = 0.82;
    return (
      <group>
        <mesh position={[0, h * 0.16, -length * 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035 + detail * 0.012, 0.035 + detail * 0.012, length, 12]} />
          <meshStandardMaterial color="#65717e" roughness={0.27} metalness={0.84} />
        </mesh>
        <mesh position={[0, h * 0.16, -length - 0.08]} castShadow receiveShadow>
          <boxGeometry args={[Math.min(0.72, Math.max(0.32, w * 0.28)), Math.max(0.18, h * 0.82), 0.075]} />
          <meshStandardMaterial color="#202832" roughness={0.42} metalness={0.7} />
        </mesh>
      </group>
    );
  }
  if (terrain === "xylophone") {
    const supportX = Math.min(w * 0.3, 0.52);
    const stemLength = 0.78;
    return (
      <group>
        {[-supportX, supportX].map((x) => (
          <group key={x} position={[x, h * 0.35, 0]}>
            <mesh position={[0, 0, -stemLength * 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.028, 0.028, stemLength, 12]} />
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


function frontDepthForStyle(style: string, h: number, d: number) {
  if (style === "boomwhacker-tube" || style === "tube-cylinder" || style === "toy-tube" || style === "toy-peg" || style.includes("tube")) return Math.max(0.1, h * 0.56);
  if (style === "instrument-cymbal" || style === "drum-disc" || style === "gong-disc") return Math.max(0.08, h * 0.6);
  if (style === "flute-pipe") return Math.max(0.1, h * 0.52);
  if (style.includes("rail") || style === "instrument-wire") return Math.max(0.055, h * 0.24);
  return d * 0.5;
}

export function RhythmicPlatformField3D({ platforms, settings, courseOverrides, selectedNodeIndex, onSelectNode, resolveSettings, impactIndex, impactStrength, timeMs }: {
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
  const visible = useMemo(() => platformsMountedFor3D(platforms), [platforms]);

  const denseSupports = useMemo(() => {
    const activeSurfaceIds = new Set<number>();
    for (const platform of visible) {
      if (!platform.visualHidden && platform.denseSurfaceId !== undefined) activeSurfaceIds.add(platform.denseSurfaceId);
    }
    return [...activeSurfaceIds].flatMap((surfaceId) => {
      const surface = visible
        .filter((platform) => platform.denseSurfaceId === surfaceId && !platform.visualHidden)
        .sort((a, b) => a.index - b.index);
      if (surface.length < 2) return [];

      // The backing follows the same polyline as the playable keys. One long rail
      // between first/last was the visual twin of the old straight-surface bug:
      // at a bend the marble and keys turned while the chassis cut across empty
      // space. Segment the chassis at every physical strike instead.
      return surface.slice(0, -1).map((first, offset) => {
        const last = surface[offset + 1];
        const firstX = first.visualX ?? first.x;
        const firstY = first.visualY ?? first.y;
        const lastX = last.visualX ?? last.x;
        const lastY = last.visualY ?? last.y;
        const firstWidth = first.visualWidth ?? first.width;
        const lastWidth = last.visualWidth ?? last.width;
        const dx = lastX - firstX;
        const dy = lastY - firstY;
        const span = Math.hypot(dx, dy) + Math.min(firstWidth, lastWidth) * 0.52;
        return {
          id: `${surfaceId}-${first.index}-${last.index}`,
          x: ((firstX + lastX) * 0.5 - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
          y: -((firstY + lastY) * 0.5) * RHYTHMIC_WORLD_SCALE,
          width: Math.max(0.22, span * RHYTHMIC_WORLD_SCALE),
          angle: Math.atan2(dy, dx),
        };
      });
    });
  }, [visible]);

  return (
    <group>
      {denseSupports.map((support) => (
        <group key={`dense-support-${support.id}`} position={[support.x, support.y, -0.62]} rotation={[0, 0, -support.angle]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[support.width, 0.1, 0.22]} />
            <meshStandardMaterial color="#272c33" roughness={0.38} metalness={0.52} />
          </mesh>
          <mesh position={[0, -0.055, 0.118]}>
            <boxGeometry args={[Math.max(0.2, support.width * 0.96), 0.018, 0.018]} />
            <meshStandardMaterial color="#747d87" roughness={0.28} metalness={0.72} />
          </mesh>
        </group>
      ))}
      {visible.map((platform) => {
        if (platform.visualHidden) return null;
        const override = overrideForNode(platform.index, courseOverrides);
        if (override && !isPlatformCourseItem(override.style) && override.span > 1) return null;
        const platformSettings = resolveSettings?.(platform.index) ?? settings;
        const style = platform.visualStyle ?? (override && isPlatformCourseItem(override.style) ? override.style : resolvePlatformStyle(platform.index, platformSettings));
        const displayWidth = platform.visualWidth ?? platform.width;
        const w = Math.max(0.3, displayWidth * RHYTHMIC_WORLD_SCALE);
        const displayThickness = platform.visualThickness ?? platform.thickness;
        const compactSurface = platform.denseSurfaceId !== undefined || displayThickness < 9;
        const h = Math.max(compactSurface ? 0.055 : 0.09, displayThickness * RHYTHMIC_WORLD_SCALE);
        const d = style === "instrument-cymbal" ? 0.5 : style.includes("rail") ? 0.46 : style === "tube-cylinder" ? 0.62 : 0.54;
        const normalInset = platform.contactMode === "surface"
          ? Math.max(0.04, displayThickness * 0.5) * RHYTHMIC_WORLD_SCALE
          : 0;
        const baseX = platform.visualX ?? platform.x;
        const baseY = platform.visualY ?? platform.y;
        const visualAngle = platform.visualTiltRad ?? platform.tiltRad;
        const visualNormal = platform.denseSurfaceId !== undefined
          ? { x: Math.sin(visualAngle), y: -Math.cos(visualAngle) }
          : { x: platform.normalX, y: platform.normalY };
        const worldX = ((baseX - visualNormal.x * normalInset / RHYTHMIC_WORLD_SCALE) - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE;
        const worldY = -(baseY - visualNormal.y * normalInset / RHYTHMIC_WORLD_SCALE) * RHYTHMIC_WORLD_SCALE;
        const immediateHit = platform.index === impactIndex ? Math.max(0, impactStrength) : 0;
        const noteLight = instrumentLightAtTime(platform.event.timeMs, timeMs, platform.color).intensity;
        const effectiveGlow = platformSettings.impactPlatformLight
          ? 0.055 + Math.max(noteLight, immediateHit) * (0.94 + platformSettings.platformGlow * 0.78)
          : platformSettings.platformGlow;
        const depth = d * (0.92 + platformSettings.platformDetail * 0.12);
        const frontDepth = frontDepthForStyle(style, h, depth);
        const lightColors = noteLightColorsForPlatform(platform, platforms);
        return (
          <group
            key={platform.index}
            // The visible striking face sits exactly on z=0. The instrument body
            // and wall mount extend behind it, matching the reference installation.
            position={[worldX, worldY, -frontDepth]}
            rotation={[0, 0, -visualAngle]}
            onClick={(event) => {
              event.stopPropagation();
              onSelectNode(platform.index);
            }}
          >
            {platform.denseRunId === undefined && (
              <PhysicalMount terrain={platformSettings.terrainProfile} w={w} h={h} detail={platformSettings.platformDetail} showcase={platformSettings.instrumentFamily !== "auto"} frontDepth={frontDepth} style={style} />
            )}
            <PlatformMesh w={w} h={h} d={depth} color={platform.color} style={style} selected={platform.index === selectedNodeIndex} glow={effectiveGlow} detail={platformSettings.platformDetail} />
            {isNoteLitInstrumentStyle(style) && <RhythmicInstrumentNoteLights3D width={w} height={h} frontDepth={frontDepth} colors={lightColors} glow={effectiveGlow} />}
          </group>
        );
      })}
    </group>
  );
}
