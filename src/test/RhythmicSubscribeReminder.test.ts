import { describe, expect, it, vi } from "vitest";
import {
  drawSubscribeWallSign2D,
  subscribeReminderFrameAt,
  subscribeWallMount,
} from "../features/rhythmic-studio/lib/subscribeReminder";

describe("rhythmic subscribe reminder", () => {
  const course = [
    { x: 120, y: 300, timeMs: 0 },
    { x: 180, y: 520, timeMs: 1_000 },
    { x: 610, y: 740, timeMs: 2_000 },
    { x: 560, y: 960, timeMs: 7_000 },
    { x: 140, y: 1_180, timeMs: 8_000 },
  ];

  it("lights up when the camera reaches its middle-course mount", () => {
    expect(subscribeReminderFrameAt(2_000, 4_000)).toMatchObject({ visible: false, opacity: 0 });

    const entering = subscribeReminderFrameAt(3_050, 4_000);
    expect(entering.visible).toBe(true);
    expect(entering.opacity).toBeGreaterThan(0);
    expect(entering.opacity).toBeLessThan(1);
    expect(entering.scale).toBeLessThan(1);

    expect(subscribeReminderFrameAt(4_000, 4_000)).toMatchObject({
      visible: true,
      opacity: 1,
      scale: 1,
      translateY: 0,
    });
    expect(subscribeReminderFrameAt(6_700, 4_000)).toMatchObject({ visible: false, opacity: 0 });
  });

  it("mounts in the emptiest side of the longest middle-song rest", () => {
    const mount = subscribeWallMount(course);

    expect(mount.x).toBeLessThan(360);
    expect(mount.y).toBeGreaterThan(course[2].y);
    expect(mount.y).toBeLessThan(course[3].y);
    expect(mount.cueTimeMs).toBe(4_500);
  });

  it("prefers a middle-song rest over a longer intro gap", () => {
    const mount = subscribeWallMount([
      { x: 120, y: 200, timeMs: 0 },
      { x: 580, y: 420, timeMs: 5_000 },
      { x: 540, y: 560, timeMs: 6_000 },
      { x: 160, y: 780, timeMs: 8_500 },
      { x: 220, y: 980, timeMs: 12_000 },
    ]);

    expect(mount.cueTimeMs).toBe(7_250);
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

    const mount = subscribeWallMount(course);
    drawSubscribeWallSign2D(context, mount, 400);
    expect(method).toHaveBeenCalledWith(mount.x, mount.y);
    expect(fillText).toHaveBeenCalledWith("SUBSCRIBE", expect.any(Number), 0);

    fillText.mockClear();
    drawSubscribeWallSign2D(context, mount, 4_700);
    expect(fillText).toHaveBeenCalledWith("SUBSCRIBE", expect.any(Number), 0);
  });
});
