import { useMemo } from "react";
import type { CourseItemOverride, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { resolvePlatformStyle } from "../lib/platformStyles";
import { isPlatformCourseItem, overrideForNode } from "../lib/courseItems";
import { RHYTHMIC_COURSE_WIDTH, RHYTHMIC_WORLD_SCALE } from "./RhythmicMotion3D";
import { PlatformMesh } from "./RhythmicPlatformMeshes3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import { DENSE_CHASSIS_CENTER_Z, DENSE_CHASSIS_DEPTH, shadowReceiverZForSettings, wallMountProfile } from "./rhythmicSceneMath3D";
import { instrumentLightAtTime } from "../lib/instrumentLight";
import { isNoteLitInstrumentStyle, noteLightColorsForPlatform } from "../lib/instrumentLightsModel";
import { RhythmicInstrumentNoteLights3D } from "./RhythmicInstrumentNoteLights3D";
import { platformsMountedFor3D } from "../lib/platformViewport";
import { RhythmicDenseChassisMounts3D } from "./RhythmicDenseChassisMounts3D";
import { denseSurfaceSegments } from "../engine/denseSurfaceGeometry";
import { instrumentImpactResponseAtTime, instrumentKeyPressAtTime } from "../lib/instrumentResponse";
import { instrumentPlayingSurface3D, instrumentPressOffset3D, instrumentSurfaceFrame3D } from "./instrumentPlayingSurface3D";

function PhysicalMount({ terrain, w, h, detail, showcase, frontDepth, receiverZ, style }: {
  terrain: StudioSettings["terrainProfile"];
  w: number;
  h: number;
  detail: number;
  showcase: boolean;
  frontDepth: number;
  receiverZ: number;
  style: string;
}) {
  const supportX = Math.min(w * 0.3, showcase ? 0.46 : 0.38);
  const singleSupport = style === "instrument-pad" || style === "pluck-pad" || style === "instrument-cymbal" || style === "drum-disc" || style === "gong-disc" || style === "metallophone-plate";
  const supportPositions = singleSupport ? [0] : [-supportX, supportX];
  const mount = wallMountProfile(frontDepth, receiverZ);
  const stemColor = terrain === "xylophone" ? "#77634f" : terrain === "comet" ? "#555b76" : "#5c6670";
  const anchorColor = terrain === "xylophone" ? "#322a24" : "#282d34";
  const stemRadius = 0.022 + detail * 0.012;
  return (
    <group>
      {supportPositions.map((x) => (
        <group key={x} position={[x, h * 0.28, 0]}>
          <mesh position={[0, 0, mount.stemCenterZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[stemRadius, stemRadius, mount.stemLength, 12]} />
            <meshStandardMaterial color={stemColor} roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, mount.anchorCenterZ]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[showcase ? 0.072 : 0.064, showcase ? 0.072 : 0.064, mount.anchorThickness, 16]} />
            <meshStandardMaterial color={anchorColor} roughness={0.48} metalness={0.46} />
          </mesh>
        </group>
      ))}
    </group>
  );
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
  const visible = useMemo(() => platformsMountedFor3D(platforms, focusIndex), [focusIndex, platforms]);
  const receiverZ = shadowReceiverZForSettings(settings);

  const denseSupports = useMemo(() => {
    const segments = denseSurfaceSegments(visible);
    return segments.map((segment, offset) => {
      const dx = segment.toX - segment.fromX;
      const dy = segment.toY - segment.fromY;
      return {
        ...segment,
        x: ((segment.fromX + segment.toX) * 0.5 - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
        y: -((segment.fromY + segment.toY) * 0.5) * RHYTHMIC_WORLD_SCALE,
        width: Math.max(0.12, Math.hypot(dx, dy) * RHYTHMIC_WORLD_SCALE),
        angle: Math.atan2(dy, dx),
        mounted: offset % 3 === 0 || offset === segments.length - 1,
      };
    });
  }, [visible]);

  return (
    <group>
      {denseSupports.map((support) => (
        <group key={`dense-support-${support.id}`} position={[support.x, support.y, 0]} rotation={[0, 0, -support.angle]}>
          <mesh position={[0, 0, DENSE_CHASSIS_CENTER_Z]} castShadow receiveShadow>
            <boxGeometry args={[support.width, 0.1, DENSE_CHASSIS_DEPTH]} />
            <meshStandardMaterial color="#272c33" roughness={0.38} metalness={0.52} />
          </mesh>
          <mesh position={[0, -0.055, DENSE_CHASSIS_CENTER_Z + DENSE_CHASSIS_DEPTH * 0.5 + 0.008]}>
            <boxGeometry args={[Math.max(0.2, support.width * 0.96), 0.018, 0.018]} />
            <meshStandardMaterial color="#747d87" roughness={0.28} metalness={0.72} />
          </mesh>
          {support.layout === "parallel-rails" && [-0.065, 0.065].map((y) => (
            <mesh key={y} position={[0, y, DENSE_CHASSIS_CENTER_Z + DENSE_CHASSIS_DEPTH * 0.5 + 0.035]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.022, 0.022, support.width, 14]} />
              <meshStandardMaterial color="#8af7ff" emissive="#22d3ee" emissiveIntensity={2.4} roughness={0.18} metalness={0.52} toneMapped={false} />
            </mesh>
          ))}
          {support.mounted && <RhythmicDenseChassisMounts3D width={support.width} receiverZ={receiverZ} terrain={settings.terrainProfile} detail={settings.platformDetail} />}
        </group>
      ))}
      {visible.map((platform) => {
        if (platform.visualHidden) return null;
        const override = overrideForNode(platform.index, courseOverrides);
        if (override && !isPlatformCourseItem(override.style) && override.span > 1) return null;
        const platformSettings = resolveSettings?.(platform.index) ?? settings;
        const style = platform.visualStyle ?? (override && isPlatformCourseItem(override.style) ? override.style : resolvePlatformStyle(platform.index, platformSettings));
        const displayWidth = platform.visualWidth ?? platform.width;
        const w = Math.max(platform.denseLayout === "connected-keys" ? 0.065 : 0.3, displayWidth * RHYTHMIC_WORLD_SCALE);
        const displayThickness = platform.visualThickness ?? platform.thickness;
        const compactSurface = platform.denseSurfaceId !== undefined || displayThickness < 9;
        const h = Math.max(compactSurface ? 0.055 : 0.09, displayThickness * RHYTHMIC_WORLD_SCALE);
        const d = style === "instrument-cymbal" ? 0.5 : style.includes("rail") ? 0.46 : style === "tube-cylinder" ? 0.62 : 0.54;
        const depth = d * (0.92 + platformSettings.platformDetail * 0.12);
        const baseX = platform.visualX ?? platform.x;
        const baseY = platform.visualY ?? platform.y;
        const surfaceFrame = instrumentSurfaceFrame3D(
          platform.visualTiltRad ?? platform.tiltRad,
          platform.normalX,
          platform.normalY,
        );
        const visualAngle = surfaceFrame.angleRad;
        const visualNormal = { x: surfaceFrame.normalX, y: surfaceFrame.normalY };
        const playingSurface = instrumentPlayingSurface3D(
          style,
          w,
          h,
          depth,
          platformSettings.ballSize * RHYTHMIC_WORLD_SCALE,
          surfaceFrame.normalAlignment,
        );
        const normalInset = platform.contactMode === "surface"
          ? playingSurface.centerInset
          : 0;
        const worldX = ((baseX - visualNormal.x * normalInset / RHYTHMIC_WORLD_SCALE) - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE;
        const worldY = -(baseY - visualNormal.y * normalInset / RHYTHMIC_WORLD_SCALE) * RHYTHMIC_WORLD_SCALE;
        const immediateHit = platform.index === impactIndex ? Math.max(0, impactStrength) : 0;
        const noteLight = instrumentLightAtTime(platform.event.timeMs, timeMs, platform.color).intensity;
        const effectiveGlow = platformSettings.impactPlatformLight
          ? 0.055 + Math.max(noteLight, immediateHit) * (0.94 + platformSettings.platformGlow * 0.78)
          : platformSettings.platformGlow;
        const lightColors = noteLightColorsForPlatform(platform, platforms);
        const keyPress = style === "piano-key" || style === "piano-keyboard"
          ? instrumentKeyPressAtTime(platform.event.timeMs, timeMs) * Math.min(0.085, Math.max(0.035, h * 0.46))
          : 0;
        const response = instrumentImpactResponseAtTime(style, platform.event.timeMs, timeMs, platform.index);
        const resonanceTravel = response.normalRecoil * Math.min(0.09, Math.max(0.025, h * 0.55));
        const pressOffset = instrumentPressOffset3D(playingSurface, keyPress + resonanceTravel);
        return (
          <group
            key={platform.index}
            // The visible striking face sits exactly on z=0. The instrument body
            // and wall mount extend behind it, matching the reference installation.
            position={[worldX, worldY, -playingSurface.frontDepth]}
            rotation={[0, 0, -visualAngle]}
            onClick={(event) => {
              event.stopPropagation();
              onSelectNode(platform.index);
            }}
          >
            {platform.denseRunId === undefined && (
              <PhysicalMount terrain={platformSettings.terrainProfile} w={w} h={h} detail={platformSettings.platformDetail} showcase={platformSettings.instrumentFamily !== "auto"} frontDepth={playingSurface.frontDepth} receiverZ={receiverZ} style={style} />
            )}
            <group position={[0, pressOffset.y, pressOffset.z]}>
              <group rotation={[
                playingSurface.pitchRad + response.tiltRad,
                response.twistRad * 0.45,
                response.twistRad,
              ]}>
                <PlatformMesh w={w} h={h} d={depth} color={platform.color} style={style} selected={platform.index === selectedNodeIndex} glow={effectiveGlow} detail={platformSettings.platformDetail} />
                {isNoteLitInstrumentStyle(style) && <RhythmicInstrumentNoteLights3D width={w} height={h} surface={playingSurface} colors={lightColors} glow={effectiveGlow} />}
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}
