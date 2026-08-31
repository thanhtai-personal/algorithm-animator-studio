import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { StudioSettings } from "../types";

const TERMINAL_ENTRY_DROP_PX = 240;
const TERMINAL_STAGE_MARGIN_PX = 48;

export interface TerminalMarbleGoal {
  launchX: number;
  launchY: number;
  launchVX: number;
  launchVY: number;
  gravity: number;
  entryTimeMs: number;
  impactTimeMs: number;
  settleTimeMs: number;
  entryX: number;
  mouthY: number;
  mouthWidth: number;
  centerX: number;
  impactX: number;
  restX: number;
  bottomY: number;
  depth: number;
  reboundSpeed: number;
}

const clamp = (value: number, min: number, max: number) => (
  Math.min(max, Math.max(min, value))
);

function secondsToDrop(launchVY: number, gravity: number, drop: number) {
  const safeGravity = Math.max(1, gravity);
  return (-launchVY + Math.sqrt(launchVY ** 2 + 2 * safeGravity * drop)) / safeGravity;
}

function ballisticPoint(platform: MarblePlatform, seconds: number) {
  return {
    x: platform.hitX + platform.outVX * seconds,
    y: platform.hitY + platform.outVY * seconds + 0.5 * platform.gravity * seconds ** 2,
  };
}

export function usesTerminalMarbleGoal(settings: StudioSettings) {
  return settings.marbleMode === "single" && settings.instrumentFamily === "mixed";
}

export function terminalMarbleGoalForCourse(
  platforms: readonly MarblePlatform[],
  settings: StudioSettings,
  courseWidth = 720,
): TerminalMarbleGoal | null {
  if (!platforms.length) return null;
  const last = platforms.at(-1)!;
  if (!usesTerminalMarbleGoal(settings) && !last.terminalGoal) return null;
  const gravity = Math.max(1, last.gravity);
  const mouthWidth = Math.max(90, settings.ballSize * 6.4);
  const entryDrop = Math.max(TERMINAL_ENTRY_DROP_PX, settings.ballSize * 16);
  const depth = Math.max(92, settings.ballSize * 6.2);
  const entrySeconds = secondsToDrop(last.outVY, gravity, entryDrop);
  const impactSeconds = secondsToDrop(last.outVY, gravity, entryDrop + depth);
  const entry = ballisticPoint(last, entrySeconds);
  const impact = ballisticPoint(last, impactSeconds);
  const desiredRestX = impact.x + clamp(last.outVX * 0.018, -4, 4);
  const halfMouth = mouthWidth / 2;
  const restX = clamp(
    desiredRestX,
    TERMINAL_STAGE_MARGIN_PX + halfMouth,
    courseWidth - TERMINAL_STAGE_MARGIN_PX - halfMouth,
  );
  const impactVY = last.outVY + gravity * impactSeconds;
  const reboundSpeed = clamp(impactVY * 0.2, 105, 165);
  const reboundSeconds = 2 * reboundSpeed / gravity;

  return {
    launchX: last.hitX,
    launchY: last.hitY,
    launchVX: last.outVX,
    launchVY: last.outVY,
    gravity,
    entryTimeMs: entrySeconds * 1_000,
    impactTimeMs: impactSeconds * 1_000,
    settleTimeMs: (impactSeconds + reboundSeconds) * 1_000,
    entryX: entry.x,
    mouthY: entry.y,
    mouthWidth,
    centerX: restX,
    impactX: impact.x,
    restX,
    bottomY: impact.y,
    depth,
    reboundSpeed,
  };
}

export function terminalMarbleGoalPoint(goal: TerminalMarbleGoal, elapsedMs: number) {
  const seconds = Math.max(0, elapsedMs) / 1_000;
  const impactSeconds = goal.impactTimeMs / 1_000;
  if (seconds <= impactSeconds) {
    return {
      x: goal.launchX + goal.launchVX * seconds,
      y: goal.launchY + goal.launchVY * seconds + 0.5 * goal.gravity * seconds ** 2,
    };
  }

  const settleSeconds = goal.settleTimeMs / 1_000;
  if (seconds >= settleSeconds) return { x: goal.restX, y: goal.bottomY };
  const reboundElapsed = seconds - impactSeconds;
  const reboundDuration = Math.max(0.001, settleSeconds - impactSeconds);
  const phase = clamp(reboundElapsed / reboundDuration, 0, 1);
  const smoothPhase = phase * phase * (3 - 2 * phase);
  return {
    x: goal.impactX + (goal.restX - goal.impactX) * smoothPhase,
    y: goal.bottomY - goal.reboundSpeed * reboundElapsed
      + 0.5 * goal.gravity * reboundElapsed ** 2,
  };
}
