import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { ChaseOwner } from "../engine/chaseStrikeOwnership";
import type { RenderQuality, StudioSettings } from "../types";
import { settingsForChaseOwner } from "../engine/chaseCoursePlanner";
import { collisionStrength } from "./marbleCourse";
import {
  chaseMarbleAtTime,
  chaseTrackMarbleAtTime,
  type ChaseCoursePlan,
} from "./chaseCourse";
import { drawMarbleAvatar2D } from "./marbleAvatarRenderer2D";
import { IDLE_MARBLE_AVATAR_MOTION, marbleAvatarMotion2D } from "./marbleAvatarMotion2D";
import { drawPresetMarble } from "./presetMarbleRenderer";
import { drawPresetTrail } from "./presetTrailRenderer";

const OWNERS: ChaseOwner[] = ["A", "B"];

interface DrawChasePerformersArgs {
  ctx: CanvasRenderingContext2D;
  timeMs: number;
  durationMs: number;
  cameraY: number;
  settings: StudioSettings;
  plan: ChaseCoursePlan;
  quality: RenderQuality;
  resolveSettings?: StudioSettingsResolver;
}

function ownerSettingsAt(
  owner: ChaseOwner,
  platformIndex: number,
  settings: StudioSettings,
  resolveSettings?: StudioSettingsResolver,
) {
  return settingsForChaseOwner(resolveSettings?.(platformIndex) ?? settings, owner);
}

export function chaseFocusAtTime(
  timeMs: number,
  plan: ChaseCoursePlan,
  settings: StudioSettings,
  resolveSettings?: StudioSettingsResolver,
) {
  const a = chaseMarbleAtTime("A", timeMs, plan, settings, resolveSettings);
  const b = chaseMarbleAtTime("B", timeMs, plan, settings, resolveSettings);
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    color: a.color,
    platformIndex: Math.max(a.platformIndex, b.platformIndex),
  };
}

function trailCount(settings: StudioSettings) {
  if (settings.terrainProfile === "comet") return Math.round(Math.min(44, settings.trailLength * 1.35));
  if (settings.terrainProfile === "xylophone") return Math.round(Math.min(16, settings.trailLength * 0.9));
  if (settings.terrainProfile === "tube-board") return Math.round(Math.min(12, settings.trailLength * 0.85));
  return Math.round(Math.min(28, settings.trailLength));
}

function drawFallbackTrail(
  ctx: CanvasRenderingContext2D,
  points: ReturnType<typeof chaseTrackMarbleAtTime>[],
  cameraY: number,
  settings: StudioSettings,
) {
  points.forEach((point, index) => {
    const age = (points.length - index) / Math.max(1, points.length);
    const alpha = (1 - age) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y - cameraY, Math.max(2, settings.ballSize * (0.18 + alpha * 0.8)), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

export function drawChasePerformers2D(args: DrawChasePerformersArgs) {
  const performers = OWNERS.map((owner) => {
    const point = chaseTrackMarbleAtTime(owner, args.timeMs, args.plan, args.settings, args.resolveSettings);
    const globalPoint = chaseMarbleAtTime(owner, args.timeMs, args.plan, args.settings, args.resolveSettings);
    const settings = ownerSettingsAt(owner, globalPoint.platformIndex, args.settings, args.resolveSettings);
    return { owner, point, globalPoint, settings, track: args.plan.tracks[owner] };
  });

  if (args.quality === "live") {
    for (const performer of performers) {
      const count = trailCount(performer.settings);
      const points = Array.from({ length: count }, (_, index) => {
        const age = count - index;
        return {
          ...chaseTrackMarbleAtTime(
            performer.owner,
            Math.max(0, args.timeMs - age * 18),
            args.plan,
            args.settings,
            args.resolveSettings,
          ),
          age: age / Math.max(1, count),
        };
      });
      if (!drawPresetTrail(args.ctx, points, args.cameraY, performer.settings)) {
        drawFallbackTrail(args.ctx, points, args.cameraY, performer.settings);
      }
    }
  }

  for (const performer of performers) {
    const pulse = args.quality === "live" && performer.settings.pulseAnimation
      ? collisionStrength(args.timeMs, performer.track.events) * performer.settings.animationSensitivity
      : 0;
    const before = chaseTrackMarbleAtTime(performer.owner, Math.max(0, args.timeMs - 12), args.plan, args.settings, args.resolveSettings);
    const after = chaseTrackMarbleAtTime(performer.owner, Math.min(args.durationMs, args.timeMs + 12), args.plan, args.settings, args.resolveSettings);
    const motion = args.quality === "live"
      ? marbleAvatarMotion2D(args.timeMs, performer.track.events, performer.track.platforms, performer.point, before, after)
      : IDLE_MARBLE_AVATAR_MOTION;
    if (!drawMarbleAvatar2D(args.ctx, performer.point, args.cameraY, pulse, performer.settings, motion)) {
      drawPresetMarble(args.ctx, performer.point, args.cameraY, pulse, performer.settings);
    }
  }
}
