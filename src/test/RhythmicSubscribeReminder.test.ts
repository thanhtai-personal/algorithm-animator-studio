import { describe, expect, it, vi } from "vitest";
import {
  drawSubscribeWallSign2D,
  subscribeReminderFrameAt,
  subscribeWallMount,
} from "../features/rhythmic-studio/lib/subscribeReminder";

describe("rhythmic subscribe reminder", () => {
  it("enters after the opening beat, holds briefly, then leaves", () => {
    expect(subscribeReminderFrameAt(500)).toMatchObject({ visible: false, opacity: 0 });

    const entering = subscribeReminderFrameAt(1_050);
    expect(entering.visible).toBe(true);
    expect(entering.opacity).toBeGreaterThan(0);
    expect(entering.opacity).toBeLessThan(1);
    expect(entering.scale).toBeLessThan(1);

    expect(subscribeReminderFrameAt(2_000)).toMatchObject({
      visible: true,
      opacity: 1,
      scale: 1,
      translateY: 0,
    });
    expect(subscribeReminderFrameAt(4_700)).toMatchObject({ visible: false, opacity: 0 });
  });

  it("mounts on the opposite side of the opening instrument instead of screen center", () => {
    const rightWall = subscribeWallMount({ x: 120, y: 620 });
    const leftWall = subscribeWallMount({ x: 610, y: 720 });

    expect(rightWall.x).toBeGreaterThan(360);
    expect(leftWall.x).toBeLessThan(360);
    expect(rightWall.y).toBeLessThan(620);
    expect(leftWall.y).toBeLessThan(720);
  });

  it("draws a persistent wall plaque at course coordinates while only its light animates", () => {
    const fillText = vi.fn();
    const method = vi.fn();
    const context = {
      save: method,
      restore: method,
      translate: method,
      scale: method,
      beginPath: method,
      arc: method,
      moveTo: method,
      lineTo: method,
      arcTo: method,
      closePath: method,
      fill: method,
      stroke: method,
      fillText,
      measureText: vi.fn(() => ({ width: 100 })),
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    const mount = subscribeWallMount({ x: 120, y: 620 });
    drawSubscribeWallSign2D(context, mount, 400);
    expect(method).toHaveBeenCalledWith(mount.x, mount.y);
    expect(fillText).toHaveBeenCalledWith("SUBSCRIBE", expect.any(Number), 0);

    fillText.mockClear();
    drawSubscribeWallSign2D(context, mount, 4_700);
    expect(fillText).toHaveBeenCalledWith("SUBSCRIBE", expect.any(Number), 0);
  });
});
