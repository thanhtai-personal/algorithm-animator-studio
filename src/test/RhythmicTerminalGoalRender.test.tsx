import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicTerminalGoal3D } from "../features/rhythmic-studio/components/RhythmicTerminalGoal3D";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  drawTerminalMarbleGoalBack2D,
  drawTerminalMarbleGoalFront2D,
} from "../features/rhythmic-studio/lib/terminalMarbleGoalRenderer2D";
import type { TerminalMarbleGoal } from "../features/rhythmic-studio/lib/terminalMarbleGoal";

const goal: TerminalMarbleGoal = {
  launchX: 510,
  launchY: 1_000,
  launchVX: -110,
  launchVY: -160,
  gravity: 780,
  entryTimeMs: 980,
  impactTimeMs: 1_150,
  settleTimeMs: 1_520,
  entryX: 402,
  mouthY: 1_240,
  mouthWidth: 96,
  centerX: 382,
  impactX: 383,
  restX: 382,
  bottomY: 1_332,
  depth: 92,
  reboundSpeed: 145,
};

function canvasContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), closePath: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), quadraticCurveTo: vi.fn(), bezierCurveTo: vi.fn(),
    arc: vi.fn(), ellipse: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient), createRadialGradient: vi.fn(() => gradient),
  } as unknown as CanvasRenderingContext2D;
}

describe("terminal marble goal renderers", () => {
  it("draws a wide funnel behind the marble and a foreground retaining lip", () => {
    const context = canvasContext();

    drawTerminalMarbleGoalBack2D(context, goal, 1_050, DEFAULT_SETTINGS, 132_000);
    drawTerminalMarbleGoalFront2D(context, goal, 1_050, DEFAULT_SETTINGS);

    expect(context.quadraticCurveTo).toHaveBeenCalled();
    expect(context.ellipse).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
  });

  it("builds a 3D funnel, rear mount and bottom cradle around the goal point", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<RhythmicTerminalGoal3D goal={goal} settings={DEFAULT_SETTINGS} />);
    consoleError.mockRestore();

    expect(container.querySelector('[name="terminal-goal"]')).not.toBeNull();
    expect(container.querySelector('[name="terminal-goal-funnel"]')).not.toBeNull();
    expect(container.querySelector('[name="terminal-goal-cradle"]')).not.toBeNull();
    expect(container.querySelector('[name="terminal-goal-wall-mount"]')).not.toBeNull();
  });
});
